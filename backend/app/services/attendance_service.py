from datetime import date, datetime, timedelta
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.datetime_utils import get_vietnam_now, get_vietnam_today
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
        thu_day_du = THU_DAY_DU_MAP[weekday_idx]
        ngay_str = str(ngay_cong_dt.day).zfill(2) if hasattr(ngay_cong_dt, "day") else "01"
        thang_str = str(ngay_cong_dt.month).zfill(2) if hasattr(ngay_cong_dt, "month") else "10"
        thang_label = f"Th.{ngay_cong_dt.month}" if hasattr(ngay_cong_dt, "month") else "Th.10"
        ngay_full = str(ngay_cong_dt)
        is_today = bool(ngay_cong_dt == get_vietnam_today()) if hasattr(ngay_cong_dt, "strftime") else False

        loai = r.get("loai_cong") or "CONG_DU"
        trang_thai = STATUS_LABEL_MAP.get(loai, "Đúng giờ")
        so_gio_lam_val = float(r.get("so_gio_lam") or 0.0)
        ghi_chu_val = r.get("ghi_chu") or ""
        is_penalized = bool(so_gio_lam_val == 7.0 or "trừ 1 tiếng" in ghi_chu_val)

        recent_records.append({
            "ma_cc": r["ma_cc"],
            "thu": thu_str,
            "thu_day_du": thu_day_du,
            "ngay": ngay_str,
            "thang": thang_str,
            "thang_label": thang_label,
            "is_today": is_today,
            "ngay_day_du": ngay_full,
            "gio_vao": format_time_str(r.get("gio_vao")),
            "gio_ra": format_time_str(r.get("gio_ra")),
            "ca_lam_viec": r.get("ca_lam_viec") or "Hành chính (08:00 - 17:00)",
            "dia_diem_cham": branch_name,
            "dia_diem_chi_nhanh": branch_name,
            "hinh_thuc": "GPS",
            "trang_thai": trang_thai,
            "ghi_chu": ghi_chu_val,
            "loai_cong": loai,
            "so_gio_lam": so_gio_lam_val,
            "so_cong": float(r.get("so_cong") or 1.0),
            "is_penalized": is_penalized,
        })

    # 3. Thống kê tháng
    st = repo.get_monthly_stats(db, emp["ma_nv"])
    so_cong = float(st.get("tong_cong") or 0)
    now = get_vietnam_now()

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


CA_GIO_BAT_DAU = "08:00:00"
CA_GIO_KET_THUC = "17:00:00"
MOC_TRE_CHO_PHEP = "08:15:00"  # Cho phép đi trễ 15 phút (check-in <= 08:15:00 tính Đúng giờ)


