from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class ContractBase(BaseModel):
    ma_hd: Optional[str] = Field(None, description="Mã hợp đồng (tự sinh HD-xxx nếu bỏ trống)")
    ma_nv: str = Field(..., description="Mã nhân viên được ký HĐ")
    loai_hd: str = Field(..., description="THU_VIEC, XAC_DINH_1_NAM, XAC_DINH_3_NAM, KHONG_XAC_DINH, THOI_VU")
    ngay_ky: date = Field(..., description="Ngày ký hợp đồng")
    ngay_bat_dau: date = Field(..., description="Ngày bắt đầu hiệu lực (ngày vào làm)")
    ngay_ket_thuc: Optional[date] = Field(None, description="Ngày kết thúc (để trống nếu KHONG_XAC_DINH)")
    luong_co_ban: float = Field(..., gt=0, description="Mức lương cơ bản thỏa thuận (VNĐ)")
    ty_le_huong: float = Field(100.0, ge=50, le=100, description="Tỷ lệ hưởng lương (85% thử việc, 100% chính thức)")
    so_tai_khoan: Optional[str] = Field(None, description="Số tài khoản ngân hàng nhận lương")
    ngan_hang: Optional[str] = Field(None, description="Tên ngân hàng")
    ma_so_thue: Optional[str] = Field(None, description="Mã số thuế cá nhân")
    so_bhxh: Optional[str] = Field(None, description="Số sổ BHXH")
    trang_thai: str = Field("HIEU_LUC", description="HIEU_LUC, HET_HAN, DA_THANH_LY, TAM_HOAN")


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    loai_hd: Optional[str] = None
    ngay_ky: Optional[date] = None
    ngay_bat_dau: Optional[date] = None
    ngay_ket_thuc: Optional[date] = None
    luong_co_ban: Optional[float] = None
    ty_le_huong: Optional[float] = None
    so_tai_khoan: Optional[str] = None
    ngan_hang: Optional[str] = None
    ma_so_thue: Optional[str] = None
    so_bhxh: Optional[str] = None
    trang_thai: Optional[str] = None


class ContractResponse(ContractBase):
    ho_ten: Optional[str] = None
    ten_pb: Optional[str] = None
    ten_cv: Optional[str] = None
    cccd: Optional[str] = None
    sdt: Optional[str] = None
    email: Optional[str] = None
    con_lai_ngay: Optional[int] = None
    ngay_tao: Optional[datetime] = None
    ngay_cap_nhat: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContractListResponse(BaseModel):
    total: int
    items: list[ContractResponse]
    so_hieu_luc: Optional[int] = 0
    so_sap_het_han_30_ngay: Optional[int] = 0
    so_da_thanh_ly: Optional[int] = 0
