from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.datetime_utils import get_vietnam_now


def generate_supplier_code(db: Session) -> str:
    query = """
        SELECT ma_ncc 
        FROM nha_cung_cap 
        WHERE ma_ncc REGEXP '^NCC[0-9]+$'
        ORDER BY CAST(SUBSTRING(ma_ncc, 4) AS UNSIGNED) DESC 
        LIMIT 1
    """
    latest = db.execute(text(query)).scalar()
    if latest:
        num = int(latest[3:]) + 1
        return f"NCC{num:02d}"
    return "NCC01"


def get_supplier_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    loai_hang: str | None = None,
    trang_thai: int | None = None,
) -> dict:
    offset = (page - 1) * page_size
    conditions = ["1=1"]
    params = {}

    if search:
        conditions.append("(ncc.ma_ncc LIKE :search OR ncc.ten_ncc LIKE :search OR ncc.nguoi_lien_he LIKE :search OR ncc.sdt LIKE :search)")
        params["search"] = f"%{search.strip()}%"

    if loai_hang:
        conditions.append("ncc.loai_hang LIKE :loai_hang")
        params["loai_hang"] = f"%{loai_hang.strip()}%"

    if trang_thai is not None:
        conditions.append("ncc.trang_thai = :trang_thai")
        params["trang_thai"] = trang_thai

    where_sql = " AND ".join(conditions)

    count_query = f"SELECT COUNT(*) FROM nha_cung_cap ncc WHERE {where_sql}"
    total = db.execute(text(count_query), params).scalar() or 0

    query = f"""
        SELECT 
            ncc.ma_ncc,
            ncc.ten_ncc,
            ncc.dia_chi,
            ncc.tinh_thanh,
            ncc.sdt,
            ncc.email,
            ncc.nguoi_lien_he,
            ncc.loai_hang,
            ncc.ma_nv_phu_trach,
            nv.ho_ten AS ten_nv_phu_trach,
            ncc.trang_thai,
            ncc.ngay_tao,
            ncc.ngay_cap_nhat,
            (SELECT COUNT(*) FROM san_pham sp WHERE sp.ma_ncc = ncc.ma_ncc) AS so_san_pham_cung_cap
        FROM nha_cung_cap ncc
        LEFT JOIN nhan_vien nv ON ncc.ma_nv_phu_trach = nv.ma_nv
        WHERE {where_sql}
        ORDER BY ncc.ma_ncc ASC
        LIMIT :limit OFFSET :offset
    """
    params["limit"] = page_size
    params["offset"] = offset

    rows = db.execute(text(query), params).mappings().all()
    return {
        "total": total,
        "items": [dict(r) for r in rows]
    }


def get_supplier_by_id(db: Session, ma_ncc: str) -> dict | None:
    query = """
        SELECT 
            ncc.ma_ncc,
            ncc.ten_ncc,
            ncc.dia_chi,
            ncc.tinh_thanh,
            ncc.sdt,
            ncc.email,
            ncc.nguoi_lien_he,
            ncc.loai_hang,
            ncc.ma_nv_phu_trach,
            nv.ho_ten AS ten_nv_phu_trach,
            ncc.trang_thai,
            ncc.ngay_tao,
            ncc.ngay_cap_nhat,
            (SELECT COUNT(*) FROM san_pham sp WHERE sp.ma_ncc = ncc.ma_ncc) AS so_san_pham_cung_cap
        FROM nha_cung_cap ncc
        LEFT JOIN nhan_vien nv ON ncc.ma_nv_phu_trach = nv.ma_nv
        WHERE ncc.ma_ncc = :ma_ncc
        LIMIT 1
    """
    row = db.execute(text(query), {"ma_ncc": ma_ncc}).mappings().first()
    return dict(row) if row else None


def create_supplier(db: Session, data: dict) -> dict:
    if not data.get("ma_ncc"):
        data["ma_ncc"] = generate_supplier_code(db)
    
    now_vn = get_vietnam_now()
    data["ngay_tao"] = now_vn
    data["ngay_cap_nhat"] = now_vn

    query = """
        INSERT INTO nha_cung_cap (
            ma_ncc, ten_ncc, dia_chi, tinh_thanh, sdt, email,
            nguoi_lien_he, loai_hang, ma_nv_phu_trach, trang_thai, ngay_tao, ngay_cap_nhat
        ) VALUES (
            :ma_ncc, :ten_ncc, :dia_chi, :tinh_thanh, :sdt, :email,
            :nguoi_lien_he, :loai_hang, :ma_nv_phu_trach, :trang_thai, :ngay_tao, :ngay_cap_nhat
        )
    """
    db.execute(text(query), data)
    db.commit()
    return get_supplier_by_id(db, data["ma_ncc"])


def update_supplier(db: Session, ma_ncc: str, data: dict) -> dict | None:
    supplier = get_supplier_by_id(db, ma_ncc)
    if not supplier:
        return None

    clean_data = {k: v for k, v in data.items() if v is not None}
    if not clean_data:
        return supplier

    clean_data["ngay_cap_nhat"] = get_vietnam_now()
    set_clauses = [f"{k} = :{k}" for k in clean_data.keys()]

    query = f"""
        UPDATE nha_cung_cap
        SET {', '.join(set_clauses)}
        WHERE ma_ncc = :ma_ncc
    """
    db.execute(text(query), {**clean_data, "ma_ncc": ma_ncc})
    db.commit()
    return get_supplier_by_id(db, ma_ncc)


def delete_supplier(db: Session, ma_ncc: str) -> bool:
    # Kiểm tra xem có sản phẩm nào liên kết với nhà cung cấp này không
    count_sp = db.execute(
        text("SELECT COUNT(*) FROM san_pham WHERE ma_ncc = :ma_ncc"),
        {"ma_ncc": ma_ncc}
    ).scalar() or 0
    if count_sp > 0:
        raise ValueError(f"Không thể xóa nhà cung cấp vì đang có {count_sp} sản phẩm liên kết. Hãy chuyển sang ngừng hợp tác!")

    db.execute(text("DELETE FROM nha_cung_cap WHERE ma_ncc = :ma_ncc"), {"ma_ncc": ma_ncc})
    db.commit()
    return True
