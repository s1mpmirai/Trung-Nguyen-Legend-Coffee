"""Hằng số vai trò dùng chung (không import module khác để tránh vòng lặp import)."""

ADMIN_ROLE = "ADMIN"

# Quản trị hệ thống (IT) chỉ quản lý tài khoản, phân quyền và xem danh bạ nhân sự.
# Không có quyền nghiệp vụ (duyệt đơn, chấm công, tính lương, tổ chức, hợp đồng) dù ma trận hay
# quyền cấp riêng ghi gì: tách biệt giao diện / nghiệp vụ Admin với quản lý nhân sự.
ADMIN_SYSTEM_PERMISSIONS = frozenset({"ACCOUNT_MANAGE", "PERMISSION_ASSIGN", "EMPLOYEE_VIEW"})
