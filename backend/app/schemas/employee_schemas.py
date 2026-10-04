from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class employee_profile(BaseModel):
    """Schema thông tin nhân viên cơ sở (bảng nhan_vien)."""
    ma_nv: str = Field(..., description="Mã nhân viên")
    ho_ten: str = Field(..., description="Họ tên nhân viên")
    ngay_sinh: date = Field(..., description="Ngày sinh")
    gioi_tinh: str = Field("Nam", description="Giới tính: Nam, Nu, Khac")
    cccd: Optional[str] = Field(None, description="Số CCCD/CMND")
    dia_chi: Optional[str] = Field(None, description="Địa chỉ thường trú")
    sdt: Optional[str] = Field(None, description="Số điện thoại liên lạc")
    email: Optional[EmailStr] = Field(None, description="Email công việc")
    so_nguoi_pt: Optional[int] = Field(0, description="Số người phụ thuộc")
    ma_pb: str = Field(..., description="Mã phòng ban")
    ma_cv: str = Field(..., description="Mã chức vụ")
    ma_cn: Optional[str] = Field(None, description="Mã chi nhánh")
    ma_ngl: Optional[str] = Field(None, description="Mã ngạch lương")
    ngay_vao_lam: date = Field(..., description="Ngày vào làm")
    ngay_nghi_viec: Optional[date] = Field(None, description="Ngày nghỉ việc")
    trang_thai: str = Field("DANG_LAM", description="Trạng thái: DANG_LAM, NGHI_PHEP, DA_NGHI_VIEC")
    hinh_thuc_lam_viec: Optional[str] = Field("FULL_TIME", description="Hình thức: FULL_TIME hoặc PART_TIME")
    so_tai_khoan: Optional[str] = Field(None, description="Số tài khoản ngân hàng")
    ngan_hang: Optional[str] = Field(None, description="Tên ngân hàng")
    ma_so_thue: Optional[str] = Field(None, description="Mã số thuế cá nhân")
    so_bhxh: Optional[str] = Field(None, description="Số sổ BHXH")
    ngay_tao: Optional[datetime] = Field(None, description="Ngày tạo bản ghi")
    ngay_cap_nhat: Optional[datetime] = Field(None, description="Ngày cập nhật gần nhất")

    class Config:
        from_attributes = True


class employee_profile_create(employee_profile):
    """Schema tạo mới nhân viên (mã nhân viên được sinh tự động bởi hệ thống)."""
    ma_nv: Optional[str] = Field(None, description="Tự động sinh (bỏ trống khi tạo)")


class employee_profile_response(employee_profile):
    """Schema trả về thông tin cơ bản nhân viên."""
    pass


class employee_list_response(BaseModel):
    """Schema danh sách nhân viên phân trang."""
    total: int = Field(..., description="Tổng số nhân viên")
    items: list[employee_profile_response] = Field(..., description="Danh sách nhân viên")


class employee_detail_response(BaseModel):
    """Schema chi tiết hồ sơ cá nhân đầy đủ (kèm thông tin phòng ban, chức vụ, hợp đồng)."""
    ma_nv: str = Field(..., description="Mã nhân viên")
    ho_ten: str = Field(..., description="Họ và tên")
    ngay_sinh: Optional[date] = None
    gioi_tinh: Optional[str] = None
    cccd: Optional[str] = None
    dia_chi: Optional[str] = None
    sdt: Optional[str] = None
    email: Optional[EmailStr] = None
    so_nguoi_pt: Optional[int] = 0
    ma_pb: Optional[str] = None
    ten_pb: Optional[str] = None
    ma_cv: Optional[str] = None
    ten_cv: Optional[str] = None
    ngay_vao_lam: Optional[date] = None
    ngay_nghi_viec: Optional[date] = None
    trang_thai: Optional[str] = "DANG_LAM"
    so_tai_khoan: Optional[str] = None
    ngan_hang: Optional[str] = None
    ma_so_thue: Optional[str] = None
    so_bhxh: Optional[str] = None
    ma_hd: Optional[str] = None
    loai_hd: Optional[str] = None
    trang_thai_hd: Optional[str] = None
    hinh_thuc_lam_viec: Optional[str] = "FULL_TIME"
    lan_dn_cuoi: Optional[datetime] = None
    ngay_cap_nhat_tk: Optional[datetime] = None

    class Config:
        from_attributes = True


