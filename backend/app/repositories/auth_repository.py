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

def get_employees_without_account(db: Session) -> list[TaiKhoan]:
    query = """
        SELECT nv.ma_nv, nv.ho_ten, nv.email, pb.ten_pb, cv.ten_cv
        FROM nhan_vien nv
        LEFT JOIN tai_khoan tk ON nv.ma_nv = tk.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        WHERE tk.ma_nv IS NULL
          AND nv.trang_thai = 'DANG_LAM'
        ORDER BY nv.ma_nv ASC
    """
    rows = db.execute(text(query)).mappings().all()
    return [dict(row) for row in rows]
