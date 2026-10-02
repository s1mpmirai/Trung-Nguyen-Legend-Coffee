from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
    
class employee_profile(BaseModel):
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
    hinh_thuc_lam_viec: Optional[str] = Field('FULL_TIME', description="Hình thức làm việc: FULL_TIME hoặc PART_TIME")
    so_tai_khoan: Optional[str] = Field(None, description="Số tài khoản ngân hàng")
    ngan_hang: Optional[str] = Field(None, description="Ngân hàng")
    ma_so_thue: Optional[str] = Field(None, description="Mã số thuế")
    so_bhxh: Optional[str] = Field(None, description="Số BHXH")
    ngay_tao: datetime = Field(None, description="Ngày tạo")    
    ngay_cap_nhat: datetime = Field(None, description="Ngày cập nhật")
    
class employee_profile_create(employee_profile):
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

class employee_profile_create_response(employee_profile):
    class Config:
        orm_mode = True

class employee_profile_update(employee_profile):
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
    
class employee_profile_update_response(employee_profile):
    class Config:
        orm_mode = True
    
class employee_profile_response(employee_profile):
    class Config:
        orm_mode = True
        
class employee_list_response(BaseModel):
    total: int = Field(..., description="Tổng số nhân viên")
    items: List[employee_profile_response] = Field(..., description="Danh sách nhân viên")

class employee_detail_response(BaseModel):
    ma_nv: str = Field(..., description="Mã nhân viên")
    ho_ten: str = Field(..., description="Họ và tên")
    ngay_sinh: Optional[date] = None
    gioi_tinh: Optional[str] = None
    cccd: Optional[str] = None
    dia_chi: Optional[str] = None
    sdt: Optional[str] = None
    email: Optional[EmailStr] = None
    so_nguoi_pt: Optional[int] = 0
    ma_pb: Optional[str] = None
    ten_pb: Optional[str] = None
    ma_cv: Optional[str] = None
    ten_cv: Optional[str] = None
    ngay_vao_lam: Optional[date] = None
    ngay_nghi_viec: Optional[date] = None
    trang_thai: Optional[str] = "DANG_LAM"
    so_tai_khoan: Optional[str] = None
    ngan_hang: Optional[str] = None
    ma_so_thue: Optional[str] = None
    so_bhxh: Optional[str] = None
    ma_hd: Optional[str] = None
    loai_hd: Optional[str] = None
    trang_thai_hd: Optional[str] = None
    hinh_thuc_lam_viec: Optional[str] = "FULL_TIME"
    lan_dn_cuoi: Optional[datetime] = None
    ngay_cap_nhat_tk: Optional[datetime] = None

    class Config:
        from_attributes = True

class employee_contact_update(BaseModel):
    ngay_sinh: Optional[date] = Field(None, description="Ngày sinh")
    gioi_tinh: Optional[str] = Field(None, description="Giới tính (Nam, Nu, Khac)")
    sdt: Optional[str] = Field(None, description="Số điện thoại")
    email: Optional[EmailStr] = Field(None, description="Email")
    dia_chi: Optional[str] = Field(None, description="Địa chỉ")
    so_tai_khoan: Optional[str] = Field(None, description="Số tài khoản ngân hàng")
    ngan_hang: Optional[str] = Field(None, description="Tên ngân hàng")