class employee_contact_update(BaseModel):
    """Schema cho nhân viên tự cập nhật thông tin cá nhân & liên hệ."""
    ngay_sinh: Optional[date] = Field(None, description="Ngày sinh")
    gioi_tinh: Optional[str] = Field(None, description="Giới tính: Nam, Nu, Khac")
    sdt: Optional[str] = Field(None, description="Số điện thoại")
    email: Optional[EmailStr] = Field(None, description="Email")
    dia_chi: Optional[str] = Field(None, description="Địa chỉ")
    so_tai_khoan: Optional[str] = Field(None, description="Số tài khoản ngân hàng")
    ngan_hang: Optional[str] = Field(None, description="Tên ngân hàng")
    hinh_thuc_lam_viec: Optional[str] = Field(None, description="Hình thức: FULL_TIME hoặc PART_TIME")
    ma_so_thue: Optional[str] = Field(None, description="Mã số thuế cá nhân")
    so_bhxh: Optional[str] = Field(None, description="Số sổ bảo hiểm xã hội (BHXH)")



class profile_update_request_create(BaseModel):
    """Schema gửi yêu cầu cập nhật hồ sơ cá nhân của nhân viên."""
    thong_tin_moi: dict = Field(..., description="Các thông tin muốn cập nhật")
    ly_do: Optional[str] = Field(None, description="Lý do cập nhật thông tin")


class profile_update_review_request(BaseModel):
    """Schema cho Quản lý phê duyệt/từ chối yêu cầu cập nhật hồ sơ."""
    trang_thai: str = Field(..., description="Trạng thái phê duyệt: DA_DUYET hoặc TU_CHOI")
    nguoi_duyet: Optional[str] = Field(None, description="Mã nhân viên người duyệt")
    y_kien_duyet: Optional[str] = Field(None, description="Ý kiến hoặc lý do duyệt / từ chối")


class profile_update_request_response(BaseModel):
    """Schema trả về thông tin yêu cầu cập nhật hồ sơ cá nhân."""
    ma_yc: int
    ma_nv: str
    ho_ten: Optional[str] = None
    ten_pb: Optional[str] = None
    ten_cv: Optional[str] = None
    thong_tin_cu: Optional[dict] = None
    thong_tin_moi: dict
    ly_do: Optional[str] = None
    trang_thai: str
    nguoi_duyet: Optional[str] = None
    ten_nguoi_duyet: Optional[str] = None
    ngay_duyet: Optional[datetime] = None
    y_kien_duyet: Optional[str] = None
    ngay_tao: Optional[datetime] = None
    ngay_cap_nhat: Optional[datetime] = None

    class Config:
        from_attributes = True


class employee_status_update(BaseModel):
    """Schema cho Quản lý khóa hoặc cập nhật trạng thái nhân viên."""
    trang_thai: str = Field(..., description="Trạng thái: DANG_LAM, DA_NGHI_VIEC, TAM_HOAN_HD, NGHI_PHEP, NGHI_THAI_SAN")
    ngay_nghi_viec: Optional[date] = Field(None, description="Ngày thôi việc (mặc định hôm nay nếu trạng thái là DA_NGHI_VIEC)")
    khoa_tai_khoan: bool = Field(True, description="Tự động khóa tài khoản đăng nhập nếu cho thôi việc hoặc tạm hoãn")
    ly_do: Optional[str] = Field(None, description="Lý do khóa / thay đổi trạng thái nhân sự")


class employee_summary_item(BaseModel):
    """Tóm tắt thông tin nhân sự trong báo cáo."""
    ma_nv: str
    ho_ten: str
    ma_pb: Optional[str] = None
    ten_pb: Optional[str] = None
    ma_cv: Optional[str] = None
    ten_cv: Optional[str] = None
    trang_thai: str
    ngay_vao_lam: Optional[date] = None
    ngay_nghi_viec: Optional[date] = None
    so_ngay_nghi_thang: Optional[float] = 0.0


class employee_monthly_report_response(BaseModel):
    """Báo cáo biến động và tình hình nhân sự theo tháng (đang làm, nghỉ phép, nghỉ việc)."""
    thang: int
    nam: int
    ma_pb: Optional[str] = None
    ten_pb: Optional[str] = None
    tong_nhan_su: int
    so_dang_lam: int
    so_nghi_phep: int
    so_da_nghi_viec: int
    so_moi_vao_lam: int
    ty_le_bien_dong: float = Field(..., description="Tỷ lệ biến động/nghỉ việc (%)")
    danh_sach_dang_lam: list[employee_summary_item]
    danh_sach_nghi_phep: list[employee_summary_item]
    danh_sach_da_nghi_viec: list[employee_summary_item]
    danh_sach_moi_vao_lam: list[employee_summary_item]


