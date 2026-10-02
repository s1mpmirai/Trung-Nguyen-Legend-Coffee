/**
 * Service kết nối dữ liệu Đơn từ & Nghỉ phép trực tiếp từ Backend API
 * Theo định nghĩa tại api_link.txt
 */

import apiClient from "./apiClient";

/**
 * [Nhân viên] Lịch sử đơn từ của cá nhân
 * GET /api/v1/leaves/my-history/{ma_nv} (hoặc /api/v1/leaves/history/{ma_nv})
 */
export async function getLeaveHistory(ma_nv = 'NV10') {
  try {
    const cleanId = (ma_nv || 'NV10').toString().trim().toUpperCase().replace('-', '');
    const token = localStorage.getItem("access_token") || localStorage.getItem("auth_token");
    const res = await fetch(`/api/v1/leaves/my-history/${cleanId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    // Fallback thử endpoint history cũ nếu my-history trả về 404
    const fallbackRes = await fetch(`/api/v1/leaves/history/${cleanId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error('Error fetching leaves history:', e);
  }
  return [];
}

/**
 * [Quản lý] Lấy danh sách tất cả đơn từ nhân viên
 * GET /api/v1/leaves/all (kèm bộ lọc trạng thái: CHO_DUYET, DA_DUYET, TU_CHOI, DA_HUY)
 */
export async function getAllLeavesForManager(trang_thai = null) {
  try {
    const token = localStorage.getItem("access_token") || localStorage.getItem("auth_token");
    const url = trang_thai
      ? `/api/v1/leaves/all?trang_thai=${encodeURIComponent(trang_thai)}`
      : `/api/v1/leaves/all`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error('Error fetching all leaves for manager:', e);
  }
  return [];
}

/**
 * [Quản lý] Lấy danh sách đơn từ đang chờ duyệt
 * GET /api/v1/leaves/pending
 */
export async function getPendingLeavesForManager() {
  try {
    const token = localStorage.getItem("access_token") || localStorage.getItem("auth_token");
    const res = await fetch(`/api/v1/leaves/pending`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error('Error fetching pending leaves for manager:', e);
  }
  return [];
}

/**
 * [Quản lý] Phê duyệt hoặc Từ chối đơn từ
 * PUT /api/v1/leaves/{ma_don}/review
 * Body: { trang_thai: "DA_DUYET" | "TU_CHOI", nguoi_duyet: "NV01", y_kien_duyet: string }
 */
export async function reviewLeave(ma_don, { trang_thai, nguoi_duyet, y_kien_duyet }) {
  const token = localStorage.getItem("access_token") || localStorage.getItem("auth_token");
  const cleanReviewer = (nguoi_duyet || localStorage.getItem("user_ma_nv") || "NV01")
    .toString()
    .trim()
    .toUpperCase()
    .replace("-", "");

  const response = await fetch(`/api/v1/leaves/${encodeURIComponent(ma_don)}/review`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      trang_thai,
      nguoi_duyet: cleanReviewer,
      y_kien_duyet: y_kien_duyet || (trang_thai === "DA_DUYET" ? "Đồng ý phê duyệt" : "Từ chối đơn"),
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.detail || `Lỗi xử lý duyệt đơn: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * [Nhân viên] Gửi đơn xin nghỉ phép/nghỉ việc
 * POST /api/v1/leaves/request
 */
export async function submitLeaveRequest(leaveData) {
  const token = localStorage.getItem("access_token") || localStorage.getItem("auth_token");
  const response = await fetch("/api/v1/leaves/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(leaveData),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.detail || "Lỗi khi gửi đơn xin nghỉ");
  }

  return await response.json();
}
