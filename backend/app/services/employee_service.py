from datetime import date

from sqlalchemy.orm import Session

from app.core.datetime_utils import get_vietnam_today
from app.repositories.employee_repository import (
    cancel_profile_update_request,
    create,
    create_profile_update_request,
    get_active_employees_for_statistics,
    get_by_cccd,
    get_by_ma_nv,
    get_degrees_of_employees,
    get_employee_list,
    get_expiring_contracts,
    get_monthly_personnel_report as repo_get_monthly_report,
    get_pending_profile_request_by_employee,
    get_profile_requests_for_manager,
    is_active_department,
    is_active_position,
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
    if not is_active_department(db, data.ma_pb):
        raise ValueError(f"Phòng ban {data.ma_pb} không tồn tại hoặc đã ngừng hoạt động")
    if not is_active_position(db, data.ma_cv):
        raise ValueError(f"Chức vụ {data.ma_cv} không tồn tại hoặc đã ngừng sử dụng")

    ma_nv = generate_employee_code(db)
    employee_data = data.model_dump(exclude={"ma_nv", "ten_nql"})
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
    page_size: int = 50,
    q: str | None = None,
    ma_pb: str | None = None,
    ma_cv: str | None = None,
    trang_thai: str | None = None,
    hinh_thuc_lam_viec: str | None = None,
    gioi_tinh: str | None = None,
    loai_hd: str | None = None,
    luong_tu: float | None = None,
    luong_den: float | None = None,
    ngay_vao_tu: str | None = None,
    ngay_vao_den: str | None = None,
    sort_by: str = "ma_nv",
    sort_order: str = "asc",
) -> dict:
    return get_employee_list(
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
    )

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


