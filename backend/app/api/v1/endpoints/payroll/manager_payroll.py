from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_permission
from app.core.roles import BOARD_ROLE
from app.db.session import get_db
from app.schemas.payroll_schemas import (
    payroll_calculate_request,
    payroll_company_summary_response,
    payroll_pending_approval_response,
    payroll_status_update,
)
from app.services.payroll_service import (
    calculate_payroll_month,
    change_payroll_status,
    get_company_payroll_summary,
    get_pending_approvals,
    submit_payroll_month,
)

# Xem bảng lương toàn công ty: người tính lương (PAYROLL_MANAGE) hoặc người duyệt lương (PAYROLL_APPROVE).
# Tính lương / gửi duyệt chỉ PAYROLL_MANAGE; từng bước chuyển trạng thái kiểm tra quyền riêng
# (payroll_service.PAYROLL_STATUS_PERMISSION).
router = APIRouter(dependencies=[Depends(require_permission("PAYROLL_MANAGE", "PAYROLL_APPROVE"))])
DbSession = Annotated[Session, Depends(get_db)]
PayrollCalculator = Annotated[dict, Depends(require_permission("PAYROLL_MANAGE"))]
PayrollActor = Annotated[dict, Depends(require_permission("PAYROLL_MANAGE", "PAYROLL_APPROVE"))]
PayrollApprover = Annotated[dict, Depends(require_permission("PAYROLL_APPROVE"))]


@router.post(
    "/submit",
    summary="[Kế toán] Gửi bảng lương tháng sang Ban Giám đốc duyệt",
)
def submit_payroll_endpoint(
    data: payroll_calculate_request,
    account: PayrollCalculator,
    db: DbSession = None,
):
    """Chuyển toàn bộ bảng lương Nháp của tháng sang Chờ duyệt; sau khi gửi không tính lại được cho đến khi bị trả về."""
    try:
        return submit_payroll_month(db, data.thang, data.nam, nguoi_gui=account["ma_nv"])
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err


@router.get(
    "/pending-approval",
    response_model=payroll_pending_approval_response,
    summary="[Ban Giám đốc] Bảng lương Kế toán đã gửi đang chờ duyệt",
)
def get_pending_approval_endpoint(
    account: PayrollApprover,
    db: DbSession = None,
):
    """Dùng cho thông báo / huy hiệu ở Cổng Quản lý: số bảng lương chờ người đang đăng nhập duyệt, theo kỳ."""
    return get_pending_approvals(db, account["ma_nv"], chi_duyet_ban_giam_doc=account["ma_vai_tro"] != BOARD_ROLE)


@router.post(
    "/calculate",
    summary="[Quản lý] Tự động tính bảng lương tháng toàn bộ nhân viên",
)
def calculate_payroll_endpoint(
    data: payroll_calculate_request,
    account: PayrollCalculator,
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
        return calculate_payroll_month(db, data.thang, data.nam, nguoi_lap=account["ma_nv"])
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err


@router.get(
    "/company-summary",
    response_model=payroll_company_summary_response,
    summary="[Quản lý] Xem bảng lương tháng của toàn bộ nhân viên",
)
@router.get(
    "/summary",
    response_model=payroll_company_summary_response,
    include_in_schema=False,
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
    account: PayrollActor,
    db: DbSession = None,
):
    """
    Gửi duyệt, xác nhận chi trả (PAYROLL_MANAGE – Kế toán); duyệt, trả về Kế toán (PAYROLL_APPROVE – Ban Giám đốc).
    Người lập không tự duyệt; không ai duyệt/chi trả lương của chính mình.
    """
    try:
        return change_payroll_status(
            db,
            ma_bl,
            data.trang_thai,
            nguoi_thuc_hien=account["ma_nv"],
            chi_duyet_ban_giam_doc=account["ma_vai_tro"] != BOARD_ROLE,
            quyen=set(account["permissions"]),
        )
    except PermissionError as err:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(err)) from err
    except LookupError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err
