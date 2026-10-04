from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.account_model import TaiKhoan


def get_by_ma_nv(db: Session, ma_nv: str) -> TaiKhoan | None:
    return db.query(TaiKhoan).filter(TaiKhoan.ma_nv == ma_nv).first()

def create(db: Session, account_data: dict) -> TaiKhoan:
    new_account = TaiKhoan(**account_data)
    db.add(new_account)
    db.flush()
    return new_account

def update_status(db: Session, ma_nv: str, trang_thai: str) -> TaiKhoan | None:
    account = get_by_ma_nv(db, ma_nv)
    if account:
        account.trang_thai = trang_thai
        db.flush()
    return account

def get_employees_without_account(db: Session) -> list[str]:
    query = """
        SELECT nv.ma_nv
        FROM nhan_vien nv
        LEFT JOIN tai_khoan tk ON nv.ma_nv = tk.ma_nv
        WHERE tk.ma_nv IS NULL
          AND nv.trang_thai = 'DANG_LAM'
        ORDER BY 
            CASE WHEN nv.ma_nv REGEXP '^NV[0-9]+$' THEN CAST(SUBSTRING(nv.ma_nv, 3) AS UNSIGNED) ELSE 999999 END ASC,
            nv.ma_nv ASC
    """
    rows = db.execute(text(query)).scalars().all()
    return list(rows)


def get_accounts_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    ma_vai_tro: str | None = None,
    trang_thai: str | None = None,
) -> dict:
    offset = (page - 1) * page_size
    conditions = ["1=1"]
    params = {}

    if search:
        conditions.append("(tk.ma_nv LIKE :search OR nv.ho_ten LIKE :search OR nv.email LIKE :search)")
        params["search"] = f"%{search.strip()}%"

    if ma_vai_tro:
        conditions.append("tk.ma_vai_tro = :ma_vai_tro")
        params["ma_vai_tro"] = ma_vai_tro.strip()

    if trang_thai:
        conditions.append("tk.trang_thai = :trang_thai")
        params["trang_thai"] = trang_thai.strip()

    where_sql = " AND ".join(conditions)

    count_query = f"""
        SELECT COUNT(*) 
        FROM tai_khoan tk 
        JOIN nhan_vien nv ON tk.ma_nv = nv.ma_nv 
        WHERE {where_sql}
    """
    total = db.execute(text(count_query), params).scalar() or 0

    query = f"""
        SELECT 
            tk.ma_tk,
            tk.ma_nv,
            nv.ho_ten,
            nv.email,
            nv.sdt,
            pb.ten_pb,
            cv.ten_cv,
            tk.ma_vai_tro,
            vt.ten_vai_tro,
            tk.trang_thai,
            tk.lan_dn_cuoi,
            tk.ngay_tao,
            tk.ngay_cap_nhat
        FROM tai_khoan tk
        JOIN nhan_vien nv ON tk.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN vai_tro vt ON tk.ma_vai_tro = vt.ma_vai_tro
        WHERE {where_sql}
        ORDER BY tk.ngay_tao DESC
        LIMIT :limit OFFSET :offset
    """
    params["limit"] = page_size
    params["offset"] = offset

    rows = db.execute(text(query), params).mappings().all()
    return {
        "total": total,
        "items": [dict(r) for r in rows]
    }

