from sqlalchemy.orm import Session

from app.core.config import settings

from app.repositories import payroll_repository
from app.repositories.attendance_repository import get_monthly_attendance_lock
from app.repositories.holiday_repository import get_holidays
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
# HĐ thử việc (dưới 3 tháng): khấu trừ 10% trên tổng thu nhập từ 2 triệu/lần chi trả, không giảm trừ gia cảnh
# (Thông tư 111/2013/TT-BTC, Điều 25 khoản 1 điểm i)
THUE_SUAT_KHAU_TRU_THU_VIEC = 0.10
NGUONG_KHAU_TRU_THU_VIEC = 2_000_000
# Nghỉ không hưởng lương từ 14 ngày làm việc trở lên trong tháng thì không đóng BHXH tháng đó
NGUONG_NGAY_KHONG_DONG_BH = 14

# NHAP -> DA_DUYET -> DA_TRA; được mở lại (DA_DUYET -> NHAP) trước khi chi trả, đã chi trả thì khóa hẳn
PAYROLL_STATUS_FLOW = {
    "NHAP": {"CHO_DUYET"},
    "CHO_DUYET": {"DA_DUYET", "NHAP"},
    "DA_DUYET": {"DA_TRA", "NHAP"},
    "DA_TRA": set(),
}

# Tách nhiệm vụ theo từng bước (trạng thái hiện tại, trạng thái mới):
# Kế toán (PAYROLL_MANAGE) gửi duyệt và xác nhận chi trả; Ban Giám đốc (PAYROLL_APPROVE) duyệt hoặc trả về.
PAYROLL_STATUS_PERMISSION = {
    ("NHAP", "CHO_DUYET"): "PAYROLL_MANAGE",
    ("CHO_DUYET", "DA_DUYET"): "PAYROLL_APPROVE",
    ("CHO_DUYET", "NHAP"): "PAYROLL_APPROVE",
    ("DA_DUYET", "NHAP"): "PAYROLL_APPROVE",
    ("DA_DUYET", "DA_TRA"): "PAYROLL_MANAGE",
}
PERMISSION_DENIED_MESSAGES = {
    "PAYROLL_APPROVE": "Chỉ Ban Giám đốc (quyền duyệt lương) mới được duyệt hoặc trả bảng lương về Kế toán.",
    "PAYROLL_MANAGE": "Chỉ Kế toán (quyền tính lương) mới được gửi duyệt hoặc xác nhận chi trả lương.",
}


def get_employee_payroll_month(
    db: Session, ma_nv: str, thang: int, nam: int, chi_da_duyet: bool = False
) -> dict | None:
    """Lấy bảng lương 1 tháng cụ thể. chi_da_duyet: nhân viên chỉ thấy bảng lương đã duyệt / đã trả."""
    return get_payroll_by_month(db, ma_nv, thang, nam, chi_da_duyet)


def get_employee_payroll_year(db: Session, ma_nv: str, nam: int, chi_da_duyet: bool = False) -> dict | None:
    """Lấy bảng tổng hợp lương cả năm của nhân viên. Trả về None nếu chưa có dữ liệu."""
    return get_payroll_by_year(db, ma_nv, nam, chi_da_duyet)


