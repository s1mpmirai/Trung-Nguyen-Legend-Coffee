from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.leave_schemas import leave_response, leave_review_request
from app.services import leave_service

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get(
    "/pending",
    response_model=list[leave_response],
    summary="[Quản lý] Danh sách đơn từ đang chờ duyệt",
)
def get_pending_leaves_endpoint(
    db: DbSession = None,
):
    """Lấy toàn bộ các đơn xin nghỉ phép/nghỉ việc đang ở trạng thái CHO_DUYET."""
    return leave_service.get_pending_leaves_for_manager(db)


@router.get(
    "/all",
    response_model=list[leave_response],
    summary="[Quản lý] Xem tất cả đơn từ nhân viên",
)
def get_all_leaves_endpoint(
    trang_thai: str = Query(
        None, description="Lọc theo trạng thái: CHO_DUYET, DA_DUYET, TU_CHOI, DA_HUY"
    ),
    db: DbSession = None,
):
    """Quản lý xem danh sách tất cả các đơn từ trong công ty kèm bộ lọc trạng thái."""
    return leave_service.get_all_leaves_for_manager(db, trang_thai)


@router.put(
    "/{ma_don}/review",
    response_model=leave_response,
    summary="[Quản lý] Phê duyệt hoặc Từ chối đơn từ",
)
def review_leave_endpoint(
    ma_don: str,
    data: leave_review_request,
    db: DbSession = None,
):
    """
    Quản lý thực hiện phê duyệt (DA_DUYET) hoặc từ chối (TU_CHOI) đơn từ.
    Nếu ĐỒNG Ý duyệt đơn: Hệ thống sẽ tự động cập nhật ngày nghỉ phép vào Bảng chấm công.
    """
    try:
        return leave_service.review_leave_by_manager(db, ma_don, data)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)
        ) from err
