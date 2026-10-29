from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import app.services.auth_service as account_service
from app.core.permissions import CurrentAccount, require_permission
from app.db.session import get_db
from app.schemas.auth_schemas import (
    account_admin_update,
    account_create,
    account_create_response,
    account_response,
    account_update_status,
    change_password_request,
    employee_without_account_response,
)

router = APIRouter()

DbSession = Annotated[Session, Depends(get_db)]
# Toàn bộ chức năng quản trị tài khoản yêu cầu quyền ACCOUNT_MANAGE (Admin hoặc NV được cấp riêng)
AccountManager = Annotated[dict, Depends(require_permission("ACCOUNT_MANAGE"))]


@router.post("/create_account", response_model=account_create_response, status_code=status.HTTP_201_CREATED)
def create_account_endpoint(
    data: account_create,
    db: DbSession,
    account: AccountManager,
):
    """Cấp tài khoản mới. Mật khẩu tạm được sinh ngẫu nhiên, trả về một lần duy nhất trong response."""
    try:
        return account_service.create_account(db, data, actor=account)
    except PermissionError as err:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(err)) from err
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err


@router.put("/{ma_nv}", summary="Admin chỉnh sửa tài khoản (Đặt lại mật khẩu, vai trò, trạng thái)")
def update_account_endpoint(
    ma_nv: str,
    data: account_admin_update,
    db: DbSession,
    account: AccountManager,
):
    """Admin cập nhật tài khoản: đặt lại mật khẩu (bắt đổi ở lần đăng nhập sau), đổi vai trò hoặc trạng thái."""
    try:
        return account_service.admin_update_account(
            db,
            ma_nv=ma_nv,
            mat_khau_moi=data.mat_khau_moi,
            ma_vai_tro=data.ma_vai_tro,
            trang_thai=data.trang_thai,
            actor=account,
        )
    except PermissionError as err:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(err)) from err
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err


@router.put("/{ma_nv}/status", response_model=account_response)
def update_status_endpoint(
    ma_nv: str,
    data: account_update_status,
    db: DbSession,
    account: AccountManager,
):
    try:
        return account_service.change_account_status(db, ma_nv, data.trang_thai, actor=account)
    except PermissionError as err:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(err)) from err
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err


@router.post("/change-password")
def change_password_endpoint(
    data: change_password_request,
    db: DbSession,
    account: CurrentAccount,
):
    """Người dùng tự đổi mật khẩu của chính mình (mã NV lấy từ token, không lấy từ body)."""
    try:
        return account_service.change_password(
            db,
            ma_nv=account["ma_nv"],
            old_pass=data.mat_khau_cu,
            new_pass=data.mat_khau_moi,
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err


@router.get(
    "/without_account",
    response_model=list[str],
    summary="Danh sách mã nhân viên chưa có tài khoản",
)
def get_without_account_endpoint(db: DbSession, account: AccountManager):
    """Lấy danh sách mã nhân viên (list[str]) chưa được cấp tài khoản để Admin chọn tạo tài khoản."""
    return account_service.get_without_account(db)


@router.get(
    "/without_account_details",
    response_model=list[employee_without_account_response],
    summary="Chi tiết danh sách nhân sự chưa có tài khoản",
)
def get_without_account_details_endpoint(db: DbSession, account: AccountManager):
    """Lấy danh sách đầy đủ thông tin nhân sự (họ tên, phòng ban, chức vụ, email, sdt) chưa có tài khoản theo thứ tự."""
    return account_service.get_without_account_detailed(db)


@router.get("", summary="Danh sách tài khoản hệ thống")
def list_accounts_endpoint(
    db: DbSession,
    account: AccountManager,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    ma_vai_tro: str | None = None,
    trang_thai: str | None = None,
    sort_by: str | None = Query(None, description="Trường sắp xếp: ma_nv, ho_ten, ten_pb, ma_vai_tro, trang_thai, lan_dn_cuoi, ngay_tao"),
    sort_order: str | None = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    """Lấy danh sách tất cả tài khoản hệ thống phục vụ màn hình Quản trị Tài khoản Admin."""
    return account_service.get_accounts_list(
        db,
        page=page,
        page_size=page_size,
        search=search,
        ma_vai_tro=ma_vai_tro,
        trang_thai=trang_thai,
        sort_by=sort_by,
        sort_order=sort_order,
    )
