from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.employee_schemas import employee_profile_create, employee_list_response, employee_profile_response
from app.services.employee_service import create_employee as create_employee_service, employee_list

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