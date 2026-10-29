"""
Kiểm thử công thức tính lương (không cần CSDL): ngày công, trần BH, giảm trừ gia cảnh,
thuế TNCN lũy tiến, thử việc, không tính làm thêm giờ.
Chạy: cd backend && python -m pytest tests -q
"""
from datetime import date

from app.services.payroll_service import compute_payroll_line, tinh_thue_tncn
from app.utils.work_calendar import count_working_days, standard_workdays


def _emp(**overrides):
    base = {
        "ma_nv": "NV99",
        "luong_hop_dong": 30_000_000,
        "luong_bac": None,
        "ty_le_huong": 100,
        "phu_cap_chuc_vu": 0,
        "so_cong_thuc_te": 22,
        "so_nguoi_pt": 0,
        "he_so_luong": 1,
        "loai_hd": "KHONG_XAC_DINH",
    }
    base.update(overrides)
    return base


def test_bieu_thue_luy_tien_5_bac():
    assert tinh_thue_tncn(0) == 0
    assert tinh_thue_tncn(10_000_000) == 500_000
    assert tinh_thue_tncn(30_000_000) == 2_500_000
    assert tinh_thue_tncn(60_000_000) == 8_500_000
    assert tinh_thue_tncn(100_000_000) == 20_500_000
    assert tinh_thue_tncn(120_000_000) == 27_500_000


def test_giam_tru_gia_canh_ban_than_va_nguoi_phu_thuoc():
    khong_pt = compute_payroll_line(_emp(so_nguoi_pt=0), 22)
    assert khong_pt["giam_tru_gia_canh"] == 15_500_000
    assert khong_pt["thu_nhap_tinh_thue"] == 30_000_000 - 3_150_000 - 15_500_000
    assert khong_pt["thue_tncn"] == 635_000

    hai_pt = compute_payroll_line(_emp(so_nguoi_pt=2), 22)
    assert hai_pt["giam_tru_gia_canh"] == 15_500_000 + 2 * 6_200_000
    assert hai_pt["thu_nhap_tinh_thue"] == 0
    assert hai_pt["thue_tncn"] == 0
    assert hai_pt["luong_net"] == 30_000_000 - 3_150_000


def test_ap_tran_bao_hiem():
    line = compute_payroll_line(_emp(luong_hop_dong=80_000_000, phu_cap_chuc_vu=15_000_000), 22)
    assert line["bhxh"] == 3_744_000  # 8% x 46.800.000
    assert line["bhyt"] == 702_000    # 1,5% x 46.800.000
    assert line["bhtn"] == 950_000    # 95tr < trần 106.200.000


def test_nghi_khong_luong_tru_theo_ngay_cong():
    line = compute_payroll_line(_emp(so_cong_thuc_te=19), 22)
    assert line["luong_theo_cong"] == round(30_000_000 / 22 * 19)


def test_khong_tinh_lam_them_gio():
    line = compute_payroll_line(_emp(so_gio_tang_ca=10), 22)
    assert line["tien_tang_ca"] == 0
    assert line["luong_gross"] == 30_000_000


def test_thu_viec_khong_dong_bh_va_khau_tru_10_phan_tram():
    line = compute_payroll_line(_emp(loai_hd="THU_VIEC", ty_le_huong=85, luong_hop_dong=10_000_000), 22)
    assert line["luong_gross"] == 8_500_000
    assert line["bhxh"] == line["bhyt"] == line["bhtn"] == 0
    assert line["giam_tru_gia_canh"] == 0
    assert line["thue_tncn"] == 850_000


def test_tinh_lai_cho_ket_qua_giong_het():
    assert compute_payroll_line(_emp(so_nguoi_pt=1), 22) == compute_payroll_line(_emp(so_nguoi_pt=1), 22)


def test_ngay_le_khong_tinh_vao_cong_chuan():
    le_quoc_khanh = {date(2026, 9, 1), date(2026, 9, 2)}
    assert standard_workdays(9, 2026) == 22
    assert standard_workdays(9, 2026, le_quoc_khanh) == 20
    # Đơn nghỉ 31/8 - 4/9/2026 chỉ tính 3 ngày làm việc (bỏ 2 ngày lễ)
    assert count_working_days(date(2026, 8, 31), date(2026, 9, 4), le_quoc_khanh) == 3
