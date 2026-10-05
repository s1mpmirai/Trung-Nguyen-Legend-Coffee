from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.leave_schemas import leave_create, leave_response
from app.services import leave_service

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.post(
    "/create",
    response_model=leave_response,
    status_code=status.HTTP_201_CREATED,
    summary="[Nhân viên] Nộp đơn xin nghỉ phép/nghỉ việc",
)
@router.post(
    "/request",
    response_model=leave_response,
    status_code=status.HTTP_201_CREATED,
    summary="[Nhân viên] Nộp đơn xin nghỉ phép/nghỉ việc (alias)",
)
def create_leave_endpoint(
    data: leave_create,
    db: DbSession = None,
):
    """
    Nhân viên nộp đơn xin nghỉ (nghỉ phép, nghỉ ốm, thai sản, nghỉ không lương, nghỉ việc).
    Đơn mới tạo sẽ ở trạng thái 'CHO_DUYET'.
    """
    try:
        return leave_service.create_employee_leave(db, data)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)
        ) from err


@router.get(
    "/history/{ma_nv}",
    response_model=list[leave_response],
    summary="[Nhân viên] Xem lịch sử đơn từ của chính mình",
)
@router.get(
    "/my-history/{ma_nv}",
    response_model=list[leave_response],
    summary="[Nhân viên] Xem lịch sử đơn từ của chính mình (alias)",
)
def get_leaves_by_employee_endpoint(
    ma_nv: str,
    db: DbSession = None,
):
    """Lấy toàn bộ lịch sử đơn từ mà nhân viên này đã từng nộp."""
    return leave_service.get_employee_leave_history(db, ma_nv)


@router.put(
    "/{ma_don}/cancel",
    response_model=leave_response,
    summary="[Nhân viên] Hủy đơn xin nghỉ (khi đơn đang Chờ duyệt)",
)
@router.put(
    "/cancel/{ma_don}",
    response_model=leave_response,
    summary="[Nhân viên] Hủy đơn xin nghỉ (khi đơn đang Chờ duyệt - alias)",
)
def cancel_leave_endpoint(
    ma_don: str,
    ma_nv: str = Query(..., description="Mã nhân viên người tạo đơn"),
    db: DbSession = None,
):
    """Nhân viên tự hủy đơn nghỉ của mình nếu đơn chưa được duyệt."""
    try:
        return leave_service.cancel_employee_leave(db, ma_don, ma_nv)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)
        ) from err
