from collections.abc import Callable

from fastapi import HTTPException, status


def require_permission(permission_code: str) -> Callable[[], None]:
    def dependency() -> None:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"Permission checking is not wired yet: {permission_code}",
        )

    return dependency
