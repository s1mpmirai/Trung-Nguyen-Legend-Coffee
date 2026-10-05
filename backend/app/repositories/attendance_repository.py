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
            'Trụ sở chính Trung Nguyên' AS ten_cn,
            '82 Nguyễn Du, Quận 1, TP. Hồ Chí Minh' AS dia_chi_cn
        FROM nhan_vien nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
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
            COALESCE(ca.ten_ca, 'Hành chính') as ca_lam_viec,
            ca.gio_vao as ca_gio_vao, ca.gio_ra as ca_gio_ra
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


def get_today_attendance(
    db: Session, ma_nv: str, today: date
) -> Optional[dict[str, Any]]:
    """Lấy bản ghi chấm công của nhân viên trong ngày hôm nay."""
    check_sql = text("""
        SELECT ma_cc, ma_nv, ngay_cong, ma_ca, gio_vao, gio_ra, 
               so_gio_lam, so_gio_tang_ca, loai_cong, so_cong, ghi_chu
        FROM bang_cham_cong 
        WHERE ma_nv = :ma_nv AND ngay_cong = :ngay_cong
        LIMIT 1
    """)
    row = db.execute(check_sql, {"ma_nv": ma_nv, "ngay_cong": today}).fetchone()
    return dict(row._mapping) if row else None


def count_late_checkins_in_month(
    db: Session, ma_nv: str, month: int, year: int, exclude_date: Optional[date] = None
) -> int:
    """
    Đếm số lần nhân viên check-in muộn (sau 08:15 hoặc loai_cong = 'DI_TRE') trong tháng.
    """
    where_parts = [
        "ma_nv = :ma_nv",
        "MONTH(ngay_cong) = :month",
        "YEAR(ngay_cong) = :year",
        "(loai_cong = 'DI_TRE' OR gio_vao > '08:15:00')",
    ]
    params: dict[str, Any] = {"ma_nv": ma_nv, "month": month, "year": year}
    if exclude_date:
        where_parts.append("ngay_cong != :exclude_date")
        params["exclude_date"] = exclude_date

    query = text(f"""
        SELECT COUNT(*) AS total
        FROM bang_cham_cong
        WHERE {' AND '.join(where_parts)}
    """)
    row = db.execute(query, params).fetchone()
    return int(row[0]) if row else 0


def record_check_in(
    db: Session,
    ma_nv: str,
    today: date,
    gio_vao: str,
    ma_ca: str = "CA01",
    loai_cong: str = "CONG_DU",
    so_cong: float = 1.0,
    so_gio_lam: float = 8.0,
    ghi_chu: str = "",
) -> dict[str, Any]:
    """
    Thực hiện lưu lượt check-in hôm nay.
    Quy định: Mỗi ngày nhân viên chỉ được check-in 1 lần. Những lần sau không tính.
    Nếu đã check-in trước đó thì không ghi đè, trả về thông tin kèm cờ is_duplicate=True.
    """
    existing = get_today_attendance(db, ma_nv, today)

    if existing and existing.get("gio_vao"):
        return {
            "ma_cc": existing["ma_cc"],
            "gio_vao": str(existing["gio_vao"]),
            "loai_cong": existing.get("loai_cong") or "CONG_DU",
            "is_duplicate": True,
        }

    if existing:
        update_sql = text("""
            UPDATE bang_cham_cong 
            SET ma_ca = :ma_ca, gio_vao = :gio_vao, loai_cong = :loai_cong, 
                so_cong = :so_cong, so_gio_lam = :so_gio_lam, ghi_chu = :ghi_chu
            WHERE ma_cc = :ma_cc
        """)
        db.execute(update_sql, {
            "ma_ca": ma_ca,
            "gio_vao": gio_vao,
            "loai_cong": loai_cong,
            "so_cong": so_cong,
            "so_gio_lam": so_gio_lam,
            "ghi_chu": ghi_chu,
            "ma_cc": existing["ma_cc"],
        })
        ma_cc = existing["ma_cc"]
    else:
        insert_sql = text("""
            INSERT INTO bang_cham_cong (ma_nv, ngay_cong, ma_ca, gio_vao, loai_cong, so_cong, so_gio_lam, ghi_chu)
            VALUES (:ma_nv, :ngay_cong, :ma_ca, :gio_vao, :loai_cong, :so_cong, :so_gio_lam, :ghi_chu)
        """)
        res = db.execute(insert_sql, {
            "ma_nv": ma_nv,
            "ngay_cong": today,
            "ma_ca": ma_ca,
            "gio_vao": gio_vao,
            "loai_cong": loai_cong,
            "so_cong": so_cong,
            "so_gio_lam": so_gio_lam,
            "ghi_chu": ghi_chu,
        })
        ma_cc = res.lastrowid

    db.commit()
    return {
        "ma_cc": ma_cc,
        "gio_vao": gio_vao,
        "loai_cong": loai_cong,
        "so_cong": so_cong,
        "so_gio_lam": so_gio_lam,
        "is_duplicate": False,
    }


