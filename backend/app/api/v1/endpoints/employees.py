from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.employee_schemas import ho_so_nhan_vien_create
from app.services.employee_service import create_employee as create_employee_service, employee_list

router = APIRouter()

@router.post("/create_employee")
def create_employee(
    data: ho_so_nhan_vien_create,
    db: Session = Depends(get_db),
):
    try:
        return create_employee_service(db, data)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

@router.get("/get_employee_list")
def get_employee_list(
    db: Session = Depends(get_db),
    page: int = 10,
):
    return employee_list(db, page)