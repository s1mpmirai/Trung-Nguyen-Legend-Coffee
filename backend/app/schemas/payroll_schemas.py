from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class payroll_month_response(BaseModel):
    """Chi tiết bảng lương 1 tháng."""
    ma_bl: int
    thang: int
    nam: int
    ma_nv: str
    ho_ten: Optional[str] = None
    luong_co_ban: float = 0
    he_so_luong: float = 1.0
    so_cong_chuan: float = 26.0
    so_cong_thuc_te: float = 0
    so_gio_tang_ca: float = 0
    luong_theo_cong: float = 0
    tien_tang_ca: float = 0
    tong_phu_cap: float = 0
    tien_thuong: float = 0
    luong_gross: float = 0
    bhxh: float = 0
    bhyt: float = 0
    bhtn: float = 0
    thue_tncn: float = 0
    khau_tru_khac: float = 0
    tong_khau_tru: float = 0
    luong_net: float = 0
    trang_thai: Optional[str] = "NHAP"
    ghi_chu: Optional[str] = None
    ngay_tao: Optional[datetime] = None
    ngay_cap_nhat: Optional[datetime] = None

    class Config:
        from_attributes = True


class payroll_month_item(BaseModel):
    """Một dòng trong danh sách tháng lương."""
    thang: int
    nam: int
    trang_thai: Optional[str] = None
    luong_net: float = 0


class payroll_months_response(BaseModel):
    """Danh sách các tháng đã có bảng lương."""
    items: List[payroll_month_item] = Field(default_factory=list)




class payroll_calculate_request(BaseModel):
    """Yêu cầu tính lương tháng."""
    thang: int = Field(..., ge=1, le=12, description="Tháng (1-12)")
    nam: int = Field(..., ge=2000, description="Năm")


class payroll_status_update(BaseModel):
    """Cập nhật trạng thái duyệt/chi trả bảng lương."""
    trang_thai: str = Field(..., description="Trạng thái: NHAP, DA_DUYET, DA_TRA")


class payroll_summary_item(BaseModel):
    """Một dòng tóm tắt lương nhân viên trong bảng lương tháng toàn công ty."""
    ma_bl: int
    ma_nv: str
    ho_ten: Optional[str] = None
    ten_pb: Optional[str] = None
    ten_cv: Optional[str] = None
    so_cong_thuc_te: float = 0
    luong_gross: float = 0
    tong_khau_tru: float = 0
    luong_net: float = 0
    trang_thai: str = "NHAP"

    class Config:
        from_attributes = True


class payroll_company_summary_response(BaseModel):
    """Bảng lương tháng toàn công ty."""
    thang: int
    nam: int
    tong_nhan_vien: int = 0
    tong_tien_net: float = 0
    items: List[payroll_summary_item] = Field(default_factory=list)


class payroll_year_summary_response(BaseModel):
    """Tổng hợp bảng lương cả năm của nhân viên."""
    ma_nv: str
    ho_ten: Optional[str] = None
    nam: int
    so_thang_co_luong: int = 0
    tong_gross: float = 0
    tong_net: float = 0
    tong_khau_tru: float = 0
    tong_bhxh: float = 0
    tong_bhyt: float = 0
    tong_bhtn: float = 0
    tong_thue_tncn: float = 0
    tong_cong_thuc_te: float = 0
    tong_gio_tang_ca: float = 0
    chi_tiet_thang: List[payroll_month_response] = Field(default_factory=list)

    class Config:
        from_attributes = True


