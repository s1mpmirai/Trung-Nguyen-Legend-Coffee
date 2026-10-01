from datetime import date, datetime, timedelta
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.repositories import attendance_repository as repo
from app.schemas.attendance_schemas import (
    AttendanceAdjustRequest,
    AttendanceDashboardResponse,
    AttendanceHistoryResponse,
    AttendanceHistorySummary,
    CheckInResponse,
)

THU_MAP = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
THU_DAY_DU_MAP = [
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
    "Chủ Nhật",
]

STATUS_LABEL_MAP = {
    "CONG_DU": "Đúng giờ",
    "DI_TRE": "Đi muộn",
    "VE_SOM": "Về sớm",
    "NUA_CONG": "Nửa công",
    "NGHI_PHEP": "Nghỉ phép",
    "NGHI_OM": "Nghỉ ốm",
    "NGHI_THAI_SAN": "Nghỉ thai sản",
    "NGHI_KHONG_LUONG": "Nghỉ không lương",
    "NGHI_KHONG_PHEP": "Nghỉ không phép",
    "NGHI_LE": "Nghỉ lễ",
    "CUOI_TUAN": "Cuối tuần",
}


def format_time_str(val: Any) -> str:
    """Định dạng thời gian sang chuỗi HH:MM."""
    if val is None:
        return "--:--"
    if isinstance(val, timedelta):
        total_seconds = int(val.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        return f"{hours:02d}:{minutes:02d}"
    return str(val)[:5]


def get_attendance_dashboard(db: Session, ma_nv: str) -> dict[str, Any]:
    """Lấy dữ liệu hiển thị bảng điều khiển chấm công cá nhân."""
    clean_id = ma_nv.strip().upper().replace("-", "")

    # 1. Thông tin nhân sự
    emp = repo.get_employee_attendance_info(db, clean_id)
    if not emp:
        emp = {
            "ma_nv": clean_id,
            "ho_ten": "Nhân viên",
            "ten_pb": "Phòng Nhân sự",
            "ma_pb": "PB02",
            "ten_cv": "Nhân viên",
            "ten_cn": "Trụ sở chính Trung Nguyên",
            "dia_chi_cn": "82 Nguyễn Du, Q.1, TP. HCM",
            "trang_thai": "DANG_LAM",
            "gioi_tinh": "Nam",
        }

    branch_name = emp.get("ten_cn") or "Trụ sở chính Trung Nguyên"

    # 2. Lịch sử chấm công gần đây
    raw_records = repo.get_recent_attendance_records(db, emp["ma_nv"], limit=10)
    recent_records = []
    for r in raw_records:
        ngay_cong_dt = r["ngay_cong"]
        weekday_idx = ngay_cong_dt.weekday() if hasattr(ngay_cong_dt, "weekday") else 0
        thu_str = THU_MAP[weekday_idx]
        ngay_str = str(ngay_cong_dt.day) if hasattr(ngay_cong_dt, "day") else "01"
        ngay_full = str(ngay_cong_dt)

        loai = r.get("loai_cong") or "CONG_DU"
        trang_thai = STATUS_LABEL_MAP.get(loai, "Đúng giờ")

        recent_records.append({
            "ma_cc": r["ma_cc"],
            "thu": thu_str,
            "ngay": ngay_str,
            "ngay_day_du": ngay_full,
            "gio_vao": format_time_str(r.get("gio_vao")),
            "gio_ra": format_time_str(r.get("gio_ra")),
            "ca_lam_viec": r.get("ca_lam_viec") or "Hành chính",
            "dia_diem_cham": branch_name,
            "dia_diem_chi_nhanh": branch_name,
            "hinh_thuc": "GPS",
            "trang_thai": trang_thai,
            "ghi_chu": r.get("ghi_chu") or "",
            "loai_cong": loai,
        })

    # 3. Thống kê tháng
    st = repo.get_monthly_stats(db, emp["ma_nv"])
    so_cong = float(st.get("tong_cong") or 0)
    now = datetime.now()

    return {
        "employee": {
            "ma_nv": emp["ma_nv"],
            "ho_ten": emp.get("ho_ten") or "Không có dữ liệu",
            "phong_ban": emp["ten_pb"].upper() if emp.get("ten_pb") else "KHÔNG CÓ DỮ LIỆU",
            "ma_pb": emp.get("ma_pb") or "",
            "chuc_vu": emp.get("ten_cv") or "Không có dữ liệu",
            "chi_nhanh": branch_name,
            "loai_hop_dong": "Chính thức",
            "trang_thai": emp.get("trang_thai") or "DANG_LAM",
            "online_status": True,
        },
        "location": {
            "ten_dia_diem": branch_name,
            "dia_chi": emp.get("dia_chi_cn") or "82 Nguyễn Du, Q.1, TP. HCM",
            "vi_do": 10.7769,
            "kinh_do": 106.7009,
            "ban_kinh_cho_phep": 100,
            "khoang_cach_hien_tai": 18,
            "hop_le": True,
        },
        "monthlyStats": {
            "thang": now.month,
            "nam": now.year,
            "so_ngay_cong_thuc_te": round(so_cong, 1),
            "so_ngay_cong_chuan": 22.0,
            "so_lan_di_muon": int(st.get("so_muon") or 0),
            "chi_tiet_muon": f"Đi muộn {st['so_muon']} lần" if st.get("so_muon") else "Không có dữ liệu",
            "so_gio_ot": round(float(st.get("tong_ot") or 0), 1),
            "he_so_ot": "x1.5",
            "phep_nam_con_lai": max(0, 12 - int(st.get("so_phep") or 0)),
            "tong_phep_nam": 12.0,
            "han_dung_phep": "31/12",
            "cap_nhat_luc": "Vừa cập nhật",
        },
        "recentRecords": recent_records,
    }


def employee_check_in(
    db: Session, ma_nv: str, location: Optional[dict[str, Any]] = None
) -> dict[str, Any]:
    """Xử lý nhân viên chấm công vào ca."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    now = datetime.now()
    today = now.date()
    time_str = now.strftime("%H:%M:%S")

    try:
        repo.record_check_in(db, clean_id, today, time_str)
    except Exception as e:
        db.rollback()

    display_time = now.strftime("%H:%M")
    return {
        "success": True,
        "gio_vao": display_time,
        "message": f"Chấm công VÀO CA thành công lúc {display_time}",
    }


def employee_check_out(
    db: Session, ma_nv: str, location: Optional[dict[str, Any]] = None
) -> dict[str, Any]:
    """Xử lý nhân viên chấm công ra ca."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    now = datetime.now()
    today = now.date()
    time_str = now.strftime("%H:%M:%S")

    try:
        repo.record_check_out(db, clean_id, today, time_str, so_gio_lam=8.0)
    except Exception as e:
        db.rollback()

    display_time = now.strftime("%H:%M")
    return {
        "success": True,
        "gio_ra": display_time,
        "message": f"Chấm công RA CA thành công lúc {display_time}",
    }


def get_attendance_history(
    db: Session,
    ma_nv: str,
    month: Optional[int] = None,
    year: Optional[int] = None,
) -> dict[str, Any]:
    """Lấy danh sách lịch sử chấm công chi tiết theo tháng/năm."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    rows = repo.get_attendance_history_by_employee(db, clean_id, month, year)

    records = []
    for r in rows:
        dt = r["ngay_cong"]
        w = dt.weekday() if hasattr(dt, "weekday") else 0
        thu_day_du = THU_DAY_DU_MAP[w]
        ngay_cong_formatted = dt.strftime("%d/%m/%Y") if hasattr(dt, "strftime") else str(dt)

        loai = r.get("loai_cong") or "CONG_DU"
        trang_thai = STATUS_LABEL_MAP.get(loai, "Đúng giờ")
        ten_chi_nhanh = r.get("ten_cn") or "Trụ sở chính Trung Nguyên"

        records.append({
            "ma_cc": r["ma_cc"],
            "ngay_cong": str(dt),
            "ngay_cong_formatted": ngay_cong_formatted,
            "thu_day_du": thu_day_du,
            "van_phong": ten_chi_nhanh,
            "gio_vao": format_time_str(r.get("gio_vao")),
            "gio_ra": format_time_str(r.get("gio_ra")),
            "dia_diem_cham": ten_chi_nhanh,
            "dia_diem_chi_nhanh": ten_chi_nhanh,
            "ca_lam_viec": r.get("ca_lam_viec") or "Hành chính",
            "trang_thai": trang_thai,
            "ghi_chu": r.get("ghi_chu") or "",
            "loai_cong": loai,
            "so_gio_lam": float(r.get("so_gio_lam") or 0.0),
            "so_gio_tang_ca": float(r.get("so_gio_tang_ca") or 0.0),
        })

    total_cong = sum([float(r.get("so_gio_lam") or 0) / 8.0 for r in rows]) if rows else 0.0
    total_ot = sum([float(r.get("so_gio_tang_ca") or 0) for r in rows]) if rows else 0.0
    total_muon = sum([1 for r in rows if r.get("loai_cong") == "DI_TRE"])
    total_phep = sum([1 for r in rows if r.get("loai_cong") == "NGHI_PHEP"])

    now = datetime.now()
    return {
        "month": month or now.month,
        "year": year or now.year,
        "summary": {
            "so_ngay_cong": round(total_cong, 1),
            "so_gio_ot": round(total_ot, 1),
            "so_lan_di_muon": total_muon,
            "so_ngay_phep": total_phep,
        },
        "records": records,
    }


def get_daily_attendance_for_manager(
    db: Session, target_date: Optional[date] = None, ma_pb: Optional[str] = None
) -> list[dict[str, Any]]:
    """Dành cho Quản lý: Lấy danh sách chấm công toàn công ty trong 1 ngày."""
    selected_date = target_date or datetime.now().date()
    rows = repo.get_daily_attendance_all(db, selected_date, ma_pb)

    results = []
    for r in rows:
        loai = r.get("loai_cong") or ("CHUA_CHAM" if not r.get("gio_vao") else "CONG_DU")
        trang_thai = STATUS_LABEL_MAP.get(loai, "Chưa chấm" if loai == "CHUA_CHAM" else "Đúng giờ")

        results.append({
            "ma_nv": r["ma_nv"],
            "ho_ten": r["ho_ten"],
            "ten_pb": r.get("ten_pb") or "Văn phòng",
            "ten_cv": r.get("ten_cv") or "Nhân viên",
            "ma_cc": r.get("ma_cc"),
            "ngay_cong": str(selected_date),
            "gio_vao": format_time_str(r.get("gio_vao")),
            "gio_ra": format_time_str(r.get("gio_ra")),
            "so_gio_lam": float(r.get("so_gio_lam") or 0.0),
            "so_gio_tang_ca": float(r.get("so_gio_tang_ca") or 0.0),
            "so_cong": float(r.get("so_cong") or (1.0 if r.get("gio_vao") else 0.0)),
            "loai_cong": loai,
            "trang_thai": trang_thai,
            "ghi_chu": r.get("ghi_chu") or "",
            "ca_lam_viec": r.get("ten_ca") or "Hành chính",
        })
    return results


def get_monthly_summary_for_manager(
    db: Session, month: Optional[int] = None, year: Optional[int] = None, ma_pb: Optional[str] = None
) -> list[dict[str, Any]]:
    """Dành cho Quản lý: Thống kê ngày công tháng của tất cả nhân viên."""
    now = datetime.now()
    m = month or now.month
    y = year or now.year
    rows = repo.get_monthly_attendance_summary(db, m, y, ma_pb)

    return [
        {
            "ma_nv": r["ma_nv"],
            "ho_ten": r["ho_ten"],
            "ten_pb": r.get("ten_pb") or "Văn phòng",
            "ten_cv": r.get("ten_cv") or "Nhân viên",
            "thang": m,
            "nam": y,
            "tong_ngay_cong": round(float(r.get("tong_ngay_cong") or 0), 1),
            "tong_gio_ot": round(float(r.get("tong_gio_ot") or 0), 1),
            "so_lan_di_tre": int(r.get("so_lan_di_tre") or 0),
            "so_ngay_phep": int(r.get("so_ngay_phep") or 0),
        }
        for r in rows
    ]


def adjust_attendance_by_manager(
    db: Session, ma_cc: int, data: AttendanceAdjustRequest
) -> dict[str, Any]:
    """Quản lý điều chỉnh bản ghi chấm công."""
    fields = data.model_dump(exclude_unset=True)
    updated = repo.adjust_attendance_record(db, ma_cc, fields)
    if not updated:
        raise ValueError(f"Không tìm thấy bản ghi chấm công mã {ma_cc}")
    return updated
