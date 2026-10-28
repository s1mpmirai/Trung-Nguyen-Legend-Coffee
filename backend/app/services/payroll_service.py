from sqlalchemy.orm import Session

from app.repositories import payroll_repository
from app.repositories.attendance_repository import get_monthly_attendance_lock
from app.repositories.payroll_repository import (
    get_payroll_by_month,
    get_payroll_by_year,
    get_payroll_months,
)
from app.utils.work_calendar import month_bounds, standard_workdays

# ─── THAM SỐ TÍNH LƯƠNG (cập nhật khi Nhà nước thay đổi quy định) ───────────────
TY_LE_BHXH = 0.08
TY_LE_BHYT = 0.015
TY_LE_BHTN = 0.01
LUONG_CO_SO = 2_340_000              # Mức lương cơ sở, trần đóng BHXH/BHYT = 20 lần
LUONG_TOI_THIEU_VUNG_I = 5_310_000   # Lương tối thiểu vùng I, trần đóng BHTN = 20 lần
TRAN_BHXH_BHYT = 20 * LUONG_CO_SO
TRAN_BHTN = 20 * LUONG_TOI_THIEU_VUNG_I
GIAM_TRU_BAN_THAN = 15_500_000       # Giảm trừ gia cảnh bản thân / tháng
GIAM_TRU_NGUOI_PHU_THUOC = 6_200_000 # Giảm trừ mỗi người phụ thuộc / tháng
# Biểu thuế lũy tiến từng phần (thu nhập tính thuế/tháng: (mức trần bậc, thuế suất))
BIEU_THUE_TNCN = [
    (10_000_000, 0.05),
    (30_000_000, 0.10),
    (60_000_000, 0.20),
    (100_000_000, 0.30),
    (float("inf"), 0.35),
]
HE_SO_TANG_CA = 1.5                  # Tăng ca ngày thường = 150% đơn giá giờ
GIO_CONG_CHUAN_NGAY = 8
# Nghỉ không hưởng lương từ 14 ngày làm việc trở lên trong tháng thì không đóng BHXH tháng đó
NGUONG_NGAY_KHONG_DONG_BH = 14

# NHAP -> DA_DUYET -> DA_TRA; được mở lại (DA_DUYET -> NHAP) trước khi chi trả, đã chi trả thì khóa hẳn
PAYROLL_STATUS_FLOW = {"NHAP": {"DA_DUYET"}, "DA_DUYET": {"DA_TRA", "NHAP"}, "DA_TRA": set()}


def get_employee_payroll_month(db: Session, ma_nv: str, thang: int, nam: int) -> dict | None:
    """Lấy bảng lương 1 tháng cụ thể. Trả về None nếu chưa có dữ liệu."""
    return get_payroll_by_month(db, ma_nv, thang, nam)


def get_employee_payroll_year(db: Session, ma_nv: str, nam: int) -> dict | None:
    """Lấy bảng tổng hợp lương cả năm của nhân viên. Trả về None nếu chưa có dữ liệu."""
    return get_payroll_by_year(db, ma_nv, nam)


def get_employee_payroll_history(db: Session, ma_nv: str) -> dict:
    """Lấy danh sách tháng đã có bảng lương."""
    months = get_payroll_months(db, ma_nv)
    return {"items": months}


def tinh_thue_tncn(thu_nhap_tinh_thue: float) -> int:
    """Thuế TNCN theo biểu thuế lũy tiến từng phần."""
    thue = 0.0
    muc_duoi = 0.0
    for muc_tran, thue_suat in BIEU_THUE_TNCN:
        if thu_nhap_tinh_thue <= muc_duoi:
            break
        thue += (min(thu_nhap_tinh_thue, muc_tran) - muc_duoi) * thue_suat
        muc_duoi = muc_tran
    return round(thue)


