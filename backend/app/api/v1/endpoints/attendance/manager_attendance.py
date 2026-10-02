from datetime import date
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.attendance_schemas import AttendanceAdjustRequest
from app.services import attendance_service

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get(
    "/daily",
    summary="[Quản lý] Bảng chấm công theo ngày của toàn công ty/phòng ban",
)
def get_daily_attendance_endpoint(
    ngay: Optional[date] = Query(None, description="Ngày chấm công (mặc định là hôm nay)"),
    ma_pb: Optional[str] = Query(None, description="Lọc theo mã phòng ban (vd: PB01, PB02)"),
    db: DbSession = None,
):
    """Quản lý xem tình hình đi làm trong ngày của toàn bộ nhân sự."""
    return attendance_service.get_daily_attendance_for_manager(db, ngay, ma_pb)


@router.get(
    "/summary",
    summary="[Quản lý] Bảng tổng hợp công tháng của tất cả nhân viên",
)
def get_monthly_attendance_summary_endpoint(
    thang: Optional[int] = Query(None, ge=1, le=12, description="Tháng thống kê"),
    nam: Optional[int] = Query(None, ge=2000, le=2100, description="Năm thống kê"),
    ma_pb: Optional[str] = Query(None, description="Lọc theo mã phòng ban"),
    db: DbSession = None,
):
    """Quản lý xem tổng số ngày công, giờ OT, số lần đi trễ, số ngày phép trong tháng."""
    return attendance_service.get_monthly_summary_for_manager(db, thang, nam, ma_pb)


@router.put(
    "/{ma_cc}/adjust",
    summary="[Quản lý] Điều chỉnh/chốt thông tin chấm công thủ công",
)
@router.put(
    "/manager/{ma_cc}/adjust",
    summary="[Quản lý] Điều chỉnh/chốt thông tin chấm công thủ công",
)
def adjust_attendance_endpoint(
    ma_cc: int,
    data: AttendanceAdjustRequest,
    db: DbSession = None,
):
    """
    Quản lý điều chỉnh giờ vào/ra, loại công (CONG_DU, DI_TRE, VE_SOM, NUA_CONG...),
    số công và ghi chú khi nhân viên quên chấm công hoặc giải trình hợp lệ.
    """
    try:
        return attendance_service.adjust_attendance_by_manager(db, ma_cc, data)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)
        ) from err
