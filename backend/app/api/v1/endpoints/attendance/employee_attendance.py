from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

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
    db: DbSession = None,
):
    """
    Lấy thông tin tổng hợp chấm công của nhân viên:
    - Hồ sơ cá nhân & đơn vị công tác
    - Tọa độ GPS chi nhánh hợp lệ
    - Thống kê tháng (Số ngày công, số lần đi muộn, số giờ OT, phép năm)
    - 10 bản ghi chấm công gần nhất
    """
    return attendance_service.get_attendance_dashboard(db, ma_nv)


@router.post(
    "/check-in",
    response_model=CheckInResponse,
    summary="[Nhân viên] Chấm công VÀO CA (Check-in)",
)
def check_in_endpoint(
    payload: CheckInRequest,
    db: DbSession = None,
):
    """Nhân viên thực hiện chấm công vào ca với tọa độ vị trí."""
    return attendance_service.employee_check_in(db, payload.ma_nv, payload.location)


@router.post(
    "/check-out",
    response_model=CheckInResponse,
    summary="[Nhân viên] Chấm công RA CA (Check-out)",
)
def check_out_endpoint(
    payload: CheckInRequest,
    db: DbSession = None,
):
    """Nhân viên thực hiện chấm công ra ca kết thúc ngày làm việc."""
    return attendance_service.employee_check_out(db, payload.ma_nv, payload.location)


@router.get(
    "/history/{ma_nv}",
    response_model=AttendanceHistoryResponse,
    summary="[Nhân viên] Xem lịch sử chấm công chi tiết theo tháng/năm",
)
def get_attendance_history_endpoint(
    ma_nv: str,
    month: Optional[int] = Query(None, ge=1, le=12, description="Tháng cần tra cứu (1-12)"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Năm cần tra cứu"),
    db: DbSession = None,
):
    """Tra cứu chi tiết từng ngày công, giờ vào/ra, OT, trạng thái theo tháng."""
    return attendance_service.get_attendance_history(db, ma_nv, month, year)