def compute_payroll_line(emp: dict, so_cong_chuan: int, tien_thuong: float = 0, khau_tru_khac: float = 0) -> dict:
    """
    Tính 1 dòng bảng lương:
      Lương thực hưởng  = Lương hợp đồng x Tỷ lệ hưởng (thử việc 85%)
      Lương theo công   = Lương thực hưởng / Công chuẩn x Công thực tế
      Tiền tăng ca      = Lương thực hưởng / Công chuẩn / 8 x Giờ tăng ca x 150%
      Phụ cấp chức vụ   = Phụ cấp x (Công thực tế / Công chuẩn), tối đa 100%
      Gross             = Lương theo công + Tăng ca + Phụ cấp + Thưởng
      BH (10.5%)        = (Lương hợp đồng + Phụ cấp chức vụ) có áp trần; không đóng khi thử việc
                          hoặc nghỉ không lương >= 14 ngày trong tháng
      Thu nhập tính thuế = Gross - phần tăng ca được miễn thuế - BH - Giảm trừ gia cảnh
      Net               = Gross - BH - Thuế TNCN - Khấu trừ khác
    """
    luong_hop_dong = float(emp["luong_hop_dong"] or emp["luong_bac"] or 0)
    ty_le_huong = float(emp["ty_le_huong"] or 100) / 100
    phu_cap_chuc_vu = float(emp["phu_cap_chuc_vu"] or 0)
    so_cong_thuc_te = float(emp["so_cong_thuc_te"] or 0)
    so_gio_tang_ca = float(emp["so_gio_tang_ca"] or 0)
    so_nguoi_pt = int(emp["so_nguoi_pt"] or 0)

    luong_thuc_huong = luong_hop_dong * ty_le_huong
    don_gia_ngay = luong_thuc_huong / so_cong_chuan
    luong_theo_cong = round(don_gia_ngay * so_cong_thuc_te)
    tien_tang_ca = round(don_gia_ngay / GIO_CONG_CHUAN_NGAY * so_gio_tang_ca * HE_SO_TANG_CA)
    tong_phu_cap = round(phu_cap_chuc_vu * min(1.0, so_cong_thuc_te / so_cong_chuan))
    luong_gross = luong_theo_cong + tien_tang_ca + tong_phu_cap + round(tien_thuong)

    so_ngay_khong_luong = so_cong_chuan - so_cong_thuc_te
    khong_dong_bh = emp.get("loai_hd") == "THU_VIEC" or so_ngay_khong_luong >= NGUONG_NGAY_KHONG_DONG_BH
    luong_dong_bh = luong_hop_dong + phu_cap_chuc_vu
    if khong_dong_bh:
        bhxh = bhyt = bhtn = 0
    else:
        bhxh = round(min(luong_dong_bh, TRAN_BHXH_BHYT) * TY_LE_BHXH)
        bhyt = round(min(luong_dong_bh, TRAN_BHXH_BHYT) * TY_LE_BHYT)
        bhtn = round(min(luong_dong_bh, TRAN_BHTN) * TY_LE_BHTN)
    tong_bh = bhxh + bhyt + bhtn

    # Phần tiền tăng ca vượt đơn giá thường (50%) được miễn thuế TNCN
    tang_ca_mien_thue = round(tien_tang_ca * (HE_SO_TANG_CA - 1) / HE_SO_TANG_CA)
    giam_tru_gia_canh = GIAM_TRU_BAN_THAN + GIAM_TRU_NGUOI_PHU_THUOC * so_nguoi_pt
    thu_nhap_tinh_thue = max(0, luong_gross - tang_ca_mien_thue - tong_bh - giam_tru_gia_canh)
    thue_tncn = tinh_thue_tncn(thu_nhap_tinh_thue)

    tong_khau_tru = tong_bh + thue_tncn + round(khau_tru_khac)
    return {
        "ma_nv": emp["ma_nv"],
        "luong_co_ban": round(luong_hop_dong),
        "he_so_luong": float(emp["he_so_luong"] or 1.0),
        "so_cong_chuan": so_cong_chuan,
        "so_cong_thuc_te": so_cong_thuc_te,
        "so_gio_tang_ca": so_gio_tang_ca,
        "luong_theo_cong": luong_theo_cong,
        "tien_tang_ca": tien_tang_ca,
        "tong_phu_cap": tong_phu_cap,
        "tien_thuong": round(tien_thuong),
        "luong_gross": luong_gross,
        "bhxh": bhxh,
        "bhyt": bhyt,
        "bhtn": bhtn,
        "giam_tru_gia_canh": giam_tru_gia_canh,
        "thu_nhap_tinh_thue": thu_nhap_tinh_thue,
        "thue_tncn": thue_tncn,
        "khau_tru_khac": round(khau_tru_khac),
        "tong_khau_tru": tong_khau_tru,
        "luong_net": luong_gross - tong_khau_tru,
        "ghi_chu": "Thử việc: không đóng BH bắt buộc" if emp.get("loai_hd") == "THU_VIEC" else None,
    }


