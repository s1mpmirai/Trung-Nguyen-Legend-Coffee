from pydantic import BaseModel, Field

class request_dang_nhap(BaseModel):
    ma_nv: str = Field(..., description="Mã nhân viên")
    mat_khau: str = Field(..., description="Mật khẩu")

class create_account(BaseModel):
    ma_nv: str = Field(..., description="Mã nhân viên")
    mat_khau: str = Field(..., description="Mật khẩu")
    ma_vai_tro: str = Field(..., description="Mã vai trò")
    trang_thai: str = Field(..., description="Trạng thái")
    ngay_tao: str = Field(..., description="Ngày tạo")