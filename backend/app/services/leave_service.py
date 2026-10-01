from datetime import timedelta
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.repositories import leave_repository
from app.repositories.employee_repository import get_by_ma_nv as get_employee_by_id
from app.schemas.leave_schemas import leave_create, leave_review_request


def create_employee_leave(db: Session, data: leave_create) -> dict:
    """Xử lý nghiệp vụ nộp đơn xin nghỉ của nhân viên."""
    # 1. Kiểm tra nhân viên tồn tại
    clean_id = data.ma_nv.strip().upper().replace("-", "")
    emp = get_employee_by_id(db, clean_id)
    if not emp:
        raise ValueError(f"Không tìm thấy nhân viên có mã {clean_id}")

    # 2. Kiểm tra ngày hợp lệ
    if data.ngay_ket_thuc < data.ngay_bat_dau:
        raise ValueError("Ngày kết thúc nghỉ không thể nhỏ hơn ngày bắt đầu.")

    leave_data = data.model_dump()
    leave_data["ma_nv"] = clean_id
    return leave_repository.create_leave(db, leave_data)


def get_employee_leave_history(db: Session, ma_nv: str) -> list[dict]:
    """Lấy danh sách đơn từ của nhân viên."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    return leave_repository.get_leaves_by_employee(db, clean_id)


def cancel_employee_leave(db: Session, ma_don: str, ma_nv: str) -> dict:
    """Nhân viên tự hủy đơn nghỉ."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    leave = leave_repository.cancel_leave(db, ma_don, clean_id)
    if not leave:
        raise ValueError(f"Không tìm thấy đơn nghỉ có mã {ma_don}")
    return leave


def get_pending_leaves_for_manager(db: Session) -> list[dict]:
    """Quản lý lấy danh sách các đơn đang chờ duyệt."""
    return leave_repository.get_pending_leaves(db)


def get_all_leaves_for_manager(db: Session, trang_thai: str = None) -> list[dict]:
    """Quản lý xem danh sách tất cả đơn từ."""
    return leave_repository.get_all_leaves(db, trang_thai)


def review_leave_by_manager(db: Session, ma_don: str, data: leave_review_request) -> dict:
    """Quản lý phê duyệt hoặc từ chối đơn."""
    if data.trang_thai not in ["DA_DUYET", "TU_CHOI"]:
        raise ValueError("Trạng thái duyệt chỉ có thể là DA_DUYET hoặc TU_CHOI.")

    clean_reviewer = data.nguoi_duyet.strip().upper().replace("-", "")
    leave = leave_repository.review_leave(
        db,
        ma_don=ma_don,
        trang_thai=data.trang_thai,
        nguoi_duyet=clean_reviewer,
        y_kien_duyet=data.y_kien_duyet,
    )
    if not leave:
        raise ValueError(f"Không tìm thấy đơn nghỉ có mã {ma_don}")

    # Nếu được DUYỆT -> tự động đồng bộ ngày nghỉ vào bảng chấm công
    if data.trang_thai == "DA_DUYET":
        try:
            curr_date = leave["ngay_bat_dau"]
            end_date = leave["ngay_ket_thuc"]
            while curr_date <= end_date:
                # Chỉ đồng bộ các ngày trong tuần (T2 - T7)
                if curr_date.weekday() < 6:
                    sync_query = """
                        INSERT INTO bang_cham_cong (
                            ma_nv, ngay_cong, loai_cong, so_cong, ma_don, ghi_chu
                        ) VALUES (
                            :ma_nv, :ngay_cong, 'NGHI_PHEP', 1.0, :ma_don, 'Nghỉ phép có duyệt'
                        )
                        ON DUPLICATE KEY UPDATE
                            loai_cong = 'NGHI_PHEP',
                            so_cong   = 1.0,
                            ma_don    = :ma_don,
                            ghi_chu   = 'Nghỉ phép có duyệt'
                    """
                    db.execute(
                        text(sync_query),
                        {
                            "ma_nv": leave["ma_nv"],
                            "ngay_cong": curr_date,
                            "ma_don": ma_don,
                        },
                    )
                curr_date += timedelta(days=1)
            db.commit()
        except Exception:
            db.rollback()

    return leave
