"""Hằng số vai trò dùng chung (không import module khác để tránh vòng lặp import)."""

ADMIN_ROLE = "ADMIN"
BOARD_ROLE = "BAN_GIAM_DOC"
HR_ROLE = "NHAN_SU"
ACCOUNTING_ROLE = "KE_TOAN"
STAFF_ROLE = "NHAN_VIEN"

# Vai trò nghiệp vụ theo phòng ban: dùng Cổng Quản lý và làm việc trên dữ liệu toàn công ty.
# - Ban Giám đốc: xem toàn bộ, báo cáo, duyệt đơn, duyệt bảng lương.
# - Phòng Nhân sự: hồ sơ, hợp đồng, cơ cấu tổ chức, chấm công / chốt công, duyệt đơn.
# - Phòng Kế toán: tính lương, xác nhận chi trả.
# Phòng IT dùng vai trò ADMIN (Cổng Quản trị); mọi nhân sự còn lại là NHAN_VIEN.
BUSINESS_ROLES = frozenset({BOARD_ROLE, HR_ROLE, ACCOUNTING_ROLE})
VALID_ROLES = frozenset({ADMIN_ROLE, STAFF_ROLE, *BUSINESS_ROLES})

# Thứ tự hiển thị vai trò (danh sách, ma trận quyền)
ROLE_DISPLAY_ORDER = (ADMIN_ROLE, BOARD_ROLE, HR_ROLE, ACCOUNTING_ROLE, STAFF_ROLE)

# Quản trị hệ thống (IT) chỉ quản lý tài khoản, phân quyền và xem danh bạ nhân sự.
# Không có quyền nghiệp vụ (duyệt đơn, chấm công, tính lương, tổ chức, hợp đồng) dù ma trận hay
# quyền cấp riêng ghi gì: tách biệt giao diện / nghiệp vụ Admin với quản lý nhân sự.
ADMIN_SYSTEM_PERMISSIONS = frozenset({"ACCOUNT_MANAGE", "PERMISSION_ASSIGN", "EMPLOYEE_VIEW"})
