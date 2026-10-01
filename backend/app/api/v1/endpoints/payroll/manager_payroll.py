from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.payroll_schemas import (
    payroll_calculate_request,
    payroll_company_summary_response,
    payroll_status_update,
)
from app.services.payroll_service import (
    calculate_payroll_month,
    change_payroll_status,
    get_company_payroll_summary,
)

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.post(
    "/calculate",
    summary="[Quản lý] Tự động tính bảng lương tháng toàn bộ nhân viên",
)
def calculate_payroll_endpoint(
    data: payroll_calculate_request,
    db: DbSession = None,
):
    """
    Quản lý bấm nút để hệ thống tự động:
    1. Lấy ngày công thực tế và giờ tăng ca từ bảng_chấm_công.
    2. Áp dụng mức lương và phụ cấp theo chức vụ/bậc lương.
    3. Tính lương Gross, khấu trừ BHXH, BHYT, BHTN, thuế TNCN và Lương Net.
    4. Lưu kết quả vào bảng bảng_lương.
    """
    try:
        return calculate_payroll_month(db, data.thang, data.nam)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tính lương: {str(err)}",
        ) from err


@router.get(
    "/company-summary",
    response_model=payroll_company_summary_response,
    summary="[Quản lý] Xem bảng lương tháng của toàn bộ nhân viên",
)
def get_company_payroll_endpoint(
    thang: int = Query(..., ge=1, le=12, description="Tháng (1-12)"),
    nam: int = Query(..., ge=2000, description="Năm"),
    db: DbSession = None,
):
    """Lấy danh sách bảng lương tháng của toàn thể nhân viên kèm tổng chi phí lương Net."""
    return get_company_payroll_summary(db, thang, nam)


@router.put(
    "/{ma_bl}/status",
    summary="[Quản lý] Duyệt / Cập nhật trạng thái bảng lương",
)
def update_payroll_status_endpoint(
    ma_bl: int,
    data: payroll_status_update,
    db: DbSession = None,
):
    """Duyệt bảng lương (NHAP -> DA_DUYET -> DA_TRA)."""
    try:
        return change_payroll_status(db, ma_bl, data.trang_thai)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(err)
        ) from err
