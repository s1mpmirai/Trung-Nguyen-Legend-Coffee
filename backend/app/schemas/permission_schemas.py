from typing import Any, Optional
from pydantic import BaseModel, Field


class PermissionItem(BaseModel):
    """Thông tin chi tiết một quyền chức năng."""
    ma_quyen: str = Field(..., description="Mã quyền (vd: EMPLOYEE_VIEW, LEAVE_APPROVE)")
    ten_quyen: str = Field(..., description="Tên hiển thị quyền")
    nhom_quyen: str = Field(..., description="Nhóm quyền (vd: NHAN_SU, DON_TU, CHAM_CONG, LUONG)")
    mo_ta: Optional[str] = Field(None, description="Mô tả chi tiết quyền")

    class Config:
        from_attributes = True


class RoleItem(BaseModel):
    """Thông tin một vai trò hệ thống kèm danh sách quyền được cấp."""
    ma_vai_tro: str = Field(..., description="Mã vai trò (ADMIN, QUAN_LY, TRUONG_NHOM, NHAN_VIEN)")
    ten_vai_tro: str = Field(..., description="Tên vai trò")
    mo_ta: Optional[str] = Field(None, description="Mô tả vai trò")
    he_thong: bool = Field(False, description="Vai trò hệ thống mặc định")
    permissions: list[str] = Field(default_factory=list, description="Danh sách mã quyền mặc định của vai trò")

    class Config:
        from_attributes = True


class RoleMatrixResponse(BaseModel):
    """Ma trận phân quyền hệ thống (Vai trò x Quyền) và so sánh thăng chức."""
    roles: list[RoleItem]
    permissions: list[PermissionItem]
    matrix: dict[str, list[str]] = Field(..., description="Ánh xạ {ma_vai_tro: [ma_quyen, ...]}")
    comparison_staff_vs_leader: dict[str, Any] = Field(
        ...,
        description="So sánh quyền: Nhân viên (NHAN_VIEN) có quyền gì, và khi lên Trưởng nhóm (TRUONG_NHOM) quyền thay đổi ra sao",
    )


class EmployeePermissionsResponse(BaseModel):
    """Quyền hạn thực tế của một nhân sự cụ thể."""
    ma_nv: str
    ho_ten: str
    ma_pb: Optional[str] = None
    ten_pb: Optional[str] = None
    ma_cv: Optional[str] = None
    ten_cv: Optional[str] = None
    has_account: bool = False
    ma_vai_tro: str
    ten_vai_tro: str
    vai_tro_quyen: list[str] = Field(default_factory=list, description="Quyền thừa hưởng từ vai trò")
    custom_quyen_cap: list[str] = Field(default_factory=list, description="Quyền riêng được cấp thêm")
    custom_quyen_thu_hoi: list[str] = Field(default_factory=list, description="Quyền riêng bị thu hồi")
    effective_permissions: list[str] = Field(
        default_factory=list, description="Toàn bộ danh sách quyền thực tế có hiệu lực"
    )


class AssignRoleRequest(BaseModel):
    """Yêu cầu gán hoặc thăng chức vai trò cho nhân sự."""
    ma_vai_tro: str = Field(..., description="Mã vai trò mới: ADMIN, QUAN_LY, TRUONG_NHOM, NHAN_VIEN")
    ghi_chu: Optional[str] = Field(None, description="Lý do thay đổi vai trò / thăng chức")


class CustomPermissionItem(BaseModel):
    ma_quyen: str = Field(..., description="Mã quyền")
    duoc_cap: bool = Field(True, description="True = Cấp thêm, False = Thu hồi quyền")


class CustomPermissionBatchRequest(BaseModel):
    """Cấp hoặc thu hồi quyền riêng cho tài khoản nhân sự."""
    permissions: list[CustomPermissionItem]
