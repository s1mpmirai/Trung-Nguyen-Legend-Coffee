/**
 * managerUtils.js
 *
 * Tiện ích dùng chung cho Cổng Quản lý:
 * - getManagerAccess: đọc vai trò / quyền của tài khoản đăng nhập (props userSession từ App.jsx, dự phòng localStorage)
 * - getApiErrorMessage: chuẩn hóa thông báo lỗi trả về từ backend (kể cả lỗi validate 422 dạng mảng)
 * - Định dạng ngày theo kiểu Việt Nam
 */

/** Quyền chỉ ADMIN được cấp (backend trả 403 nếu Quản lý cố cấp) */
export const ADMIN_ONLY_PERMISSIONS = [
  "ACCOUNT_MANAGE",
  "PERMISSION_ASSIGN",
  "ORG_MANAGE",
  "CONTRACT_MANAGE",
  "PAYROLL_MANAGE",
  "ATTENDANCE_LOCK",
];

/** Vai trò Quản lý được phép bổ nhiệm (ADMIN / QUAN_LY chỉ ADMIN mới bổ nhiệm được) */
export const ROLES_ASSIGNABLE_BY_MANAGER = ["NHAN_VIEN", "TRUONG_NHOM"];

const readStoredPermissions = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function getManagerAccess(userSession) {
  const role = String(userSession?.role || localStorage.getItem("user_role") || "").toUpperCase();
  const permissions = Array.isArray(userSession?.permissions) ? userSession.permissions : readStoredPermissions();
  const maNv = userSession?.ma_nv || localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv") || "";
  const isAdmin = role === "ADMIN";
  return {
    role,
    permissions,
    maNv,
    isAdmin,
    can: (perm) => isAdmin || permissions.includes(perm),
  };
}

/** Lấy thông báo lỗi dễ đọc từ lỗi của apiClient */
export function getApiErrorMessage(err, fallback = "Đã có lỗi xảy ra, vui lòng thử lại.") {
  if (!err) return fallback;
  const detail = err.data?.detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => d?.msg || (typeof d === "string" ? d : "")).filter(Boolean);
    if (msgs.length) return `Dữ liệu không hợp lệ: ${msgs.join("; ")}`;
  }
  if (typeof detail === "string" && detail) return detail;
  if (err.status === 403 && !err.message) return "Bạn không có quyền thực hiện thao tác này.";
  return err.message || fallback;
}

export const isForbiddenError = (err) => err?.status === 403;

/** Ngày hôm nay theo giờ máy (YYYY-MM-DD) */
export function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "2026-10-28" | Date -> "28/10/2026" */
export function formatDateVN(value) {
  if (!value) return "—";
  const str = String(value).slice(0, 10);
  const parts = str.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("vi-VN");
}

/** "2026-10-28T09:15:00" -> "09:15 - 28/10/2026" */
export function formatDateTimeVN(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${time} - ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
}
