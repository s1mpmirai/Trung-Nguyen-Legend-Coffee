from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


def get_employee_attendance_info(db: Session, ma_nv: str) -> Optional[dict[str, Any]]:
    """Lấy thông tin nhân viên, phòng ban, chi nhánh phục vụ chấm công."""
    clean_id = ma_nv.strip().upper().replace("-", "")

    emp_query = text("""
        SELECT 
            nv.ma_nv, nv.ho_ten, nv.trang_thai, nv.gioi_tinh, nv.email,
            COALESCE(pb.ten_pb, 'Khối Văn Phòng') AS ten_pb,
            COALESCE(pb.ma_pb, 'PB01') AS ma_pb,
            COALESCE(cv.ten_cv, 'Nhân viên') AS ten_cv,
            COALESCE(cn.ten_cn, 'Trụ sở chính Trung Nguyên') AS ten_cn,
            cn.dia_chi AS dia_chi_cn
        FROM nhan_vien nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN chi_nhanh cn ON nv.ma_cn = cn.ma_cn
        WHERE nv.ma_nv = :ma_nv
        LIMIT 1
    """)
    row = db.execute(emp_query, {"ma_nv": clean_id}).fetchone()
    if not row:
        row = db.execute(emp_query, {"ma_nv": "NV10"}).fetchone()

    if row:
        return dict(row._mapping)
    return None


def get_recent_attendance_records(
    db: Session, ma_nv: str, limit: int = 10
) -> list[dict[str, Any]]:
    """Lấy các bản ghi chấm công gần nhất của nhân viên."""
    query = text("""
        SELECT 
            bcc.ma_cc, bcc.ngay_cong, bcc.gio_vao, bcc.gio_ra, 
            bcc.so_gio_lam, bcc.so_gio_tang_ca, bcc.loai_cong, bcc.ghi_chu,
            COALESCE(ca.ten_ca, 'Hành chính') as ca_lam_viec
        FROM bang_cham_cong bcc
        LEFT JOIN ca_lam_viec ca ON bcc.ma_ca = ca.ma_ca
        WHERE bcc.ma_nv = :ma_nv
          AND bcc.gio_vao IS NOT NULL
          AND bcc.loai_cong != 'NGHI_PHEP'
        ORDER BY bcc.ngay_cong DESC, bcc.ma_cc DESC
        LIMIT :limit
    """)
    rows = db.execute(query, {"ma_nv": ma_nv, "limit": limit}).fetchall()
    return [dict(r._mapping) for r in rows]


def get_monthly_stats(
    db: Session, ma_nv: str, month: Optional[int] = None, year: Optional[int] = None
) -> dict[str, Any]:
    """Thống kê tổng công, giờ OT, số lần đi muộn và số ngày phép."""
    where_parts = ["ma_nv = :ma_nv"]
    params: dict[str, Any] = {"ma_nv": ma_nv}

    if month:
        where_parts.append("MONTH(ngay_cong) = :month")
        params["month"] = month
    if year:
        where_parts.append("YEAR(ngay_cong) = :year")
        params["year"] = year

    query = text(f"""
        SELECT 
            COALESCE(SUM(so_cong), 0) AS tong_cong,
            COALESCE(SUM(so_gio_tang_ca), 0) AS tong_ot,
            COUNT(CASE WHEN loai_cong = 'DI_TRE' THEN 1 END) AS so_muon,
            COUNT(CASE WHEN loai_cong = 'NGHI_PHEP' THEN 1 END) AS so_phep
        FROM bang_cham_cong
        WHERE {' AND '.join(where_parts)}
    """)
    row = db.execute(query, params).fetchone()
    if row:
        return dict(row._mapping)
    return {"tong_cong": 0, "tong_ot": 0, "so_muon": 0, "so_phep": 0}


