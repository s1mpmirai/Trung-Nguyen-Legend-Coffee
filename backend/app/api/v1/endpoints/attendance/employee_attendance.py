from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import CurrentAccount, ensure_self_or_managed
from app.db.session import get_db
from app.schemas.attendance_schemas import (
    AttendanceDashboardResponse,
    AttendanceHistoryResponse,
    CheckInRequest,
    CheckInResponse,
)
from app.services import attendance_service

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get(
    "/dashboard/{ma_nv}",
    response_model=AttendanceDashboardResponse,
    summary="[Nhân viên] Dashboard chấm công và ca làm việc",
)
def get_attendance_dashboard_endpoint(
    ma_nv: str,
    account: CurrentAccount,
    db: DbSession = None,
):
    """
    Lấy thông tin tổng hợp chấm công của nhân viên:
    - Hồ sơ cá nhân & đơn vị công tác
    - Ca làm việc áp dụng hôm nay (giờ vào/ra chuẩn, thời gian cho phép trễ/về sớm) và trạng thái chấm công
    - Thống kê tháng hiện tại (Số ngày công, số lần đi muộn, phép năm)
    - 10 bản ghi chấm công gần nhất
    """
    clean_id = ensure_self_or_managed(db, account, ma_nv, "ATTENDANCE_MANAGE")
    try:
        return attendance_service.get_attendance_dashboard(db, clean_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.post(
    "/check-in",
    response_model=CheckInResponse,
    summary="[Nhân viên] Chấm công VÀO CA (Check-in)",
)
def check_in_endpoint(
    payload: CheckInRequest,
    account: CurrentAccount,
    db: DbSession = None,
):
    """Nhân viên chấm công vào ca (thời điểm lấy theo giờ máy chủ)."""
    # Chỉ được chấm công cho chính mình
    return attendance_service.employee_check_in(db, account["ma_nv"])


@router.post(
    "/check-out",
    response_model=CheckInResponse,
    summary="[Nhân viên] Chấm công RA CA (Check-out)",
)
def check_out_endpoint(
    payload: CheckInRequest,
    account: CurrentAccount,
    db: DbSession = None,
):
    """Nhân viên thực hiện chấm công ra ca kết thúc ngày làm việc."""
    # Chỉ được chấm công cho chính mình
    return attendance_service.employee_check_out(db, account["ma_nv"])


@router.get(
    "/history/{ma_nv}",
    response_model=AttendanceHistoryResponse,
    summary="[Nhân viên] Xem lịch sử chấm công chi tiết theo tháng/năm",
)
def get_attendance_history_endpoint(
    ma_nv: str,
    month: Optional[int] = Query(None, ge=1, le=12, description="Tháng cần tra cứu (1-12)"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Năm cần tra cứu"),
    account: CurrentAccount = None,
    db: DbSession = None,
):
    """Tra cứu chi tiết từng ngày công, giờ vào/ra, OT, trạng thái theo tháng."""
    clean_id = ensure_self_or_managed(db, account, ma_nv, "ATTENDANCE_MANAGE")
    return attendance_service.get_attendance_history(db, clean_id, month, year)
