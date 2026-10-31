"""
Phạm vi nhân sự mà một tài khoản được quản lý.
Tách riêng khỏi core/permissions.py để tầng repository dùng được mà không bị import vòng.
"""
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class DataScope:
    """Nhân sự thuộc phạm vi = cấp dưới trực tiếp của ma_nql, cộng toàn bộ phòng ban ma_pb (nếu có)."""

    ma_nql: str
    ma_pb: str | None = None

    def sql(self, alias: str = "nv") -> tuple[str, dict[str, Any]]:
        """Điều kiện SQL (kèm tham số) lọc bảng nhan_vien có bí danh `alias`."""
        if self.ma_pb:
            return (
                f"({alias}.ma_pb = :scope_ma_pb OR {alias}.ma_nql = :scope_ma_nql)",
                {"scope_ma_pb": self.ma_pb, "scope_ma_nql": self.ma_nql},
            )
        return f"{alias}.ma_nql = :scope_ma_nql", {"scope_ma_nql": self.ma_nql}

    def covers(self, employee: dict[str, Any]) -> bool:
        """Nhân sự (dict có ma_pb, ma_nql) có thuộc phạm vi hay không."""
        if employee.get("ma_nql") == self.ma_nql:
            return True
        return self.ma_pb is not None and employee.get("ma_pb") == self.ma_pb


def scope_condition(scope: DataScope | None, alias: str = "nv") -> tuple[str, dict[str, Any]]:
    """Trả về (" AND <điều kiện>", tham số); chuỗi rỗng khi được xem toàn công ty (scope None)."""
    if scope is None:
        return "", {}
    condition, params = scope.sql(alias)
    return f" AND {condition}", params
