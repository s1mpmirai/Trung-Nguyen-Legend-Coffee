from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.permissions import MANAGE_PORTAL_PERMISSIONS, CurrentAccount
from app.core.roles import ADMIN_ROLE, BUSINESS_ROLES
from app.db.session import get_db
from app.schemas.auth_schemas import (
    first_time_password_request,
    request_login,
)
from app.services.auth_service import first_time_change_password, get_me

router = APIRouter()


def _authenticate(db: Session, request: request_login) -> dict | None:
    """Đăng nhập; tài khoản bị khóa / đã nghỉ việc (đúng mật khẩu) trả 403 kèm lý do thay vì "sai mật khẩu"."""
    from app.services.auth_service import AccountInactiveError, authenticate_user

    try:
        return authenticate_user(db, request.ma_nv, request.mat_khau)
    except AccountInactiveError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error

DbSession = Annotated[Session, Depends(get_db)]

@router.post("/admin-login")
@router.post("/login-admin")
def admin_login(
    request: request_login,
    db: DbSession,
):
    user = _authenticate(db, request)
    if user is None:
        raise HTTPException(status_code=401, detail="Mã tài khoản hoặc mật khẩu không chính xác")

    role = str(user.get("ma_vai_tro") or "").upper()
    if role != "ADMIN":
        raise HTTPException(status_code=403, detail="Tài khoản không có quyền Quản trị viên tối cao")

    return user

@router.post("/manager-login")
@router.post("/login-manager")
@router.post("/login-manage")
def management_login(
    request: request_login,
    db: DbSession,
):
    user = _authenticate(db, request)
    if user is None:
        raise HTTPException(status_code=401, detail="Mã tài khoản hoặc mật khẩu không chính xác")

    role = str(user.get("ma_vai_tro") or "").upper()
    perms = user.get("permissions") or []
    has_mgmt_perm = any(p in perms for p in MANAGE_PORTAL_PERMISSIONS)

    if role == "NHAN_VIEN" and not has_mgmt_perm:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản Nhân viên vui lòng đăng nhập tại Cổng Nhân Viên (/login)"
        )

    if role != ADMIN_ROLE and role not in BUSINESS_ROLES and not has_mgmt_perm:
        raise HTTPException(status_code=403, detail="Tài khoản không có quyền Quản lý hoặc Quản trị chức năng")

    return user


@router.post("/employee-login")
@router.post("/login-employee")
def employee_login(
    request: request_login,
    db: DbSession,
):
    user = _authenticate(db, request)
    if user is None:
        raise HTTPException(status_code=401, detail="Mã nhân viên hoặc mật khẩu không chính xác")

    # Mọi nhân sự có tài khoản (kể cả Admin, Quản lý, Trưởng nhóm) đều chấm công và nhận lương theo công,
    # nên đều được đăng nhập Cổng nhân viên. Quyền quản lý chỉ quyết định việc vào Cổng Điều hành.
    return user


@router.get("/me", summary="Thông tin phiên đăng nhập hiện tại (vai trò, quyền, họ tên)")
def read_current_session(account: CurrentAccount, db: DbSession):
    """Frontend dùng để kiểm tra quyền vào từng cổng thay vì tin dữ liệu lưu ở localStorage."""
    return get_me(db, account)


@router.post("/first-time-change-password")
def api_first_time_change_password(
    request: first_time_password_request,
    account: CurrentAccount,
    db: DbSession,
):
    """Đổi mật khẩu tạm ở lần đăng nhập đầu: bắt buộc có token, mã NV lấy từ token (bỏ qua body)."""
    try:
        return first_time_change_password(db, account["ma_nv"], request.mat_khau_moi)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
