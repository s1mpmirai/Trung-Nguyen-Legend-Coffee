/**
 * payrollService.js
 *
 * Tầng giao tiếp dữ liệu cho module Bảng Lương & Phiếu Thu Nhập.
 * Hỗ trợ cả chức năng Nhân viên (cá nhân) và Quản lý (toàn công ty).
 */

import apiClient from "./apiClient";

/* ═══════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Format số tiền VNĐ: 24850000 → "24.850.000"
 */
export function formatMoney(value) {
  if (value == null || isNaN(value)) return "0";
  return Math.round(Number(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Map trạng thái lương sang nhãn hiển thị.
 */
export function mapPayrollStatus(status) {
  const map = {
    NHAP: { label: "Đang xử lý", color: "warning" },
    DA_DUYET: { label: "Đã xác nhận", color: "success" },
    DA_TRA: { label: "Đã chi trả", color: "success" },
    DANG_CAP_NHAT: { label: "Đang cập nhật", color: "warning" },
  };
  if (!status || !map[status]) {
    return { label: "Đang cập nhật", color: "warning" };
  }
  return map[status];
}

/**
 * Tính phần trăm thực nhận so với gross
 */
export function calcNetRatio(gross, net) {
  if (!gross || gross === 0) return { netPct: 0, deductPct: 0 };
  const netPct = ((net / gross) * 100).toFixed(1);
  const deductPct = (100 - netPct).toFixed(1);
  return { netPct: parseFloat(netPct), deductPct: parseFloat(deductPct) };
}

/* ═══════════════════════════════════════════════════════════════
   API CALLS - DÀNH CHO NHÂN VIÊN
   ═══════════════════════════════════════════════════════════════ */

export async function getPayrollMonth(maNv, thang, nam) {
  // API trả null (200 OK) khi tháng đó chưa có bảng lương
  const data = await apiClient.get(`/payroll/${maNv}/month`, { params: { thang, nam } });
  if (data && (data.ma_bl != null || data.luong_net != null)) {
    return { ...data, hasData: true };
  }
  return null;
}

export async function getPayrollMonths(maNv) {
  const data = await apiClient.get(`/payroll/${maNv}/months`);
  return data?.items || [];
}

export async function getPayrollYearSummary(maNv, nam) {
  return apiClient.get(`/payroll/${maNv}/year`, { params: { nam } });
}

/* ═══════════════════════════════════════════════════════════════
   API CALLS - DÀNH CHO QUẢN LÝ
   ═══════════════════════════════════════════════════════════════ */

/**
 * Lấy bảng lương tháng của toàn bộ nhân viên
 * GET /api/v1/payroll/company-summary?thang=...&nam=...
 */
export async function getCompanyPayroll(thang, nam) {
  try {
    return await apiClient.get("/payroll/company-summary", { params: { thang, nam } });
  } catch (e) {
    console.error("Error fetching company payroll:", e);
    return null;
  }
}

/**
 * Tính toán tự động bảng lương tháng từ bảng chấm công đã chốt
 * POST /api/v1/payroll/calculate
 */
export async function calculatePayroll(thang, nam) {
  return apiClient.post("/payroll/calculate", { thang, nam });
}

/**
 * Cập nhật trạng thái duyệt / chi trả bảng lương (NHAP -> DA_DUYET -> DA_TRA)
 * PUT /api/v1/payroll/{ma_bl}/status
 */
export async function updatePayrollStatus(ma_bl, trang_thai) {
  return apiClient.put(`/payroll/${ma_bl}/status`, { trang_thai });
}
