"""
Quy tắc cơ cấu tổ chức khi lập hồ sơ nhân sự mới (dùng chung cho service và kiểm thử).
Giữ khớp với frontend/src/utils/orgRules.js.

- Email doanh nghiệp: <tên>@trungnguyen.com.vn, không trùng với nhân sự khác.
- Ban Giám đốc chỉ có vị trí Giám đốc; các phòng ban còn lại chỉ có Trưởng phòng và Nhân viên.
- Quản lý trực tiếp phải là nhân sự đang làm việc trong cùng phòng ban (mặc định: trưởng phòng ban).
"""
import re

COMPANY_EMAIL_DOMAIN = "trungnguyen.com.vn"
# Phần trước @: chữ thường không dấu, số; được ngăn cách bởi một dấu chấm, gạch dưới hoặc gạch ngang
EMAIL_LOCAL_PATTERN = re.compile(r"^[a-z0-9]+(?:[._-][a-z0-9]+)*$")
EMAIL_LOCAL_MAX_LENGTH = 64

BOARD_DEPARTMENT = "PB01"  # Ban Giám đốc
DIRECTOR_POSITION = "CV07"  # Giám đốc
HEAD_POSITION = "CV05"  # Trưởng phòng
STAFF_POSITION = "CV01"  # Nhân viên

BOARD_POSITIONS = (DIRECTOR_POSITION,)
DEPARTMENT_POSITIONS = (HEAD_POSITION, STAFF_POSITION)


def allowed_positions(ma_pb: str | None) -> tuple[str, ...]:
    """Chức vụ được phép chọn theo phòng ban."""
    return BOARD_POSITIONS if (ma_pb or "").strip().upper() == BOARD_DEPARTMENT else DEPARTMENT_POSITIONS


def normalize_company_email(email: str | None) -> str:
    """Chuẩn hóa và kiểm tra email doanh nghiệp; ném ValueError với thông báo dễ hiểu khi không hợp lệ."""
    value = (email or "").strip().lower()
    local, sep, domain = value.partition("@")
    if not local:
        raise ValueError("Vui lòng nhập email doanh nghiệp.")
    if sep and domain != COMPANY_EMAIL_DOMAIN:
        raise ValueError(f"Email doanh nghiệp phải có đuôi @{COMPANY_EMAIL_DOMAIN}.")
    if len(local) > EMAIL_LOCAL_MAX_LENGTH or not EMAIL_LOCAL_PATTERN.match(local):
        raise ValueError(
            "Email không hợp lệ. Phần trước @ chỉ gồm chữ không dấu, số và dấu chấm, gạch dưới hoặc gạch ngang ở giữa."
        )
    return f"{local}@{COMPANY_EMAIL_DOMAIN}"
