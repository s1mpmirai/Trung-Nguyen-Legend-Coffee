from datetime import datetime

from pydantic import BaseModel, Field


class request_login(BaseModel):
    ma_nv: str = Field(..., description="Mã nhân viên")
    mat_khau: str = Field(..., description="Mật khẩu")

class account_create(BaseModel):
    ma_nv: str = Field(..., description="Mã nhân viên")
    mat_khau: str = Field(..., description="Mật khẩu")
    ma_vai_tro: str = Field(..., description="Mã vai trò")
    trang_thai: str = Field(..., description="Trạng thái")

class account_update_status(BaseModel):
    trang_thai: str = Field(..., description="Trạng thái mới: HOAT_DONG hoặc KHOA")
# 3. Dữ liệu trả về cho client (Bảo mật: KHÔNG trả về mật khẩu)
class account_response(BaseModel):
    ma_tk: int
    ma_nv: str
    ma_vai_tro: str
    trang_thai: str
    ngay_tao: datetime | None = None
    class Config:
        from_attributes = True

class change_password_request(BaseModel):
    ma_nv: str = Field(..., description="Mã nhân viên")
    mat_khau_cu: str = Field(..., description="Mật khẩu hiện tại")
    mat_khau_moi: str = Field(..., min_length=6, description="Mật khẩu mới (tối thiểu 6 ký tự)")

class employee_without_account_response(BaseModel):
    ma_nv: str = Field(..., description="Mã nhân viên")
    ho_ten: str = Field(..., description="Họ tên")
    email: str | None = None
    sdt: str | None = None
    ten_pb: str | None = None
    ten_cv: str | None = None

    class Config:
        from_attributes = True


class account_admin_update(BaseModel):
    mat_khau_moi: str | None = Field(None, description="Mật khẩu mới nếu muốn đổi (bỏ trống nếu giữ nguyên)")
    ma_vai_tro: str | None = Field(None, description="Vai trò mới (ADMIN, QUAN_LY, TRUONG_NHOM, NHAN_VIEN)")
    trang_thai: str | None = Field(None, description="Trạng thái tài khoản (HOAT_DONG, KHOA)")