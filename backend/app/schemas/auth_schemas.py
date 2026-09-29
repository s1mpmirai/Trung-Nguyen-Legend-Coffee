from pydantic import BaseModel, Field

class request_dang_nhap(BaseModel):
    ma_nv: str = Field(..., description="Mã nhân viên")
    mat_khau: str = Field(..., description="Mật khẩu")