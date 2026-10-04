from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class SupplierBase(BaseModel):
    ma_ncc: Optional[str] = Field(None, description="Mã nhà cung cấp (tự sinh NCCxx nếu bỏ trống)")
    ten_ncc: str = Field(..., description="Tên công ty / nhà cung cấp")
    dia_chi: Optional[str] = Field(None, description="Địa chỉ")
    tinh_thanh: Optional[str] = Field(None, description="Tỉnh / Thành phố")
    sdt: Optional[str] = Field(None, description="Số điện thoại liên hệ")
    email: Optional[EmailStr] = Field(None, description="Email liên hệ")
    nguoi_lien_he: Optional[str] = Field(None, description="Họ tên người liên hệ")
    loai_hang: Optional[str] = Field(None, description="Loại mặt hàng cung cấp (cà phê nhân, bao bì, máy móc...)")
    ma_nv_phu_trach: Optional[str] = Field(None, description="Mã nhân viên phụ trách hợp đồng/nhập hàng")
    trang_thai: int = Field(1, description="1: Đang hợp tác, 0: Ngừng hợp tác")


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    ten_ncc: Optional[str] = None
    dia_chi: Optional[str] = None
    tinh_thanh: Optional[str] = None
    sdt: Optional[str] = None
    email: Optional[EmailStr] = None
    nguoi_lien_he: Optional[str] = None
    loai_hang: Optional[str] = None
    ma_nv_phu_trach: Optional[str] = None
    trang_thai: Optional[int] = None


class SupplierResponse(SupplierBase):
    ten_nv_phu_trach: Optional[str] = None
    so_san_pham_cung_cap: Optional[int] = 0
    ngay_tao: Optional[datetime] = None
    ngay_cap_nhat: Optional[datetime] = None

    class Config:
        from_attributes = True


class SupplierListResponse(BaseModel):
    total: int
    items: list[SupplierResponse]
