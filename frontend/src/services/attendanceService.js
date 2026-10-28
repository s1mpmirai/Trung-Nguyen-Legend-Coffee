/**
 * Service kết nối dữ liệu Chấm công & Nhân sự
 * Ánh xạ 100% với cấu trúc Database Schema (bang_cham_cong, nhan_vien, phong_ban, chot_cong_thang)
 * Mọi request đi qua apiClient để tự gắn token đăng nhập.
 */

import apiClient from "./apiClient";

const cleanMaNv = (ma_nv) => String(ma_nv || "").trim().toUpperCase().replace("-", "");

/**
 * Lấy dữ liệu bảng chấm công của nhân viên (null nếu không tải được)
 */
export async function getAttendanceDashboardData(ma_nv) {
  try {
    return await apiClient.get(`/attendance/dashboard/${cleanMaNv(ma_nv)}`);
  } catch (e) {
    console.error("Error fetching dashboard from API:", e);
    return null;
  }
}

async function postCheck(endpoint, ma_nv, location, fallbackMessage) {
  try {
    // Backend luôn chấm công cho chính tài khoản đang đăng nhập (theo token)
    return await apiClient.post(endpoint, { ma_nv: cleanMaNv(ma_nv), location });
  } catch (e) {
    return { success: false, message: e.message || fallbackMessage };
  }
}

/**
 * Thực hiện chấm công vào ca (Check-in)
 */
export async function checkInAttendance(ma_nv, locationData) {
  return postCheck("/attendance/check-in", ma_nv, locationData, "Không thể kết nối đến máy chủ chấm công");
}

/**
 * Thực hiện chấm công ra ca (Check-out)
 */
export async function checkOutAttendance(ma_nv, locationData) {
  return postCheck("/attendance/check-out", ma_nv, locationData, "Không thể kết nối đến máy chủ chấm công");
}

/**
 * Lấy danh sách lịch sử chấm công chi tiết theo tháng/năm
 */
export async function getAttendanceHistory(ma_nv, month = null, year = null) {
  try {
    return await apiClient.get(`/attendance/history/${cleanMaNv(ma_nv)}`, {
      params: { month: month || undefined, year: year || undefined },
    });
  } catch (e) {
    console.error("Error fetching attendance history:", e);
    return { month, year, summary: {}, records: [] };
  }
}

/**
 * [Quản lý] Bảng chấm công theo ngày của toàn công ty/phòng ban
 * GET /api/v1/attendance/daily?ngay=...&ma_pb=...
 */
export async function getDailyAttendanceForManager(ngay = null, ma_pb = null) {
  try {
    return await apiClient.get("/attendance/daily", {
      params: { ngay: ngay || undefined, ma_pb: ma_pb && ma_pb !== "all" ? ma_pb : undefined },
    });
  } catch (e) {
    console.error("Error fetching daily attendance for manager:", e);
    return [];
  }
}

/**
 * [Quản lý] Bảng tổng hợp công tháng của tất cả nhân viên
 * GET /api/v1/attendance/summary?thang=...&nam=...&ma_pb=...
 */
export async function getMonthlyAttendanceSummaryForManager(thang = null, nam = null, ma_pb = null) {
  try {
    return await apiClient.get("/attendance/summary", {
      params: {
        thang: thang || undefined,
        nam: nam || undefined,
        ma_pb: ma_pb && ma_pb !== "all" ? ma_pb : undefined,
      },
    });
  } catch (e) {
    console.error("Error fetching monthly attendance summary for manager:", e);
    return [];
  }
}

/**
 * [Quản lý] Điều chỉnh thông tin chấm công / duyệt giải trình
 * PUT /api/v1/attendance/{ma_cc}/adjust
 */
export async function adjustAttendanceRecord(ma_cc, data) {
  return apiClient.put(`/attendance/${ma_cc}/adjust`, data);
}

/**
 * [Quản lý] Danh mục tất cả các ca làm việc
 * GET /api/v1/attendance/shifts
 */
export async function getShifts() {
  try {
    return await apiClient.get("/attendance/shifts");
  } catch (e) {
    console.error("Error fetching shifts:", e);
    return [];
  }
}

/**
 * [Quản lý] Xu hướng chấm công N ngày làm việc gần nhất
 * GET /api/v1/attendance/trend?days=7
 */
export async function getAttendanceTrend(days = 7) {
  return apiClient.get("/attendance/trend", { params: { days } });
}

/**
 * [Quản lý] Lấy trạng thái Chốt/Khóa bảng công tháng
 * GET /api/v1/attendance/lock-status?thang=...&nam=...
 */
export async function getAttendanceLockStatus(thang, nam) {
  try {
    return await apiClient.get("/attendance/lock-status", { params: { thang, nam } });
  } catch (e) {
    console.error("Error fetching attendance lock status:", e);
    return { thang, nam, is_locked: false };
  }
}

/**
 * [Quản lý] Chốt hoặc Mở khóa bảng công tháng
 * POST /api/v1/attendance/toggle-lock
 */
export async function toggleAttendanceLock(data) {
  return apiClient.post("/attendance/toggle-lock", data);
}
