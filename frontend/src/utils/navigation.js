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
  QUAN_LY: "Quản lý",
  TRUONG_NHOM: "Trưởng nhóm",
  NHAN_VIEN: "Nhân viên",
};

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
  "REPORT_VIEW",
  "PERMISSION_ASSIGN",
];

/** Cổng Quản trị: CHỈ vai trò ADMIN hoặc tài khoản được cấp ACCOUNT_MANAGE. */
export const canAccessAdminPortal = (role, permissions = []) =>
  isAdminRole(role) || normalizePerms(permissions).includes("ACCOUNT_MANAGE");

/** Cổng Quản lý: vai trò ADMIN / QUAN_LY / TRUONG_NHOM hoặc có quyền nghiệp vụ quản lý. */
export const canAccessManagerPortal = (role, permissions = []) => {
  const r = normalizeRole(role);
  if (r === "ADMIN" || r === "QUAN_LY" || r === "TRUONG_NHOM") return true;
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
