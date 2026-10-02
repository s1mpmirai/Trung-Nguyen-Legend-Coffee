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

