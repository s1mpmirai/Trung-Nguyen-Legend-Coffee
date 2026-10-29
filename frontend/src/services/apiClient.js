/**
 * apiClient.js
 *
 * Wrapper fetch API cho toàn bộ ứng dụng:
 * - Tự động thêm Base URL
 * - Tự động đính kèm Token xác thực nếu có
 * - Chuẩn hóa xử lý lỗi HTTP và JSON response
 */

let BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";
if (BASE_URL.startsWith("http") && !BASE_URL.includes("/api/v1")) {
  BASE_URL = `${BASE_URL.replace(/\/+$/, "")}/api/v1`;
}

const SESSION_KEYS = [
  "user_ma_nv",
  "ma_nv",
  "auth_token",
  "access_token",
  "user_role",
  "user_permissions",
  "auth_portal",
];

function handleSessionExpired() {
  const portal = localStorage.getItem("auth_portal");
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  window.location.assign(portal === "manage" ? "/login-manage" : "/login");
}

// Các route đăng nhập: 401 ở đây nghĩa là sai mật khẩu, không phải phiên hết hạn
const isLoginEndpoint = (endpoint) => /^\/auth\/[^/]*login[^/]*$/i.test(endpoint);

// Tên trường hiển thị tiếng Việt cho lỗi kiểm tra dữ liệu (422) của FastAPI
const FIELD_LABELS = {
  ma_nv: "Mã nhân viên",
  mat_khau: "Mật khẩu",
  mat_khau_moi: "Mật khẩu mới",
  mat_khau_cu: "Mật khẩu hiện tại",
  ma_vai_tro: "Vai trò",
  trang_thai: "Trạng thái",
  ma_pb: "Mã phòng ban",
  ten_pb: "Tên phòng ban",
  ma_truong_pb: "Mã trưởng phòng",
  ma_cv: "Mã chức vụ",
  ten_cv: "Tên chức vụ",
  cap_bac: "Cấp bậc",
  phu_cap_chuc_vu: "Phụ cấp chức vụ",
  bac: "Bậc lương",
  he_so: "Hệ số lương",
  muc_luong: "Mức lương",
  ma_hd: "Mã hợp đồng",
  loai_hd: "Loại hợp đồng",
  ngay_ky: "Ngày ký",
  ngay_bat_dau: "Ngày bắt đầu",
  ngay_ket_thuc: "Ngày kết thúc",
  luong_co_ban: "Lương cơ bản",
  ty_le_huong: "Tỷ lệ hưởng lương",
  so_tai_khoan: "Số tài khoản",
  ngan_hang: "Ngân hàng",
  ma_so_thue: "Mã số thuế",
  so_bhxh: "Số BHXH",
  sdt: "Số điện thoại",
  email: "Email",
  ma_quyen: "Mã quyền",
};

const translateValidationMessage = (item) => {
  const type = String(item?.type || "");
  const ctx = item?.ctx || {};
  if (type === "missing") return "là bắt buộc";
  if (type === "string_too_short") return `phải có ít nhất ${ctx.min_length ?? ""} ký tự`;
  if (type === "string_too_long") return `chỉ được tối đa ${ctx.max_length ?? ""} ký tự`;
  if (type === "greater_than") return `phải lớn hơn ${ctx.gt}`;
  if (type === "greater_than_equal") return `phải lớn hơn hoặc bằng ${ctx.ge}`;
  if (type === "less_than") return `phải nhỏ hơn ${ctx.lt}`;
  if (type === "less_than_equal") return `phải nhỏ hơn hoặc bằng ${ctx.le}`;
  if (type.startsWith("date")) return "không phải ngày hợp lệ";
  if (type.startsWith("int") || type.startsWith("float") || type.startsWith("decimal")) return "phải là số hợp lệ";
  if (type.startsWith("bool")) return "không hợp lệ";
  if (type === "value_error" && item?.msg) return String(item.msg).replace(/^Value error,\s*/i, "");
  return item?.msg ? String(item.msg) : "không hợp lệ";
};

/**
 * Chuyển `detail` của FastAPI thành câu tiếng Việt dễ đọc.
 * - 422: detail là mảng [{loc, msg, type}] → "Mật khẩu mới: phải có ít nhất 6 ký tự; ..."
 * - Các lỗi khác: detail là chuỗi.
 */
export function formatApiErrorDetail(detail) {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (typeof item === "string") return item;
      const loc = Array.isArray(item?.loc) ? item.loc.filter((p) => p !== "body" && p !== "query" && p !== "path") : [];
      const field = loc.length ? loc[loc.length - 1] : "";
      const label = FIELD_LABELS[field] || field;
      const message = translateValidationMessage(item);
      return label ? `${label}: ${message}` : message;
    });
    const unique = [...new Set(parts.filter(Boolean))];
    return unique.length ? `Dữ liệu chưa hợp lệ – ${unique.join("; ")}` : "Dữ liệu gửi lên chưa hợp lệ.";
  }
  if (typeof detail === "object") {
    return detail.message || detail.msg || JSON.stringify(detail);
  }
  return String(detail);
}

/** Lấy thông báo lỗi thân thiện (ưu tiên câu báo quyền khi 403). */
export function getErrorMessage(error, fallback = "Đã xảy ra lỗi. Vui lòng thử lại!") {
  if (!error) return fallback;
  if (error.status === 403 && !error.message) return "Bạn không có quyền thực hiện thao tác này.";
  return error.message || fallback;
}

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const { params, ...restOptions } = options;

  let queryString = "";
  if (params && typeof params === "object") {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      queryString = (endpoint.includes("?") ? "&" : "?") + qs;
    }
  }

  const cleanBase = BASE_URL.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}${queryString}`;

  const config = {
    ...restOptions,
    headers,
  };

  try {
    let response;
    try {
      response = await fetch(url, config);
    } catch (networkError) {
      const error = new Error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.");
      error.status = 0;
      error.cause = networkError;
      throw error;
    }

    // Xử lý status 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    // Token hết hạn / không hợp lệ: xóa phiên và đưa về trang đăng nhập tương ứng
    // (trừ các route đăng nhập, nơi 401 nghĩa là sai mã tài khoản / mật khẩu)
    if (response.status === 401 && !isLoginEndpoint(cleanEndpoint)) {
      handleSessionExpired();
    }

    if (!response.ok) {
      let errorMessage = formatApiErrorDetail(data && (data.detail ?? data.message));
      if (!errorMessage) {
        errorMessage =
          response.status === 403
            ? "Bạn không có quyền thực hiện thao tác này."
            : `Lỗi hệ thống (${response.status})${response.statusText ? `: ${response.statusText}` : ""}`;
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.warn(`[API] Yêu cầu ${options.method || "GET"} ${endpoint} thất bại:`, error.message);
    throw error;
  }
}

export default {
  get: (endpoint, options) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options) =>
    request(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body, options) =>
    request(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: "DELETE" }),
};
