from sqlalchemy.orm import Session

from app.repositories.employee_repository import create, get_by_cccd, get_employee_list
from app.utils.auto_gen import generate_employee_code

from app.schemas.employee_schemas import ho_so_nhan_vien_create


def create_employee(db: Session, data: ho_so_nhan_vien_create) -> dict:
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
) -> list[dict]:
    return get_employee_list(db, page)