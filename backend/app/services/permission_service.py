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
    """Lấy danh mục tất cả 16 quyền chức năng trong hệ thống."""
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


def assign_role_to_employee(db: Session, ma_nv: str, data: AssignRoleRequest) -> dict[str, Any]:
    """Cấp / thay đổi vai trò cho nhân viên (vd: thăng chức lên Trưởng nhóm)."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    emp = get_by_ma_nv(db, clean_id)
    if not emp:
        raise ValueError(f"Không tìm thấy nhân viên có mã {clean_id}")

    target_role = data.ma_vai_tro.strip().upper()
    return permission_repository.assign_role_to_employee(
        db=db, ma_nv=clean_id, ma_vai_tro=target_role, ghi_chu=data.ghi_chu
    )


def update_custom_permissions(
    db: Session, ma_nv: str, data: CustomPermissionBatchRequest
) -> dict[str, Any]:
    """Cấp hoặc thu hồi quyền tùy chỉnh cho nhân viên."""
    clean_id = ma_nv.strip().upper().replace("-", "")
    emp = get_by_ma_nv(db, clean_id)
    if not emp:
        raise ValueError(f"Không tìm thấy nhân viên có mã {clean_id}")

    items = [p.model_dump() for p in data.permissions]
    return permission_repository.update_employee_custom_permissions(db=db, ma_nv=clean_id, permissions=items)
