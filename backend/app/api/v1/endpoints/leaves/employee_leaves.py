from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import CurrentAccount, ensure_self_or_permission
from app.db.session import get_db
from app.schemas.leave_schemas import annual_leave_balance_response, leave_create, leave_response
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
    account: CurrentAccount,
    db: DbSession = None,
):
    """
    Nhân viên nộp đơn xin nghỉ (nghỉ phép, nghỉ ốm, thai sản, nghỉ không lương, nghỉ việc).
    Đơn mới tạo sẽ ở trạng thái 'CHO_DUYET'. Đơn luôn được tạo cho chính người đang đăng nhập.
    """
    data.ma_nv = account["ma_nv"]
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
    account: CurrentAccount,
    db: DbSession = None,
):
    """Lấy toàn bộ lịch sử đơn từ mà nhân viên này đã từng nộp."""
    clean_id = ensure_self_or_permission(account, ma_nv, "LEAVE_APPROVE")
    return leave_service.get_employee_leave_history(db, clean_id)


@router.get(
    "/balance/{ma_nv}",
    response_model=annual_leave_balance_response,
    summary="[Nhân viên] Số dư phép năm (tổng được hưởng, đã dùng, chờ duyệt, còn lại)",
)
def get_annual_leave_balance_endpoint(
    ma_nv: str,
    account: CurrentAccount,
    nam: int | None = Query(None, ge=2000, le=2100, description="Năm (mặc định năm hiện tại)"),
    db: DbSession = None,
):
    """Phép năm = 12 ngày (tính theo tỷ lệ tháng ở năm đầu) + 1 ngày cho mỗi 5 năm thâm niên."""
    clean_id = ensure_self_or_permission(account, ma_nv, "LEAVE_APPROVE")
    return leave_service.get_annual_leave_balance(db, clean_id, nam)


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
    account: CurrentAccount,
    db: DbSession = None,
):
    """Nhân viên tự hủy đơn nghỉ của mình nếu đơn chưa được duyệt."""
    try:
        return leave_service.cancel_employee_leave(db, ma_don, account["ma_nv"])
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)
        ) from err
