from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


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


class payroll_year_summary_response(BaseModel):
    """Tổng hợp lương cả năm."""
    so_thang: int = 0
    tong_gross: float = 0
    tong_khau_tru: float = 0
    tong_net: float = 0
    tong_thuong: float = 0
    tong_phu_cap: float = 0
    tong_bhxh: float = 0
    tong_bhyt: float = 0
    tong_bhtn: float = 0
    tong_thue_tncn: float = 0
