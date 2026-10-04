from datetime import date
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.datetime_utils import get_vietnam_now


def generate_contract_code(db: Session) -> str:
    query = """
        SELECT ma_hd 
        FROM hop_dong_lao_dong 
        WHERE ma_hd REGEXP '^HD-[0-9]+$'
        ORDER BY CAST(SUBSTRING(ma_hd, 4) AS UNSIGNED) DESC 
        LIMIT 1
    """
    latest = db.execute(text(query)).scalar()
    if latest:
        num = int(latest[3:]) + 1
        return f"HD-{num:03d}"
    return "HD-001"


def get_contract_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    loai_hd: str | None = None,
    trang_thai: str | None = None,
    expiring_days: int | None = None,
) -> dict:
    offset = (page - 1) * page_size
    conditions = ["1=1"]
    params = {}

    if search:
        conditions.append("(hd.ma_hd LIKE :search OR hd.ma_nv LIKE :search OR nv.ho_ten LIKE :search OR nv.cccd LIKE :search)")
        params["search"] = f"%{search.strip()}%"

    if loai_hd:
        conditions.append("hd.loai_hd = :loai_hd")
        params["loai_hd"] = loai_hd.strip()

    if trang_thai:
        conditions.append("hd.trang_thai = :trang_thai")
        params["trang_thai"] = trang_thai.strip()

    if expiring_days is not None:
        conditions.append("hd.trang_thai = 'HIEU_LUC' AND hd.ngay_ket_thuc IS NOT NULL AND DATEDIFF(hd.ngay_ket_thuc, CURDATE()) BETWEEN 0 AND :expiring_days")
        params["expiring_days"] = expiring_days

    where_sql = " AND ".join(conditions)

    count_query = f"""
        SELECT COUNT(*) 
        FROM hop_dong_lao_dong hd
        JOIN nhan_vien nv ON hd.ma_nv = nv.ma_nv
        WHERE {where_sql}
    """
    total = db.execute(text(count_query), params).scalar() or 0

    stats_query = """
        SELECT 
            SUM(CASE WHEN trang_thai = 'HIEU_LUC' THEN 1 ELSE 0 END) AS so_hieu_luc,
            SUM(CASE WHEN trang_thai = 'DA_THANH_LY' THEN 1 ELSE 0 END) AS so_da_thanh_ly,
            SUM(CASE WHEN trang_thai = 'HIEU_LUC' AND ngay_ket_thuc IS NOT NULL AND DATEDIFF(ngay_ket_thuc, CURDATE()) BETWEEN 0 AND 30 THEN 1 ELSE 0 END) AS so_sap_het_han_30_ngay
        FROM hop_dong_lao_dong
    """
    stats_row = db.execute(text(stats_query)).mappings().first()

    query = f"""
        SELECT 
            hd.ma_hd,
            hd.ma_nv,
            nv.ho_ten,
            nv.cccd,
            nv.sdt,
            nv.email,
            pb.ten_pb,
            cv.ten_cv,
            hd.loai_hd,
            hd.ngay_ky,
            hd.ngay_bat_dau,
            hd.ngay_ket_thuc,
            hd.luong_co_ban,
            hd.ty_le_huong,
            hd.so_tai_khoan,
            hd.ngan_hang,
            hd.ma_so_thue,
            hd.so_bhxh,
            hd.trang_thai,
            CASE 
                WHEN hd.ngay_ket_thuc IS NOT NULL THEN DATEDIFF(hd.ngay_ket_thuc, CURDATE())
                ELSE NULL 
            END AS con_lai_ngay,
            hd.ngay_tao,
            hd.ngay_cap_nhat
        FROM hop_dong_lao_dong hd
        JOIN nhan_vien nv ON hd.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        WHERE {where_sql}
        ORDER BY hd.ngay_bat_dau DESC
        LIMIT :limit OFFSET :offset
    """
    params["limit"] = page_size
    params["offset"] = offset

    rows = db.execute(text(query), params).mappings().all()
    return {
        "total": total,
        "so_hieu_luc": stats_row["so_hieu_luc"] if stats_row else 0,
        "so_sap_het_han_30_ngay": stats_row["so_sap_het_han_30_ngay"] if stats_row else 0,
        "so_da_thanh_ly": stats_row["so_da_thanh_ly"] if stats_row else 0,
        "items": [dict(r) for r in rows]
    }


