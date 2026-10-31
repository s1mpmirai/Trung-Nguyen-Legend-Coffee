from collections.abc import Callable
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.data_scope import DataScope
from app.core.security import decode_access_token, oauth2_scheme
from app.db.session import get_db
from app.repositories import auth_repository
from app.repositories.employee_repository import apply_due_terminations
from app.repositories.permission_repository import get_employee_permissions

# Phạm vi dữ liệu (xem data_scope):
# - ADMIN và Quản lý thuộc Phòng Nhân sự: toàn công ty.
# - Quản lý phòng ban khác: nhân sự trong phòng mình + cấp dưới trực tiếp.
# - Còn lại (TRUONG_NHOM, nhân viên được cấp quyền riêng): chỉ cấp dưới trực tiếp (nhan_vien.ma_nql).

# Có ít nhất một quyền này thì được vào cổng điều hành (/login-manage).
# Giữ khớp với MANAGER_PORTAL_PERMISSIONS + ACCOUNT_MANAGE ở frontend/src/utils/navigation.js.
MANAGE_PORTAL_PERMISSIONS = (
    "EMPLOYEE_VIEW",
    "EMPLOYEE_CREATE",
    "EMPLOYEE_UPDATE",
    "EMPLOYEE_DELETE",
    "LEAVE_APPROVE",
    "ATTENDANCE_MANAGE",
    "ATTENDANCE_LOCK",
    "PAYROLL_MANAGE",
    "REPORT_VIEW",
    "PERMISSION_ASSIGN",
    "ACCOUNT_MANAGE",
)


def normalize_ma_nv(ma_nv: str | None) -> str:
    return (ma_nv or "").strip().upper().replace("-", "")


def get_current_account(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Giải mã JWT, kiểm tra tài khoản còn hoạt động và trả về quyền thực tế của người gọi API."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise unauthorized

    ma_nv = normalize_ma_nv(str(payload["sub"]))
    # Thôi việc đến ngày hiệu lực: khóa tài khoản ngay cả khi token cũ vẫn còn hạn
    apply_due_terminations(db, ma_nv)
    account = auth_repository.get_by_ma_nv(db, ma_nv)
    if account is None:
        raise unauthorized
    db.refresh(account)
    if account.trang_thai != "HOAT_DONG":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khóa")

    perms = get_employee_permissions(db, ma_nv) or {}
    ma_pb = db.execute(text("SELECT ma_pb FROM nhan_vien WHERE ma_nv = :ma_nv"), {"ma_nv": ma_nv}).scalar()
    return {
        "ma_nv": account.ma_nv,
        "ma_tk": account.ma_tk,
        "ma_vai_tro": account.ma_vai_tro,
        "ma_pb": ma_pb,
        "permissions": set(perms.get("effective_permissions", [])),
    }


def has_permission(account: dict[str, Any], *permission_codes: str) -> bool:
    """ADMIN có toàn quyền; các vai trò khác cần ít nhất một trong các quyền được liệt kê."""
    if account["ma_vai_tro"] == "ADMIN":
        return True
    return any(code in account["permissions"] for code in permission_codes)


def require_permission(*permission_codes: str) -> Callable[..., dict[str, Any]]:
    """Dependency chặn API nếu tài khoản không có quyền tương ứng (vd: require_permission("LEAVE_APPROVE"))."""

    def dependency(account: dict[str, Any] = Depends(get_current_account)) -> dict[str, Any]:
        if not has_permission(account, *permission_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bạn không có quyền thực hiện chức năng này ({', '.join(permission_codes)})",
            )
        return account

    return dependency


def ensure_self_or_permission(account: dict[str, Any], ma_nv: str, *permission_codes: str) -> str:
    """Nhân viên chỉ được truy cập dữ liệu của chính mình, trừ khi có quyền quản lý tương ứng."""
    clean_id = normalize_ma_nv(ma_nv)
    if clean_id == account["ma_nv"] or has_permission(account, *permission_codes):
        return clean_id
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Bạn chỉ được xem hoặc thao tác trên dữ liệu của chính mình",
    )


def data_scope(account: dict[str, Any], *company_wide_permissions: str) -> DataScope | None:
    """
    Phạm vi nhân sự người gọi API được quản lý; None = toàn công ty.
    company_wide_permissions: quyền mà bản chất là việc toàn công ty với API đang gọi
    (vd: CONTRACT_MANAGE khi xem danh sách nhân sự để ký hợp đồng).
    """
    if account["ma_vai_tro"] == "ADMIN":
        return None
    if any(code in account["permissions"] for code in company_wide_permissions):
        return None
    if account["ma_vai_tro"] == "QUAN_LY":
        if account.get("ma_pb") == settings.hr_department_code:
            return None
        return DataScope(ma_nql=account["ma_nv"], ma_pb=account.get("ma_pb"))
    return DataScope(ma_nql=account["ma_nv"])


def ensure_in_scope(db: Session, account: dict[str, Any], ma_nv: str, *company_wide_permissions: str) -> str:
    """Chặn thao tác trên nhân sự ngoài phạm vi quản lý; nhân sự không tồn tại để endpoint tự báo 404."""
    clean_id = normalize_ma_nv(ma_nv)
    scope = data_scope(account, *company_wide_permissions)
    if scope is None:
        return clean_id
    employee = db.execute(
        text("SELECT ma_pb, ma_nql FROM nhan_vien WHERE ma_nv = :ma_nv"), {"ma_nv": clean_id}
    ).mappings().first()
    if employee is not None and not scope.covers(dict(employee)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nhân sự này không thuộc phạm vi quản lý của bạn",
        )
    return clean_id


def ensure_self_or_managed(
    db: Session,
    account: dict[str, Any],
    ma_nv: str,
    *permission_codes: str,
    company_wide: tuple[str, ...] = (),
) -> str:
    """Dữ liệu của chính mình, hoặc của nhân sự trong phạm vi quản lý khi có quyền tương ứng."""
    clean_id = ensure_self_or_permission(account, ma_nv, *permission_codes)
    if clean_id != account["ma_nv"]:
        ensure_in_scope(db, account, clean_id, *company_wide)
    return clean_id


# Alias dùng chung cho endpoint cần biết ai đang gọi API (giống DbSession).
CurrentAccount = Annotated[dict[str, Any], Depends(get_current_account)]
