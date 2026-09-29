from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
    
class ho_so_nhan_vien(BaseModel):
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
    
class ho_so_nhan_vien_create(ho_so_nhan_vien):
    ma_nv: str = Field(None, description="Tự động sinh")
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

class ho_so_nhan_vien_create_response(ho_so_nhan_vien):
    class Config:
        orm_mode = True

class ho_so_nhan_vien_update(ho_so_nhan_vien):
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
    ngay_cap_nhat: datetime = Field(None, description="Ngày cập nhật")
    
class ho_so_nhan_vien_update_response(ho_so_nhan_vien):
    class Config:
        orm_mode = True
    
class ho_so_nhan_vien_response(ho_so_nhan_vien):
    class Config:
        orm_mode = True
        
class danh_sach_nhan_vien_response(BaseModel):
    total: int = Field(..., description="Tổng số nhân viên")
    items: List[ho_so_nhan_vien_response] = Field(..., description="Danh sách nhân viên")