from pydantic import BaseModel, Field
from datetime import datetime

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