def get_employee_payroll_history(db: Session, ma_nv: str, chi_da_duyet: bool = False) -> dict:
    """Lấy danh sách tháng đã có bảng lương."""
    months = get_payroll_months(db, ma_nv, chi_da_duyet)
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
    Tính 1 dòng bảng lương (đề tài không tính làm thêm giờ):
      Lương thực hưởng  = Lương hợp đồng x Tỷ lệ hưởng (thử việc 85%)
      Lương theo công   = Lương thực hưởng / Công chuẩn x Công thực tế (công đã duyệt)
      Phụ cấp chức vụ   = Phụ cấp x (Công thực tế / Công chuẩn), tối đa 100%
      Gross             = Lương theo công + Phụ cấp + Thưởng
      BH (10.5%)        = (Lương hợp đồng + Phụ cấp chức vụ) có áp trần; không đóng khi thử việc
                          hoặc nghỉ không lương >= 14 ngày trong tháng
      Thuế TNCN         = HĐ thử việc: 10% x Gross (nếu Gross >= 2 triệu)
                          Còn lại: lũy tiến trên (Gross - BH - Giảm trừ gia cảnh)
      Net               = Gross - BH - Thuế TNCN - Khấu trừ khác
    """
    luong_hop_dong = float(emp["luong_hop_dong"] or emp["luong_bac"] or 0)
    # Tỷ lệ 0 là giá trị thật (không được coi là "chưa nhập" rồi tính thành 100%)
    ty_le_huong = (100.0 if emp["ty_le_huong"] is None else float(emp["ty_le_huong"])) / 100
    phu_cap_chuc_vu = float(emp["phu_cap_chuc_vu"] or 0)
    so_cong_thuc_te = float(emp["so_cong_thuc_te"] or 0)
    so_nguoi_pt = int(emp["so_nguoi_pt"] or 0)
    la_thu_viec = emp.get("loai_hd") == "THU_VIEC"

    luong_thuc_huong = luong_hop_dong * ty_le_huong
    don_gia_ngay = luong_thuc_huong / so_cong_chuan
    luong_theo_cong = round(don_gia_ngay * so_cong_thuc_te)
    tong_phu_cap = round(phu_cap_chuc_vu * min(1.0, so_cong_thuc_te / so_cong_chuan))
    luong_gross = luong_theo_cong + tong_phu_cap + round(tien_thuong)

    so_ngay_khong_luong = so_cong_chuan - so_cong_thuc_te
    khong_dong_bh = la_thu_viec or so_ngay_khong_luong >= NGUONG_NGAY_KHONG_DONG_BH
    luong_dong_bh = luong_hop_dong + phu_cap_chuc_vu
    if khong_dong_bh:
        bhxh = bhyt = bhtn = 0
    else:
        bhxh = round(min(luong_dong_bh, TRAN_BHXH_BHYT) * TY_LE_BHXH)
        bhyt = round(min(luong_dong_bh, TRAN_BHXH_BHYT) * TY_LE_BHYT)
        bhtn = round(min(luong_dong_bh, TRAN_BHTN) * TY_LE_BHTN)
    tong_bh = bhxh + bhyt + bhtn

    if la_thu_viec:
        giam_tru_gia_canh = 0
        thu_nhap_tinh_thue = luong_gross
        thue_tncn = (
            round(luong_gross * THUE_SUAT_KHAU_TRU_THU_VIEC) if luong_gross >= NGUONG_KHAU_TRU_THU_VIEC else 0
        )
    else:
        giam_tru_gia_canh = GIAM_TRU_BAN_THAN + GIAM_TRU_NGUOI_PHU_THUOC * so_nguoi_pt
        thu_nhap_tinh_thue = max(0, luong_gross - tong_bh - giam_tru_gia_canh)
        thue_tncn = tinh_thue_tncn(thu_nhap_tinh_thue)

    tong_khau_tru = tong_bh + thue_tncn + round(khau_tru_khac)
    return {
        "ma_nv": emp["ma_nv"],
        "luong_co_ban": round(luong_hop_dong),
        "he_so_luong": float(emp["he_so_luong"] or 1.0),
        "ty_le_huong": round(ty_le_huong * 100, 2),
        "so_cong_chuan": so_cong_chuan,
        "so_cong_thuc_te": so_cong_thuc_te,
        "so_nguoi_pt": so_nguoi_pt,
        "so_gio_tang_ca": 0,
        "luong_theo_cong": luong_theo_cong,
        "tien_tang_ca": 0,
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
        "ghi_chu": "Thử việc: không đóng BH bắt buộc, khấu trừ thuế 10%" if la_thu_viec else None,
    }


def calculate_payroll_month(db: Session, thang: int, nam: int, nguoi_lap: str | None = None) -> dict:
    """[Quản lý] Tính bảng lương tháng từ bảng chấm công đã chốt; nguoi_lap = người bấm tính (không được tự duyệt)."""
    if not get_monthly_attendance_lock(db, thang, nam).get("is_locked"):
        raise ValueError(
            f"Bảng chấm công tháng {thang}/{nam} chưa được chốt. Vui lòng chốt công trước khi tính lương."
        )

    start, end = month_bounds(thang, nam)
    so_cong_chuan = standard_workdays(thang, nam, get_holidays(db, start, end))
    existing = payroll_repository.get_payroll_rows_of_month(db, thang, nam)

    so_da_tinh = 0
    bo_qua_da_duyet = []
    try:
        for emp in payroll_repository.get_payroll_inputs(db, start, end):
            old = existing.get(emp["ma_nv"])
            if old and old["trang_thai"] != "NHAP":
                # Không ghi đè bảng lương đã gửi duyệt / đã duyệt / đã chi trả
                bo_qua_da_duyet.append(emp["ma_nv"])
                continue
            line = compute_payroll_line(
                emp,
                so_cong_chuan,
                tien_thuong=float(old["tien_thuong"] or 0) if old else 0,
                khau_tru_khac=float(old["khau_tru_khac"] or 0) if old else 0,
            )
            payroll_repository.upsert_payroll_line(db, {**line, "thang": thang, "nam": nam, "nguoi_lap": nguoi_lap})
            so_da_tinh += 1
        db.commit()
    except Exception:
        db.rollback()
        raise

    message = f"Đã tính bảng lương tháng {thang}/{nam} cho {so_da_tinh} nhân sự (công chuẩn {so_cong_chuan} ngày)."
    if bo_qua_da_duyet:
        message += f" Giữ nguyên {len(bo_qua_da_duyet)} bảng lương đã gửi duyệt / đã duyệt / đã trả."
    return {
        "message": message,
        "tong_nhan_vien_tinh_luong": so_da_tinh,
        "so_cong_chuan": so_cong_chuan,
        "bo_qua_da_duyet": bo_qua_da_duyet,
    }


def submit_payroll_month(db: Session, thang: int, nam: int, nguoi_gui: str) -> dict:
    """[Kế toán] Gửi toàn bộ bảng lương Nháp của tháng sang Ban Giám đốc duyệt (khóa không tính lại được)."""
    if not get_monthly_attendance_lock(db, thang, nam).get("is_locked"):
        raise ValueError(f"Bảng chấm công tháng {thang}/{nam} chưa được chốt, chưa thể gửi duyệt bảng lương.")
    so_bang_luong = payroll_repository.submit_month_for_approval(db, thang, nam, nguoi_gui)
    if so_bang_luong == 0:
        raise ValueError(f"Tháng {thang}/{nam} không có bảng lương Nháp nào để gửi duyệt.")
    return {
        "message": f"Đã gửi {so_bang_luong} bảng lương tháng {thang}/{nam} sang Ban Giám đốc duyệt.",
        "so_bang_luong": so_bang_luong,
    }


def get_pending_approvals(db: Session, nguoi_duyet: str, chi_duyet_ban_giam_doc: bool = False) -> dict:
    """[Ban Giám đốc] Các kỳ lương Kế toán đã gửi, đang chờ người này duyệt."""
    ky_luong = payroll_repository.get_pending_approval_periods(
        db, nguoi_duyet, settings.board_department_code if chi_duyet_ban_giam_doc else None
    )
    return {"tong_bang_luong": sum(k["so_bang_luong"] for k in ky_luong), "ky_luong": ky_luong}


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


def change_payroll_status(
    db: Session,
    ma_bl: int,
    trang_thai: str,
    nguoi_thuc_hien: str | None = None,
    chi_duyet_ban_giam_doc: bool = False,
    quyen: set[str] | None = None,
) -> dict:
    """
    [Quản lý] Gửi duyệt / duyệt / trả về / chi trả lương theo quy trình
    NHAP -> CHO_DUYET -> DA_DUYET -> DA_TRA (CHO_DUYET, DA_DUYET được trả về NHAP).
    quyen: quyền thực tế của người thao tác (None = bỏ qua kiểm tra quyền, dùng trong kiểm thử).
    Tách nhiệm vụ: người lập bảng lương không tự duyệt; không ai duyệt hay chi trả dòng lương của chính mình.
    chi_duyet_ban_giam_doc: người được cấp riêng quyền duyệt (không thuộc Ban Giám đốc, vd Kế toán trưởng)
    chỉ duyệt / mở lại bảng lương của thành viên Ban Giám đốc.
    """
    row = payroll_repository.get_payroll_status_info(db, ma_bl)
    if row is None:
        raise LookupError(f"Không tìm thấy bảng lương có mã {ma_bl}")
    current = row["trang_thai"]
    if trang_thai not in PAYROLL_STATUS_FLOW.get(current, set()):
        raise ValueError(f"Không thể chuyển bảng lương từ trạng thái {current} sang {trang_thai}")
    required = PAYROLL_STATUS_PERMISSION[(current, trang_thai)]
    if quyen is not None and required not in quyen:
        raise PermissionError(PERMISSION_DENIED_MESSAGES[required])
    if (
        chi_duyet_ban_giam_doc
        and required == "PAYROLL_APPROVE"
        and row.get("ma_pb") != settings.board_department_code
    ):
        raise PermissionError("Bạn chỉ được duyệt bảng lương của Ban Giám đốc. Bảng lương nhân sự khác do Ban Giám đốc duyệt.")
    if nguoi_thuc_hien and trang_thai in ("DA_DUYET", "DA_TRA") and row["ma_nv"] == nguoi_thuc_hien:
        raise PermissionError("Bạn không thể duyệt hoặc chi trả bảng lương của chính mình.")
    if nguoi_thuc_hien and trang_thai == "DA_DUYET" and row.get("nguoi_lap") == nguoi_thuc_hien:
        raise PermissionError("Người lập bảng lương không được tự duyệt. Cần một người có quyền duyệt lương khác duyệt.")
    return payroll_repository.update_payroll_status(db, ma_bl, trang_thai, nguoi_duyet=nguoi_thuc_hien)
