from dataclasses import Field

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date

class tao_tai_khoan(BaseModel):
    ma_nv: str = Field(..., description="Mã nhân viên")
    mat_khau: str = Field(..., description="Mật khẩu")
    ma_vai_tro: str = Field(..., description="Mã vai trò")
    trang_thai: str = Field(..., description="Trạng thái tài khoản")
    ngay_tao: datetime = Field(None, description="Ngày tạo")
    ngay_cap_nhat: datetime = Field(None, description="Ngày cập nhật")
    
class cap_nhat_tai_khoan(BaseModel):
    mat_khau: Optional[str] = Field(None, description="Mật khẩu")
    ma_vai_tro: Optional[str] = Field(None, description="Mã vai trò")
    trang_thai: Optional[str] = Field(None, description="Trạng thái tài khoản")
    ngay_cap_nhat: Optional[datetime] = Field(None, description="Ngày cập nhật")
    
class nhan_vien(BaseModel):
    ma_nv: str = Field(..., description="Mã nhân viên")
    ho_ten: str = Field(..., description="Họ tên nhân viên")
    ngay_sinh: date = Field(..., description="Ngày sinh")
    gioi_tinh: str = Field(..., description="Giới tính")
    cccd: Optional[str] = Field(None, description="CCCD")
    dia_chi: Optional[str] = Field(None, description="Địa chỉ")
    sdt: Optional[str] = Field(None, description="Số điện thoại")
    email: Optional[EmailStr] = Field(None, description="Email")
    so_nguoi_pt: Optional[int] = Field(0, description="Số người phụ thuộc")
    ma_pb: str = Field(..., description="Mã phòng ban")
    ma_cv: str = Field(..., description="Mã chức vụ")
    ma_cn: Optional[str] = Field(None, description="Mã chuyên ngành")
    ma_ngl: Optional[str] = Field(None, description="Mã ngạch lương")
    ngay_vao_lam: date = Field(..., description="Ngày vào làm")
    ngay_nghi_viec: Optional[date] = Field(None, description="Ngày nghỉ việc")
    trang_thai: str = Field('DANG_LAM', description="Trạng thái nhân viên")
    so_tai_khoan: Optional[str] = Field(None, description="Số tài khoản ngân hàng")
    ngan_hang: Optional[str] = Field(None, description="Ngân hàng")
    ma_so_thue: Optional[str] = Field(None, description="Mã số thuế")
    so_bhxh: Optional[str] = Field(None, description="Số BHXH")
    ngay_tao: datetime = Field(None, description="Ngày tạo")    
    ngay_cap_nhat: datetime = Field(None, description="Ngày cập nhật")