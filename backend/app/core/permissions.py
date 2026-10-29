from collections.abc import Callable
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token, oauth2_scheme
from app.db.session import get_db
from app.repositories import auth_repository
from app.repositories.employee_repository import apply_due_terminations
from app.repositories.permission_repository import get_employee_permissions

# Vai trò quản lý toàn công ty: thấy và xử lý dữ liệu của mọi phòng ban.
# Các vai trò còn lại (TRUONG_NHOM...) chỉ xử lý nhân sự cấp dưới trực tiếp (nhan_vien.ma_nql).
COMPANY_WIDE_ROLES = {"ADMIN", "QUAN_LY"}


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
    return {
        "ma_nv": account.ma_nv,
        "ma_tk": account.ma_tk,
        "ma_vai_tro": account.ma_vai_tro,
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


def manager_scope(account: dict[str, Any]) -> str | None:
    """Trả về mã người quản lý để lọc nhân sự cấp dưới, hoặc None nếu được xem toàn công ty."""
    if account["ma_vai_tro"] in COMPANY_WIDE_ROLES:
        return None
    return account["ma_nv"]


# Alias dùng chung cho endpoint cần biết ai đang gọi API (giống DbSession).
CurrentAccount = Annotated[dict[str, Any], Depends(get_current_account)]
