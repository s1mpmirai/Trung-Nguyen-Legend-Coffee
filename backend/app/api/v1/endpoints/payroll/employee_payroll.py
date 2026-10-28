from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import CurrentAccount, ensure_self_or_permission
from app.db.session import get_db
from app.schemas.payroll_schemas import (
    payroll_month_response,
    payroll_months_response,
    payroll_year_summary_response,
)
from app.services.payroll_service import (
    get_employee_payroll_history,
    get_employee_payroll_month,
    get_employee_payroll_year,
)

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get(
    "/{ma_nv}/month",
    response_model=Optional[payroll_month_response],
    summary="[Nhân viên] Chi tiết bảng lương 1 tháng (In phiếu lương)",
)
def get_payroll_month(
    ma_nv: str,
    thang: int = Query(..., ge=1, le=12, description="Tháng (1-12)"),
    nam: int = Query(..., ge=2000, description="Năm"),
    account: CurrentAccount = None,
    db: DbSession = None,
):
    """Lấy chi tiết bảng lương 1 tháng của nhân viên để xem hoặc in phiếu lương (Trả về null với 200 OK nếu chưa có dữ liệu)."""
    clean_id = ensure_self_or_permission(account, ma_nv, "PAYROLL_MANAGE")
    return get_employee_payroll_month(db, clean_id, thang, nam)


@router.get(
    "/{ma_nv}/year",
    response_model=Optional[payroll_year_summary_response],
    summary="[Nhân viên] Tổng hợp bảng lương cả năm",
)
def get_payroll_year(
    ma_nv: str,
    nam: int = Query(..., ge=2000, description="Năm cần xem"),
    account: CurrentAccount = None,
    db: DbSession = None,
):
    """Lấy tổng hợp bảng lương cả năm của nhân viên để xem hoặc in bảng năm (Trả về null với 200 OK nếu chưa có dữ liệu)."""
    clean_id = ensure_self_or_permission(account, ma_nv, "PAYROLL_MANAGE")
    return get_employee_payroll_year(db, clean_id, nam)


@router.get("/{ma_nv}/months", response_model=payroll_months_response, summary="[Nhân viên] Danh sách các tháng đã có lương")
def get_payroll_months_list(
    ma_nv: str,
    account: CurrentAccount,
    db: DbSession = None,
):
    """Lấy danh sách các tháng/năm đã có bảng lương của nhân viên."""
    clean_id = ensure_self_or_permission(account, ma_nv, "PAYROLL_MANAGE")
    return get_employee_payroll_history(db, clean_id)


