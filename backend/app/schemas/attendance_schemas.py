from datetime import date
from typing import Any, Optional

from pydantic import BaseModel, Field


class CheckInRequest(BaseModel):
    """Schema cho yêu cầu chấm công vào / ra."""
    ma_nv: str = Field(..., description="Mã nhân viên (vd: NV01, NV10)")
    location: Optional[dict[str, Any]] = Field(None, description="Tọa độ GPS và địa điểm chấm công")


class CheckInResponse(BaseModel):
    """Kết quả trả về sau khi chấm công."""
    success: bool
    gio_vao: Optional[str] = None
    gio_ra: Optional[str] = None
    message: str


class AttendanceRecord(BaseModel):
    """Chi tiết 1 bản ghi chấm công."""
    ma_cc: int
    ma_nv: Optional[str] = None
    ho_ten: Optional[str] = None
    ten_pb: Optional[str] = None
    ngay_cong: str
    ngay_cong_formatted: Optional[str] = None
    thu_day_du: Optional[str] = None
    thu: Optional[str] = None
    ngay: Optional[str] = None
    gio_vao: Optional[str] = None
    gio_ra: Optional[str] = None
    ca_lam_viec: Optional[str] = "Hành chính"
    dia_diem_cham: Optional[str] = None
    dia_diem_chi_nhanh: Optional[str] = None
    van_phong: Optional[str] = None
    hinh_thuc: Optional[str] = "GPS"
    trang_thai: Optional[str] = "Đúng giờ"
    loai_cong: Optional[str] = "CONG_DU"
    so_gio_lam: Optional[float] = 0.0
    so_gio_tang_ca: Optional[float] = 0.0
    so_cong: Optional[float] = 1.0
    trang_thai_duyet: Optional[str] = "CHO_DUYET"
    ghi_chu: Optional[str] = ""

    class Config:
        from_attributes = True


class AttendanceDashboardResponse(BaseModel):
    """Dữ liệu hiển thị trang Dashboard chấm công cá nhân."""
    employee: dict[str, Any]
    location: dict[str, Any]
    monthlyStats: dict[str, Any]
    recentRecords: list[dict[str, Any]]


class AttendanceHistorySummary(BaseModel):
    so_ngay_cong: float = 0.0
    so_gio_ot: float = 0.0
    so_lan_di_muon: int = 0
    so_ngay_phep: int = 0


class AttendanceHistoryResponse(BaseModel):
    """Lịch sử chấm công cá nhân chi tiết theo tháng/năm."""
    month: int
    year: int
    summary: AttendanceHistorySummary
    records: list[dict[str, Any]]


class AttendanceAdjustRequest(BaseModel):
    """Schema dành cho Quản lý điều chỉnh/chốt công thủ công."""
    ma_ca: Optional[str] = Field(None, description="Mã ca làm việc (CA01, CA02, CA03)")
    gio_vao: Optional[str] = Field(None, description="Giờ vào ca định dạng HH:MM:SS hoặc HH:MM")
    gio_ra: Optional[str] = Field(None, description="Giờ ra ca định dạng HH:MM:SS hoặc HH:MM")
    loai_cong: Optional[str] = Field(None, description="CONG_DU, DI_TRE, VE_SOM, NUA_CONG, NGHI_PHEP...")
    so_cong: Optional[float] = Field(None, description="Hệ số công (1.0, 0.5, 0.0)")
    so_gio_lam: Optional[float] = Field(None, description="Số giờ làm việc")
    so_gio_tang_ca: Optional[float] = Field(None, description="Số giờ làm thêm OT")
    trang_thai_duyet: Optional[str] = Field(None, description="Trạng thái phê duyệt: CHO_DUYET, DA_DUYET, TU_CHOI")
    ghi_chu: Optional[str] = Field(None, description="Lý do điều chỉnh của quản lý")


class AttendanceLockRequest(BaseModel):
    """Yêu cầu Chốt hoặc Mở khóa bảng chấm công tháng."""
    thang: int = Field(..., ge=1, le=12, description="Tháng cần chốt công")
    nam: int = Field(..., ge=2000, description="Năm")
    khoa: bool = Field(True, description="True = Khóa/Chốt, False = Mở khóa")
    ghi_chu: Optional[str] = Field(None, description="Ghi chú khi chốt công")


class AttendanceLockStatusResponse(BaseModel):
    """Trạng thái Chốt/Khóa bảng công tháng."""
    thang: int
    nam: int
    is_locked: bool
    nguoi_chot: Optional[str] = None
    ngay_chot: Optional[str] = None
    ghi_chu: Optional[str] = None

