from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.datetime_utils import get_vietnam_now


def generate_product_code(db: Session) -> str:
    query = """
        SELECT ma_sp 
        FROM san_pham 
        WHERE ma_sp REGEXP '^SP[0-9]+$'
        ORDER BY CAST(SUBSTRING(ma_sp, 3) AS UNSIGNED) DESC 
        LIMIT 1
    """
    latest = db.execute(text(query)).scalar()
    if latest:
        num = int(latest[2:]) + 1
        return f"SP{num:02d}"
    return "SP01"


def get_product_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    loai_sp: str | None = None,
    ma_ncc: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    low_stock: int | None = None,
    trang_thai: int | None = None,
) -> dict:
    offset = (page - 1) * page_size
    conditions = ["1=1"]
    params = {}

    if search:
        conditions.append("(sp.ma_sp LIKE :search OR sp.ten_sp LIKE :search OR sp.mo_ta LIKE :search)")
        params["search"] = f"%{search.strip()}%"

    if loai_sp:
        conditions.append("sp.loai_sp = :loai_sp")
        params["loai_sp"] = loai_sp.strip()

    if ma_ncc:
        conditions.append("sp.ma_ncc = :ma_ncc")
        params["ma_ncc"] = ma_ncc.strip()

    if min_price is not None:
        conditions.append("sp.gia_ban >= :min_price")
        params["min_price"] = min_price

    if max_price is not None:
        conditions.append("sp.gia_ban <= :max_price")
        params["max_price"] = max_price

    if low_stock is not None:
        conditions.append("sp.ton_kho <= :low_stock")
        params["low_stock"] = low_stock

    if trang_thai is not None:
        conditions.append("sp.trang_thai = :trang_thai")
        params["trang_thai"] = trang_thai

    where_sql = " AND ".join(conditions)

    count_query = f"SELECT COUNT(*) FROM san_pham sp WHERE {where_sql}"
    total = db.execute(text(count_query), params).scalar() or 0

    stats_query = f"SELECT COALESCE(SUM(ton_kho), 0) AS tong_ton, COALESCE(SUM(ton_kho * gia_nhap), 0) AS tong_gia_tri FROM san_pham sp WHERE {where_sql}"
    stats_row = db.execute(text(stats_query), params).mappings().first()
    tong_ton_kho = stats_row["tong_ton"] if stats_row else 0
    tong_gia_tri_kho = float(stats_row["tong_gia_tri"] if stats_row else 0)

    query = f"""
        SELECT 
            sp.ma_sp,
            sp.ten_sp,
            sp.loai_sp,
            sp.ma_ncc,
            ncc.ten_ncc,
            sp.ma_nv_quan_ly,
            nv.ho_ten AS ten_nv_quan_ly,
            sp.don_vi_tinh,
            sp.quy_cach,
            sp.gia_nhap,
            sp.gia_ban,
            sp.ton_kho,
            sp.mo_ta,
            sp.trang_thai,
            sp.ngay_tao,
            sp.ngay_cap_nhat
        FROM san_pham sp
        LEFT JOIN nha_cung_cap ncc ON sp.ma_ncc = ncc.ma_ncc
        LEFT JOIN nhan_vien nv ON sp.ma_nv_quan_ly = nv.ma_nv
        WHERE {where_sql}
        ORDER BY sp.ma_sp ASC
        LIMIT :limit OFFSET :offset
    """
    params["limit"] = page_size
    params["offset"] = offset

    rows = db.execute(text(query), params).mappings().all()
    return {
        "total": total,
        "tong_ton_kho": tong_ton_kho,
        "tong_gia_tri_kho": tong_gia_tri_kho,
        "items": [dict(r) for r in rows]
    }


