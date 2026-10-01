from sqlalchemy.orm import Session

from app.repositories.payroll_repository import (
    get_payroll_by_month,
    get_payroll_months,
    get_payroll_year_summary,
)


def get_employee_payroll_month(db: Session, ma_nv: str, thang: int, nam: int) -> dict:
    """Lấy bảng lương 1 tháng cụ thể. Raise nếu không tìm thấy."""
    payroll = get_payroll_by_month(db, ma_nv, thang, nam)
    if not payroll:
        raise ValueError(
            f"Không tìm thấy bảng lương tháng {thang}/{nam} của nhân viên {ma_nv}"
        )
    return payroll


def get_employee_payroll_history(db: Session, ma_nv: str) -> dict:
    """Lấy danh sách tháng đã có bảng lương."""
    months = get_payroll_months(db, ma_nv)
    return {"items": months}


def get_employee_payroll_year(db: Session, ma_nv: str, nam: int) -> dict:
    """Tổng hợp lương cả năm."""
    summary = get_payroll_year_summary(db, ma_nv, nam)
    if not summary:
        raise ValueError(
            f"Không tìm thấy dữ liệu lương năm {nam} của nhân viên {ma_nv}"
        )
    return summary
