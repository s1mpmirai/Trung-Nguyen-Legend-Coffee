from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.permission_schemas import (
    AssignRoleRequest,
    CustomPermissionBatchRequest,
    EmployeePermissionsResponse,
    PermissionItem,
    RoleItem,
    RoleMatrixResponse,
)
from app.services import permission_service

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get(
    "/roles",
    response_model=list[RoleItem],
    summary="[Phân quyền] Danh sách các vai trò hệ thống kèm quyền mặc định",
)
def get_roles_endpoint(
    db: DbSession,
):
    """
    Lấy danh mục các vai trò trong hệ thống (ADMIN, QUAN_LY, TRUONG_NHOM, NHAN_VIEN)
    kèm danh sách các quyền chức năng mặc định của từng vai trò.
    """
    return permission_service.get_all_roles(db)


@router.get(
    "/all-permissions",
    response_model=list[PermissionItem],
    summary="[Phân quyền] Danh sách tất cả 16 quyền chức năng trong hệ thống",
)
def get_all_permissions_endpoint(
    db: DbSession,
):
    """Lấy danh sách tất cả các quyền chức năng (NHAN_SU, DON_TU, CHAM_CONG, LUONG, KHO, PHAN_QUYEN)."""
    return permission_service.get_all_permissions(db)


@router.get(
    "/matrix",
    response_model=RoleMatrixResponse,
    summary="[Phân quyền] Ma trận phân quyền và so sánh quyền khi nhân viên lên trưởng nhóm",
)
def get_role_matrix_endpoint(
    db: DbSession,
):
    """
    Lấy toàn bộ Ma trận phân quyền (Vai trò x Quyền) phục vụ trực tiếp cho giao diện RolePermissions:
    - Hiển thị chi tiết một Nhân viên (NHAN_VIEN) có quyền gì.
    - So sánh khi nhân viên được thăng chức lên Trưởng nhóm (TRUONG_NHOM) thì quyền thay đổi ra sao
      (được bổ sung thêm quyền xem nhân sự, duyệt đơn nghỉ và quản lý chấm công nhóm).
    """
    return permission_service.get_role_matrix(db)


@router.get(
    "/employee/{ma_nv}",
    response_model=EmployeePermissionsResponse,
    summary="[Phân quyền] Xem quyền hạn thực tế của một nhân sự",
)
def get_employee_permissions_endpoint(
    ma_nv: str,
    db: DbSession,
):
    """
    Kiểm tra chi tiết quyền của một nhân viên cụ thể:
    - Vai trò hiện tại (Nhân viên, Trưởng nhóm, Quản lý, Admin).
    - Các quyền được thừa hưởng từ vai trò.
    - Các quyền tùy chỉnh riêng được cấp thêm hoặc bị thu hồi.
    - Danh sách toàn bộ các quyền thực tế có hiệu lực.
    """
    try:
        return permission_service.get_employee_permissions(db, ma_nv)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.put(
    "/employee/{ma_nv}/role",
    response_model=EmployeePermissionsResponse,
    summary="[Phân quyền] Cấp vai trò / Thăng chức cho nhân sự (vd: lên Trưởng nhóm)",
)
def assign_role_endpoint(
    ma_nv: str,
    data: AssignRoleRequest,
    db: DbSession,
):
    """
    Cấp hoặc thay đổi vai trò hệ thống cho nhân viên:
    - Ví dụ: Thăng chức nhân viên từ 'NHAN_VIEN' lên 'TRUONG_NHOM' hoặc 'QUAN_LY'.
    - Hệ thống tự động kích hoạt quyền tương ứng của vai trò mới và đồng bộ tài khoản đăng nhập.
    """
    try:
        return permission_service.assign_role_to_employee(db, ma_nv, data)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err


@router.put(
    "/employee/{ma_nv}/custom-permissions",
    response_model=EmployeePermissionsResponse,
    summary="[Phân quyền] Cấp hoặc thu hồi quyền riêng biệt cho nhân sự",
)
def update_custom_permissions_endpoint(
    ma_nv: str,
    data: CustomPermissionBatchRequest,
    db: DbSession,
):
    """
    Cấp thêm quyền đặc thù hoặc thu hồi quyền cụ thể của một nhân sự
    (ghi nhận vào bảng tai_khoan_quyen mà không cần thay đổi vai trò chính).
    """
    try:
        return permission_service.update_custom_permissions(db, ma_nv, data)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from error
