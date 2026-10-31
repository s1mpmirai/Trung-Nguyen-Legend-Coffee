from typing import Any
from sqlalchemy.orm import Session

from app.repositories import permission_repository
from app.repositories.employee_repository import get_by_ma_nv
from app.schemas.permission_schemas import (
    AssignRoleRequest,
    CustomPermissionBatchRequest,
    RolePermissionsUpdate,
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


# Người không phải ADMIN chỉ được cấp các vai trò / quyền nghiệp vụ trong phạm vi của mình.
# Quyền quản trị và quyền có tác dụng toàn công ty (tính lương, chốt công) chỉ Admin cấp.
ROLES_ASSIGNABLE_BY_MANAGER = {"NHAN_VIEN", "TRUONG_NHOM"}
ADMIN_ONLY_PERMISSIONS = {
    "ACCOUNT_MANAGE",
    "PERMISSION_ASSIGN",
    "ORG_MANAGE",
    "CONTRACT_MANAGE",
    "PAYROLL_MANAGE",
    "ATTENDANCE_LOCK",
}


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
        raise PermissionError("Chỉ Admin mới được cấp / thu hồi quyền quản trị, tính lương và chốt công.")
    return permission_repository.update_employee_custom_permissions(db=db, ma_nv=clean_id, permissions=items)


def update_role_permissions(
    db: Session, ma_vai_tro: str, data: RolePermissionsUpdate, actor: dict[str, Any]
) -> dict[str, Any]:
    """
    [Chỉ Admin] Chỉnh ma trận vai trò x quyền: thay toàn bộ quyền mặc định của một vai trò.
    Vai trò ADMIN luôn có toàn quyền nên không chỉnh được.
    """
    if actor["ma_vai_tro"] != "ADMIN":
        raise PermissionError("Chỉ Admin mới được chỉnh ma trận phân quyền theo vai trò.")
    ma_vai_tro = ma_vai_tro.strip().upper()
    if ma_vai_tro == "ADMIN":
        raise ValueError("Vai trò ADMIN luôn có toàn bộ quyền, không thể chỉnh.")
    roles = {r["ma_vai_tro"] for r in permission_repository.get_all_roles_with_permissions(db)}
    if ma_vai_tro not in roles:
        raise ValueError(f"Vai trò không tồn tại: {ma_vai_tro}")
    valid = {p["ma_quyen"] for p in permission_repository.get_all_permissions(db)}
    requested = sorted(set(data.ma_quyen))
    invalid = [q for q in requested if q not in valid]
    if invalid:
        raise ValueError(f"Mã quyền không hợp lệ: {', '.join(invalid)}")

    try:
        permission_repository.set_role_permissions(db, ma_vai_tro, requested)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return permission_repository.get_role_matrix(db)
