import calendar
from datetime import date, timedelta

# Công ty làm việc từ Thứ 2 đến Thứ 6 (weekday 0-4); Thứ 7, Chủ nhật là ngày nghỉ.
WORKING_WEEKDAYS = {0, 1, 2, 3, 4}


def month_bounds(thang: int, nam: int) -> tuple[date, date]:
    """Ngày đầu và ngày cuối của tháng."""
    last_day = calendar.monthrange(nam, thang)[1]
    return date(nam, thang, 1), date(nam, thang, last_day)


def iter_working_days(start: date, end: date):
    """Duyệt các ngày làm việc trong khoảng [start, end]."""
    current = start
    while current <= end:
        if current.weekday() in WORKING_WEEKDAYS:
            yield current
        current += timedelta(days=1)


def count_working_days(start: date, end: date) -> int:
    return sum(1 for _ in iter_working_days(start, end))


def standard_workdays(thang: int, nam: int) -> int:
    """Số công chuẩn của tháng = số ngày làm việc (T2 - T6) trong tháng."""
    start, end = month_bounds(thang, nam)
    return count_working_days(start, end)