def get_product_by_id(db: Session, ma_sp: str) -> dict | None:
    query = """
        SELECT 
            sp.ma_sp,
            sp.ten_sp,
            sp.loai_sp,
            sp.ma_ncc,
            ncc.ten_ncc,
            sp.ma_nv_quan_ly,
            nv.ho_ten AS ten_nv_quan_ly,
            sp.don_vi_tinh,
            sp.quy_cach,
            sp.gia_nhap,
            sp.gia_ban,
            sp.ton_kho,
            sp.mo_ta,
            sp.trang_thai,
            sp.ngay_tao,
            sp.ngay_cap_nhat
        FROM san_pham sp
        LEFT JOIN nha_cung_cap ncc ON sp.ma_ncc = ncc.ma_ncc
        LEFT JOIN nhan_vien nv ON sp.ma_nv_quan_ly = nv.ma_nv
        WHERE sp.ma_sp = :ma_sp
        LIMIT 1
    """
    row = db.execute(text(query), {"ma_sp": ma_sp}).mappings().first()
    return dict(row) if row else None


def get_distinct_categories(db: Session) -> list[str]:
    query = "SELECT DISTINCT loai_sp FROM san_pham ORDER BY loai_sp ASC"
    rows = db.execute(text(query)).scalars().all()
    return list(rows)


def create_product(db: Session, data: dict) -> dict:
    if not data.get("ma_sp"):
        data["ma_sp"] = generate_product_code(db)

    now_vn = get_vietnam_now()
    data["ngay_tao"] = now_vn
    data["ngay_cap_nhat"] = now_vn

    query = """
        INSERT INTO san_pham (
            ma_sp, ten_sp, loai_sp, ma_ncc, ma_nv_quan_ly, don_vi_tinh,
            quy_cach, gia_nhap, gia_ban, ton_kho, mo_ta, trang_thai, ngay_tao, ngay_cap_nhat
        ) VALUES (
            :ma_sp, :ten_sp, :loai_sp, :ma_ncc, :ma_nv_quan_ly, :don_vi_tinh,
            :quy_cach, :gia_nhap, :gia_ban, :ton_kho, :mo_ta, :trang_thai, :ngay_tao, :ngay_cap_nhat
        )
    """
    db.execute(text(query), data)
    db.commit()
    return get_product_by_id(db, data["ma_sp"])


def update_product(db: Session, ma_sp: str, data: dict) -> dict | None:
    product = get_product_by_id(db, ma_sp)
    if not product:
        return None

    clean_data = {k: v for k, v in data.items() if v is not None}
    if not clean_data:
        return product

    clean_data["ngay_cap_nhat"] = get_vietnam_now()
    set_clauses = [f"{k} = :{k}" for k in clean_data.keys()]

    query = f"""
        UPDATE san_pham
        SET {', '.join(set_clauses)}
        WHERE ma_sp = :ma_sp
    """
    db.execute(text(query), {**clean_data, "ma_sp": ma_sp})
    db.commit()
    return get_product_by_id(db, ma_sp)


def adjust_stock(db: Session, ma_sp: str, loai_thay_doi: str, so_luong: int, ghi_chu: str | None = None) -> dict:
    product = get_product_by_id(db, ma_sp)
    if not product:
        raise ValueError(f"Không tìm thấy sản phẩm {ma_sp}")

    current_stock = product["ton_kho"]

    if loai_thay_doi == "NHAP_KHO":
        new_stock = current_stock + so_luong
    elif loai_thay_doi == "XUAT_KHO":
        if current_stock < so_luong:
            raise ValueError(f"Tồn kho hiện tại ({current_stock}) không đủ để xuất ({so_luong})")
        new_stock = current_stock - so_luong
    elif loai_thay_doi == "DIEU_CHINH":
        new_stock = so_luong
    else:
        raise ValueError("Loại thay đổi tồn kho không hợp lệ (NHAP_KHO, XUAT_KHO, DIEU_CHINH)")

    now_vn = get_vietnam_now()
    query = """
        UPDATE san_pham 
        SET ton_kho = :new_stock, ngay_cap_nhat = :now 
        WHERE ma_sp = :ma_sp
    """
    db.execute(text(query), {"new_stock": new_stock, "now": now_vn, "ma_sp": ma_sp})
    db.commit()
    return get_product_by_id(db, ma_sp)


def delete_product(db: Session, ma_sp: str) -> bool:
    db.execute(text("DELETE FROM san_pham WHERE ma_sp = :ma_sp"), {"ma_sp": ma_sp})
    db.commit()
    return True
