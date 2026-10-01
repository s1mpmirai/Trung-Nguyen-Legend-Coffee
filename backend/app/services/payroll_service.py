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


def calculate_payroll_month(db: Session, thang: int, nam: int) -> dict:
    """[Quản lý] Tự động tính toán bảng lương tháng cho toàn bộ nhân viên."""
    from app.repositories.payroll_repository import calculate_and_save_monthly_payroll

    count = calculate_and_save_monthly_payroll(db, thang, nam)
    return {
        "message": f"Đã tính toán và cập nhật bảng lương tháng {thang}/{nam} thành công.",
        "tong_nhan_vien_tinh_luong": count,
    }


def get_company_payroll_summary(db: Session, thang: int, nam: int) -> dict:
    """[Quản lý] Lấy danh sách bảng lương tháng toàn công ty."""
    from app.repositories.payroll_repository import get_all_company_payroll

    items = get_all_company_payroll(db, thang, nam)
    tong_tien = sum(item["luong_net"] for item in items)
    return {
        "thang": thang,
        "nam": nam,
        "tong_nhan_vien": len(items),
        "tong_tien_net": tong_tien,
        "items": items,
    }


def change_payroll_status(db: Session, ma_bl: int, trang_thai: str) -> dict:
    """[Quản lý] Cập nhật trạng thái duyệt/chi trả lương."""
    from app.repositories.payroll_repository import update_payroll_status

    res = update_payroll_status(db, ma_bl, trang_thai)
    if not res:
        raise ValueError(f"Không tìm thấy bảng lương có mã {ma_bl}")
    return res

