/**
 * navigation.js
 * Tiện ích điều hướng Clean URL thống nhất cho toàn bộ hệ thống TrungNguyenHR
 * + quy tắc phân quyền vào từng cổng (Quản trị / Quản lý / Nhân viên).
 */

export const navigateClean = (route) => {
  const clean = String(route || "").replace(/^#\/?/, "").replace(/^\/+/, "");
  const targetUrl = clean ? `/${clean}` : "/";
  if (window.location.pathname !== targetUrl) {
    window.history.pushState({ inApp: true, page: clean }, "", targetUrl);
  }
  if (window.location.hash) {
    window.history.replaceState({ inApp: true, page: clean }, "", targetUrl);
  }
  window.dispatchEvent(new CustomEvent("app-route-change", { detail: { route: clean } }));
};

/** Thay URL hiện tại (không thêm mục lịch sử) – dùng cho chuyển hướng do guard. */
export const replaceClean = (route) => {
  const clean = String(route || "").replace(/^#\/?/, "").replace(/^\/+/, "");
  window.history.replaceState({ inApp: true, page: clean }, "", clean ? `/${clean}` : "/");
};

export const getCleanRoute = () => {
  const hash = window.location.hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  return path || hash || "";
};

// ───────────────────────── QUY TẮC TRUY CẬP CÁC CỔNG ─────────────────────────

export const ROLE_LABELS = {
  ADMIN: "Quản trị viên hệ thống",
  BAN_GIAM_DOC: "Ban Giám đốc",
  NHAN_SU: "Phòng Nhân sự",
  KE_TOAN: "Phòng Kế toán",
  NHAN_VIEN: "Nhân viên",
};

/** Vai trò nghiệp vụ theo phòng ban, dùng Cổng Quản lý (khớp BUSINESS_ROLES ở backend/app/core/roles.py) */
export const BUSINESS_ROLES = ["BAN_GIAM_DOC", "NHAN_SU", "KE_TOAN"];

export const getRoleLabel = (role) => {
  const key = String(role || "").toUpperCase();
  return ROLE_LABELS[key] || key || "Chưa xác định";
};

const normalizeRole = (role) => String(role || "").toUpperCase();
const normalizePerms = (permissions) => (Array.isArray(permissions) ? permissions : []);

export const isAdminRole = (role) => normalizeRole(role) === "ADMIN";

// Quyền nghiệp vụ được dùng trong Cổng Quản lý
const MANAGER_PORTAL_PERMISSIONS = [
  "EMPLOYEE_VIEW",
  "EMPLOYEE_CREATE",
  "EMPLOYEE_UPDATE",
  "EMPLOYEE_DELETE",
  "LEAVE_APPROVE",
  "ATTENDANCE_MANAGE",
  "ATTENDANCE_LOCK",
  "PAYROLL_MANAGE",
  "PAYROLL_APPROVE",
  "REPORT_VIEW",
  "PERMISSION_ASSIGN",
];

// ───────────────────────── QUYỀN CÁ NHÂN Ở CỔNG NHÂN VIÊN ─────────────────────────
// Khớp has_personal_permission / ensure_personal_permission ở backend/app/core/permissions.py:
// cấp / thu hồi qua Phân quyền ở Cổng Quản trị; ADMIN luôn có (bộ quyền ADMIN cố định).

/** Có ít nhất một trong các quyền cá nhân (LEAVE_VIEW, LEAVE_CREATE, PAYROLL_VIEW). */
export const hasPersonalPermission = (session, ...codes) =>
  isAdminRole(session?.role) || codes.some((code) => normalizePerms(session?.permissions).includes(code));

/** Xem phiếu lương của chính mình: PAYROLL_VIEW, hoặc người tính / duyệt lương (xem được mọi bảng lương). */
export const canViewOwnPayroll = (session) =>
  hasPersonalPermission(session, "PAYROLL_VIEW") ||
  normalizePerms(session?.permissions).some((p) => p === "PAYROLL_MANAGE" || p === "PAYROLL_APPROVE");

/** Cổng Quản trị: CHỈ vai trò ADMIN hoặc tài khoản được cấp ACCOUNT_MANAGE. */
export const canAccessAdminPortal = (role, permissions = []) =>
  isAdminRole(role) || normalizePerms(permissions).includes("ACCOUNT_MANAGE");

/**
 * Cổng Quản lý: vai trò Ban Giám đốc / Nhân sự / Kế toán hoặc có quyền nghiệp vụ quản lý.
 * ADMIN (quản trị hệ thống) KHÔNG vào Cổng Quản lý: giao diện Admin tách biệt với quản lý nhân sự.
 */
export const canAccessManagerPortal = (role, permissions = []) => {
  const r = normalizeRole(role);
  if (r === "ADMIN") return false;
  if (BUSINESS_ROLES.includes(r)) return true;
  return normalizePerms(permissions).some((p) => MANAGER_PORTAL_PERMISSIONS.includes(p));
};

/** Trang chủ của cổng điều hành theo quyền: Quản trị → /admin, Quản lý → /manager, còn lại → Nhân viên. */
export const getManageHome = (role, permissions = []) => {
  if (canAccessAdminPortal(role, permissions)) return "admin";
  if (canAccessManagerPortal(role, permissions)) return "manager";
  return "attendance";
};

/** Trang chủ theo cổng đã đăng nhập ("manage" | "employee"). */
export const getPortalHome = (session) => {
  if (!session) return "login";
  if (session.portal === "manage") return getManageHome(session.role, session.permissions);
  return "attendance";
};

export const isLoginRoute = (route) =>
  route === "login" || route === "login-manage" || route === "login-manager" || route === "login-admin";

export const isManageLoginRoute = (route) =>
  route === "login-manage" || route === "login-manager" || route === "login-admin";

export const isManagePortalRoute = (route) => {
  const r = String(route || "").toLowerCase();
  return r === "admin" || r.startsWith("admin/") || r === "manager" || r.startsWith("manager/") || isManageLoginRoute(r);
};
