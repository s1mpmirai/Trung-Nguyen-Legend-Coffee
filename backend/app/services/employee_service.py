from sqlalchemy.orm import Session

from app.repositories.employee_repository import (
    cancel_profile_update_request,
    create,
    create_profile_update_request,
    get_by_cccd,
    get_by_ma_nv,
    get_employee_list,
    get_monthly_personnel_report as repo_get_monthly_report,
    get_pending_profile_request_by_employee,
    get_profile_requests_for_manager,
    review_profile_update_request,
    update_contact,
    update_employee_status as repo_update_status,
)
from app.schemas.employee_schemas import (
    employee_contact_update,
    employee_profile_create,
    employee_status_update,
    profile_update_request_create,
    profile_update_review_request,
)
from app.utils.auto_gen import generate_employee_code



def create_employee(db: Session, data: employee_profile_create) -> dict:
    if data.cccd and get_by_cccd(db, data.cccd) is not None:
        raise ValueError("CCCD đã tồn tại")

    ma_nv = generate_employee_code(db)
    employee_data = data.model_dump(exclude={"ma_nv", "ma_ngl"})
    employee_data["ma_nv"] = ma_nv

    try:
        employee = create(db, employee_data)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return employee

def employee_list(
    db: Session,
    page: int = 1,
) -> dict:
    return get_employee_list(db, page)

def get_employee_profile(db: Session, ma_nv: str) -> dict:
    profile = get_by_ma_nv(db, ma_nv)
    if not profile:
        raise ValueError(f"Không tìm thấy thông tin nhân viên {ma_nv}")
    return profile

def update_employee_contact(db: Session, ma_nv: str, data: employee_contact_update) -> dict:
    profile = get_by_ma_nv(db, ma_nv)
    if not profile:
        raise ValueError(f"Không tìm thấy thông tin nhân viên {ma_nv}")
    
    update_dict = data.model_dump(exclude_unset=True)
    updated = update_contact(db, ma_nv, update_dict)
    return updated


def request_profile_update(db: Session, ma_nv: str, data: profile_update_request_create) -> dict:
    """Nhân viên gửi yêu cầu chỉnh sửa thông tin cá nhân chờ Quản lý phê duyệt."""
    profile = get_by_ma_nv(db, ma_nv)
    if not profile:
        raise ValueError(f"Không tìm thấy thông tin nhân viên {ma_nv}")
    return create_profile_update_request(db, ma_nv, data.thong_tin_moi, data.ly_do)


def get_pending_profile_update(db: Session, ma_nv: str) -> dict | None:
    """Lấy yêu cầu cập nhật hồ sơ đang chờ duyệt của nhân viên (nếu có)."""
    return get_pending_profile_request_by_employee(db, ma_nv)


def cancel_profile_update(db: Session, ma_yc: int, ma_nv: str | None = None) -> dict:
    """Nhân viên tự hủy yêu cầu cập nhật thông tin cá nhân đang chờ duyệt."""
    return cancel_profile_update_request(db, ma_yc, ma_nv)


def get_profile_requests_manager(db: Session, trang_thai: str | None = None) -> list[dict]:
    """Quản lý lấy danh sách các yêu cầu cập nhật hồ sơ cá nhân."""
    return get_profile_requests_for_manager(db, trang_thai)


def review_profile_update(db: Session, ma_yc: int, data: profile_update_review_request) -> dict:
    """Quản lý phê duyệt (DA_DUYET) hoặc từ chối (TU_CHOI) yêu cầu cập nhật hồ sơ."""
    return review_profile_update_request(
        db=db,
        ma_yc=ma_yc,
        trang_thai=data.trang_thai,
        nguoi_duyet=data.nguoi_duyet,
        y_kien_duyet=data.y_kien_duyet,
    )


def change_employee_status(db: Session, ma_nv: str, data: employee_status_update) -> dict:
    """Quản lý khóa hoặc cập nhật trạng thái nhân viên."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    emp = get_by_ma_nv(db, clean_id)
    if not emp:
        raise ValueError(f"Không tìm thấy nhân viên có mã {clean_id}")

    valid_statuses = ["DANG_LAM", "DA_NGHI_VIEC", "TAM_HOAN_HD", "NGHI_PHEP", "NGHI_THAI_SAN"]
    if data.trang_thai not in valid_statuses:
        raise ValueError(f"Trạng thái '{data.trang_thai}' không hợp lệ. Phải là một trong: {', '.join(valid_statuses)}")

    updated = repo_update_status(
        db=db,
        ma_nv=clean_id,
        trang_thai=data.trang_thai,
        ngay_nghi_viec=data.ngay_nghi_viec,
        khoa_tai_khoan=data.khoa_tai_khoan,
        ly_do=data.ly_do,
    )
    return updated


def deactivate_employee(db: Session, ma_nv: str, ly_do: str | None = None) -> dict:
    """Thôi việc / Khóa tài khoản nhân sự (xóa mềm an toàn)."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    emp = get_by_ma_nv(db, clean_id)
    if not emp:
        raise ValueError(f"Không tìm thấy nhân viên có mã {clean_id}")

    return repo_update_status(
        db=db,
        ma_nv=clean_id,
        trang_thai="DA_NGHI_VIEC",
        khoa_tai_khoan=True,
        ly_do=ly_do or "Cho thôi việc / Khóa hồ sơ",
    )


def get_monthly_personnel_report(
    db: Session,
    thang: int,
    nam: int,
    ma_pb: str | None = None,
) -> dict:
    """Báo cáo biến động nhân sự theo tháng: đang làm, nghỉ phép, nghỉ việc."""
    if not (1 <= thang <= 12):
        raise ValueError("Tháng phải từ 1 đến 12")
    if nam < 2000:
        raise ValueError("Năm không hợp lệ")

    return repo_get_monthly_report(db, thang, nam, ma_pb)

