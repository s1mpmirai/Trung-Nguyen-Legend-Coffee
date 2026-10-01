from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth_schemas import (
    request_login,
    account_create,
    account_response,
    account_update_status,
    change_password_request,
)
from app.services.auth_service import login_for_portal
from fastapi import status
import app.services.auth_service as account_service

router = APIRouter()


@router.post("/management-login")
def management_login(
    request: request_login,
    db: Session = Depends(get_db),
):
    result = login_for_portal(
        db,
        request.ma_nv,
        request.mat_khau,
        allowed_roles={"ADMIN", "QUAN_LY", "TRUONG_NHOM"},
    )
    if result is None:
        raise HTTPException(status_code=401, detail="Thông tin đăng nhập không hợp lệ")
    return result


@router.post("/employee-login")
def employee_login(
    request: request_login,
    db: Session = Depends(get_db),
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

@router.post("/create_account", response_model=account_response, status_code=status.HTTP_201_CREATED)
def create_account_endpoint(
    data: account_create,
    db: Session = Depends(get_db)
):
    try:
        return account_service.create_account(db, data)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))

@router.put("/{ma_nv}/status", response_model=account_response)
def update_status_endpoint(
    ma_nv: str,
    data: account_update_status,
    db: Session = Depends(get_db)
):
    try:
        return account_service.change_account_status(db, ma_nv, data.trang_thai)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))

@router.post("/change-password")
def change_password_endpoint(
    data: change_password_request,
    db: Session = Depends(get_db)
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