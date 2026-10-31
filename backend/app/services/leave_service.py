from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.data_scope import DataScope
from app.core.datetime_utils import get_vietnam_today
from app.repositories import leave_repository
from app.repositories.attendance_repository import get_monthly_attendance_lock
from app.repositories.employee_repository import (
    TOP_LEVEL_AUTO_APPROVE_NOTE,
    is_top_level_employee,
    update_employee_status,
)
from app.repositories.employee_repository import get_by_ma_nv as get_employee_by_id
from app.repositories.holiday_repository import get_holidays
from app.schemas.leave_schemas import leave_create, leave_review_request
from app.utils.work_calendar import iter_working_days

# Phép năm: 12 ngày (Điều 113 BLLĐ 2019), cứ đủ 5 năm làm việc được cộng thêm 1 ngày (Điều 114).
# Năm đầu vào làm: tính theo tỷ lệ số tháng làm việc trong năm.
ANNUAL_LEAVE_DAYS = 12.0
SENIORITY_STEP_YEARS = 5

# Cách ghi nhận từng loại đơn vào bảng chấm công khi được duyệt:
#   loai_cong: loại công ghi vào bang_cham_cong
#   so_cong:   số công công ty trả lương cho mỗi ngày nghỉ
# Nghỉ ốm và thai sản do BHXH chi trả nên công ty không tính công; nghỉ không lương không tính công.
# NGHI_VIEC (lên lịch thôi việc khi duyệt) và KHAC không ghi vào bảng chấm công.
LEAVE_ATTENDANCE_RULES = {
    "NGHI_PHEP": {"loai_cong": "NGHI_PHEP", "so_cong": 1.0, "ghi_chu": "Nghỉ phép năm có lương"},
    "NGHI_OM": {"loai_cong": "NGHI_OM", "so_cong": 0.0, "ghi_chu": "Nghỉ ốm (BHXH chi trả)"},
    "NGHI_THAI_SAN": {"loai_cong": "NGHI_THAI_SAN", "so_cong": 0.0, "ghi_chu": "Nghỉ thai sản (BHXH chi trả)"},
    "NGHI_KHONG_LUONG": {"loai_cong": "NGHI_KHONG_LUONG", "so_cong": 0.0, "ghi_chu": "Nghỉ không lương"},
}
VALID_LEAVE_TYPES = {"NGHI_PHEP", "NGHI_OM", "NGHI_THAI_SAN", "NGHI_KHONG_LUONG", "NGHI_VIEC", "KHAC"}
# Thai sản và nghỉ việc tính theo ngày lịch; các loại còn lại tính theo ngày làm việc
CALENDAR_DAY_TYPES = {"NGHI_THAI_SAN", "NGHI_VIEC"}
# Chỉ các loại tính theo ngày làm việc mới được xin nửa ngày (khi khoảng nghỉ đúng 1 ngày làm việc)
HALF_DAY = 0.5


def _clean_id(ma_nv: str) -> str:
    return ma_nv.strip().upper().replace("-", "")


def _leave_working_days(db: Session, start: date, end: date) -> list[date]:
    return list(iter_working_days(start, end, get_holidays(db, start, end)))


def _compute_so_ngay(db: Session, loai_don: str, start: date, end: date, so_ngay_xin: float | None) -> float:
    """Số ngày nghỉ do server tính (không tin số client gửi lên)."""
    if loai_don in CALENDAR_DAY_TYPES:
        return float((end - start).days + 1)
    working_days = _leave_working_days(db, start, end)
    if not working_days:
        raise ValueError("Khoảng thời gian đã chọn không có ngày làm việc nào (cuối tuần hoặc ngày lễ).")
    if len(working_days) == 1 and so_ngay_xin == HALF_DAY:
        return HALF_DAY
    return float(len(working_days))


