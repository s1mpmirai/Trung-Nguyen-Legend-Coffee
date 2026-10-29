from sqlalchemy.orm import Session

import app.repositories.auth_repository as account_repository
from app.core.datetime_utils import get_vietnam_now
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.employee_repository import apply_due_terminations
from app.repositories.employee_repository import get_by_ma_nv as employee_get_by_ma_nv
from app.repositories.permission_repository import get_employee_permissions
from app.schemas.auth_schemas import account_create
from app.utils.auto_gen import define_pass

PROTECTED_ADMIN = "NV01"
VALID_ROLES = {"ADMIN", "QUAN_LY", "TRUONG_NHOM", "NHAN_VIEN"}
VALID_ACCOUNT_STATUSES = {"HOAT_DONG", "KHOA"}
MIN_PASSWORD_LENGTH = 6


def _clean(ma_nv: str) -> str:
    return (ma_nv or "").strip().upper().replace("-", "")


def _validate_new_password(mat_khau_moi: str | None) -> str:
    password = (mat_khau_moi or "").strip()
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Mật khẩu mới phải có tối thiểu {MIN_PASSWORD_LENGTH} ký tự")
    if password == "1":
        raise ValueError("Mật khẩu mới không được trùng với mật khẩu mặc định. Vui lòng đặt mật khẩu an toàn hơn!")
    return password


def _check_can_manage(actor: dict, target_ma_nv: str, target_role: str | None) -> None:
    """Người có ACCOUNT_MANAGE nhưng không phải ADMIN không được động vào tài khoản ADMIN hay tự sửa mình."""
    if target_ma_nv == actor["ma_nv"]:
        raise PermissionError("Không thể tự thay đổi tài khoản của chính mình tại màn hình quản trị.")
    if target_ma_nv == PROTECTED_ADMIN:
        raise PermissionError("Tài khoản Quản trị viên tối cao (NV01) được bảo vệ, không thể chỉnh sửa!")
    if actor["ma_vai_tro"] != "ADMIN" and target_role == "ADMIN":
        raise PermissionError("Chỉ Admin mới được thao tác trên tài khoản có vai trò ADMIN.")


def authenticate_user(db: Session, ma_nv: str, mat_khau: str) -> dict | None:
    clean_id = _clean(ma_nv)
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

    # Thôi việc đến ngày hiệu lực thì khóa tài khoản trước khi kiểm tra trạng thái
    apply_due_terminations(db, clean_id)
    db.refresh(account)
    if account.trang_thai != "HOAT_DONG":
        return None

    account.lan_dn_cuoi = get_vietnam_now()
    db.commit()

    emp_perms = get_employee_permissions(db, account.ma_nv)
    effective_perms = emp_perms.get("effective_permissions", []) if emp_perms else []
    return {
        "access_token": create_access_token(account.ma_nv),
        "token_type": "bearer",
        "ma_nv": account.ma_nv,
        "ma_vai_tro": account.ma_vai_tro,
        "permissions": effective_perms,
        "must_change_password": bool(account.phai_doi_mat_khau),
    }


def get_me(db: Session, account: dict) -> dict:
    """Thông tin phiên đăng nhập hiện tại (dùng cho guard cổng và header ở frontend)."""
    emp = employee_get_by_ma_nv(db, account["ma_nv"]) or {}
    tk = account_repository.get_by_ma_nv(db, account["ma_nv"])
    return {
        "ma_nv": account["ma_nv"],
        "ho_ten": emp.get("ho_ten"),
        "ma_vai_tro": account["ma_vai_tro"],
        "permissions": sorted(account["permissions"]),
        "ten_pb": emp.get("ten_pb"),
        "ten_cv": emp.get("ten_cv"),
        "email": emp.get("email"),
        "must_change_password": bool(tk.phai_doi_mat_khau) if tk else False,
    }


