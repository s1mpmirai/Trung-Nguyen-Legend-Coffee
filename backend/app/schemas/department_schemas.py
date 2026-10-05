from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ===================== PHÒNG BAN =====================
class DepartmentBase(BaseModel):
    ma_pb: Optional[str] = Field(None, description="Mã phòng ban (vd: PB01, PB02)")
    ten_pb: str = Field(..., description="Tên phòng ban")
    ma_truong_pb: Optional[str] = Field(None, description="Mã nhân viên trưởng phòng")
    sdt: Optional[str] = Field(None, description="Số điện thoại phòng ban")
    mo_ta: Optional[str] = Field(None, description="Mô tả chức năng nhiệm vụ")
    trang_thai: int = Field(1, description="1: Hoạt động, 0: Ngừng hoạt động")


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    ten_pb: Optional[str] = None
    ma_truong_pb: Optional[str] = None
    sdt: Optional[str] = None
    mo_ta: Optional[str] = None
    trang_thai: Optional[int] = None


class DepartmentEmployeeItem(BaseModel):
    ma_nv: str
    ho_ten: str
    ten_cv: Optional[str] = None
    sdt: Optional[str] = None
    email: Optional[str] = None
    trang_thai: Optional[str] = None


class DepartmentResponse(DepartmentBase):
    ten_truong_pb: Optional[str] = None
    so_luong_nv: Optional[int] = 0
    ngay_tao: Optional[datetime] = None
    ngay_cap_nhat: Optional[datetime] = None

    class Config:
        from_attributes = True


class DepartmentDetailResponse(DepartmentResponse):
    danh_sach_nhan_vien: list[DepartmentEmployeeItem] = []


# ===================== CHỨC VỤ & BẬC LƯƠNG =====================
class SalaryScaleItem(BaseModel):
    ma_bac: Optional[int] = None
    ma_cv: str
    bac: int = Field(..., description="Bậc (1, 2, 3...)")
    he_so: float = Field(1.0, description="Hệ số lương")
    muc_luong: float = Field(0, description="Mức lương tham chiếu (VNĐ)")
    mo_ta: Optional[str] = None


class PositionBase(BaseModel):
    ma_cv: Optional[str] = Field(None, description="Mã chức vụ (vd: CV01, CV02)")
    ten_cv: str = Field(..., description="Tên chức vụ")
    cap_bac: int = Field(1, description="1=NV, 2=Tổ trưởng, 3=Phó/Trưởng phòng, 4=Phó GĐ, 5=Ban GĐ")
    phu_cap_chuc_vu: float = Field(0, description="Phụ cấp chức vụ (VNĐ)")
    mo_ta: Optional[str] = Field(None, description="Mô tả công việc chức vụ")


class PositionCreate(PositionBase):
    pass


class PositionUpdate(BaseModel):
    ten_cv: Optional[str] = None
    cap_bac: Optional[int] = None
    phu_cap_chuc_vu: Optional[float] = None
    mo_ta: Optional[str] = None


class PositionResponse(PositionBase):
    so_luong_nv: Optional[int] = 0
    thang_bac_luong: list[SalaryScaleItem] = []
    ngay_tao: Optional[datetime] = None
    ngay_cap_nhat: Optional[datetime] = None

    class Config:
        from_attributes = True
