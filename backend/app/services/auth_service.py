from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.security import create_access_token, verify_password, hash_password
from app.models.account_model import TaiKhoan
from app.utils.auto_gen import define_pass
from app.schemas.auth_schemas import account_create
import app.repositories.auth_repository as account_repository


def authenticate_user(db: Session, ma_nv: str, mat_khau: str) -> dict[str, str] | None:
    clean_id = ma_nv.strip().upper().replace("-", "")
    account = account_repository.get_by_ma_nv(db, clean_id)

    if account is None:
        return None

    # Hỗ trợ mật khẩu băm chuẩn bcrypt trong DB  is_valid = verify_password(mat_khau, account.mat_khau)
    is_valid = False
    try: 
        is_valid = verify_password(mat_khau, account.mat_khau)
    except: 
        is_valid = False
        
    if not is_valid:
        # kiểm tra mật khẩu nếu chưa bâm với db nếu đúng thì cho login và bâm lại lưu vô db
        if account.mat_khau == mat_khau:
            account.mat_khau = hash_password(mat_khau)
            db.commit()
            db.refresh(account)
            is_valid = True
        else:
            return None
    
    if account.trang_thai != "HOAT_DONG":
        return None

    access_token = create_access_token(str(account.ma_tk))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "ma_nv": account.ma_nv,
        "ma_vai_tro": account.ma_vai_tro,
    }


def login_for_portal(
    db: Session,
    ma_nv: str,
    mat_khau: str,
    allowed_roles: set[str],
):
    result = authenticate_user(db, ma_nv, mat_khau)

    if result is None:
        return None

    if result["ma_vai_tro"] not in allowed_roles:
        return None

    return result


def create_account(db: Session, data: account_create):
    # 1. Kiểm tra xem nhân viên này có thật trong công ty không
    emp_exists = db.execute(
        text("SELECT ma_nv FROM nhan_vien WHERE ma_nv = :ma_nv"),
        {"ma_nv": data.ma_nv}
    ).scalar_one_or_none()
    
    if not emp_exists:
        raise ValueError(f"Không tìm thấy nhân viên {data.ma_nv} trong hồ sơ. Hãy tạo nhân viên trước!")
    
    # 2. Kiểm tra xem nhân viên đã có tài khoản chưa
    existing_account = account_repository.get_by_ma_nv(db, data.ma_nv)
    if existing_account:
        raise ValueError(f"Nhân viên {data.ma_nv} đã có tài khoản trong hệ thống.")
    
    # 3. Hash mật khẩu bảo mật bằng bcrypt
    default_pass = define_pass()
    account_dict = {
        "ma_nv": data.ma_nv,
        "mat_khau": hash_password(default_pass),
        "ma_vai_tro": data.ma_vai_tro,
        "trang_thai": data.trang_thai,
    }
    try:
        new_account = account_repository.create(db, account_dict)
        db.commit()
        db.refresh(new_account)
        return new_account
    except Exception:
        db.rollback()
        raise


def change_account_status(db: Session, ma_nv: str, trang_thai: str):
    account = account_repository.update_status(db, ma_nv, trang_thai)
    if not account:
        raise ValueError(f"Không tìm thấy tài khoản của nhân viên {ma_nv}")
    db.commit()
    return account


def change_password(db: Session, ma_nv: str, old_pass: str, new_pass: str):
    account = account_repository.get_by_ma_nv(db, ma_nv)
    if not account:
        raise ValueError(f"Không tìm thấy tài khoản của nhân viên {ma_nv}")
    if not verify_password(old_pass, account.mat_khau):
        raise ValueError("Mật khẩu hiện tại không chính xác")
    
    account.mat_khau = hash_password(new_pass)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}