def record_check_out(
    db: Session,
    ma_nv: str,
    today: date,
    gio_ra: str,
    so_gio_lam: Optional[float] = None,
    so_gio_tang_ca: Optional[float] = None,
    ma_ca: Optional[str] = None,
    so_cong: Optional[float] = None,
    loai_cong: Optional[str] = None,
    ghi_chu: Optional[str] = None,
) -> dict[str, Any]:
    """Thực hiện lưu hoặc cập nhật lượt check-out hôm nay với các trường tự động đối soát."""
    existing = get_today_attendance(db, ma_nv, today)

    if existing:
        current_gio_lam = float(existing.get("so_gio_lam") or 8.0)
        target_gio_lam = so_gio_lam if so_gio_lam is not None else current_gio_lam
        if current_gio_lam == 7.0 and target_gio_lam > 7.0:
            target_gio_lam = 7.0

        set_clauses = ["gio_ra = :gio_ra", "so_gio_lam = :so_gio_lam"]
        params: dict[str, Any] = {
            "gio_ra": gio_ra,
            "so_gio_lam": target_gio_lam,
            "ma_cc": existing["ma_cc"],
        }

        if so_gio_tang_ca is not None:
            set_clauses.append("so_gio_tang_ca = :so_gio_tang_ca")
            params["so_gio_tang_ca"] = so_gio_tang_ca

        if ma_ca is not None:
            set_clauses.append("ma_ca = :ma_ca")
            params["ma_ca"] = ma_ca

        if so_cong is not None:
            set_clauses.append("so_cong = :so_cong")
            params["so_cong"] = so_cong

        if loai_cong is not None:
            set_clauses.append("loai_cong = :loai_cong")
            params["loai_cong"] = loai_cong

        if ghi_chu is not None:
            set_clauses.append("ghi_chu = :ghi_chu")
            params["ghi_chu"] = ghi_chu

        update_sql = text(f"""
            UPDATE bang_cham_cong 
            SET {', '.join(set_clauses)}
            WHERE ma_cc = :ma_cc
        """)
        db.execute(update_sql, params)
        ma_cc = existing["ma_cc"]
    else:
        target_gio_lam = so_gio_lam if so_gio_lam is not None else 8.0
        target_ot = so_gio_tang_ca if so_gio_tang_ca is not None else 0.0
        target_ca = ma_ca or "CA01"
        target_cong = so_cong if so_cong is not None else 1.0
        target_loai = loai_cong or "CONG_DU"
        target_ghi_chu = ghi_chu or ""

        insert_sql = text("""
            INSERT INTO bang_cham_cong (ma_nv, ngay_cong, ma_ca, gio_ra, loai_cong, so_cong, so_gio_lam, so_gio_tang_ca, ghi_chu)
            VALUES (:ma_nv, :ngay_cong, :ma_ca, :gio_ra, :loai_cong, :so_cong, :so_gio_lam, :so_gio_tang_ca, :ghi_chu)
        """)
        res = db.execute(
            insert_sql,
            {
                "ma_nv": ma_nv,
                "ngay_cong": today,
                "ma_ca": target_ca,
                "gio_ra": gio_ra,
                "loai_cong": target_loai,
                "so_cong": target_cong,
                "so_gio_lam": target_gio_lam,
                "so_gio_tang_ca": target_ot,
                "ghi_chu": target_ghi_chu,
            }
        )
        ma_cc = res.lastrowid

    db.commit()
    return {"ma_cc": ma_cc, "gio_ra": gio_ra}


