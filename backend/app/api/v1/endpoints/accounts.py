from typing import Annotated  # 1. Import thêm Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import app.services.auth_service as account_service
from app.db.session import get_db
from app.schemas.auth_schemas import (
    account_create,
    account_response,
    account_update_status,
    change_password_request,
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
