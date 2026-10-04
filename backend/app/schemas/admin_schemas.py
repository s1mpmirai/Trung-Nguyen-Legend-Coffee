from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DepartmentStatItem(BaseModel):
    ma_pb: str
    ten_pb: str
    so_luong_nv: int


class RoleDistributionItem(BaseModel):
    ma_vai_tro: str
    ten_vai_tro: str
    so_tai_khoan: int


class ExpiringContractItem(BaseModel):
    ma_hd: str
    ma_nv: str
    ho_ten: str
    ten_pb: Optional[str] = None
    loai_hd: str
    ngay_ket_thuc: str
    so_ngay_con_lai: int


class AdminDashboardStatsResponse(BaseModel):
    # Tổng quan số lượng
    tong_nhan_su: int = Field(0, description="Tổng số nhân sự")
    nhan_su_dang_lam: int = Field(0, description="Nhân sự đang làm việc")
    nhan_su_nghi_viec: int = Field(0, description="Nhân sự đã nghỉ việc")
    nhan_su_thu_viec: int = Field(0, description="Nhân sự đang thử việc")
    tong_phong_ban: int = Field(0, description="Tổng số phòng ban")
    tong_chuc_vu: int = Field(0, description="Tổng số chức vụ")
    tong_tai_khoan: int = Field(0, description="Tổng số tài khoản đã cấp")
    tai_khoan_hoat_dong: int = Field(0, description="Số tài khoản đang hoạt động")
    tai_khoan_khoa: int = Field(0, description="Số tài khoản bị khóa")
    nhan_su_chua_co_tai_khoan: int = Field(0, description="Nhân sự chưa được cấp tài khoản")
    
    # Kho & Nhà cung cấp
    tong_nha_cung_cap: int = Field(0, description="Tổng số nhà cung cấp")
    ncc_dang_hop_tac: int = Field(0, description="Số NCC đang hợp tác")
    tong_san_pham: int = Field(0, description="Tổng số mặt hàng sản phẩm")
    san_pham_dang_ban: int = Field(0, description="Sản phẩm đang kinh doanh")
    tong_so_luong_ton_kho: int = Field(0, description="Tổng số lượng tồn kho")
    tong_gia_tri_kho: float = Field(0.0, description="Tổng giá trị vốn tồn kho (VNĐ)")
    san_pham_canh_bao_ton_it: int = Field(0, description="Số sản phẩm tồn kho < 500")

    # Hợp đồng & Cảnh báo
    tong_hop_dong: int = Field(0, description="Tổng số hợp đồng")
    hop_dong_hieu_luc: int = Field(0, description="Số hợp đồng đang hiệu lực")
    hop_dong_sap_het_han_30_ngay: int = Field(0, description="Số hợp đồng sắp hết hạn trong 30 ngày")

    # Phân bố theo phòng ban & vai trò
    phan_bo_phong_ban: list[DepartmentStatItem] = []
    phan_bo_vai_tro: list[RoleDistributionItem] = []
    danh_sach_hd_sap_het_han: list[ExpiringContractItem] = []
    
    thoi_gian_cap_nhat: Optional[datetime] = None
