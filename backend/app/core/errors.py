"""
Thông báo lỗi thân thiện cho người dùng: không bao giờ trả câu SQL, tên bảng hay lỗi tiếng Anh của driver.
Chi tiết kỹ thuật chỉ ghi vào log máy chủ.
"""
import logging

from sqlalchemy.exc import DBAPIError, IntegrityError, SQLAlchemyError

logger = logging.getLogger("uvicorn.error")

# Mã lỗi MySQL / MariaDB thường gặp
_DUPLICATE = 1062
_FK_PARENT_MISSING = 1452
_FK_CHILD_EXISTS = 1451
_TOO_LONG = 1406
_BAD_VALUE = (1265, 1366, 1292)
_CHECK_FAILED = 4025

_DUPLICATE_FIELDS = {
    "email": "Email này đã được sử dụng.",
    "cccd": "Số CCCD này đã tồn tại.",
    "PRIMARY": "Mã này đã tồn tại.",
}


def _mysql_code(error: Exception) -> int | None:
    orig = getattr(error, "orig", None)
    args = getattr(orig, "args", None) or ()
    return args[0] if args and isinstance(args[0], int) else None


def db_error_message(error: Exception, action: str) -> str:
    """
    Câu báo lỗi tiếng Việt cho thao tác `action` (vd: "cập nhật phòng ban").
    ValueError / PermissionError là thông báo nghiệp vụ do hệ thống tự viết nên giữ nguyên.
    """
    if isinstance(error, (ValueError, PermissionError)):
        return str(error)

    logger.exception("Lỗi khi %s", action)
    code = _mysql_code(error) if isinstance(error, DBAPIError) else None
    if code == _DUPLICATE:
        raw = str(getattr(error, "orig", error))
        for key, message in _DUPLICATE_FIELDS.items():
            if f"'{key}'" in raw or f".{key}'" in raw:
                return message
        return f"Không thể {action}: dữ liệu bị trùng với bản ghi đã có."
    if code == _FK_PARENT_MISSING:
        return f"Không thể {action}: mã tham chiếu (nhân sự, phòng ban, chức vụ...) không tồn tại."
    if code == _FK_CHILD_EXISTS:
        return f"Không thể {action}: dữ liệu đang được sử dụng ở nơi khác."
    if code == _TOO_LONG:
        return f"Không thể {action}: có thông tin nhập vào quá dài."
    if code in _BAD_VALUE or code == _CHECK_FAILED:
        return f"Không thể {action}: có thông tin nhập vào không hợp lệ."
    if isinstance(error, (IntegrityError, SQLAlchemyError)):
        return f"Không thể {action}: dữ liệu không hợp lệ hoặc bị trùng."
    return f"Không thể {action}. Vui lòng thử lại hoặc liên hệ quản trị viên hệ thống."