def _ensure_months_unlocked(db: Session, days: list[date]) -> None:
    """Không ghi nhận đơn nghỉ vào tháng đã chốt công (tránh lệch bảng công và bảng lương)."""
    for thang, nam in sorted({(d.month, d.year) for d in days}):
        if get_monthly_attendance_lock(db, thang, nam).get("is_locked"):
            raise ValueError(
                f"Bảng chấm công tháng {thang}/{nam} đã chốt. Vui lòng nhờ Quản lý mở khóa trước khi ghi nhận đơn nghỉ."
            )


def annual_leave_entitlement(db: Session, ma_nv: str, nam: int) -> float:
    """Tổng số ngày phép năm được hưởng trong năm `nam` (theo thâm niên và tháng vào làm)."""
    start = leave_repository.get_first_contract_start(db, ma_nv)
    if start is None:
        return ANNUAL_LEAVE_DAYS
    if start.year > nam:
        return 0.0

    so_ngay = ANNUAL_LEAVE_DAYS
    if start.year == nam:
        # Năm đầu: tính theo số tháng làm việc (vào làm sau ngày 15 thì tháng đó không tính)
        so_thang = 12 - start.month + (1 if start.day <= 15 else 0)
        so_ngay = round(ANNUAL_LEAVE_DAYS * so_thang / 12)

    nam_tham_nien = (date(nam, 12, 31) - start).days // 365
    return float(so_ngay + nam_tham_nien // SENIORITY_STEP_YEARS)


def get_annual_leave_balance(db: Session, ma_nv: str, nam: int | None = None) -> dict:
    """Số dư phép năm: tổng được hưởng, đã duyệt, đang chờ duyệt, còn lại."""
    clean_id = _clean_id(ma_nv)
    nam = nam or get_vietnam_today().year
    tong = annual_leave_entitlement(db, clean_id, nam)
    usage = leave_repository.annual_leave_usage(db, clean_id, nam)
    return {
        "ma_nv": clean_id,
        "nam": nam,
        "tong_phep_nam": tong,
        "da_su_dung": usage["da_duyet"],
        "dang_cho_duyet": usage["cho_duyet"],
        "con_lai": max(0.0, tong - usage["da_duyet"] - usage["cho_duyet"]),
        "han_dung_phep": f"31/12/{nam}",
    }


def _check_annual_leave_balance(db: Session, ma_nv: str, nam: int, so_ngay_moi: float, exclude_ma_don: str | None = None) -> None:
    tong = annual_leave_entitlement(db, ma_nv, nam)
    used = leave_repository.sum_annual_leave_days(db, ma_nv, nam, exclude_ma_don)
    if used + so_ngay_moi > tong:
        con_lai = max(0.0, tong - used)
        raise ValueError(
            f"Không đủ ngày phép năm {nam}: còn {con_lai:g}/{tong:g} ngày, đơn xin {so_ngay_moi:g} ngày."
        )


def create_employee_leave(db: Session, data: leave_create) -> dict:
    """Xử lý nghiệp vụ nộp đơn xin nghỉ của nhân viên."""
    clean_id = _clean_id(data.ma_nv)
    emp = get_employee_by_id(db, clean_id)
    if not emp:
        raise ValueError(f"Không tìm thấy nhân viên có mã {clean_id}")
    if emp.get("trang_thai") == "DA_NGHI_VIEC":
        raise ValueError("Nhân sự đã nghỉ việc không thể nộp đơn.")

    if data.loai_don not in VALID_LEAVE_TYPES:
        raise ValueError(f"Loại đơn không hợp lệ: {data.loai_don}")
    if data.ngay_ket_thuc < data.ngay_bat_dau:
        raise ValueError("Ngày kết thúc nghỉ không thể nhỏ hơn ngày bắt đầu.")
    if data.loai_don == "NGHI_PHEP" and data.ngay_bat_dau.year != data.ngay_ket_thuc.year:
        raise ValueError("Đơn nghỉ phép năm không được kéo dài sang năm sau. Vui lòng tách thành 2 đơn theo từng năm.")
    if data.loai_don == "NGHI_VIEC" and emp.get("ngay_nghi_viec"):
        raise ValueError(f"Bạn đã có lịch thôi việc từ ngày {emp['ngay_nghi_viec']:%d/%m/%Y}.")

    data.so_ngay = _compute_so_ngay(db, data.loai_don, data.ngay_bat_dau, data.ngay_ket_thuc, data.so_ngay)

    if leave_repository.has_overlapping_leave(db, clean_id, data.ngay_bat_dau, data.ngay_ket_thuc):
        raise ValueError("Bạn đã có đơn nghỉ đang chờ duyệt hoặc đã duyệt trùng khoảng thời gian này.")
    if data.loai_don in LEAVE_ATTENDANCE_RULES:
        _ensure_months_unlocked(db, _leave_working_days(db, data.ngay_bat_dau, data.ngay_ket_thuc))

    if data.loai_don == "NGHI_PHEP":
        _check_annual_leave_balance(db, clean_id, data.ngay_bat_dau.year, data.so_ngay)

    leave_data = data.model_dump()
    leave_data["ma_nv"] = clean_id
    created = leave_repository.create_leave(db, leave_data)

    # Ban Giám đốc (không có cấp trên để duyệt) -> hệ thống tự động duyệt đơn
    # (nguoi_duyet để trống vì không phải ai duyệt, lý do ghi ở y_kien_duyet)
    if is_top_level_employee(db, clean_id):
        try:
            updated = leave_repository.review_leave(
                db,
                ma_don=created["ma_don"],
                trang_thai="DA_DUYET",
                nguoi_duyet=None,
                y_kien_duyet=TOP_LEVEL_AUTO_APPROVE_NOTE,
            )
            _apply_approved_leave(db, updated)
            db.commit()
        except Exception:
            db.rollback()
            raise
        return leave_repository.get_leave_by_id(db, created["ma_don"])

    return created


def get_employee_leave_history(db: Session, ma_nv: str) -> list[dict]:
    """Lấy danh sách đơn từ của nhân viên."""
    return leave_repository.get_leaves_by_employee(db, _clean_id(ma_nv))


def cancel_employee_leave(db: Session, ma_don: str, ma_nv: str) -> dict:
    """Nhân viên tự hủy đơn nghỉ."""
    leave = leave_repository.cancel_leave(db, ma_don, _clean_id(ma_nv))
    if not leave:
        raise ValueError(f"Không tìm thấy đơn nghỉ có mã {ma_don}")
    return leave


def get_pending_leaves_for_manager(db: Session, scope: DataScope | None = None) -> list[dict]:
    """Quản lý lấy danh sách các đơn đang chờ duyệt (scope: chỉ lấy đơn của nhân sự trong phạm vi)."""
    return leave_repository.get_pending_leaves(db, scope)


def get_all_leaves_for_manager(db: Session, trang_thai: str = None, scope: DataScope | None = None) -> list[dict]:
    """Quản lý xem danh sách tất cả đơn từ."""
    return leave_repository.get_all_leaves(db, trang_thai, scope)


def _sync_leave_to_attendance(db: Session, leave: dict) -> None:
    """Ghi các ngày nghỉ đã duyệt vào bảng chấm công theo đúng loại công của từng loại đơn."""
    rule = LEAVE_ATTENDANCE_RULES.get(leave["loai_don"])
    if rule is None:
        return

    working_days = _leave_working_days(db, leave["ngay_bat_dau"], leave["ngay_ket_thuc"])
    _ensure_months_unlocked(db, working_days)
    # Đơn nghỉ nửa ngày (vd 0.5 ngày phép) chỉ được tính đúng phần công xin nghỉ
    so_cong = rule["so_cong"]
    if len(working_days) == 1 and float(leave["so_ngay"]) < 1:
        so_cong = rule["so_cong"] * float(leave["so_ngay"])

    sync_query = text("""
        INSERT INTO bang_cham_cong (
            ma_nv, ngay_cong, loai_cong, so_cong, trang_thai_duyet, ma_don, ghi_chu
        ) VALUES (
            :ma_nv, :ngay_cong, :loai_cong, :so_cong, 'DA_DUYET', :ma_don, :ghi_chu
        )
        ON DUPLICATE KEY UPDATE
            -- Không ghi đè ngày nhân viên thực tế đã chấm công đi làm, chỉ liên kết với đơn
            loai_cong = IF(gio_vao IS NULL, VALUES(loai_cong), loai_cong),
            so_cong = IF(gio_vao IS NULL, VALUES(so_cong), so_cong),
            ghi_chu = IF(gio_vao IS NULL, VALUES(ghi_chu), ghi_chu),
            trang_thai_duyet = 'DA_DUYET',
            ma_don = VALUES(ma_don)
    """)
    for ngay in working_days:
        db.execute(
            sync_query,
            {
                "ma_nv": leave["ma_nv"],
                "ngay_cong": ngay,
                "loai_cong": rule["loai_cong"],
                "so_cong": so_cong,
                "ma_don": leave["ma_don"],
                "ghi_chu": rule["ghi_chu"],
            },
        )


def _apply_approved_leave(db: Session, leave: dict) -> None:
    """Hệ quả nghiệp vụ khi đơn được duyệt: ghi bảng công, hoặc lên lịch thôi việc với đơn NGHI_VIEC."""
    if leave["loai_don"] == "NGHI_VIEC":
        # Ngày hiệu lực thôi việc = ngày kết thúc đơn; trước ngày đó nhân sự vẫn làm việc bình thường
        update_employee_status(
            db,
            ma_nv=leave["ma_nv"],
            trang_thai="DA_NGHI_VIEC",
            ngay_nghi_viec=leave["ngay_ket_thuc"],
            ly_do=f"Đơn xin nghỉ việc {leave['ma_don']}: {leave['ly_do']}"[:255],
        )
        return
    _sync_leave_to_attendance(db, leave)


def review_leave_by_manager(
    db: Session,
    ma_don: str,
    data: leave_review_request,
    nguoi_duyet: str,
    scope: DataScope | None = None,
) -> dict:
    """
    Quản lý phê duyệt hoặc từ chối đơn.
    nguoi_duyet lấy từ tài khoản đang đăng nhập; scope khác None nghĩa là người duyệt
    chỉ được duyệt đơn của nhân sự trong phạm vi (phòng mình / cấp dưới trực tiếp).
    """
    if data.trang_thai not in ["DA_DUYET", "TU_CHOI"]:
        raise ValueError("Trạng thái duyệt chỉ có thể là DA_DUYET hoặc TU_CHOI.")

    leave = leave_repository.get_leave_by_id(db, ma_don)
    if not leave:
        raise ValueError(f"Không tìm thấy đơn nghỉ có mã {ma_don}")
    if leave["trang_thai"] != "CHO_DUYET":
        raise ValueError("Đơn này đã được xử lý trước đó, không thể duyệt lại.")
    if leave["ma_nv"] == nguoi_duyet:
        raise PermissionError("Bạn không thể tự duyệt đơn của chính mình.")
    if scope is not None and not scope.covers(leave):
        raise PermissionError("Bạn chỉ được duyệt đơn của nhân sự thuộc phạm vi mình quản lý.")
    if data.trang_thai == "TU_CHOI" and not (data.y_kien_duyet or "").strip():
        raise ValueError("Vui lòng nhập lý do từ chối đơn.")
    if data.trang_thai == "DA_DUYET" and leave["loai_don"] == "NGHI_PHEP":
        _check_annual_leave_balance(
            db, leave["ma_nv"], leave["ngay_bat_dau"].year, float(leave["so_ngay"]), exclude_ma_don=ma_don
        )

    try:
        updated = leave_repository.review_leave(
            db,
            ma_don=ma_don,
            trang_thai=data.trang_thai,
            nguoi_duyet=nguoi_duyet,
            y_kien_duyet=data.y_kien_duyet,
        )
        if data.trang_thai == "DA_DUYET":
            _apply_approved_leave(db, updated)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return leave_repository.get_leave_by_id(db, ma_don)
