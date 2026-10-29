/**
 * Tiện ích định dạng & xử lý lỗi dùng chung cho Cổng Nhân viên.
 */

/**
 * Lấy thông báo lỗi dễ hiểu từ lỗi apiClient.
 * - 400/403/404: backend trả `detail` dạng chuỗi tiếng Việt -> hiển thị nguyên văn
 * - 422 (FastAPI validation): `detail` là mảng -> ghép các thông điệp
 */
export function getApiErrorMessage(err, fallback = "Có lỗi xảy ra, vui lòng thử lại.") {
  if (!err) return fallback;
  const detail = err.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => d?.msg).filter(Boolean);
    if (msgs.length) return `Dữ liệu không hợp lệ: ${msgs.join("; ")}`;
  }
  if (err.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (err.name === "TypeError") return "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.";
  const msg = typeof err.message === "string" ? err.message : "";
  if (msg && !msg.includes("[object")) return msg;
  return fallback;
}

/** Yêu cầu bị hủy chủ động (AbortController) -> bỏ qua, không báo lỗi */
export const isAbortError = (err) => err?.name === "AbortError";

/** Số ngày (có thể lẻ 0,5) theo định dạng Việt Nam: 11.5 -> "11,5" */
export function formatDays(value) {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}

/** "YYYY-MM-DD..." -> "DD/MM/YYYY" (không qua Date để tránh lệch múi giờ) */
export function formatDateVN(dateStr) {
  if (!dateStr) return "Chưa có dữ liệu";
  const parts = String(dateStr).split(/[ T]/)[0].split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return String(dateStr);
}

/** Ngày hôm nay dạng YYYY-MM-DD theo giờ địa phương */
export function todayIsoLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Giờ hợp lệ dạng HH:MM (backend trả "--:--" khi chưa có) */
export const isValidTime = (t) => Boolean(t) && t !== "--:--";
