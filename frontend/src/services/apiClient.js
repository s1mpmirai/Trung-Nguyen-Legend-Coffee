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
    const response = await fetch(url, config);

    // Xử lý status 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        (data && (data.detail || data.message)) ||
        `Lỗi hệ thống (${response.status}): ${response.statusText}`;
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
