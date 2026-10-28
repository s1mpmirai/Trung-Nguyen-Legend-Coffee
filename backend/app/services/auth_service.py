from sqlalchemy.orm import Session

import app.repositories.auth_repository as account_repository
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.employee_repository import get_by_ma_nv as employee_get_by_ma_nv
from app.schemas.auth_schemas import account_create
from app.utils.auto_gen import define_pass


def authenticate_user(db: Session, ma_nv: str, mat_khau: str) -> dict[str, str] | None:
    clean_id = ma_nv.strip().upper().replace("-", "")
    # Chỉ tài khoản do Admin cấp mới được đăng nhập (không tự tạo tài khoản khi đăng nhập)
    account = account_repository.get_by_ma_nv(db, clean_id)
    if account is None:
        return None

    try:
        is_valid = verify_password(mat_khau, account.mat_khau)
    except ValueError:
        # Mật khẩu trong dữ liệu mẫu được lưu dạng văn bản thô: so khớp đúng một lần rồi băm bcrypt lại
        is_valid = account.mat_khau == mat_khau
        if is_valid:
            account.mat_khau = hash_password(mat_khau)
            db.commit()
            db.refresh(account)

    if not is_valid:
        return None

    if account.trang_thai != "HOAT_DONG":
        return None

    access_token = create_access_token(account.ma_nv)

    from app.repositories.permission_repository import get_employee_permissions
    emp_perms = get_employee_permissions(db, account.ma_nv)
    effective_perms = emp_perms.get("effective_permissions", []) if emp_perms else []

    # BỎ HOÀN TOÀN BẮT BUỘC ĐỔI MẬT KHẨU LẦN ĐẦU THEO YÊU CẦU CỦA USER:
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "ma_nv": account.ma_nv,
        "ma_vai_tro": account.ma_vai_tro,
        "permissions": effective_perms,
        "must_change_password": False,
    }


def first_time_change_password(db: Session, ma_nv: str, mat_khau_moi: str) -> dict:
    clean_id = ma_nv.strip().upper().replace("-", "")
    account = account_repository.get_by_ma_nv(db, clean_id)
    if not account:
        raise ValueError(f"Không tìm thấy tài khoản của nhân viên {ma_nv}")

    if not mat_khau_moi or len(mat_khau_moi.strip()) < 1:
        raise ValueError("Mật khẩu mới không được để trống")

    if mat_khau_moi.strip() == "1":
        raise ValueError("Mật khẩu mới không được trùng với mật khẩu mặc định (1). Vui lòng đặt mật khẩu an toàn hơn!")

    account.mat_khau = hash_password(mat_khau_moi.strip())
    db.commit()
    db.refresh(account)

    access_token = create_access_token(account.ma_nv)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "ma_nv": account.ma_nv,
        "ma_vai_tro": account.ma_vai_tro,
        "must_change_password": False,
        "message": "Đổi mật khẩu lần đầu thành công",
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


def get_without_account_detailed(db: Session) -> list[dict]:
    return account_repository.get_employees_without_account_detailed(db)


def admin_update_account(
    db: Session,
    ma_nv: str,
    mat_khau_moi: str | None = None,
    ma_vai_tro: str | None = None,
    trang_thai: str | None = None,
) -> dict:
    if ma_nv.upper() == "NV01":
        raise ValueError("Tài khoản Quản trị viên tối cao (NV01) được bảo vệ, không thể chỉnh sửa!")

    account = account_repository.get_by_ma_nv(db, ma_nv)
    if not account:
        raise ValueError(f"Không tìm thấy tài khoản của nhân viên {ma_nv}")

    if account.ma_vai_tro == "ADMIN":
        raise ValueError("Không được phép chỉnh sửa tài khoản có vai trò ADMIN!")

    if mat_khau_moi and mat_khau_moi.strip():
        account.mat_khau = hash_password(mat_khau_moi.strip())
    if ma_vai_tro:
        account.ma_vai_tro = ma_vai_tro
    if trang_thai:
        account.trang_thai = trang_thai

    db.commit()
    db.refresh(account)
    return {
        "ma_tk": account.ma_tk,
        "ma_nv": account.ma_nv,
        "ma_vai_tro": account.ma_vai_tro,
        "trang_thai": account.trang_thai,
        "message": "Cập nhật tài khoản thành công",
    }



def get_accounts_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    ma_vai_tro: str | None = None,
    trang_thai: str | None = None,
    sort_by: str | None = None,
    sort_order: str | None = None,
) -> dict:
    return account_repository.get_accounts_list(
        db,
        page=page,
        page_size=page_size,
        search=search,
        ma_vai_tro=ma_vai_tro,
        trang_thai=trang_thai,
        sort_by=sort_by,
        sort_order=sort_order,
    )