def get_attendance_history_by_employee(
    db: Session, ma_nv: str, month: Optional[int] = None, year: Optional[int] = None
) -> list[dict[str, Any]]:
    """Lấy danh sách các ngày công chi tiết của một nhân viên."""
    ensure_attendance_columns(db)
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
            bcc.so_gio_lam, bcc.so_gio_tang_ca, bcc.so_cong, bcc.loai_cong, bcc.ghi_chu,
            COALESCE(bcc.trang_thai_duyet, 'CHO_DUYET') as trang_thai_duyet,
            COALESCE(ca.ten_ca, 'Hành chính') as ca_lam_viec,
            'Trụ sở chính Trung Nguyên' as ten_cn,
            '82 Nguyễn Du, Quận 1, TP. Hồ Chí Minh' as dia_chi_cn
        FROM bang_cham_cong bcc
        LEFT JOIN ca_lam_viec ca ON bcc.ma_ca = ca.ma_ca
        LEFT JOIN nhan_vien nv ON bcc.ma_nv = nv.ma_nv
        WHERE {' AND '.join(where_parts)}
        ORDER BY bcc.ngay_cong DESC, bcc.ma_cc DESC
    """)
    rows = db.execute(query, params).fetchall()
    return [dict(r._mapping) for r in rows]


def get_daily_attendance_all(
    db: Session, target_date: date, ma_pb: Optional[str] = None
) -> list[dict[str, Any]]:
    """Dành cho Quản lý: Lấy danh sách chấm công toàn công ty trong 1 ngày."""
    ensure_attendance_columns(db)
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
            COALESCE(bcc.trang_thai_duyet, 'CHO_DUYET') as trang_thai_duyet,
            COALESCE(bcc.ma_ca, ca.ma_ca, 'CA01') as ma_ca,
            COALESCE(ca.ten_ca, 'Hành chính') as ten_ca,
            ca.gio_vao as ca_gio_vao,
            ca.gio_ra as ca_gio_ra,
            ca.he_so as ca_he_so
        FROM nhan_vien nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN bang_cham_cong bcc ON nv.ma_nv = bcc.ma_nv AND bcc.ngay_cong = :target_date
        LEFT JOIN ca_lam_viec ca ON bcc.ma_ca = ca.ma_ca
        WHERE nv.trang_thai = 'DANG_LAM' {where_pb}
        ORDER BY 
            CASE 
                WHEN bcc.ma_cc IS NOT NULL 
                     AND bcc.gio_vao IS NOT NULL 
                     AND bcc.gio_vao != '' 
                     AND bcc.gio_vao != '--:--' 
                     AND (bcc.trang_thai_duyet = 'CHO_DUYET' OR bcc.trang_thai_duyet IS NULL OR bcc.trang_thai_duyet = '') 
                THEN 0
                WHEN bcc.ma_cc IS NOT NULL 
                     AND bcc.gio_vao IS NOT NULL 
                     AND bcc.gio_vao != '' 
                     AND bcc.gio_vao != '--:--' 
                THEN 1
                ELSE 2
            END ASC,
            nv.ma_nv ASC
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


def get_attendance_by_id(db: Session, ma_cc: int) -> Optional[dict[str, Any]]:
    """Lấy thông tin chi tiết một bản ghi chấm công theo ID."""
    query = text("""
        SELECT * FROM bang_cham_cong WHERE ma_cc = :ma_cc
    """)
    row = db.execute(query, {"ma_cc": ma_cc}).fetchone()
    return dict(row._mapping) if row else None


def count_checkin_adjustments_in_month(
    db: Session, ma_nv: str, thang: int, nam: int
) -> int:
    """Đếm số lần Quản lý đã sửa giờ check-in của nhân viên trong tháng."""
    query = text("""
        SELECT COUNT(*) AS total
        FROM lich_su_dieu_chinh_cong
        WHERE ma_nv = :ma_nv 
          AND thang = :thang 
          AND nam = :nam 
          AND gio_vao_moi IS NOT NULL
    """)
    row = db.execute(query, {"ma_nv": ma_nv, "thang": thang, "nam": nam}).fetchone()
    return int(row[0]) if row else 0


def log_attendance_adjustment(
    db: Session,
    ma_cc: int,
    ma_nv: str,
    thang: int,
    nam: int,
    gio_vao_cu: Optional[str] = None,
    gio_vao_moi: Optional[str] = None,
    gio_ra_cu: Optional[str] = None,
    gio_ra_moi: Optional[str] = None,
    ly_do: Optional[str] = None,
) -> None:
    """Ghi log lịch sử sửa đổi chấm công của Quản lý."""
    insert_sql = text("""
        INSERT INTO lich_su_dieu_chinh_cong (
            ma_cc, ma_nv, thang, nam, gio_vao_cu, gio_vao_moi, gio_ra_cu, gio_ra_moi, ly_do
        ) VALUES (
            :ma_cc, :ma_nv, :thang, :nam, :gio_vao_cu, :gio_vao_moi, :gio_ra_cu, :gio_ra_moi, :ly_do
        )
    """)
    db.execute(insert_sql, {
        "ma_cc": ma_cc,
        "ma_nv": ma_nv,
        "thang": thang,
        "nam": nam,
        "gio_vao_cu": gio_vao_cu,
        "gio_vao_moi": gio_vao_moi,
        "gio_ra_cu": gio_ra_cu,
        "gio_ra_moi": gio_ra_moi,
        "ly_do": ly_do,
    })


def get_all_shifts(db: Session) -> list[dict[str, Any]]:
    """Lấy danh sách tất cả các ca làm việc."""
    query = text("""
        SELECT ma_ca, ten_ca, gio_vao, gio_ra, so_gio_chuan, he_so
        FROM ca_lam_viec
        ORDER BY gio_vao ASC
    """)
    rows = db.execute(query).fetchall()
    results = []
    for r in rows:
        d = dict(r._mapping)
        d["gio_vao"] = str(d.get("gio_vao"))[:5] if d.get("gio_vao") else "--:--"
        d["gio_ra"] = str(d.get("gio_ra"))[:5] if d.get("gio_ra") else "--:--"
        d["so_gio_chuan"] = float(d.get("so_gio_chuan") or 8.0)
        d["he_so"] = float(d.get("he_so") or 1.0)
        results.append(d)
    return results


def get_shift_by_code(db: Session, ma_ca: str) -> Optional[dict[str, Any]]:
    """Lấy thông tin một ca làm việc theo mã ca."""
    query = text("""
        SELECT ma_ca, ten_ca, gio_vao, gio_ra, so_gio_chuan, he_so
        FROM ca_lam_viec
        WHERE ma_ca = :ma_ca
        LIMIT 1
    """)
    row = db.execute(query, {"ma_ca": ma_ca}).fetchone()
    if not row:
        return None
    d = dict(row._mapping)
    d["gio_vao_str"] = str(d.get("gio_vao"))[:8] if d.get("gio_vao") else "08:00:00"
    d["gio_ra_str"] = str(d.get("gio_ra"))[:8] if d.get("gio_ra") else "17:00:00"
    d["so_gio_chuan"] = float(d.get("so_gio_chuan") or 8.0)
    d["he_so"] = float(d.get("he_so") or 1.0)
    return d


def ensure_attendance_columns(db: Session):
    """Đảm bảo bảng chấm công có cột trang_thai_duyet nếu chạy trên DB hiện hữu."""
    try:
        check_col = text("""
            SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'bang_cham_cong' 
              AND COLUMN_NAME = 'trang_thai_duyet'
        """)
        exists = db.execute(check_col).scalar()
        if not exists:
            db.execute(text("""
                ALTER TABLE bang_cham_cong 
                ADD COLUMN trang_thai_duyet ENUM('CHO_DUYET', 'DA_DUYET', 'TU_CHOI') DEFAULT 'CHO_DUYET'
                AFTER so_cong
            """))
            db.commit()
    except Exception:
        db.rollback()


def ensure_attendance_lock_table(db: Session):
    """Tạo bảng chốt công tháng nếu chưa tồn tại và đảm bảo cấu trúc bảng chấm công."""
    ensure_attendance_columns(db)
    create_sql = text("""
        CREATE TABLE IF NOT EXISTS chot_cong_thang (
            id INT AUTO_INCREMENT PRIMARY KEY,
            thang TINYINT NOT NULL,
            nam SMALLINT NOT NULL,
            trang_thai VARCHAR(20) DEFAULT 'DA_CHOT',
            nguoi_chot VARCHAR(50) NULL,
            ngay_chot DATETIME DEFAULT CURRENT_TIMESTAMP,
            ghi_chu VARCHAR(255) NULL,
            UNIQUE (thang, nam)
        ) ENGINE=InnoDB;
    """)
    db.execute(create_sql)
    db.commit()


def get_monthly_attendance_lock(db: Session, thang: int, nam: int) -> dict[str, Any]:
    """Kiểm tra trạng thái Chốt/Khóa bảng công tháng."""
    ensure_attendance_lock_table(db)
    query = text("""
        SELECT thang, nam, trang_thai, nguoi_chot, ngay_chot, ghi_chu
        FROM chot_cong_thang
        WHERE thang = :thang AND nam = :nam
    """)
    row = db.execute(query, {"thang": thang, "nam": nam}).fetchone()
    if row:
        m = dict(row._mapping)
        is_locked = bool(m.get("trang_thai") == "DA_CHOT")
        return {
            "thang": thang,
            "nam": nam,
            "is_locked": is_locked,
            "nguoi_chot": m.get("nguoi_chot") or "Quản lý nhân sự",
            "ngay_chot": str(m.get("ngay_chot")) if m.get("ngay_chot") else "",
            "ghi_chu": m.get("ghi_chu") or "",
        }
    return {
        "thang": thang,
        "nam": nam,
        "is_locked": False,
        "nguoi_chot": None,
        "ngay_chot": None,
        "ghi_chu": None,
    }


def set_monthly_attendance_lock(
    db: Session, thang: int, nam: int, is_locked: bool, nguoi_chot: str = "Quản lý", ghi_chu: str = ""
) -> dict[str, Any]:
    """Khóa hoặc Mở khóa bảng công tháng."""
    ensure_attendance_lock_table(db)
    trang_thai = "DA_CHOT" if is_locked else "CHO_CHOT"
    upsert_sql = text("""
        INSERT INTO chot_cong_thang (thang, nam, trang_thai, nguoi_chot, ngay_chot, ghi_chu)
        VALUES (:thang, :nam, :trang_thai, :nguoi_chot, NOW(), :ghi_chu)
        ON DUPLICATE KEY UPDATE
            trang_thai = VALUES(trang_thai),
            nguoi_chot = VALUES(nguoi_chot),
            ngay_chot = NOW(),
            ghi_chu = VALUES(ghi_chu)
    """)
    db.execute(upsert_sql, {
        "thang": thang,
        "nam": nam,
        "trang_thai": trang_thai,
        "nguoi_chot": nguoi_chot,
        "ghi_chu": ghi_chu or ("Đã chốt bảng công tháng" if is_locked else "Đã mở khóa bảng công tháng"),
    })
    db.commit()
    return get_monthly_attendance_lock(db, thang, nam)