def get_contract_by_id(db: Session, ma_hd: str) -> dict | None:
    query = """
        SELECT 
            hd.ma_hd,
            hd.ma_nv,
            nv.ho_ten,
            nv.cccd,
            nv.sdt,
            nv.email,
            pb.ten_pb,
            cv.ten_cv,
            hd.loai_hd,
            hd.ngay_ky,
            hd.ngay_bat_dau,
            hd.ngay_ket_thuc,
            hd.luong_co_ban,
            hd.ty_le_huong,
            hd.so_tai_khoan,
            hd.ngan_hang,
            hd.ma_so_thue,
            hd.so_bhxh,
            hd.trang_thai,
            CASE 
                WHEN hd.ngay_ket_thuc IS NOT NULL THEN DATEDIFF(hd.ngay_ket_thuc, CURDATE())
                ELSE NULL 
            END AS con_lai_ngay,
            hd.ngay_tao,
            hd.ngay_cap_nhat
        FROM hop_dong_lao_dong hd
        JOIN nhan_vien nv ON hd.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        WHERE hd.ma_hd = :ma_hd
        LIMIT 1
    """
    row = db.execute(text(query), {"ma_hd": ma_hd}).mappings().first()
    return dict(row) if row else None


def get_contracts_by_employee(db: Session, ma_nv: str) -> list[dict]:
    query = """
        SELECT 
            hd.ma_hd,
            hd.ma_nv,
            hd.loai_hd,
            hd.ngay_ky,
            hd.ngay_bat_dau,
            hd.ngay_ket_thuc,
            hd.luong_co_ban,
            hd.ty_le_huong,
            hd.so_tai_khoan,
            hd.ngan_hang,
            hd.ma_so_thue,
            hd.so_bhxh,
            hd.trang_thai,
            CASE 
                WHEN hd.ngay_ket_thuc IS NOT NULL THEN DATEDIFF(hd.ngay_ket_thuc, CURDATE())
                ELSE NULL 
            END AS con_lai_ngay,
            hd.ngay_tao,
            hd.ngay_cap_nhat
        FROM hop_dong_lao_dong hd
        WHERE hd.ma_nv = :ma_nv
        ORDER BY hd.ngay_bat_dau DESC
    """
    rows = db.execute(text(query), {"ma_nv": ma_nv}).mappings().all()
    return [dict(r) for r in rows]


def create_contract(db: Session, data: dict) -> dict:
    if not data.get("ma_hd"):
        data["ma_hd"] = generate_contract_code(db)

    now_vn = get_vietnam_now()
    data["ngay_tao"] = now_vn
    data["ngay_cap_nhat"] = now_vn

    query = """
        INSERT INTO hop_dong_lao_dong (
            ma_hd, ma_nv, loai_hd, ngay_ky, ngay_bat_dau, ngay_ket_thuc,
            luong_co_ban, ty_le_huong, so_tai_khoan, ngan_hang, ma_so_thue, so_bhxh,
            trang_thai, ngay_tao, ngay_cap_nhat
        ) VALUES (
            :ma_hd, :ma_nv, :loai_hd, :ngay_ky, :ngay_bat_dau, :ngay_ket_thuc,
            :luong_co_ban, :ty_le_huong, :so_tai_khoan, :ngan_hang, :ma_so_thue, :so_bhxh,
            :trang_thai, :ngay_tao, :ngay_cap_nhat
        )
    """
    db.execute(text(query), data)
    db.commit()
    return get_contract_by_id(db, data["ma_hd"])


def update_contract(db: Session, ma_hd: str, data: dict) -> dict | None:
    contract = get_contract_by_id(db, ma_hd)
    if not contract:
        return None

    clean_data = {k: v for k, v in data.items() if v is not None}
    if not clean_data:
        return contract

    clean_data["ngay_cap_nhat"] = get_vietnam_now()
    set_clauses = [f"{k} = :{k}" for k in clean_data.keys()]

    query = f"""
        UPDATE hop_dong_lao_dong
        SET {', '.join(set_clauses)}
        WHERE ma_hd = :ma_hd
    """
    db.execute(text(query), {**clean_data, "ma_hd": ma_hd})
    db.commit()
    return get_contract_by_id(db, ma_hd)


def liquidate_contract(db: Session, ma_hd: str, ngay_ket_thuc: date | None = None) -> dict:
    contract = get_contract_by_id(db, ma_hd)
    if not contract:
        raise ValueError(f"Không tìm thấy hợp đồng {ma_hd}")

    now_vn = get_vietnam_now()
    end_date = ngay_ket_thuc or now_vn.date()

    query = """
        UPDATE hop_dong_lao_dong
        SET trang_thai = 'DA_THANH_LY',
            ngay_ket_thuc = :end_date,
            ngay_cap_nhat = :now
        WHERE ma_hd = :ma_hd
    """
    db.execute(text(query), {"end_date": end_date, "now": now_vn, "ma_hd": ma_hd})
    db.commit()
    return get_contract_by_id(db, ma_hd)


def delete_contract(db: Session, ma_hd: str) -> bool:
    db.execute(text("DELETE FROM hop_dong_lao_dong WHERE ma_hd = :ma_hd"), {"ma_hd": ma_hd})
    db.commit()
    return True
