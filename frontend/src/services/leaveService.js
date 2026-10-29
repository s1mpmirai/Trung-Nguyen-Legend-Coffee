/**
 * Service kết nối dữ liệu Đơn từ & Nghỉ phép trực tiếp từ Backend API
 * Theo định nghĩa tại api_link.txt
 */

import apiClient from "./apiClient";

/**
 * [Nhân viên] Lịch sử đơn từ của cá nhân
 * GET /api/v1/leaves/my-history/{ma_nv}
 * options.throwOnError = true: ném lỗi để giao diện hiển thị trạng thái lỗi thay vì danh sách rỗng
 */
export async function getLeaveHistory(ma_nv, options = {}) {
  try {
    const cleanId = String(ma_nv || "").trim().toUpperCase().replace("-", "");
    const data = await apiClient.get(`/leaves/my-history/${cleanId}`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (options.throwOnError) throw e;
    console.error("Error fetching leaves history:", e);
    return [];
  }
}

/**
 * [Nhân viên] Số dư phép năm do server tính (12 ngày + thâm niên, tính theo tỷ lệ năm đầu)
 * GET /api/v1/leaves/balance/{ma_nv}?nam=YYYY
 * -> { ma_nv, nam, tong_phep_nam, da_su_dung, dang_cho_duyet, con_lai, han_dung_phep }
 * Ném lỗi khi không tải được để giao diện hiển thị trạng thái lỗi (không dùng số giả).
 */
export async function getLeaveBalance(ma_nv, nam = null) {
  const cleanId = String(ma_nv || "").trim().toUpperCase().replace("-", "");
  return apiClient.get(`/leaves/balance/${cleanId}`, { params: { nam: nam || undefined } });
}

/**
 * [Quản lý] Lấy danh sách đơn từ nhân viên (Trưởng nhóm chỉ thấy đơn của cấp dưới)
 * GET /api/v1/leaves/all (kèm bộ lọc trạng thái: CHO_DUYET, DA_DUYET, TU_CHOI, DA_HUY)
 */
export async function getAllLeavesForManager(trang_thai = null) {
  const data = await apiClient.get("/leaves/all", { params: { trang_thai: trang_thai || undefined } });
  return Array.isArray(data) ? data : [];
}

/**
 * [Quản lý] Lấy danh sách đơn từ đang chờ duyệt
 * GET /api/v1/leaves/pending
 */
export async function getPendingLeavesForManager() {
  const data = await apiClient.get("/leaves/pending");
  return Array.isArray(data) ? data : [];
}

/**
 * [Quản lý] Phê duyệt hoặc Từ chối đơn từ
 * PUT /api/v1/leaves/{ma_don}/review
 * Body: { trang_thai: "DA_DUYET" | "TU_CHOI", y_kien_duyet: string }
 * Người duyệt được backend lấy từ tài khoản đang đăng nhập.
 */
export async function reviewLeave(ma_don, { trang_thai, y_kien_duyet }) {
  return apiClient.put(`/leaves/${encodeURIComponent(ma_don)}/review`, {
    trang_thai,
    y_kien_duyet: y_kien_duyet || (trang_thai === "DA_DUYET" ? "Đồng ý phê duyệt" : ""),
  });
}

/**
 * [Nhân viên] Gửi đơn xin nghỉ phép/nghỉ việc
 * POST /api/v1/leaves/request
 * Server tự tính so_ngay (ngày làm việc, trừ ngày lễ); chỉ gửi so_ngay = 0.5 khi xin nghỉ nửa ngày.
 */
export async function submitLeaveRequest(leaveData) {
  return apiClient.post("/leaves/request", leaveData);
}

/**
 * [Nhân viên] Hủy đơn đang chờ duyệt
 * PUT /api/v1/leaves/{ma_don}/cancel
 */
export async function cancelLeaveRequest(ma_don) {
  return apiClient.put(`/leaves/${encodeURIComponent(ma_don)}/cancel`, {});
}
