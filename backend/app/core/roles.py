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

# Quyền cá nhân ở Cổng Nhân viên (đơn từ, phiếu lương của chính mình).
# Cấp / thu hồi qua vai trò hoặc quyền riêng; ADMIN luôn có vì bộ quyền ADMIN cố định ở trên.
PERSONAL_PERMISSIONS = frozenset({"LEAVE_VIEW", "LEAVE_CREATE", "PAYROLL_VIEW"})

# Tên quyền hiển thị cho người dùng (khớp PERMISSION_MAP ở frontend/src/pages/admin/tabs/AdminPermissionsTab.jsx).
# Thông báo lỗi chỉ dùng tên này, không bao giờ in mã quyền.
PERMISSION_LABELS = {
    "EMPLOYEE_VIEW": "Xem danh sách & hồ sơ nhân sự",
    "EMPLOYEE_CREATE": "Thêm nhân sự mới",
    "EMPLOYEE_UPDATE": "Cập nhật thông tin nhân sự",
    "EMPLOYEE_DELETE": "Cho thôi việc nhân sự",
    "CONTRACT_MANAGE": "Quản lý hợp đồng lao động",
    "ORG_MANAGE": "Quản lý cơ cấu tổ chức",
    "LEAVE_VIEW": "Xem đơn từ",
    "LEAVE_CREATE": "Tạo và gửi đơn",
    "LEAVE_APPROVE": "Phê duyệt / từ chối đơn",
    "ATTENDANCE_MANAGE": "Quản lý chấm công",
    "ATTENDANCE_LOCK": "Chốt / mở khóa công tháng",
    "PAYROLL_VIEW": "Xem phiếu lương",
    "PAYROLL_MANAGE": "Tính lương",
    "PAYROLL_APPROVE": "Duyệt bảng lương",
    "REPORT_VIEW": "Xem báo cáo nhân sự",
    "ACCOUNT_MANAGE": "Quản lý tài khoản người dùng",
    "PERMISSION_ASSIGN": "Phân quyền & bổ nhiệm vai trò",
}