def record_check_in(
    db: Session, ma_nv: str, today: date, gio_vao: str
) -> dict[str, Any]:
    """Thực hiện lưu hoặc cập nhật lượt check-in hôm nay."""
    check_sql = text("""
        SELECT ma_cc FROM bang_cham_cong 
        WHERE ma_nv = :ma_nv AND ngay_cong = :ngay_cong
        LIMIT 1
    """)
    existing = db.execute(check_sql, {"ma_nv": ma_nv, "ngay_cong": today}).fetchone()

    if existing:
        update_sql = text("""
            UPDATE bang_cham_cong 
            SET gio_vao = :gio_vao, loai_cong = 'CONG_DU'
            WHERE ma_cc = :ma_cc
        """)
        db.execute(update_sql, {"gio_vao": gio_vao, "ma_cc": existing[0]})
        ma_cc = existing[0]
    else:
        insert_sql = text("""
            INSERT INTO bang_cham_cong (ma_nv, ngay_cong, ma_ca, gio_vao, loai_cong, so_cong)
            VALUES (:ma_nv, :ngay_cong, 'CA01', :gio_vao, 'CONG_DU', 1.0)
        """)
        res = db.execute(insert_sql, {"ma_nv": ma_nv, "ngay_cong": today, "gio_vao": gio_vao})
        ma_cc = res.lastrowid

    db.commit()
    return {"ma_cc": ma_cc, "gio_vao": gio_vao}


def record_check_out(
    db: Session, ma_nv: str, today: date, gio_ra: str, so_gio_lam: float = 8.0
) -> dict[str, Any]:
    """Thực hiện lưu hoặc cập nhật lượt check-out hôm nay."""
    check_sql = text("""
        SELECT ma_cc, gio_vao FROM bang_cham_cong 
        WHERE ma_nv = :ma_nv AND ngay_cong = :ngay_cong
        LIMIT 1
    """)
    existing = db.execute(check_sql, {"ma_nv": ma_nv, "ngay_cong": today}).fetchone()

    if existing:
        update_sql = text("""
            UPDATE bang_cham_cong 
            SET gio_ra = :gio_ra, so_gio_lam = :so_gio_lam
            WHERE ma_cc = :ma_cc
        """)
        db.execute(update_sql, {"gio_ra": gio_ra, "so_gio_lam": so_gio_lam, "ma_cc": existing[0]})
        ma_cc = existing[0]
    else:
        insert_sql = text("""
            INSERT INTO bang_cham_cong (ma_nv, ngay_cong, ma_ca, gio_ra, loai_cong, so_cong, so_gio_lam)
            VALUES (:ma_nv, :ngay_cong, 'CA01', :gio_ra, 'CONG_DU', 1.0, :so_gio_lam)
        """)
        res = db.execute(
            insert_sql,
            {"ma_nv": ma_nv, "ngay_cong": today, "gio_ra": gio_ra, "so_gio_lam": so_gio_lam}
        )
        ma_cc = res.lastrowid

    db.commit()
    return {"ma_cc": ma_cc, "gio_ra": gio_ra}


def get_attendance_history_by_employee(
    db: Session, ma_nv: str, month: Optional[int] = None, year: Optional[int] = None
) -> list[dict[str, Any]]:
    """Lấy danh sách các ngày công chi tiết của một nhân viên."""
    params: dict[str, Any] = {"ma_nv": ma_nv}
    where_parts = [
        "bcc.ma_nv = :ma_nv",
        "bcc.gio_vao IS NOT NULL",
        "bcc.loai_cong != 'NGHI_PHEP'",
    ]

    if month:
        where_parts.append("MONTH(bcc.ngay_cong) = :month")
        params["month"] = month
    if year:
        where_parts.append("YEAR(bcc.ngay_cong) = :year")
        params["year"] = year

    query = text(f"""
        SELECT 
            bcc.ma_cc, bcc.ngay_cong, bcc.gio_vao, bcc.gio_ra, 
            bcc.so_gio_lam, bcc.so_gio_tang_ca, bcc.loai_cong, bcc.ghi_chu,
            COALESCE(ca.ten_ca, 'Hành chính') as ca_lam_viec,
            COALESCE(cn.ten_cn, 'Trụ sở chính Trung Nguyên') as ten_cn,
            cn.dia_chi as dia_chi_cn
        FROM bang_cham_cong bcc
        LEFT JOIN ca_lam_viec ca ON bcc.ma_ca = ca.ma_ca
        LEFT JOIN nhan_vien nv ON bcc.ma_nv = nv.ma_nv
        LEFT JOIN chi_nhanh cn ON nv.ma_cn = cn.ma_cn
        WHERE {' AND '.join(where_parts)}
        ORDER BY bcc.ngay_cong DESC, bcc.ma_cc DESC
    """)
    rows = db.execute(query, params).fetchall()
    return [dict(r._mapping) for r in rows]


