from sqlalchemy.orm import Session

from app.repositories.employee_repository import (
    cancel_profile_update_request,
    create,
    create_profile_update_request,
    get_by_cccd,
    get_by_ma_nv,
    get_employee_list,
    get_pending_profile_request_by_employee,
    get_profile_requests_for_manager,
    review_profile_update_request,
    update_contact,
)
from app.schemas.employee_schemas import (
    employee_contact_update,
    employee_profile_create,
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
