from datetime import date, datetime, timedelta, timezone

# Múi giờ chuẩn Việt Nam (UTC+7: Asia/Ho_Chi_Minh)
VN_TZ = timezone(timedelta(hours=7))


def get_vietnam_now() -> datetime:
    """Trả về datetime hiện tại chính xác theo giờ Việt Nam (UTC+7)."""
    return datetime.now(VN_TZ)


def get_vietnam_today() -> date:
    """Trả về date (ngày/tháng/năm) hiện tại chính xác theo giờ Việt Nam (UTC+7)."""
    return datetime.now(VN_TZ).date()


def format_vietnam_time_str(dt: datetime = None, format_str: str = "%H:%M:%S") -> str:
    """Định dạng chuỗi thời gian theo giờ Việt Nam."""
    d = dt or get_vietnam_now()
    return d.strftime(format_str)
