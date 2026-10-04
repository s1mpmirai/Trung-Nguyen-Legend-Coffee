from sqlalchemy.orm import Session

import app.repositories.auth_repository as account_repository
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.employee_repository import get_by_ma_nv as employee_get_by_ma_nv
from app.schemas.auth_schemas import account_create
from app.utils.auto_gen import define_pass


def authenticate_user(db: Session, ma_nv: str, mat_khau: str) -> dict[str, str] | None:
    clean_id = ma_nv.strip().upper().replace("-", "")
    account = account_repository.get_by_ma_nv(db, clean_id)

    if account is None:
        return None

    # Hỗ trợ mật khẩu băm chuẩn bcrypt trong DB  is_valid = verify_password(mat_khau, account.mat_khau)
    is_valid = False
    try: 
        is_valid = verify_password(mat_khau, account.mat_khau)
    except:  # noqa: E722
        is_valid = False
        
    if not is_valid:
        # Hỗ trợ mật khẩu mặc định "1" hoặc chưa băm đúng với DB
        if mat_khau == "1" and (account.mat_khau == "1" or "$2y$10$92IXUNpkjO0rOQ5byMi" in (account.mat_khau or "")):
            is_valid = True
        elif account.mat_khau == mat_khau:
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
    emp_exists = employee_get_by_ma_nv(db, data.ma_nv)
    
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

def get_without_account(db: Session) -> list[str]:
    return account_repository.get_employees_without_account(db)


def get_accounts_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    ma_vai_tro: str | None = None,
    trang_thai: str | None = None,
) -> dict:
    return account_repository.get_accounts_list(
        db,
        page=page,
        page_size=page_size,
        search=search,
        ma_vai_tro=ma_vai_tro,
        trang_thai=trang_thai,
    )