def get_daily_attendance_all(
    db: Session, target_date: date, ma_pb: Optional[str] = None
) -> list[dict[str, Any]]:
    """Dành cho Quản lý: Lấy danh sách chấm công toàn công ty trong 1 ngày."""
    params: dict[str, Any] = {"target_date": target_date}
    where_pb = ""
    if ma_pb:
        where_pb = "AND nv.ma_pb = :ma_pb"
        params["ma_pb"] = ma_pb

    query = text(f"""
        SELECT 
            nv.ma_nv, nv.ho_ten, pb.ten_pb, cv.ten_cv,
            bcc.ma_cc, bcc.ngay_cong, bcc.gio_vao, bcc.gio_ra,
            bcc.so_gio_lam, bcc.so_gio_tang_ca, bcc.loai_cong, bcc.so_cong, bcc.ghi_chu,
            ca.ten_ca
        FROM nhan_vien nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN bang_cham_cong bcc ON nv.ma_nv = bcc.ma_nv AND bcc.ngay_cong = :target_date
        LEFT JOIN ca_lam_viec ca ON bcc.ma_ca = ca.ma_ca
        WHERE nv.trang_thai = 'DANG_LAM' {where_pb}
        ORDER BY nv.ma_nv ASC
    """)
    rows = db.execute(query, params).fetchall()
    return [dict(r._mapping) for r in rows]


def get_monthly_attendance_summary(
    db: Session, month: int, year: int, ma_pb: Optional[str] = None
) -> list[dict[str, Any]]:
    """Dành cho Quản lý: Thống kê công tháng của tất cả nhân viên."""
    params: dict[str, Any] = {"month": month, "year": year}
    where_pb = ""
    if ma_pb:
        where_pb = "AND nv.ma_pb = :ma_pb"
        params["ma_pb"] = ma_pb

    query = text(f"""
        SELECT 
            nv.ma_nv, nv.ho_ten, pb.ten_pb, cv.ten_cv,
            COALESCE(SUM(bcc.so_cong), 0) AS tong_ngay_cong,
            COALESCE(SUM(bcc.so_gio_tang_ca), 0) AS tong_gio_ot,
            COUNT(CASE WHEN bcc.loai_cong = 'DI_TRE' THEN 1 END) AS so_lan_di_tre,
            COUNT(CASE WHEN bcc.loai_cong = 'NGHI_PHEP' THEN 1 END) AS so_ngay_phep
        FROM nhan_vien nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN bang_cham_cong bcc ON nv.ma_nv = bcc.ma_nv 
            AND MONTH(bcc.ngay_cong) = :month 
            AND YEAR(bcc.ngay_cong) = :year
        WHERE nv.trang_thai = 'DANG_LAM' {where_pb}
        GROUP BY nv.ma_nv, nv.ho_ten, pb.ten_pb, cv.ten_cv
        ORDER BY nv.ma_nv ASC
    """)
    rows = db.execute(query, params).fetchall()
    return [dict(r._mapping) for r in rows]


def adjust_attendance_record(
    db: Session, ma_cc: int, fields: dict[str, Any]
) -> Optional[dict[str, Any]]:
    """Quản lý điều chỉnh thông tin chấm công một bản ghi."""
    set_clauses = []
    params: dict[str, Any] = {"ma_cc": ma_cc}

    for key, value in fields.items():
        if value is not None:
            set_clauses.append(f"{key} = :{key}")
            params[key] = value

    if not set_clauses:
        return None

    update_sql = text(f"""
        UPDATE bang_cham_cong
        SET {', '.join(set_clauses)}
        WHERE ma_cc = :ma_cc
    """)
    db.execute(update_sql, params)
    db.commit()

    select_sql = text("""
        SELECT * FROM bang_cham_cong WHERE ma_cc = :ma_cc
    """)
    row = db.execute(select_sql, {"ma_cc": ma_cc}).fetchone()
    return dict(row._mapping) if row else None
