from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class leave_create(BaseModel):
    """Schema tạo mới đơn xin nghỉ phép."""
    ma_nv: Optional[str] = Field(None, description="Bỏ qua: đơn luôn được tạo cho tài khoản đang đăng nhập")
    loai_don: str = Field(
        ...,
        description="Loại đơn: NGHI_PHEP, NGHI_OM, NGHI_THAI_SAN, NGHI_KHONG_LUONG, NGHI_VIEC, KHAC"
    )
    ngay_bat_dau: date = Field(..., description="Ngày bắt đầu nghỉ")
    ngay_ket_thuc: date = Field(..., description="Ngày kết thúc nghỉ")
    so_ngay: Optional[float] = Field(
        None, gt=0, description="Chỉ dùng để xin nửa ngày (0.5); server tự tính số ngày theo lịch làm việc"
    )
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
    nguoi_duyet: Optional[str] = Field(None, description="Bỏ qua: người duyệt luôn lấy từ tài khoản đang đăng nhập")
    y_kien_duyet: Optional[str] = Field(None, description="Ý kiến phản hồi của quản lý")


class annual_leave_balance_response(BaseModel):
    """Số dư phép năm của nhân viên."""
    ma_nv: str
    nam: int
    tong_phep_nam: float
    da_su_dung: float
    dang_cho_duyet: float
    con_lai: float
    han_dung_phep: str
