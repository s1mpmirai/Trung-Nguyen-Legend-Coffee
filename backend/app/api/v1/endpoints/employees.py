from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.employee_schemas import (
    employee_contact_update,
    employee_detail_response,
    employee_list_response,
    employee_profile_create,
    employee_profile_response,
)
from app.services.employee_service import (
    create_employee as create_employee_service,
)
from app.services.employee_service import (
    employee_list,
    get_employee_profile,
    update_employee_contact,
)

router = APIRouter()

@router.post("/create_employee", response_model=employee_profile_response)
def create_employee(
    data: employee_profile_create,
    db: Session = Depends(get_db),
):
    try:
        return create_employee_service(db, data)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

@router.get("/get_employee_list", response_model=employee_list_response)
def get_employee_list(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
):
    return employee_list(db, page)

@router.get("/profile/{ma_nv}", response_model=employee_detail_response)
def get_profile(
    ma_nv: str,
    db: Session = Depends(get_db),
):
    try:
        return get_employee_profile(db, ma_nv)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

@router.put("/profile/{ma_nv}", response_model=employee_detail_response)
def update_profile(
    ma_nv: str,
    data: employee_contact_update,
    db: Session = Depends(get_db),
):
    try:
        return update_employee_contact(db, ma_nv, data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
