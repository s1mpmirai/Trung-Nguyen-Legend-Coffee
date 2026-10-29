from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session


def get_holidays(db: Session, start: date, end: date) -> set[date]:
    """Các ngày nghỉ lễ, Tết (hưởng nguyên lương) trong khoảng [start, end]."""
    rows = db.execute(
        text("SELECT ngay FROM ngay_le WHERE ngay BETWEEN :start AND :end"),
        {"start": start, "end": end},
    ).scalars().all()
    return set(rows)
