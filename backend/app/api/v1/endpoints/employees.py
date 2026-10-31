from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import (
    CurrentAccount,
    data_scope,
    ensure_in_scope,
    ensure_self_or_managed,
    ensure_self_or_permission,
    normalize_ma_nv,
    require_permission,
)
from app.repositories.employee_repository import get_profile_request_by_id
from app.db.session import get_db
from app.schemas.employee_schemas import (
    employee_contact_update,
    employee_detail_response,
    employee_list_response,
    employee_monthly_report_response,
    employee_profile_create,
    employee_profile_response,
    employee_status_update,
    profile_update_request_create,
    profile_update_request_response,
    profile_update_review_request,
)
from app.services.employee_service import (
    cancel_profile_update,
    change_employee_status,
    create_employee as create_employee_service,
    deactivate_employee,
    employee_list,
    get_employee_profile,
    get_hr_statistics,
    get_monthly_personnel_report,
    get_pending_profile_update,
    get_profile_requests_manager,
    request_profile_update,
    review_profile_update,
    update_employee_contact,
    delete_employee,
)

router = APIRouter()

DbSession = Annotated[Session, Depends(get_db)]
EmployeeViewer = Annotated[dict, Depends(require_permission("EMPLOYEE_VIEW", "ACCOUNT_MANAGE", "PERMISSION_ASSIGN"))]
EmployeeUpdater = Annotated[dict, Depends(require_permission("EMPLOYEE_UPDATE"))]
EmployeeRemover = Annotated[dict, Depends(require_permission("EMPLOYEE_DELETE"))]
ReportViewer = Annotated[dict, Depends(require_permission("REPORT_VIEW"))]

# Danh sách nhân sự toàn công ty cho các việc quản trị: ký hợp đồng, cấp tài khoản
LIST_COMPANY_WIDE_PERMISSIONS = ("CONTRACT_MANAGE", "ACCOUNT_MANAGE")


def _forbid_self_action(account: dict, ma_nv: str) -> None:
    if normalize_ma_nv(ma_nv) == account["ma_nv"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không thể tự thay đổi trạng thái của chính mình")


def _report_department(account: dict, ma_pb: Optional[str]) -> Optional[str]:
    """Báo cáo của người không quản lý toàn công ty luôn giới hạn trong phòng ban của họ."""
    if data_scope(account) is None:
        return ma_pb
    return account.get("ma_pb")


def _check_create_scope(account: dict, data: employee_profile_create) -> None:
    """Quản lý phòng ban chỉ thêm nhân sự vào phòng mình; Trưởng nhóm chỉ thêm cấp dưới trực tiếp của mình."""
    scope = data_scope(account)
    if scope is None:
        return
    if scope.ma_pb:
        if (data.ma_pb or "").strip().upper() != scope.ma_pb:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn chỉ được thêm nhân sự vào phòng ban mình quản lý.",
            )
        return
    if data.ma_nql and normalize_ma_nv(data.ma_nql) != scope.ma_nql:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chỉ được thêm nhân sự là cấp dưới trực tiếp của mình.",
        )
    data.ma_nql = scope.ma_nql


@router.post("/create_employee", response_model=employee_profile_response)
def create_employee(
    data: employee_profile_create,
    db: DbSession,
    account: Annotated[dict, Depends(require_permission("EMPLOYEE_CREATE"))],
):
    _check_create_scope(account, data)
    try:
        return create_employee_service(db, data)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

