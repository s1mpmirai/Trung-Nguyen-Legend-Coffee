from sqlalchemy.orm import Session
from sqlalchemy import text
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
