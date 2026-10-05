from typing import Annotated
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth_schemas import (
    request_login,
)
from app.services.auth_service import login_for_portal

router = APIRouter()

DbSession = Annotated[Session, Depends(get_db)]

@router.post("/admin-login")
@router.post("/login-admin")
def admin_login(
    request: request_login,
    db: DbSession,
):
    from app.services.auth_service import authenticate_user
    user = authenticate_user(db, request.ma_nv, request.mat_khau)
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
    from app.services.auth_service import authenticate_user
    user = authenticate_user(db, request.ma_nv, request.mat_khau)
    if user is None:
        raise HTTPException(status_code=401, detail="Mã tài khoản hoặc mật khẩu không chính xác")

    role = str(user.get("ma_vai_tro") or "").upper()
    if role == "NHAN_VIEN":
        raise HTTPException(
            status_code=403,
            detail="Tài khoản Nhân viên vui lòng đăng nhập tại Cổng Nhân Viên (/login)"
        )

    if role not in {"ADMIN", "QUAN_LY", "TRUONG_NHOM"}:
        raise HTTPException(status_code=403, detail="Tài khoản không có quyền Quản lý")

    return user


@router.post("/employee-login")
@router.post("/login-employee")
def employee_login(
    request: request_login,
    db: DbSession,
):
    from app.services.auth_service import authenticate_user
    user = authenticate_user(db, request.ma_nv, request.mat_khau)
    if user is None:
        raise HTTPException(status_code=401, detail="Mã nhân viên hoặc mật khẩu không chính xác")

    role = str(user.get("ma_vai_tro") or "").upper()
    # Chặn hoàn toàn Admin, Quản lý, Trưởng nhóm đăng nhập từ Cổng nhân viên
    if role in {"ADMIN", "QUAN_LY", "TRUONG_NHOM"}:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản Quản lý / Quản trị viên không được phép đăng nhập tại đây. Vui lòng sử dụng Cổng Điều Hành (/login-manage)"
        )

    if role != "NHAN_VIEN":
        raise HTTPException(status_code=403, detail="Tài khoản không có quyền truy cập Cổng nhân viên")

    return user


class FirstTimePasswordRequest(BaseModel):
    ma_nv: str
    mat_khau_moi: str


@router.post("/first-time-change-password")
def api_first_time_change_password(
    request: FirstTimePasswordRequest,
    db: DbSession,
):
    try:
        from app.services.auth_service import first_time_change_password
        return first_time_change_password(db, request.ma_nv, request.mat_khau_moi)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))