def first_time_change_password(db: Session, ma_nv: str, mat_khau_moi: str) -> dict:
    """Đổi mật khẩu tạm ở lần đăng nhập đầu. ma_nv luôn lấy từ token của người gọi."""
    account = account_repository.get_by_ma_nv(db, _clean(ma_nv))
    if not account:
        raise ValueError(f"Không tìm thấy tài khoản của nhân viên {ma_nv}")
    if not account.phai_doi_mat_khau:
        raise ValueError("Tài khoản không ở trạng thái bắt buộc đổi mật khẩu. Vui lòng dùng chức năng Đổi mật khẩu.")

    account.mat_khau = hash_password(_validate_new_password(mat_khau_moi))
    account.phai_doi_mat_khau = False
    db.commit()
    db.refresh(account)

    return {
        "access_token": create_access_token(account.ma_nv),
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


def create_account(db: Session, data: account_create, actor: dict) -> dict:
    ma_nv = _clean(data.ma_nv)
    if data.ma_vai_tro not in VALID_ROLES:
        raise ValueError(f"Vai trò không hợp lệ: {data.ma_vai_tro}")
    if data.trang_thai not in VALID_ACCOUNT_STATUSES:
        raise ValueError(f"Trạng thái tài khoản không hợp lệ: {data.trang_thai}")
    _check_can_manage(actor, ma_nv, data.ma_vai_tro)

    # 1. Kiểm tra xem nhân viên này có thật trong công ty không
    emp = employee_get_by_ma_nv(db, ma_nv)
    if not emp:
        raise ValueError(f"Không tìm thấy nhân viên {ma_nv} trong hồ sơ. Hãy tạo nhân viên trước!")
    if emp.get("trang_thai") == "DA_NGHI_VIEC":
        raise ValueError(f"Nhân viên {ma_nv} đã nghỉ việc, không thể cấp tài khoản.")

    # 2. Kiểm tra xem nhân viên đã có tài khoản chưa
    if account_repository.get_by_ma_nv(db, ma_nv):
        raise ValueError(f"Nhân viên {ma_nv} đã có tài khoản trong hệ thống.")

    # 3. Mật khẩu tạm ngẫu nhiên, băm bcrypt, bắt đổi ở lần đăng nhập đầu
    temp_password = define_pass()
    try:
        new_account = account_repository.create(db, {
            "ma_nv": ma_nv,
            "mat_khau": hash_password(temp_password),
            "ma_vai_tro": data.ma_vai_tro,
            "trang_thai": data.trang_thai,
            "phai_doi_mat_khau": True,
        })
        db.commit()
        db.refresh(new_account)
    except Exception:
        db.rollback()
        raise

    return {
        "ma_tk": new_account.ma_tk,
        "ma_nv": new_account.ma_nv,
        "ma_vai_tro": new_account.ma_vai_tro,
        "trang_thai": new_account.trang_thai,
        "ngay_tao": new_account.ngay_tao,
        "mat_khau_tam": temp_password,
    }


def change_account_status(db: Session, ma_nv: str, trang_thai: str, actor: dict):
    clean_id = _clean(ma_nv)
    if trang_thai not in VALID_ACCOUNT_STATUSES:
        raise ValueError(f"Trạng thái tài khoản không hợp lệ: {trang_thai}")
    account = account_repository.get_by_ma_nv(db, clean_id)
    if not account:
        raise ValueError(f"Không tìm thấy tài khoản của nhân viên {clean_id}")
    _check_can_manage(actor, clean_id, account.ma_vai_tro)

    account_repository.update_status(db, clean_id, trang_thai)
    db.commit()
    db.refresh(account)
    return account


def change_password(db: Session, ma_nv: str, old_pass: str, new_pass: str):
    account = account_repository.get_by_ma_nv(db, ma_nv)
    if not account:
        raise ValueError(f"Không tìm thấy tài khoản của nhân viên {ma_nv}")
    if not verify_password(old_pass, account.mat_khau):
        raise ValueError("Mật khẩu hiện tại không chính xác")

    account.mat_khau = hash_password(_validate_new_password(new_pass))
    account.phai_doi_mat_khau = False
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}


def get_without_account(db: Session) -> list[str]:
    return account_repository.get_employees_without_account(db)


def get_without_account_detailed(db: Session) -> list[dict]:
    return account_repository.get_employees_without_account_detailed(db)


def admin_update_account(
    db: Session,
    ma_nv: str,
    actor: dict,
    mat_khau_moi: str | None = None,
    ma_vai_tro: str | None = None,
    trang_thai: str | None = None,
) -> dict:
    clean_id = _clean(ma_nv)
    account = account_repository.get_by_ma_nv(db, clean_id)
    if not account:
        raise ValueError(f"Không tìm thấy tài khoản của nhân viên {clean_id}")
    _check_can_manage(actor, clean_id, account.ma_vai_tro)
    if ma_vai_tro:
        if ma_vai_tro not in VALID_ROLES:
            raise ValueError(f"Vai trò không hợp lệ: {ma_vai_tro}")
        _check_can_manage(actor, clean_id, ma_vai_tro)
    if trang_thai and trang_thai not in VALID_ACCOUNT_STATUSES:
        raise ValueError(f"Trạng thái tài khoản không hợp lệ: {trang_thai}")

    if mat_khau_moi and mat_khau_moi.strip():
        # Mật khẩu do Admin đặt lại là mật khẩu tạm: người dùng phải đổi ở lần đăng nhập tới
        account.mat_khau = hash_password(_validate_new_password(mat_khau_moi))
        account.phai_doi_mat_khau = True
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
        "must_change_password": bool(account.phai_doi_mat_khau),
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
