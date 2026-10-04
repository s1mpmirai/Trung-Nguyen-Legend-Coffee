from typing import Annotated

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
    result = login_for_portal(
        db,
        request.ma_nv,
        request.mat_khau,
        allowed_roles={"ADMIN"},
    )
    if result is None:
        raise HTTPException(status_code=401, detail="Thông tin đăng nhập không hợp lệ hoặc tài khoản không có quyền Quản trị viên")
    return result

@router.post("/manager-login")
@router.post("/login-manager")
def management_login(
    request: request_login,
    db: DbSession,
):
    result = login_for_portal(
        db,
        request.ma_nv,
        request.mat_khau,
        allowed_roles={"ADMIN", "QUAN_LY", "TRUONG_NHOM"},
    )
    if result is None:
        raise HTTPException(status_code=401, detail="Thông tin đăng nhập không hợp lệ hoặc tài khoản không có quyền Quản lý")
    return result


@router.post("/employee-login")
@router.post("/login-employee")
def employee_login(
    request: request_login,
    db: DbSession,
):
    result = login_for_portal(
        db,
        request.ma_nv,
        request.mat_khau,
        allowed_roles={"ADMIN", "QUAN_LY", "TRUONG_NHOM", "NHAN_VIEN"},
    )
    if result is None:
        raise HTTPException(status_code=401, detail="Thông tin đăng nhập không hợp lệ")
    return result