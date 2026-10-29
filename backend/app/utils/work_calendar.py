import calendar
from collections.abc import Collection
from datetime import date, timedelta

# Công ty làm việc từ Thứ 2 đến Thứ 6 (weekday 0-4); Thứ 7, Chủ nhật là ngày nghỉ.
# Ngày lễ, Tết (bảng ngay_le) cũng là ngày nghỉ hưởng nguyên lương: không tính vào công chuẩn
# và không trừ vào quỹ phép, nên nhân viên đi làm đủ các ngày còn lại vẫn nhận đủ lương.
WORKING_WEEKDAYS = {0, 1, 2, 3, 4}


def month_bounds(thang: int, nam: int) -> tuple[date, date]:
    """Ngày đầu và ngày cuối của tháng."""
    last_day = calendar.monthrange(nam, thang)[1]
    return date(nam, thang, 1), date(nam, thang, last_day)


def is_working_day(day: date, holidays: Collection[date] = ()) -> bool:
    return day.weekday() in WORKING_WEEKDAYS and day not in holidays


def iter_working_days(start: date, end: date, holidays: Collection[date] = ()):
    """Duyệt các ngày làm việc trong khoảng [start, end] (bỏ T7, CN và ngày lễ)."""
    current = start
    while current <= end:
        if is_working_day(current, holidays):
            yield current
        current += timedelta(days=1)


def count_working_days(start: date, end: date, holidays: Collection[date] = ()) -> int:
    return sum(1 for _ in iter_working_days(start, end, holidays))


def standard_workdays(thang: int, nam: int, holidays: Collection[date] = ()) -> int:
    """Số công chuẩn của tháng = số ngày làm việc (T2 - T6, trừ ngày lễ) trong tháng."""
    start, end = month_bounds(thang, nam)
    return count_working_days(start, end, holidays)
