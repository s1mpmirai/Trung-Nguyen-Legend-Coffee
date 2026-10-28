from sqlalchemy import text
from sqlalchemy.orm import Session

from app.repositories import leave_repository
from app.repositories.employee_repository import (
    TOP_LEVEL_AUTO_APPROVE_NOTE,
    is_top_level_employee,
)
from app.repositories.employee_repository import get_by_ma_nv as get_employee_by_id
from app.schemas.leave_schemas import leave_create, leave_review_request
from app.utils.work_calendar import iter_working_days

ANNUAL_LEAVE_DAYS = 12.0

# Cách ghi nhận từng loại đơn vào bảng chấm công khi được duyệt:
#   loai_cong: loại công ghi vào bang_cham_cong
#   so_cong:   số công công ty trả lương cho mỗi ngày nghỉ
# Nghỉ ốm và thai sản do BHXH chi trả nên công ty không tính công; nghỉ không lương không tính công.
# NGHI_VIEC và KHAC không ghi vào bảng chấm công.
LEAVE_ATTENDANCE_RULES = {
    "NGHI_PHEP": {"loai_cong": "NGHI_PHEP", "so_cong": 1.0, "ghi_chu": "Nghỉ phép năm có lương"},
    "NGHI_OM": {"loai_cong": "NGHI_OM", "so_cong": 0.0, "ghi_chu": "Nghỉ ốm (BHXH chi trả)"},
    "NGHI_THAI_SAN": {"loai_cong": "NGHI_THAI_SAN", "so_cong": 0.0, "ghi_chu": "Nghỉ thai sản (BHXH chi trả)"},
    "NGHI_KHONG_LUONG": {"loai_cong": "NGHI_KHONG_LUONG", "so_cong": 0.0, "ghi_chu": "Nghỉ không lương"},
}
VALID_LEAVE_TYPES = {"NGHI_PHEP", "NGHI_OM", "NGHI_THAI_SAN", "NGHI_KHONG_LUONG", "NGHI_VIEC", "KHAC"}


def _clean_id(ma_nv: str) -> str:
    return ma_nv.strip().upper().replace("-", "")


def _check_annual_leave_balance(db: Session, ma_nv: str, nam: int, so_ngay_moi: float, exclude_ma_don: str | None = None) -> None:
    used = leave_repository.sum_annual_leave_days(db, ma_nv, nam, exclude_ma_don)
    if used + so_ngay_moi > ANNUAL_LEAVE_DAYS:
        con_lai = max(0.0, ANNUAL_LEAVE_DAYS - used)
        raise ValueError(
            f"Không đủ ngày phép năm {nam}: còn {con_lai:g}/{ANNUAL_LEAVE_DAYS:g} ngày, đơn xin {so_ngay_moi:g} ngày."
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
    so_ngay_lich = (data.ngay_ket_thuc - data.ngay_bat_dau).days + 1
    if data.so_ngay > so_ngay_lich:
        raise ValueError(f"Số ngày nghỉ ({data.so_ngay:g}) vượt quá khoảng thời gian đã chọn ({so_ngay_lich} ngày).")

    if leave_repository.has_overlapping_leave(db, clean_id, data.ngay_bat_dau, data.ngay_ket_thuc):
        raise ValueError("Bạn đã có đơn nghỉ đang chờ duyệt hoặc đã duyệt trùng khoảng thời gian này.")

    if data.loai_don == "NGHI_PHEP":
        _check_annual_leave_balance(db, clean_id, data.ngay_bat_dau.year, data.so_ngay)

    leave_data = data.model_dump()
    leave_data["ma_nv"] = clean_id
    created = leave_repository.create_leave(db, leave_data)

    # Nhân sự cấp cao nhất không có cấp trên để duyệt -> hệ thống tự động duyệt đơn
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
            _sync_leave_to_attendance(db, updated)
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


def get_pending_leaves_for_manager(db: Session, ma_nql: str | None = None) -> list[dict]:
    """Quản lý lấy danh sách các đơn đang chờ duyệt (ma_nql: chỉ lấy đơn của cấp dưới trực tiếp)."""
    return leave_repository.get_pending_leaves(db, ma_nql)


def get_all_leaves_for_manager(db: Session, trang_thai: str = None, ma_nql: str | None = None) -> list[dict]:
    """Quản lý xem danh sách tất cả đơn từ."""
    return leave_repository.get_all_leaves(db, trang_thai, ma_nql)


def _sync_leave_to_attendance(db: Session, leave: dict) -> None:
    """Ghi các ngày nghỉ đã duyệt vào bảng chấm công theo đúng loại công của từng loại đơn."""
    rule = LEAVE_ATTENDANCE_RULES.get(leave["loai_don"])
    if rule is None:
        return

    working_days = list(iter_working_days(leave["ngay_bat_dau"], leave["ngay_ket_thuc"]))
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


def review_leave_by_manager(
    db: Session,
    ma_don: str,
    data: leave_review_request,
    nguoi_duyet: str,
    ma_nql: str | None = None,
) -> dict:
    """
    Quản lý phê duyệt hoặc từ chối đơn.
    nguoi_duyet lấy từ tài khoản đang đăng nhập; ma_nql khác None nghĩa là người duyệt
    chỉ được duyệt đơn của nhân sự cấp dưới trực tiếp (vai trò Trưởng nhóm).
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
    if ma_nql is not None and leave.get("ma_nql") != ma_nql:
        raise PermissionError("Bạn chỉ được duyệt đơn của nhân sự do mình quản lý trực tiếp.")
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
            _sync_leave_to_attendance(db, updated)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return leave_repository.get_leave_by_id(db, ma_don)
