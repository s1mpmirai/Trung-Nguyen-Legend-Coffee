from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.payroll_schemas import (
    payroll_month_response,
    payroll_months_response,
    payroll_year_summary_response,
)
from app.services.payroll_service import (
    get_employee_payroll_month,
    get_employee_payroll_history,
    get_employee_payroll_year,
)

router = APIRouter()


@router.get("/{ma_nv}/month", response_model=payroll_month_response)
def get_payroll_month(
    ma_nv: str,
    thang: int = Query(..., ge=1, le=12, description="Tháng (1-12)"),
    nam: int = Query(..., ge=2000, description="Năm"),
    db: Session = Depends(get_db),
):
    """Lấy chi tiết bảng lương 1 tháng của nhân viên."""
    try:
        return get_employee_payroll_month(db, ma_nv, thang, nam)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(err)
        ) from err


@router.get("/{ma_nv}/months", response_model=payroll_months_response)
def get_payroll_months_list(
    ma_nv: str,
    db: Session = Depends(get_db),
):
    """Lấy danh sách các tháng/năm đã có bảng lương."""
    return get_employee_payroll_history(db, ma_nv)


@router.get("/{ma_nv}/year", response_model=payroll_year_summary_response)
def get_payroll_year(
    ma_nv: str,
    nam: int = Query(..., ge=2000, description="Năm"),
    db: Session = Depends(get_db),
):
    """Tổng hợp lương cả năm."""
    try:
        return get_employee_payroll_year(db, ma_nv, nam)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(err)
        ) from err
