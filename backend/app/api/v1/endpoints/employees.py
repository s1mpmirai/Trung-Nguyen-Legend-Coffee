from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.employee_schemas import (
    employee_contact_update,
    employee_detail_response,
    employee_list_response,
    employee_profile_create,
    employee_profile_response,
    profile_update_request_create,
    profile_update_request_response,
    profile_update_review_request,
)
from app.services.employee_service import (
    cancel_profile_update,
    create_employee as create_employee_service,
    employee_list,
    get_employee_profile,
    get_pending_profile_update,
    get_profile_requests_manager,
    request_profile_update,
    review_profile_update,
    update_employee_contact,
)

router = APIRouter()

DbSession = Annotated[Session, Depends(get_db)]


@router.post("/create_employee", response_model=employee_profile_response)
def create_employee(
    data: employee_profile_create,
        db: DbSession,
):
    try:
        return create_employee_service(db, data)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

@router.get("/get_employee_list", response_model=employee_list_response)
def get_employee_list(
    db: DbSession,
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
):
    return employee_list(db, page)

@router.get("/profile/{ma_nv}", response_model=employee_detail_response)
def get_profile(
    ma_nv: str,
    db: DbSession,
):
    try:
        return get_employee_profile(db, ma_nv)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

@router.put("/profile/{ma_nv}", response_model=employee_detail_response)
def update_profile(
    ma_nv: str,
    data: employee_contact_update,
    db: DbSession,
):
    try:
        return update_employee_contact(db, ma_nv, data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


# ─── QUY TRÌNH DUYỆT SỬA HỒ SƠ CÁ NHÂN (EMPLOYEE <-> MANAGER) ────────────────

@router.post(
    "/profile/{ma_nv}/request-update",
    response_model=profile_update_request_response,
    summary="[Nhân viên] Gửi yêu cầu chỉnh sửa hồ sơ chờ Quản lý phê duyệt",
)
def request_profile_update_endpoint(
    ma_nv: str,
    data: profile_update_request_create,
    db: DbSession,
):
    """
    Nhân viên gửi yêu cầu chỉnh sửa thông tin cá nhân.
    Dữ liệu sẽ KHÔNG được lưu ngay vào bảng nhan_vien mà lưu ở bảng yêu cầu với trạng thái CHO_DUYET.
    Chỉ khi Quản lý phê duyệt (DA_DUYET) thì thông tin mới được cập nhật vào database chính thức.
    """
    try:
        return request_profile_update(db, ma_nv, data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get(
    "/profile/{ma_nv}/pending-request",
    response_model=Optional[profile_update_request_response],
    summary="[Nhân viên] Lấy yêu cầu chỉnh sửa hồ sơ đang chờ duyệt",
)
def get_pending_profile_request_endpoint(
    ma_nv: str,
    db: DbSession,
):
    """Kiểm tra xem nhân viên có yêu cầu cập nhật thông tin nào đang ở trạng thái CHO_DUYET hay không."""
    return get_pending_profile_update(db, ma_nv)


@router.put(
    "/profile-request/{ma_yc}/cancel",
    response_model=profile_update_request_response,
    summary="[Nhân viên] Hủy yêu cầu chỉnh sửa hồ sơ đang chờ duyệt",
)
def cancel_profile_request_endpoint(
    ma_yc: int,
    db: DbSession,
    ma_nv: Optional[str] = Query(None, description="Mã nhân viên yêu cầu hủy (tùy chọn để kiểm tra bảo mật)"),
):
    """Nhân viên tự hủy yêu cầu chỉnh sửa thông tin đang chờ Quản lý xử lý."""
    try:
        return cancel_profile_update(db, ma_yc, ma_nv)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get(
    "/manager/profile-requests",
    response_model=list[profile_update_request_response],
    summary="[Quản lý] Danh sách yêu cầu cập nhật hồ sơ cá nhân của nhân viên",
)
def get_profile_requests_manager_endpoint(
    db: DbSession,
    trang_thai: Optional[str] = Query(
        None, description="Lọc theo trạng thái: CHO_DUYET, DA_DUYET, TU_CHOI, DA_HUY"
    ),
):
    """Quản lý xem danh sách các yêu cầu cập nhật hồ sơ cá nhân cần xét duyệt hoặc đã xử lý."""
    return get_profile_requests_manager(db, trang_thai)


@router.put(
    "/manager/profile-requests/{ma_yc}/review",
    response_model=profile_update_request_response,
    summary="[Quản lý] Phê duyệt hoặc Từ chối yêu cầu cập nhật hồ sơ",
)
def review_profile_request_endpoint(
    ma_yc: int,
    data: profile_update_review_request,
    db: DbSession,
):
    """
    Quản lý xét duyệt yêu cầu cập nhật hồ sơ:
    - Nếu DA_DUYET: Hệ thống tự động ghi đè thông tin mới vào bảng nhan_vien trong DB và đổi trạng thái yêu cầu sang DA_DUYET.
    - Nếu TU_CHOI: Bảng nhan_vien giữ nguyên không đổi, trạng thái yêu cầu chuyển sang TU_CHOI.
    """
    try:
        return review_profile_update(db, ma_yc, data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


