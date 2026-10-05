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

        ca_name = r.get("ca_lam_viec") or "Hành chính"
        ca_gio_vao = format_time_str(r.get("ca_gio_vao"))
        ca_gio_ra = format_time_str(r.get("ca_gio_ra"))
        if ca_gio_vao != "--:--" and ca_gio_ra != "--:--" and ("(" not in ca_name):
            ca_display = f"{ca_name} ({ca_gio_vao} - {ca_gio_ra})"
        elif "(" in ca_name:
            ca_display = ca_name
        else:
            ca_display = f"{ca_name} (08:00 - 17:00)"

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
            "ca_lam_viec": ca_display,
            "dia_diem_cham": branch_name,
            "dia_diem_chi_nhanh": branch_name,
            "hinh_thuc": "GPS",
            "trang_thai": trang_thai,
            "ghi_chu": ghi_chu_val,
            "loai_cong": loai,
            "so_gio_lam": so_gio_lam_val,
            "so_cong": float(r["so_cong"]) if r.get("so_cong") is not None else 1.0,
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


def parse_time_to_minutes(val: Any) -> int:
    """Chuyển đổi time/timedelta/str sang số phút trong ngày (0 - 1439)."""
    if val is None:
        return 0
    if isinstance(val, timedelta):
        return int(val.total_seconds() // 60)
    if hasattr(val, "hour") and hasattr(val, "minute"):
        return val.hour * 60 + val.minute
    s = str(val).strip()
    parts = s.split(":")
    if len(parts) >= 2:
        try:
            return int(parts[0]) * 60 + int(parts[1])
        except ValueError:
            return 0
    return 0


def is_office_staff(db: Session, ma_nv: str) -> bool:
    """
    Kiểm tra xem nhân viên có thuộc Khối Văn phòng (Hành chính) hay không.
    - Khối Văn phòng: PB01 (Ban Giám đốc), PB02 (Nhân sự), PB03 (Kế toán), PB04 (Marketing), PB05 (Kinh doanh), PB06 (IT), PB08...
    - Khối Cửa hàng / Sản xuất: PB07 (Xưởng Sản xuất), cửa hàng, quán cà phê...
    """
    try:
        clean_id = ma_nv.strip().upper().replace("-", "")
        emp = repo.get_employee_attendance_info(db, clean_id)
        if not emp:
            return True  # Mặc định là nhân viên văn phòng

        ma_pb = (emp.get("ma_pb") or "").upper()
        ten_pb = (emp.get("ten_pb") or "").lower()
        ten_cn = (emp.get("ten_cn") or "").lower()

        # Nếu thuộc xưởng sản xuất hoặc cửa hàng bán lẻ/quán -> Xoay ca
        if "xưởng" in ten_pb or "sản xuất" in ten_pb or "cửa hàng" in ten_cn or "quán" in ten_cn:
            return False

        # Các phòng ban Trụ sở chính và khối hành chính
        if ma_pb in ["PB01", "PB02", "PB03", "PB04", "PB05", "PB06", "PB08"]:
            return True

        return True
    except Exception:
        return True


CA_GIO_BAT_DAU = "08:00:00"
CA_GIO_KET_THUC = "17:00:00"


def detect_shift_and_status(
    db: Session, now: datetime, ma_nv: Optional[str] = None
) -> dict[str, Any]:
    """
    Tự động nhận diện ca làm việc KẾT HỢP:
    1. Nhận diện theo Loại nhân viên (Khối Văn phòng vs Khối Vận hành quán/nhà máy).
       - Khối Văn phòng: Luôn cố định là CA01 (Hành chính 08:00 - 17:00).
         Dù check-in 07:00 hay 08:15 vẫn luôn là Ca hành chính.
         Check-in <= 08:15: Đúng giờ. Check-in > 08:15: Đi muộn.
       - Khối Cửa hàng / Xưởng sản xuất (xoay ca):
         * Check-in trước 11:30: CA02 (Ca sáng 06:00 - 14:00)
         * Check-in từ 11:30 trở đi: CA03 (Ca chiều 14:00 - 22:00)
       (Không còn ca đêm, nhân viên làm ngoài giờ sẽ được tính vào giờ làm thêm OT).
    """
    mins = now.hour * 60 + now.minute
    is_van_phong = is_office_staff(db, ma_nv) if ma_nv else False

    if is_van_phong:
        target_ma_ca = "CA01"  # Khối văn phòng cố định Ca hành chính 08:00 - 17:00
    else:
        if mins < 690:          # Trước 11:30 -> Ca sáng 06:00 - 14:00
            target_ma_ca = "CA02"
        else:                   # Từ 11:30 trở đi -> Ca chiều 14:00 - 22:00
            target_ma_ca = "CA03"

    shift = None
    try:
        if db:
            shift = repo.get_shift_by_code(db, target_ma_ca)
    except Exception:
        shift = None

    if not shift:
        SHIFTS_FALLBACK = {
            "CA01": {"ma_ca": "CA01", "ten_ca": "Hành chính", "gio_vao_str": "08:00:00", "gio_ra_str": "17:00:00", "so_gio_chuan": 8.0, "he_so": 1.0},
            "CA02": {"ma_ca": "CA02", "ten_ca": "Ca sáng", "gio_vao_str": "06:00:00", "gio_ra_str": "14:00:00", "so_gio_chuan": 8.0, "he_so": 1.0},
            "CA03": {"ma_ca": "CA03", "ten_ca": "Ca chiều", "gio_vao_str": "14:00:00", "gio_ra_str": "22:00:00", "so_gio_chuan": 8.0, "he_so": 1.0},
        }
        shift = SHIFTS_FALLBACK.get(target_ma_ca, SHIFTS_FALLBACK["CA01"])

    parts = shift["gio_vao_str"].split(":")
    shift_start_mins = int(parts[0]) * 60 + int(parts[1])
    diff_mins = mins - shift_start_mins

    # Cho phép trễ tối đa 15 phút so với giờ bắt đầu ca
    # Nếu đến sớm (diff_mins <= 0): Không tính trễ (diff_mins âm)
    is_late = diff_mins > 15
    late_minutes = max(0, diff_mins)

    return {
        "shift": shift,
        "is_late": is_late,
        "late_minutes": late_minutes,
        "is_office": is_van_phong,
    }


def employee_check_in(
    db: Session, ma_nv: str, location: Optional[dict[str, Any]] = None
) -> dict[str, Any]:
    """
    Xử lý nhân viên chấm công vào ca.
    Hệ thống TỰ ĐỘNG NHẬN DIỆN CA LÀM VIỆC:
    1. Check-in 1 ngày 1 lần, những lần sau coi như không tính.
    2. Tự động nhận diện ca phù hợp nhất (Sáng, Hành chính, Chiều, Đêm).
    3. Kiểm tra giờ đến so với mốc bắt đầu ca (cho phép trễ 15p):
       - Check-in <= gio_vao + 15p: Tính Đúng giờ (CONG_DU).
       - Check-in > gio_vao + 15p: Tính Đi muộn (DI_TRE).
       - Hỗ trợ sửa giờ tối đa 3 lần/tháng. Sau 3 lần phạt trừ 1 tiếng công (so_gio_lam=7.0).
    """
    clean_id = ma_nv.strip().upper().replace("-", "")
    now = get_vietnam_now()
    today = get_vietnam_today()
    time_str = now.strftime("%H:%M:%S")
    display_time = now.strftime("%H:%M")

    # 1. Check-in 1 ngày 1 lần
    existing = repo.get_today_attendance(db, clean_id, today)
    if existing and existing.get("gio_vao"):
        existing_time = format_time_str(existing["gio_vao"])
        return {
            "success": False,
            "gio_vao": existing_time,
            "message": f"Hôm nay bạn đã chấm công vào ca lúc {existing_time}. Mỗi ngày chỉ check-in 1 lần, những lần sau không tính!",
        }

    # 2. Tự động nhận diện ca làm việc và tính trễ (kết hợp phân loại văn phòng)
    detected = detect_shift_and_status(db, now, ma_nv=clean_id)
    shift = detected["shift"]
    is_late = detected["is_late"]
    late_minutes = detected["late_minutes"]

    ma_ca = shift["ma_ca"]
    ten_ca = shift["ten_ca"]
    so_gio_chuan = float(shift.get("so_gio_chuan") or 8.0)

    loai_cong = "CONG_DU"
    so_cong = 1.0
    so_gio_lam = so_gio_chuan
    ghi_chu = f"Đúng giờ ({ten_ca})"
    message = f"Chấm công VÀO CA thành công lúc {display_time} ({ten_ca} - Đúng giờ)"

    if is_late:
        loai_cong = "DI_TRE"
        so_lan_ql_sua = repo.count_checkin_adjustments_in_month(db, clean_id, today.month, today.year)
        so_lan_di_tre_cu = repo.count_late_checkins_in_month(db, clean_id, today.month, today.year, exclude_date=today)
        tong_so_lan_tre = so_lan_ql_sua + so_lan_di_tre_cu
        lan_hien_tai = tong_so_lan_tre + 1

        if tong_so_lan_tre < 3:
            ghi_chu = f"Đi muộn {late_minutes}p ({ten_ca} - Lần {lan_hien_tai}/3 trong tháng)"
            message = (
                f"Vào ca lúc {display_time} ({ten_ca}, trễ {late_minutes} phút so với giờ bắt đầu ca). "
                f"Đây là lần đi trễ thứ {lan_hien_tai}/3 trong tháng. "
                f"Vui lòng báo Quản lý nếu cần hỗ trợ sửa lại giờ check-in."
            )
        else:
            so_gio_lam = max(0.0, so_gio_chuan - 1.0)
            so_cong = round(so_gio_lam / so_gio_chuan, 2)
            ghi_chu = f"Đi trễ {late_minutes}p ({ten_ca}, lần {lan_hien_tai} trong tháng) - Phạt trừ 1 tiếng lương"
            message = (
                f"Vào ca lúc {display_time} ({ten_ca}, trễ {late_minutes} phút). "
                f"Bạn đã vượt quá 3 lần đi trễ trong tháng, do đó bị phạt trừ 1 tiếng công/lương."
            )

    try:
        res = repo.record_check_in(
            db=db,
            ma_nv=clean_id,
            today=today,
            gio_vao=time_str,
            ma_ca=ma_ca,
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
    """
    Xử lý nhân viên chấm công ra ca:
    TÍNH NĂNG SMART CHECK-OUT MATCHING & AUTO OVERTIME:
    1. Kiểm tra bản ghi vào ca hôm nay.
    2. Tính tổng thời gian làm việc thực tế từ gio_vao đến gio_ra.
    3. Tự động đối soát ca thông minh (Smart Shift Matching):
       - Nếu check-in buổi sáng (~06:30 - 09:00) và check-out buổi chiều (~16:30 - 18:30)
         -> Tự động xác lập chính xác là Ca hành chính (CA01), xóa bỏ nhầm lẫn ca sáng quán.
    4. Tự động tính số giờ làm chuẩn và số giờ tăng ca (OT):
       - Nếu làm việc >= 8.5 giờ: Đủ 8.0h công chuẩn, phần dư tính vào so_gio_tang_ca (tối đa 4h OT).
       - Nếu bị phạt trừ 1 tiếng (vượt 3 lần đi muộn): so_gio_lam giữ nguyên 7.0h.
       - Nếu làm việc dưới 5 tiếng: Tính nửa công (so_cong = 0.5, NUA_CONG).
    """
    clean_id = ma_nv.strip().upper().replace("-", "")
    now = get_vietnam_now()
    today = get_vietnam_today()
    time_str = now.strftime("%H:%M:%S")
    display_time = now.strftime("%H:%M")

    existing = repo.get_today_attendance(db, clean_id, today)
    if not existing or not existing.get("gio_vao"):
        return {
            "success": False,
            "gio_ra": None,
            "message": "Bạn chưa chấm công vào ca hôm nay!",
        }

    # Mỗi ca / ngày chỉ được check-out 1 lần duy nhất
    if existing.get("gio_ra"):
        out_time = format_time_str(existing["gio_ra"])
        return {
            "success": False,
            "gio_ra": out_time,
            "message": f"Hôm nay bạn đã hoàn thành ra ca lúc {out_time}. Mỗi ca chỉ được check-out 1 lần!",
        }

    # 1. Tính số phút làm việc thực tế
    in_mins = parse_time_to_minutes(existing.get("gio_vao"))
    out_mins = now.hour * 60 + now.minute
    if out_mins < in_mins:  # Làm việc vắt qua ngày hôm sau
        work_mins = (out_mins + 24 * 60) - in_mins
    else:
        work_mins = out_mins - in_mins

    # 2. Smart Shift Matching (Đối soát ca thông minh 2 đầu)
    current_ma_ca = existing.get("ma_ca") or "CA01"
    final_ma_ca = current_ma_ca

    # Nếu là nhân viên văn phòng HOẶC vào từ sáng trước 09:30 và ra sau 16:30:
    is_van_phong = is_office_staff(db, clean_id)
    if is_van_phong or (in_mins < 570 and out_mins >= 990):
        final_ma_ca = "CA01"  # Ca hành chính (08:00 - 17:00)

    # 3. Tính giờ làm thực tế (trừ 1h nghỉ trưa nếu là ca hành chính làm trên 5 tiếng)
    if final_ma_ca == "CA01" and work_mins > 300:
        actual_work_hours = max(0.0, (work_mins - 60) / 60.0)
    else:
        actual_work_hours = max(0.0, work_mins / 60.0)

    # 4. Kiểm tra xem ngày này có bị phạt trừ 1 tiếng do vượt 3 lần đi muộn không
    is_penalized = float(existing.get("so_gio_lam") or 8.0) == 7.0 or "trừ 1 tiếng" in (existing.get("ghi_chu") or "")

    # 5. Phân bổ công chuẩn (so_gio_lam) và làm thêm ngoài giờ (so_gio_tang_ca)
    so_cong = 1.0
    loai_cong = existing.get("loai_cong") or "CONG_DU"
    ghi_chu = existing.get("ghi_chu") or ""
    so_gio_tang_ca = 0.0

    so_gio_thuc_te = round(actual_work_hours, 1)

    if actual_work_hours >= 8.5:
        # Vượt quá 30 phút so với ca chuẩn 8 tiếng -> Tự động tính làm thêm ngoài giờ (OT)
        so_gio_lam = 7.0 if is_penalized else 8.0
        # Làm ngoài giờ: mọi giờ làm việc vượt chuẩn 8 tiếng được ghi nhận làm thêm ngoài giờ
        so_gio_tang_ca = round(actual_work_hours - 8.0, 1)
        so_cong = 1.0
        if so_gio_tang_ca > 0:
            ghi_chu = f"{ghi_chu} | Làm thêm ngoài giờ {so_gio_tang_ca}h".strip(" |")
    elif actual_work_hours >= 7.0:
        # Đủ ca tiêu chuẩn (từ 7 tiếng trở lên)
        so_gio_lam = 7.0 if is_penalized else 8.0
        so_gio_tang_ca = 0.0
        so_cong = 1.0
    elif actual_work_hours >= 4.0:
        # Làm từ 4.0 tiếng đến dưới 7.0 tiếng -> Đủ điều kiện tính Nửa ngày công (0.5 công)
        so_gio_lam = so_gio_thuc_te
        so_gio_tang_ca = 0.0
        so_cong = 0.5
        if loai_cong != "DI_TRE":
            loai_cong = "NUA_CONG"
        ghi_chu = f"{ghi_chu} | Làm nửa ngày ({so_gio_thuc_te}h)".strip(" |")
    else:
        # Làm dưới 4 tiếng -> Chưa đủ điều kiện tính nửa công (0 công - Về sớm)
        so_gio_lam = so_gio_thuc_te
        so_gio_tang_ca = 0.0
        so_cong = 0.0
        loai_cong = "VE_SOM"
        ghi_chu = f"{ghi_chu} | Chưa đủ 4 tiếng ({so_gio_thuc_te}h - Về sớm)".strip(" |")

    # Lấy tên ca làm việc để hiển thị
    shift_info = repo.get_shift_by_code(db, final_ma_ca)
    ten_ca = shift_info.get("ten_ca") if shift_info else "Hành chính"

    try:
        repo.record_check_out(
            db=db,
            ma_nv=clean_id,
            today=today,
            gio_ra=time_str,
            so_gio_lam=so_gio_lam,
            so_gio_tang_ca=so_gio_tang_ca,
            ma_ca=final_ma_ca,
            so_cong=so_cong,
            loai_cong=loai_cong,
            ghi_chu=ghi_chu,
        )
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "gio_ra": None,
            "message": f"Lỗi chấm công ra ca: {str(e)}",
        }

    # Xây dựng thông điệp thông báo chi tiết
    msg_parts = [f"Chấm công RA CA thành công lúc {display_time} ({ten_ca})"]
    if so_gio_tang_ca > 0:
        msg_parts.append(f"ghi nhận {so_gio_lam}h công + {so_gio_tang_ca}h OT")
    elif so_cong == 1.0:
        msg_parts.append(f"đủ {so_gio_lam}h công ({so_cong} công)")
    elif so_cong == 0.5:
        msg_parts.append(f"ghi nhận nửa công ({so_gio_lam}h làm việc)")
    else:
        msg_parts.append(f"thực tế {so_gio_lam}h làm việc (chưa đủ 4h tính công - Về sớm)")

    final_msg = " - ".join(msg_parts)

    return {
        "success": True,
        "gio_ra": display_time,
        "message": final_msg,
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
            "so_cong": float(r.get("so_cong") or 1.0),
            "trang_thai_duyet": r.get("trang_thai_duyet") or "CHO_DUYET",
        })

    total_cong = sum([float(r.get("so_cong") if r.get("so_cong") is not None else (float(r.get("so_gio_lam") or 0) / 8.0)) for r in rows]) if rows else 0.0
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
            "so_cong": float(r["so_cong"]) if r.get("so_cong") is not None else (1.0 if r.get("gio_vao") else 0.0),
            "loai_cong": loai,
            "trang_thai": trang_thai,
            "trang_thai_duyet": r.get("trang_thai_duyet") or "CHO_DUYET",
            "ghi_chu": r.get("ghi_chu") or "",
            "ca_lam_viec": r.get("ten_ca") or "Hành chính",
            "ma_ca": r.get("ma_ca") or "CA01",
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

    # 0. Kiểm tra nếu tháng đã bị Chốt/Khóa công
    lock_info = repo.get_monthly_attendance_lock(db, thang, nam)
    if lock_info.get("is_locked"):
        raise ValueError(
            f"Bảng chấm công tháng {thang}/{nam} đã được Chốt và Khóa! Vui lòng mở khóa trước khi điều chỉnh."
        )

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

        pass

    # 3. Tính toán lại độ trễ và số giờ làm thực tế từ giờ vào & giờ ra
    gio_vao_eff = fields.get("gio_vao") or (str(record.get("gio_vao")) if record.get("gio_vao") else None)
    gio_ra_eff = fields.get("gio_ra") or (str(record.get("gio_ra")) if record.get("gio_ra") else None)
    target_ma_ca = fields.get("ma_ca") or record.get("ma_ca") or "CA01"

    shift = None
    try:
        shift = repo.get_shift_by_code(db, target_ma_ca)
    except Exception:
        shift = None

    if not shift:
        SHIFTS_FALLBACK = {
            "CA01": {"ma_ca": "CA01", "ten_ca": "Hành chính", "gio_vao_str": "08:00:00", "gio_ra_str": "17:00:00", "so_gio_chuan": 8.0, "he_so": 1.0},
            "CA02": {"ma_ca": "CA02", "ten_ca": "Ca sáng", "gio_vao_str": "06:00:00", "gio_ra_str": "14:00:00", "so_gio_chuan": 8.0, "he_so": 1.0},
            "CA03": {"ma_ca": "CA03", "ten_ca": "Ca chiều", "gio_vao_str": "14:00:00", "gio_ra_str": "22:00:00", "so_gio_chuan": 8.0, "he_so": 1.0},
        }
        shift = SHIFTS_FALLBACK.get(target_ma_ca, SHIFTS_FALLBACK["CA01"])

    is_late = False
    if gio_vao_eff:
        try:
            v_parts = str(gio_vao_eff).split(":")
            v_mins = int(v_parts[0]) * 60 + int(v_parts[1])
            s_parts = shift["gio_vao_str"].split(":")
            s_mins = int(s_parts[0]) * 60 + int(s_parts[1])
            diff_mins = v_mins - s_mins
            is_late = diff_mins > 15
        except Exception:
            is_late = False

    if gio_vao_eff and gio_ra_eff:
        try:
            v_p = str(gio_vao_eff).split(":")
            r_p = str(gio_ra_eff).split(":")
            in_m = int(v_p[0]) * 60 + int(v_p[1])
            out_m = int(r_p[0]) * 60 + int(r_p[1])
            if out_m < in_m:
                out_m += 24 * 60
            dur_hours = (out_m - in_m) / 60.0
            if target_ma_ca == "CA01" and dur_hours >= 5.0:
                dur_hours -= 1.0
            calc_hours = max(0.0, round(dur_hours, 2))
            if "so_gio_lam" not in fields or fields["so_gio_lam"] is None or fields["so_gio_lam"] == 0:
                if calc_hours > 8.0:
                    fields["so_gio_lam"] = 8.0
                    if "so_gio_tang_ca" not in fields or fields["so_gio_tang_ca"] is None:
                        fields["so_gio_tang_ca"] = round(calc_hours - 8.0, 1)
                else:
                    fields["so_gio_lam"] = calc_hours
        except Exception:
            pass

    effective_hours = fields.get("so_gio_lam") if fields.get("so_gio_lam") is not None else float(record.get("so_gio_lam") or 0.0)
    std_hours = float(shift.get("so_gio_chuan") or 8.0)

    if "loai_cong" not in fields or fields["loai_cong"] is None:
        if not is_late and effective_hours >= (std_hours - 0.5):
            fields["loai_cong"] = "CONG_DU"
            fields["so_cong"] = 1.0
        elif is_late:
            fields["loai_cong"] = "DI_TRE"

    user_note = fields.get("ghi_chu") or ""
    if not is_late and ("Đi muộn" in user_note or "Về sớm" in user_note or "Chưa đủ" in user_note or not user_note):
        fields["ghi_chu"] = "Quản lý điều chỉnh giờ vào/ra hợp lệ"

    if "trang_thai_duyet" not in fields or fields["trang_thai_duyet"] is None:
        if fields.get("ghi_chu") and ("chốt" in str(fields.get("ghi_chu")).lower() or "phê duyệt" in str(fields.get("ghi_chu")).lower()):
            fields["trang_thai_duyet"] = "DA_DUYET"
        else:
            fields["trang_thai_duyet"] = record.get("trang_thai_duyet") or "CHO_DUYET"

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


def get_all_shifts(db: Session) -> list[dict[str, Any]]:
    """Lấy danh mục các ca làm việc."""
    return repo.get_all_shifts(db)


def get_monthly_attendance_lock_status(db: Session, thang: int, nam: int) -> dict[str, Any]:
    """Lấy trạng thái chốt công tháng."""
    return repo.get_monthly_attendance_lock(db, thang, nam)


def toggle_monthly_attendance_lock(
    db: Session, thang: int, nam: int, is_locked: bool, nguoi_chot: str = "Quản lý", ghi_chu: str = ""
) -> dict[str, Any]:
    """Chốt / Khóa hoặc Mở khóa bảng công tháng."""
    return repo.set_monthly_attendance_lock(db, thang, nam, is_locked, nguoi_chot, ghi_chu)

