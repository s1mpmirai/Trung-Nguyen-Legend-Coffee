from typing import Any
from sqlalchemy.orm import Session

from app.repositories import permission_repository
from app.repositories.employee_repository import get_by_ma_nv
from app.schemas.permission_schemas import (
    AssignRoleRequest,
    CustomPermissionBatchRequest,
)


def get_all_roles(db: Session) -> list[dict[str, Any]]:
    """Lấy danh mục các vai trò trong hệ thống kèm quyền mặc định."""
    return permission_repository.get_all_roles_with_permissions(db)


def get_all_permissions(db: Session) -> list[dict[str, Any]]:
    """Lấy danh mục tất cả quyền chức năng trong hệ thống."""
    return permission_repository.get_all_permissions(db)


def get_role_matrix(db: Session) -> dict[str, Any]:
    """Lấy ma trận phân quyền hoàn chỉnh (so sánh Nhân viên vs Trưởng nhóm)."""
    return permission_repository.get_role_matrix(db)


def get_employee_permissions(db: Session, ma_nv: str) -> dict[str, Any]:
    """Xem danh sách quyền hạn thực tế của một nhân viên."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    emp = get_by_ma_nv(db, clean_id)
    if not emp:
        raise ValueError(f"Không tìm thấy nhân viên có mã {clean_id}")

    perms = permission_repository.get_employee_permissions(db, clean_id)
    if not perms:
        raise ValueError(f"Không tìm thấy dữ liệu quyền của nhân viên {clean_id}")
    return perms


# Người không phải ADMIN chỉ được cấp các vai trò / quyền nghiệp vụ, không được cấp quyền quản trị
ROLES_ASSIGNABLE_BY_MANAGER = {"NHAN_VIEN", "TRUONG_NHOM"}
ADMIN_ONLY_PERMISSIONS = {"ACCOUNT_MANAGE", "PERMISSION_ASSIGN"}


def _check_can_change(db: Session, actor: dict[str, Any], clean_id: str) -> dict[str, Any]:
    if clean_id == actor["ma_nv"]:
        raise PermissionError("Không thể tự thay đổi vai trò hoặc quyền của chính mình.")
    target = permission_repository.get_employee_permissions(db, clean_id)
    if not target:
        raise ValueError(f"Không tìm thấy nhân viên có mã {clean_id}")
    if actor["ma_vai_tro"] != "ADMIN" and target["ma_vai_tro"] in ("ADMIN", "QUAN_LY"):
        raise PermissionError("Chỉ Admin mới được thay đổi quyền của tài khoản Quản lý / Admin.")
    return target


def assign_role_to_employee(db: Session, ma_nv: str, data: AssignRoleRequest, actor: dict[str, Any]) -> dict[str, Any]:
    """Cấp / thay đổi vai trò cho nhân viên (vd: thăng chức lên Trưởng nhóm)."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    _check_can_change(db, actor, clean_id)

    target_role = data.ma_vai_tro.strip().upper()
    if actor["ma_vai_tro"] != "ADMIN" and target_role not in ROLES_ASSIGNABLE_BY_MANAGER:
        raise PermissionError("Quản lý chỉ được cấp vai trò Nhân viên hoặc Trưởng nhóm.")
    return permission_repository.assign_role_to_employee(
        db=db, ma_nv=clean_id, ma_vai_tro=target_role, ghi_chu=data.ghi_chu
    )


def update_custom_permissions(
    db: Session, ma_nv: str, data: CustomPermissionBatchRequest, actor: dict[str, Any]
) -> dict[str, Any]:
    """Cấp hoặc thu hồi quyền tùy chỉnh cho nhân viên."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    _check_can_change(db, actor, clean_id)

    items = [p.model_dump() for p in data.permissions]
    if actor["ma_vai_tro"] != "ADMIN" and any(p["ma_quyen"] in ADMIN_ONLY_PERMISSIONS for p in items):
        raise PermissionError("Chỉ Admin mới được cấp / thu hồi quyền quản trị tài khoản và phân quyền.")
    return permission_repository.update_employee_custom_permissions(db=db, ma_nv=clean_id, permissions=items)
