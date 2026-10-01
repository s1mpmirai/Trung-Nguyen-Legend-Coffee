from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class leave_create(BaseModel):
    """Schema tạo mới đơn xin nghỉ phép."""
    ma_nv: str = Field(..., description="Mã nhân viên nộp đơn")
    loai_don: str = Field(
        ...,
        description="Loại đơn: NGHI_PHEP, NGHI_OM, NGHI_THAI_SAN, NGHI_KHONG_LUONG, NGHI_VIEC, KHAC"
    )
    ngay_bat_dau: date = Field(..., description="Ngày bắt đầu nghỉ")
    ngay_ket_thuc: date = Field(..., description="Ngày kết thúc nghỉ")
    so_ngay: float = Field(..., gt=0, description="Số ngày nghỉ (vd: 1.0, 0.5)")
    ly_do: str = Field(..., min_length=3, max_length=500, description="Lý do xin nghỉ")


class leave_response(BaseModel):
    """Schema chi tiết đơn từ."""
    ma_don: str
    ma_nv: str
    ho_ten: Optional[str] = None
    ten_pb: Optional[str] = None
    loai_don: str
    ngay_bat_dau: date
    ngay_ket_thuc: date
    so_ngay: float
    ly_do: str
    trang_thai: str
    nguoi_duyet: Optional[str] = None
    ten_nguoi_duyet: Optional[str] = None
    ngay_duyet: Optional[datetime] = None
    y_kien_duyet: Optional[str] = None
    ngay_tao: Optional[datetime] = None

    class Config:
        from_attributes = True


class leave_review_request(BaseModel):
    """Schema duyệt hoặc từ chối đơn từ của Quản lý."""
    trang_thai: str = Field(..., description="Trạng thái: DA_DUYET hoặc TU_CHOI")
    nguoi_duyet: str = Field(..., description="Mã quản lý duyệt đơn (vd: NV01, NV02)")
    y_kien_duyet: Optional[str] = Field(None, description="Ý kiến phản hồi của quản lý")