def employee_check_in(
    db: Session, ma_nv: str, location: Optional[dict[str, Any]] = None
) -> dict[str, Any]:
    """
    Xử lý nhân viên chấm công vào ca.
    Quy định nghiệp vụ:
    1. Check-in 1 ngày 1 lần, những lần sau coi như không tính.
    2. Giờ làm việc: 08:00 đến 17:00, được phép đi trễ 15 phút (check-in <= 08:15 tính Đúng giờ).
    3. Check-in sau 08:15:
       - Vẫn cho check-in bình thường, tính là Đi muộn (DI_TRE).
       - Báo cho Quản lý biết để sửa lại giờ check-in (tối đa 3 lần/tháng).
       - Sau 3 lần: Từ lần thứ 4 đi trễ sau 8h15 trở đi trong tháng (hoặc đã hết 3 lần sửa)
         thì bị phạt trừ lương 1 tiếng (so_gio_lam = 7.0, so_cong = 0.88).
    """
    clean_id = ma_nv.strip().upper().replace("-", "")
    now = get_vietnam_now()
    today = get_vietnam_today()
    time_str = now.strftime("%H:%M:%S")
    display_time = now.strftime("%H:%M")

    # 1. Check-in 1 ngày 1 lần, những lần sau coi như không tính
    existing = repo.get_today_attendance(db, clean_id, today)
    if existing and existing.get("gio_vao"):
        existing_time = format_time_str(existing["gio_vao"])
        return {
            "success": False,
            "gio_vao": existing_time,
            "message": f"Hôm nay bạn đã chấm công vào ca lúc {existing_time}. Mỗi ngày chỉ check-in 1 lần, những lần sau không tính!",
        }

    # 2. Kiểm tra giờ check-in so với mốc 08:15 (cho phép đi trễ 15p)
    is_late = time_str > MOC_TRE_CHO_PHEP
    loai_cong = "CONG_DU"
    so_cong = 1.0
    so_gio_lam = 8.0
    ghi_chu = "Đúng giờ"
    message = f"Chấm công VÀO CA thành công lúc {display_time} (Đúng giờ)"

    if is_late:
        loai_cong = "DI_TRE"
        minutes_late = max(1, (now.hour * 60 + now.minute) - (8 * 60))

        # Đếm tổng số lần đã vi phạm đi trễ / đã nhờ Quản lý sửa trong tháng
        so_lan_ql_sua = repo.count_checkin_adjustments_in_month(db, clean_id, today.month, today.year)
        so_lan_di_tre_cu = repo.count_late_checkins_in_month(db, clean_id, today.month, today.year, exclude_date=today)
        tong_so_lan_tre = so_lan_ql_sua + so_lan_di_tre_cu
        lan_hien_tai = tong_so_lan_tre + 1

        if tong_so_lan_tre < 3:
            # Trong hạn mức 3 lần được hỗ trợ báo Quản lý sửa giờ
            con_lai = 3 - so_lan_ql_sua
            ghi_chu = f"Đi muộn {minutes_late}p (Lần {lan_hien_tai}/3 trong tháng - Báo QL sửa giờ)"
            message = (
                f"Vào ca lúc {display_time} (Trễ {minutes_late} phút so với 08:15). "
                f"Đây là lần đi trễ thứ {lan_hien_tai}/3 trong tháng. "
                f"Vui lòng báo Quản lý nếu cần hỗ trợ sửa lại giờ check-in."
            )
        else:
            # Sau 3 lần thì đi trễ sau 8h15 bị trừ lương 1 tiếng
            so_gio_lam = 7.0
            so_cong = 0.88  # 7h / 8h = 0.875 công
            ghi_chu = f"Đi trễ sau 08:15 ({minutes_late}p, lần {lan_hien_tai} trong tháng) - Phạt trừ 1 tiếng lương"
            message = (
                f"Vào ca lúc {display_time} (Trễ {minutes_late} phút). "
                f"Bạn đã vượt quá 3 lần đi trễ trong tháng, do đó bị trừ 1 tiếng công/lương."
            )

    try:
        res = repo.record_check_in(
            db=db,
            ma_nv=clean_id,
            today=today,
            gio_vao=time_str,
            loai_cong=loai_cong,
            so_cong=so_cong,
            so_gio_lam=so_gio_lam,
            ghi_chu=ghi_chu,
        )
        if res.get("is_duplicate"):
            existing_time = format_time_str(res["gio_vao"])
            return {
                "success": False,
                "gio_vao": existing_time,
                "message": f"Hôm nay bạn đã chấm công vào ca lúc {existing_time}. Mỗi ngày chỉ check-in 1 lần, những lần sau không tính!",
            }
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "gio_vao": None,
            "message": f"Lỗi chấm công: {str(e)}",
        }

    return {
        "success": True,
        "gio_vao": display_time,
        "message": message,
    }


