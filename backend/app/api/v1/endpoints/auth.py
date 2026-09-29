from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth_schemas import request_dang_nhap
from app.services.auth_service import login_for_portal

router = APIRouter()


@router.post("/management-login")
def management_login(
    request: request_dang_nhap,
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
    request: request_dang_nhap,
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