from typing import Annotated  # 1. Import thêm Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import app.services.auth_service as account_service
from app.db.session import get_db
from app.schemas.auth_schemas import (
    account_admin_update,
    account_create,
    account_response,
    account_update_status,
    change_password_request,
    employee_without_account_response,
)

router = APIRouter()

# 2. Tạo type alias dùng chung cho Database Session:
DbSession = Annotated[Session, Depends(get_db)]


@router.post("/create_account", response_model=account_response, status_code=status.HTTP_201_CREATED)
def create_account_endpoint(
    data: account_create,
    db: DbSession,  # 3. Dùng DbSession trực tiếp, không cần = Depends(get_db)
):
    try:
        return account_service.create_account(db, data)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.put("/{ma_nv}", summary="Admin chỉnh sửa tài khoản (Đổi mật khẩu, vai trò, trạng thái)")
def update_account_endpoint(
    ma_nv: str,
    data: account_admin_update,
    db: DbSession,
):
    """Admin cập nhật thông tin tài khoản: đặt lại mật khẩu mới, đổi vai trò hoặc trạng thái."""
    try:
        return account_service.admin_update_account(
            db,
            ma_nv=ma_nv,
            mat_khau_moi=data.mat_khau_moi,
            ma_vai_tro=data.ma_vai_tro,
            trang_thai=data.trang_thai,
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.put("/{ma_nv}/status", response_model=account_response)
def update_status_endpoint(
    ma_nv: str,
    data: account_update_status,
    db: DbSession,  # 3. Dùng DbSession
):
    try:
        return account_service.change_account_status(db, ma_nv, data.trang_thai)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@router.post("/change-password")
def change_password_endpoint(
    data: change_password_request,
    db: DbSession,  # 3. Dùng DbSession
):
    try:
        return account_service.change_password(
            db,
            ma_nv=data.ma_nv,
            old_pass=data.mat_khau_cu,
            new_pass=data.mat_khau_moi,
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.get(
    "/without_account",
    response_model=list[str],
    summary="Danh sách mã nhân viên chưa có tài khoản",
)
def get_without_account_endpoint(db: DbSession):
    """Lấy danh sách mã nhân viên (list[str]) chưa được cấp tài khoản để Admin chọn tạo tài khoản."""
    try:
        return account_service.get_without_account(db)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@router.get(
    "/without_account_details",
    response_model=list[employee_without_account_response],
    summary="Chi tiết danh sách nhân sự chưa có tài khoản",
)
def get_without_account_details_endpoint(db: DbSession):
    """Lấy danh sách đầy đủ thông tin nhân sự (họ tên, phòng ban, chức vụ, email, sdt) chưa có tài khoản theo thứ tự."""
    try:
        return account_service.get_without_account_detailed(db)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))



@router.get("", summary="Danh sách tài khoản hệ thống")
def list_accounts_endpoint(
    db: DbSession,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    ma_vai_tro: str | None = None,
    trang_thai: str | None = None,
):
    """Lấy danh sách tất cả tài khoản hệ thống phục vụ màn hình Quản trị Tài khoản Admin."""
    return account_service.get_accounts_list(
        db,
        page=page,
        page_size=page_size,
        search=search,
        ma_vai_tro=ma_vai_tro,
        trang_thai=trang_thai,
    )