@router.get("/get_employee_list", response_model=employee_list_response)
def get_employee_list(
    db: DbSession,
    account: EmployeeViewer,
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    page_size: int = Query(50, ge=1, le=200, description="Số lượng nhân viên trên mỗi trang"),
    q: Optional[str] = Query(None, description="Từ khóa tìm kiếm (mã NV, họ tên, email, sđt, CCCD)"),
    ma_pb: Optional[str] = Query(None, description="Lọc theo mã phòng ban"),
    ma_cv: Optional[str] = Query(None, description="Lọc theo mã chức vụ"),
    trang_thai: Optional[str] = Query(None, description="Lọc theo trạng thái làm việc (DANG_LAM, NGHI_PHEP, DA_NGHI_VIEC...)"),
    hinh_thuc_lam_viec: Optional[str] = Query(None, description="Lọc theo hình thức làm việc (FULL_TIME, PART_TIME)"),
    gioi_tinh: Optional[str] = Query(None, description="Lọc theo giới tính (Nam, Nu, Khac)"),
    loai_hd: Optional[str] = Query(None, description="Lọc theo loại hợp đồng (THU_VIEC, XAC_DINH_1_NAM...)"),
    luong_tu: Optional[float] = Query(None, ge=0, description="Mức lương cơ bản từ (VNĐ)"),
    luong_den: Optional[float] = Query(None, ge=0, description="Mức lương cơ bản đến (VNĐ)"),
    ngay_vao_tu: Optional[str] = Query(None, description="Ngày vào làm từ (YYYY-MM-DD)"),
    ngay_vao_den: Optional[str] = Query(None, description="Ngày vào làm đến (YYYY-MM-DD)"),
    sort_by: Optional[str] = Query("ma_nv", description="Trường sắp xếp: ma_nv, ho_ten, ngay_vao_lam, luong_co_ban, ten_pb, ten_cv, trang_thai"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    return employee_list(
        db=db,
        page=page,
        page_size=page_size,
        q=q,
        ma_pb=ma_pb,
        ma_cv=ma_cv,
        trang_thai=trang_thai,
        hinh_thuc_lam_viec=hinh_thuc_lam_viec,
        gioi_tinh=gioi_tinh,
        loai_hd=loai_hd,
        luong_tu=luong_tu,
        luong_den=luong_den,
        ngay_vao_tu=ngay_vao_tu,
        ngay_vao_den=ngay_vao_den,
        sort_by=sort_by,
        sort_order=sort_order,
        scope=data_scope(account, *LIST_COMPANY_WIDE_PERMISSIONS),
    )

@router.get("/profile/{ma_nv}", response_model=employee_detail_response)
def get_profile(
    ma_nv: str,
    db: DbSession,
    account: CurrentAccount,
):
    clean_id = ensure_self_or_managed(db, account, ma_nv, "EMPLOYEE_VIEW")
    try:
        return get_employee_profile(db, clean_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

@router.put("/profile/{ma_nv}", response_model=employee_detail_response)
def update_profile(
    ma_nv: str,
    data: employee_contact_update,
    db: DbSession,
    account: EmployeeUpdater,
):
    """
    [Quản lý] Ghi trực tiếp thông tin liên hệ/ngân hàng vào hồ sơ.
    Nhân viên tự sửa hồ sơ phải dùng POST /profile/{ma_nv}/request-update (chờ Quản lý duyệt).
    """
    clean_id = ensure_in_scope(db, account, ma_nv)
    try:
        return update_employee_contact(db, clean_id, data)
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
    account: CurrentAccount,
):
    """
    Nhân viên gửi yêu cầu chỉnh sửa thông tin cá nhân.
    Dữ liệu sẽ KHÔNG được lưu ngay vào bảng nhan_vien mà lưu ở bảng yêu cầu với trạng thái CHO_DUYET.
    Chỉ khi Quản lý phê duyệt (DA_DUYET) thì thông tin mới được cập nhật vào database chính thức.
    """
    clean_id = ensure_self_or_permission(account, ma_nv)
    try:
        return request_profile_update(db, clean_id, data)
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
    account: CurrentAccount,
):
    """Kiểm tra xem nhân viên có yêu cầu cập nhật thông tin nào đang ở trạng thái CHO_DUYET hay không."""
    clean_id = ensure_self_or_managed(db, account, ma_nv, "EMPLOYEE_UPDATE")
    return get_pending_profile_update(db, clean_id)


@router.put(
    "/profile-request/{ma_yc}/cancel",
    response_model=profile_update_request_response,
    summary="[Nhân viên] Hủy yêu cầu chỉnh sửa hồ sơ đang chờ duyệt",
)
def cancel_profile_request_endpoint(
    ma_yc: int,
    db: DbSession,
    account: CurrentAccount,
):
    """Nhân viên tự hủy yêu cầu chỉnh sửa thông tin đang chờ Quản lý xử lý."""
    try:
        return cancel_profile_update(db, ma_yc, account["ma_nv"])
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get(
    "/manager/profile-requests",
    response_model=list[profile_update_request_response],
    summary="[Quản lý] Danh sách yêu cầu cập nhật hồ sơ cá nhân của nhân viên",
)
def get_profile_requests_manager_endpoint(
    db: DbSession,
    account: EmployeeUpdater,
    trang_thai: Optional[str] = Query(
        None, description="Lọc theo trạng thái: CHO_DUYET, DA_DUYET, TU_CHOI, DA_HUY"
    ),
):
    """Quản lý xem danh sách yêu cầu cập nhật hồ sơ của nhân sự thuộc phạm vi quản lý."""
    return get_profile_requests_manager(db, trang_thai, data_scope(account))


@router.put(
    "/manager/profile-requests/{ma_yc}/review",
    response_model=profile_update_request_response,
    summary="[Quản lý] Phê duyệt hoặc Từ chối yêu cầu cập nhật hồ sơ",
)
def review_profile_request_endpoint(
    ma_yc: int,
    data: profile_update_review_request,
    db: DbSession,
    account: EmployeeUpdater,
):
    """
    Quản lý xét duyệt yêu cầu cập nhật hồ sơ:
    - Nếu DA_DUYET: Hệ thống tự động ghi đè thông tin mới vào bảng nhan_vien trong DB và đổi trạng thái yêu cầu sang DA_DUYET.
    - Nếu TU_CHOI: Bảng nhan_vien giữ nguyên không đổi, trạng thái yêu cầu chuyển sang TU_CHOI.
    """
    request = get_profile_request_by_id(db, ma_yc)
    if request:
        ensure_in_scope(db, account, request["ma_nv"])
    data.nguoi_duyet = account["ma_nv"]
    try:
        return review_profile_update(db, ma_yc, data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error



@router.get(
    "/reports/monthly",
    response_model=employee_monthly_report_response,
    summary="[Quản lý] Báo cáo thống kê tình hình nhân sự theo tháng",
)
def get_monthly_personnel_report_endpoint(
    db: DbSession,
    account: ReportViewer,
    thang: int = Query(..., ge=1, le=12, description="Tháng cần báo cáo (1-12)"),
    nam: int = Query(..., ge=2000, description="Năm cần báo cáo (>= 2000)"),
    ma_pb: Optional[str] = Query(None, description="Lọc theo mã phòng ban"),
):
    """
    Báo cáo biến động và tình hình nhân sự theo tháng:
    - Thống kê tổng số nhân sự, số nhân sự đang làm việc, số nhân sự nghỉ phép, số nhân sự đã nghỉ việc / thôi việc.
    - Danh sách nhân sự mới tuyển dụng trong tháng và tỷ lệ biến động nhân sự.
    """
    try:
        return get_monthly_personnel_report(db, thang, nam, _report_department(account, ma_pb))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get(
    "/reports/statistics",
    summary="[Quản lý] Báo cáo thống kê nhân sự: trình độ, mức lương, thâm niên",
)
def get_hr_statistics_endpoint(
    db: DbSession,
    account: ReportViewer,
    ma_pb: Optional[str] = Query(None, description="Lọc theo mã phòng ban"),
    so_ngay_het_han: int = Query(60, ge=1, le=365, description="Cảnh báo hợp đồng hết hạn trong N ngày tới"),
):
    """Thống kê nhân sự đang làm việc theo trình độ, thâm niên, khung lương, quỹ lương phòng ban và hợp đồng sắp hết hạn."""
    return get_hr_statistics(db, _report_department(account, ma_pb), so_ngay_het_han)


@router.put(
    "/{ma_nv}/status",
    response_model=employee_detail_response,
    summary="[Quản lý] Khóa hoặc Cập nhật trạng thái làm việc của nhân sự",
)
def update_employee_status_endpoint(
    ma_nv: str,
    data: employee_status_update,
    db: DbSession,
    account: EmployeeUpdater,
):
    """
    Quản lý cập nhật trạng thái làm việc của nhân viên:
    - DA_NGHI_VIEC: Cho thôi việc (ngừng hợp đồng), tự động khóa tài khoản đăng nhập (xóa mềm an toàn).
    - TAM_HOAN_HD: Tạm hoãn hợp đồng lao động, tự động khóa tài khoản đăng nhập.
    - DANG_LAM: Khôi phục trạng thái làm việc bình thường, tự động mở khóa tài khoản.
    - NGHI_PHEP / NGHI_THAI_SAN: Cập nhật trạng thái nghỉ phép/thai sản dài ngày.
    """
    _forbid_self_action(account, ma_nv)
    ensure_in_scope(db, account, ma_nv)
    try:
        return change_employee_status(db, ma_nv, data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.put(
    "/{ma_nv}/deactivate",
    response_model=employee_detail_response,
    summary="[Quản lý] Khóa tài khoản và cho thôi việc nhân sự (Xóa mềm một chạm)",
)
def deactivate_employee_endpoint(
    ma_nv: str,
    db: DbSession,
    account: EmployeeRemover,
    ly_do: Optional[str] = Query(None, description="Lý do cho thôi việc / khóa nhân sự"),
    ngay_hieu_luc: Optional[date] = Query(None, description="Ngày hiệu lực thôi việc (YYYY-MM-DD, mặc định hôm nay)"),
):
    """
    Thực hiện thôi việc / khóa nhân viên một chạm:
    - Chuyển trạng thái nhân sự thành 'DA_NGHI_VIEC'.
    - Gán ngày nghỉ việc là ngày hiện tại.
    - Tự động khóa tài khoản đăng nhập tương ứng trong bảng tai_khoan.
    - Giữ nguyên toàn bộ lịch sử chấm công, bảng lương và hợp đồng trong CSDL.
    """
    _forbid_self_action(account, ma_nv)
    ensure_in_scope(db, account, ma_nv)
    try:
        return deactivate_employee(db, ma_nv, ly_do, ngay_hieu_luc)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.delete(
    "/{ma_nv}",
    summary="[Quản lý] Xóa nhân sự (xóa mềm: cho thôi việc và khóa tài khoản)",
)
def delete_employee_endpoint(
    ma_nv: str,
    db: DbSession,
    account: EmployeeRemover,
    ly_do: Optional[str] = Query(None, description="Lý do xóa nhân sự"),
    ngay_hieu_luc: Optional[date] = Query(None, description="Ngày hiệu lực thôi việc (YYYY-MM-DD, mặc định hôm nay)"),
):
    """
    Xóa nhân sự khỏi danh sách đang làm việc: trạng thái DA_NGHI_VIEC và khóa tài khoản đăng nhập.
    Không xóa bản ghi hay tài khoản để giữ lịch sử chấm công, bảng lương, hợp đồng.
    """
    _forbid_self_action(account, ma_nv)
    ensure_in_scope(db, account, ma_nv)
    try:
        return delete_employee(db, ma_nv, ly_do, ngay_hieu_luc)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