def employee_check_out(
    db: Session, ma_nv: str, location: Optional[dict[str, Any]] = None
) -> dict[str, Any]:
    """Xử lý nhân viên chấm công ra ca."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    now = get_vietnam_now()
    today = get_vietnam_today()
    time_str = now.strftime("%H:%M:%S")

    existing = repo.get_today_attendance(db, clean_id, today)
    if not existing or not existing.get("gio_vao"):
        return {
            "success": False,
            "gio_ra": None,
            "message": "Bạn chưa chấm công vào ca hôm nay!",
        }

    # Nếu ngày này bị phạt trừ 1 tiếng, giữ nguyên mức 7.0h
    is_penalized = float(existing.get("so_gio_lam") or 8.0) == 7.0
    so_gio = 7.0 if is_penalized else 8.0

    try:
        repo.record_check_out(db, clean_id, today, time_str, so_gio_lam=so_gio)
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "gio_ra": None,
            "message": f"Lỗi chấm công ra ca: {str(e)}",
        }

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

    now = get_vietnam_now()
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
    selected_date = target_date or get_vietnam_today()
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
    now = get_vietnam_now()
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
    """
    Quản lý điều chỉnh bản ghi chấm công.
    Quy định: Chỉ Quản lý mới có quyền sửa giờ check-in (gio_vao) cho nhân viên,
    và tối đa 3 lần/tháng đối với mỗi nhân viên.
    """
    record = repo.get_attendance_by_id(db, ma_cc)
    if not record:
        raise ValueError(f"Không tìm thấy bản ghi chấm công mã {ma_cc}")

    fields = data.model_dump(exclude_unset=True)
    ma_nv = record["ma_nv"]
    ngay_cong = record["ngay_cong"]
    thang = ngay_cong.month if hasattr(ngay_cong, "month") else get_vietnam_now().month
    nam = ngay_cong.year if hasattr(ngay_cong, "year") else get_vietnam_now().year

    # Kiểm tra nếu Quản lý điều chỉnh giờ vào (gio_vao)
    is_modifying_gio_vao = False
    gio_vao_cu = format_time_str(record.get("gio_vao"))
    gio_vao_moi = fields.get("gio_vao")

    if gio_vao_moi and format_time_str(gio_vao_moi) != gio_vao_cu:
        is_modifying_gio_vao = True
        adjusted_count = repo.count_checkin_adjustments_in_month(db, ma_nv, thang, nam)
        if adjusted_count >= 3:
            raise ValueError(
                f"Nhân viên {ma_nv} đã được sửa giờ check-in {adjusted_count}/3 lần trong tháng {thang}/{nam}. Đã đạt giới hạn tối đa cho phép!"
            )

        # Nếu sửa về giờ vào ca hợp lệ (<= 08:15:00) thì tự động chuyển thành Đúng giờ và phục hồi đủ công
        formatted_new_time = format_time_str(gio_vao_moi)
        if formatted_new_time <= "08:15":
            if "loai_cong" not in fields or not fields["loai_cong"]:
                fields["loai_cong"] = "CONG_DU"
            if "so_cong" not in fields or fields["so_cong"] is None:
                fields["so_cong"] = 1.0
            if "so_gio_lam" not in fields or fields["so_gio_lam"] is None:
                fields["so_gio_lam"] = 8.0
            if "ghi_chu" not in fields or not fields["ghi_chu"]:
                fields["ghi_chu"] = "Quản lý đã duyệt điều chỉnh giờ vào ca đúng giờ"

    updated = repo.adjust_attendance_record(db, ma_cc, fields)
    if not updated:
        raise ValueError(f"Không tìm thấy bản ghi chấm công mã {ma_cc}")

    if is_modifying_gio_vao:
        repo.log_attendance_adjustment(
            db=db,
            ma_cc=ma_cc,
            ma_nv=ma_nv,
            thang=thang,
            nam=nam,
            gio_vao_cu=str(record.get("gio_vao")) if record.get("gio_vao") else None,
            gio_vao_moi=str(gio_vao_moi) if gio_vao_moi else None,
            gio_ra_cu=str(record.get("gio_ra")) if record.get("gio_ra") else None,
            gio_ra_moi=str(fields.get("gio_ra")) if fields.get("gio_ra") else None,
            ly_do=fields.get("ghi_chu") or "Quản lý điều chỉnh giờ check-in",
        )
        db.commit()

    return updated