def calculate_payroll_month(db: Session, thang: int, nam: int) -> dict:
    """[Quản lý] Tính bảng lương tháng từ bảng chấm công đã chốt."""
    if not get_monthly_attendance_lock(db, thang, nam).get("is_locked"):
        raise ValueError(
            f"Bảng chấm công tháng {thang}/{nam} chưa được chốt. Vui lòng chốt công trước khi tính lương."
        )

    start, end = month_bounds(thang, nam)
    so_cong_chuan = standard_workdays(thang, nam)
    existing = payroll_repository.get_payroll_rows_of_month(db, thang, nam)

    so_da_tinh = 0
    bo_qua_da_duyet = []
    try:
        for emp in payroll_repository.get_payroll_inputs(db, start, end):
            old = existing.get(emp["ma_nv"])
            if old and old["trang_thai"] != "NHAP":
                # Không ghi đè bảng lương đã duyệt / đã chi trả
                bo_qua_da_duyet.append(emp["ma_nv"])
                continue
            line = compute_payroll_line(
                emp,
                so_cong_chuan,
                tien_thuong=float(old["tien_thuong"] or 0) if old else 0,
                khau_tru_khac=float(old["khau_tru_khac"] or 0) if old else 0,
            )
            payroll_repository.upsert_payroll_line(db, {**line, "thang": thang, "nam": nam})
            so_da_tinh += 1
        db.commit()
    except Exception:
        db.rollback()
        raise

    message = f"Đã tính bảng lương tháng {thang}/{nam} cho {so_da_tinh} nhân sự (công chuẩn {so_cong_chuan} ngày)."
    if bo_qua_da_duyet:
        message += f" Giữ nguyên {len(bo_qua_da_duyet)} bảng lương đã duyệt/đã trả."
    return {
        "message": message,
        "tong_nhan_vien_tinh_luong": so_da_tinh,
        "so_cong_chuan": so_cong_chuan,
        "bo_qua_da_duyet": bo_qua_da_duyet,
    }


def get_company_payroll_summary(db: Session, thang: int, nam: int) -> dict:
    """[Quản lý] Lấy danh sách bảng lương tháng toàn công ty."""
    items = payroll_repository.get_all_company_payroll(db, thang, nam)
    tong_tien = sum(item["luong_net"] for item in items)
    return {
        "thang": thang,
        "nam": nam,
        "tong_nhan_vien": len(items),
        "tong_tien_net": tong_tien,
        "items": items,
    }


def change_payroll_status(db: Session, ma_bl: int, trang_thai: str) -> dict:
    """[Quản lý] Duyệt / mở lại / chi trả lương theo quy trình NHAP <-> DA_DUYET -> DA_TRA."""
    current = payroll_repository.get_payroll_status(db, ma_bl)
    if current is None:
        raise LookupError(f"Không tìm thấy bảng lương có mã {ma_bl}")
    if trang_thai not in PAYROLL_STATUS_FLOW.get(current, set()):
        raise ValueError(f"Không thể chuyển bảng lương từ trạng thái {current} sang {trang_thai}")
    return payroll_repository.update_payroll_status(db, ma_bl, trang_thai)
