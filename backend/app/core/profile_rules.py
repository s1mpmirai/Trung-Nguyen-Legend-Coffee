"""
Kiểm tra dữ liệu hồ sơ cá nhân khi nhân sự gửi yêu cầu sửa, khi duyệt yêu cầu và khi Nhân sự sửa trực tiếp.
Giữ khớp với VALIDATORS ở frontend/src/pages/employee/components/EditProfileModal.jsx.
Chỉ kiểm tra những trường thực sự thay đổi, để dữ liệu cũ (vd: email đuôi cũ) không chặn việc sửa trường khác.
"""
import re
from datetime import date

from app.core.org_rules import normalize_company_email

MIN_WORKING_AGE = 15
MAX_AGE = 100

FIELD_LABELS = {
    "ngay_sinh": "Ngày sinh",
    "gioi_tinh": "Giới tính",
    "sdt": "Số điện thoại",
    "email": "Email doanh nghiệp",
    "dia_chi": "Địa chỉ",
    "so_tai_khoan": "Số tài khoản ngân hàng",
    "ngan_hang": "Tên ngân hàng",
    "ma_so_thue": "Mã số thuế",
    "so_bhxh": "Số sổ BHXH",
    "hinh_thuc_lam_viec": "Hình thức làm việc",
}

_PHONE = re.compile(r"^(?:\+84|0)\d{9,10}$")
_BANK_ACCOUNT = re.compile(r"^\d{6,20}$")
# MST cá nhân: 10 số, 13 số (10 số + 3 số đơn vị phụ thuộc) hoặc 12 số (số CCCD, áp dụng từ 01/07/2025)
_TAX_CODE = re.compile(r"^(?:\d{10}(?:-?\d{3})?|\d{12})$")
# Mã số BHXH: 10 số (hoặc số CCCD 12 số)
_SOCIAL_INSURANCE = re.compile(r"^(?:\d{10}|\d{12})$")

_GENDERS = {"nam": "Nam", "nu": "Nu", "nữ": "Nu", "female": "Nu", "khac": "Khac", "khác": "Khac", "other": "Khac", "male": "Nam"}
_WORK_TYPES = {"FULL_TIME", "PART_TIME"}
_MAX_LENGTH = {"dia_chi": 255, "ngan_hang": 80}


def _same(new_value, old_value) -> bool:
    old = old_value.isoformat() if isinstance(old_value, date) else old_value
    return str(new_value or "").strip().lower() == str(old or "").strip().lower()


def _parse_birth_date(value) -> date:
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value).strip()[:10])
    except ValueError as error:
        raise ValueError("Ngày sinh không hợp lệ.") from error


def _check_birth_date(value, today: date) -> date:
    birth = _parse_birth_date(value)
    age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
    if birth > today or age > MAX_AGE:
        raise ValueError("Ngày sinh không hợp lệ.")
    if age < MIN_WORKING_AGE:
        raise ValueError(f"Nhân sự phải đủ {MIN_WORKING_AGE} tuổi trở lên.")
    return birth


def clean_profile_changes(changes: dict, current: dict, today: date) -> dict:
    """
    Chuẩn hóa và kiểm tra các trường thay đổi so với hồ sơ hiện tại.
    Trả về dict chỉ gồm trường thật sự đổi (đã chuẩn hóa); ném ValueError với thông báo tiếng Việt khi sai.
    Kiểm tra email trùng với người khác do service làm (cần CSDL).
    """
    cleaned: dict = {}
    for key, raw in (changes or {}).items():
        if key not in FIELD_LABELS or raw is None:
            continue
        value = raw.strip() if isinstance(raw, str) else raw
        if _same(value, current.get(key)):
            continue
        label = FIELD_LABELS[key]
        if value == "":
            raise ValueError(f"Không thể để trống “{label}” khi hồ sơ đã có thông tin này.")

        if key == "email":
            value = normalize_company_email(value)
        elif key == "sdt":
            value = re.sub(r"[\s.\-()]", "", str(value))
            if not _PHONE.match(value):
                raise ValueError("Số điện thoại không hợp lệ (10–11 chữ số, bắt đầu bằng 0 hoặc +84).")
        elif key == "ngay_sinh":
            value = _check_birth_date(value, today)
        elif key == "gioi_tinh":
            value = _GENDERS.get(str(value).strip().lower())
            if value is None:
                raise ValueError("Giới tính không hợp lệ.")
        elif key == "so_tai_khoan":
            value = str(value).replace(" ", "")
            if not _BANK_ACCOUNT.match(value):
                raise ValueError("Số tài khoản chỉ gồm 6–20 chữ số.")
        elif key == "ma_so_thue":
            value = str(value).replace(" ", "")
            if not _TAX_CODE.match(value):
                raise ValueError("Mã số thuế gồm 10, 12 hoặc 13 chữ số.")
        elif key == "so_bhxh":
            value = str(value).replace(" ", "")
            if not _SOCIAL_INSURANCE.match(value):
                raise ValueError("Số sổ BHXH gồm 10 hoặc 12 chữ số.")
        elif key == "hinh_thuc_lam_viec":
            value = str(value).strip().upper()
            if value not in _WORK_TYPES:
                raise ValueError("Hình thức làm việc không hợp lệ.")
        elif key in _MAX_LENGTH and len(str(value)) > _MAX_LENGTH[key]:
            raise ValueError(f"“{label}” tối đa {_MAX_LENGTH[key]} ký tự.")

        if _same(value, current.get(key)):
            continue
        cleaned[key] = value
    return cleaned