def deactivate_employee(
    db: Session, ma_nv: str, ly_do: str | None = None, ngay_hieu_luc: date | None = None
) -> dict:
    """
    Cho thôi việc (xóa mềm an toàn) với ngày hiệu lực:
    - Hôm nay hoặc quá khứ: chuyển DA_NGHI_VIEC, khóa tài khoản, thanh lý HĐ ngay.
    - Tương lai: lên lịch; đến đúng ngày hệ thống mới chuyển trạng thái và khóa tài khoản.
    """
    clean_id = ma_nv.strip().upper().replace("-", "")
    emp = get_by_ma_nv(db, clean_id)
    if not emp:
        raise ValueError(f"Không tìm thấy nhân viên có mã {clean_id}")
    if emp.get("trang_thai") == "DA_NGHI_VIEC":
        raise ValueError(f"Nhân sự {clean_id} đã nghỉ việc.")

    return repo_update_status(
        db=db,
        ma_nv=clean_id,
        trang_thai="DA_NGHI_VIEC",
        ngay_nghi_viec=ngay_hieu_luc,
        khoa_tai_khoan=True,
        ly_do=ly_do or "Cho thôi việc",
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


def delete_employee(
    db: Session, ma_nv: str, ly_do: str | None = None, ngay_hieu_luc: date | None = None
) -> dict:
    """
    Xóa nhân sự theo hình thức xóa mềm: cho thôi việc và KHÓA tài khoản (không xóa tài khoản).
    Hồ sơ, hợp đồng, chấm công, bảng lương được giữ lại để tra cứu và báo cáo lịch sử.
    """
    updated = deactivate_employee(db, ma_nv, ly_do or "Xóa nhân sự khỏi danh sách đang làm việc", ngay_hieu_luc)
    clean_id = ma_nv.strip().upper().replace("-", "")
    if updated and updated.get("trang_thai") != "DA_NGHI_VIEC":
        message = f"Đã lên lịch thôi việc cho {clean_id} từ ngày {updated['ngay_nghi_viec']:%d/%m/%Y}"
    else:
        message = f"Đã xóa nhân sự {clean_id} khỏi danh sách đang làm việc và khóa tài khoản đăng nhập"
    return {"message": message, "ma_nv": clean_id, "ngay_nghi_viec": updated.get("ngay_nghi_viec") if updated else None}


TRINH_DO_LABELS = {
    "TIEN_SI": "Tiến sĩ", "THAC_SI": "Thạc sĩ", "DAI_HOC": "Đại học", "CAO_DANG": "Cao đẳng",
    "TRUNG_CAP": "Trung cấp", "CHUNG_CHI": "Chứng chỉ nghề", "THPT": "THPT", None: "Chưa cập nhật",
}
THAM_NIEN_BUCKETS = [(0, 1, "Dưới 1 năm"), (1, 3, "1 – 3 năm"), (3, 5, "3 – 5 năm"), (5, None, "Trên 5 năm")]
MUC_LUONG_BUCKETS = [
    (0, 10_000_000, "Dưới 10 triệu"),
    (10_000_000, 20_000_000, "10 – 20 triệu"),
    (20_000_000, 30_000_000, "20 – 30 triệu"),
    (30_000_000, None, "Trên 30 triệu"),
]


def _bucket_label(value: float, buckets: list) -> str:
    for low, high, label in buckets:
        if value >= low and (high is None or value < high):
            return label
    return buckets[-1][2]


def _distribution(labels_in_order: list[str], values: list[str]) -> list[dict]:
    total = max(len(values), 1)
    return [
        {"nhom": label, "so_luong": values.count(label), "ty_le": round(values.count(label) * 100 / total, 1)}
        for label in labels_in_order
    ]


def get_hr_statistics(db: Session, ma_pb: str | None = None, so_ngay_het_han: int = 60) -> dict:
    """Thống kê nhân sự đang làm việc theo trình độ, thâm niên, mức lương và hợp đồng sắp hết hạn."""
    today = get_vietnam_today()
    employees = get_active_employees_for_statistics(db, ma_pb)
    degrees = get_degrees_of_employees(db, [e["ma_nv"] for e in employees])

    trinh_do_values, tham_nien_values, luong_values = [], [], []
    tham_nien_years, luong_list = [], []
    phong_ban: dict[str, dict] = {}
    for e in employees:
        trinh_do_values.append(TRINH_DO_LABELS.get(degrees.get(e["ma_nv"]), "Chưa cập nhật"))

        if e["ngay_vao_lam"]:
            years = (today - e["ngay_vao_lam"]).days / 365.25
            tham_nien_years.append(years)
            tham_nien_values.append(_bucket_label(years, THAM_NIEN_BUCKETS))

        luong = float(e["luong_co_ban"] or 0)
        if luong > 0:
            luong_list.append(luong)
            luong_values.append(_bucket_label(luong, MUC_LUONG_BUCKETS))
            pb = phong_ban.setdefault(e["ten_pb"] or e["ma_pb"], {"luong": []})
            pb["luong"].append(luong)

    trinh_do_order = [TRINH_DO_LABELS[k] for k in TRINH_DO_LABELS]
    luong_theo_phong_ban = sorted(
        (
            {
                "ten_pb": ten_pb,
                "so_nhan_su": len(v["luong"]),
                "tong_quy_luong": sum(v["luong"]),
                "luong_trung_binh": round(sum(v["luong"]) / len(v["luong"])),
                "luong_thap_nhat": min(v["luong"]),
                "luong_cao_nhat": max(v["luong"]),
            }
            for ten_pb, v in phong_ban.items()
        ),
        key=lambda x: x["tong_quy_luong"],
        reverse=True,
    )

    return {
        "ngay_thong_ke": today,
        "tong_nhan_su": len(employees),
        "tham_nien_trung_binh": round(sum(tham_nien_years) / len(tham_nien_years), 1) if tham_nien_years else 0,
        "luong_trung_binh": round(sum(luong_list) / len(luong_list)) if luong_list else 0,
        "luong_thap_nhat": min(luong_list) if luong_list else 0,
        "luong_cao_nhat": max(luong_list) if luong_list else 0,
        "trinh_do": [d for d in _distribution(trinh_do_order, trinh_do_values) if d["so_luong"] > 0],
        "tham_nien": _distribution([b[2] for b in THAM_NIEN_BUCKETS], tham_nien_values),
        "muc_luong": _distribution([b[2] for b in MUC_LUONG_BUCKETS], luong_values),
        "luong_theo_phong_ban": luong_theo_phong_ban,
        "hop_dong_sap_het_han": get_expiring_contracts(db, today, so_ngay_het_han, ma_pb),
    }

