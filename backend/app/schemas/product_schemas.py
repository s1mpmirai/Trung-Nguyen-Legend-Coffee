from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    ma_sp: Optional[str] = Field(None, description="Mã sản phẩm (tự sinh SPxx nếu bỏ trống)")
    ten_sp: str = Field(..., description="Tên sản phẩm cà phê / vật phẩm")
    loai_sp: str = Field(..., description="Loại sản phẩm (Cà phê hòa tan, Cà phê rang xay, Cà phê hạt, Dụng cụ...)")
    ma_ncc: Optional[str] = Field(None, description="Mã nhà cung cấp")
    ma_nv_quan_ly: Optional[str] = Field(None, description="Mã nhân viên phụ trách quản lý mặt hàng")
    don_vi_tinh: str = Field("Hộp", description="Đơn vị tính (Hộp, Gói, Bịch, Túi, Cái, Lon...)")
    quy_cach: Optional[str] = Field(None, description="Quy cách đóng gói (vd: Hộp 18 gói x 16g)")
    gia_nhap: float = Field(0, ge=0, description="Giá vốn nhập kho (VNĐ)")
    gia_ban: float = Field(0, ge=0, description="Giá niêm yết bán ra (VNĐ)")
    ton_kho: int = Field(0, ge=0, description="Số lượng tồn kho hiện tại")
    mo_ta: Optional[str] = Field(None, description="Mô tả chi tiết sản phẩm")
    trang_thai: int = Field(1, description="1: Đang kinh doanh, 0: Tạm ngưng kinh doanh")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    ten_sp: Optional[str] = None
    loai_sp: Optional[str] = None
    ma_ncc: Optional[str] = None
    ma_nv_quan_ly: Optional[str] = None
    don_vi_tinh: Optional[str] = None
    quy_cach: Optional[str] = None
    gia_nhap: Optional[float] = None
    gia_ban: Optional[float] = None
    ton_kho: Optional[int] = None
    mo_ta: Optional[str] = None
    trang_thai: Optional[int] = None


class ProductStockUpdate(BaseModel):
    loai_thay_doi: str = Field(..., description="NHAP_KHO, XUAT_KHO, DIEU_CHINH")
    so_luong: int = Field(..., gt=0, description="Số lượng nhập/xuất hoặc số lượng điều chỉnh")
    ghi_chu: Optional[str] = Field(None, description="Lý do nhập kho / xuất kho / kiểm kê")


class ProductResponse(ProductBase):
    ten_ncc: Optional[str] = None
    ten_nv_quan_ly: Optional[str] = None
    ngay_tao: Optional[datetime] = None
    ngay_cap_nhat: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    total: int
    items: list[ProductResponse]
    tong_ton_kho: Optional[int] = 0
    tong_gia_tri_kho: Optional[float] = 0.0
