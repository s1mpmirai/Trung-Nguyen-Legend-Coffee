/**
 * payrollService.js
 *
 * Tầng giao tiếp dữ liệu cho module Bảng Lương & Phiếu Thu Nhập.
 *
 * API Backend khả dụng:
 *   GET /api/v1/payroll/{ma_nv}/month?thang=8&nam=2026  → Chi tiết lương 1 tháng
 *   GET /api/v1/payroll/{ma_nv}/months                  → Danh sách tháng đã có lương
 *   GET /api/v1/payroll/{ma_nv}/year?nam=2026            → Tổng hợp lương cả năm
 */

import apiClient from "./apiClient";

/* ═══════════════════════════════════════════════════════════════
   FALLBACK DATA – Dùng khi backend chưa kết nối hoặc DB rỗng
   ═══════════════════════════════════════════════════════════════ */

export const FALLBACK_PAYROLL = {
  ma_bl: 0,
  thang: 10,
  nam: 2023,
  ma_nv: "NV02",
  ho_ten: "Nguyễn Thị Minh Tâm",
  luong_co_ban: 25000000,
  he_so_luong: 2.2,
  so_cong_chuan: 22,
  so_cong_thuc_te: 22,
  so_gio_tang_ca: 0,
  luong_theo_cong: 25000000,
  tien_tang_ca: 0,
  tong_phu_cap: 3000000,
  tien_thuong: 1350000,
  luong_gross: 29350000,
  bhxh: 2000000,
  bhyt: 375000,
  bhtn: 250000,
  thue_tncn: 1875000,
  khau_tru_khac: 0,
  tong_khau_tru: 4500000,
  luong_net: 24850000,
  trang_thai: "DA_TRA",
  ghi_chu: null,
};

export const FALLBACK_MONTHS = [
  { thang: 10, nam: 2023, trang_thai: "DA_TRA", luong_net: 24850000 },
  { thang: 9, nam: 2023, trang_thai: "DA_TRA", luong_net: 24200000 },
  { thang: 8, nam: 2023, trang_thai: "DA_TRA", luong_net: 25100000 },
];

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
 * Map trạng thái lương sang label hiển thị
 */
export function mapPayrollStatus(status) {
  const map = {
    NHAP: { label: "Đang xử lý", color: "warning" },
    DA_DUYET: { label: "Đã chốt", color: "info" },
    DA_TRA: { label: "Đã chi trả", color: "success" },
  };
  return map[status] || { label: "Chưa xác định", color: "default" };
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
   API CALLS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Lấy bảng lương 1 tháng cụ thể
 */
export async function getPayrollMonth(maNv, thang, nam) {
  try {
    const data = await apiClient.get(
      `/payroll/${maNv}/month?thang=${thang}&nam=${nam}`
    );
    return data;
  } catch (error) {
    console.info(
      `[payrollService] Sử dụng dữ liệu mẫu cho ${maNv} tháng ${thang}/${nam}:`,
      error.message
    );
    return { ...FALLBACK_PAYROLL, thang, nam, ma_nv: maNv };
  }
}

/**
 * Lấy danh sách tháng đã có bảng lương
 */
export async function getPayrollMonths(maNv) {
  try {
    const data = await apiClient.get(`/payroll/${maNv}/months`);
    return data.items || [];
  } catch (error) {
    console.info("[payrollService] Sử dụng danh sách tháng mẫu:", error.message);
    return FALLBACK_MONTHS;
  }
}

/**
 * Lấy tổng hợp lương cả năm
 */
export async function getPayrollYearSummary(maNv, nam) {
  try {
    return await apiClient.get(`/payroll/${maNv}/year?nam=${nam}`);
  } catch (error) {
    console.info("[payrollService] Sử dụng tổng hợp năm mẫu:", error.message);
    return {
      so_thang: 10,
      tong_gross: 293500000,
      tong_khau_tru: 45000000,
      tong_net: 248500000,
      tong_thuong: 13500000,
      tong_phu_cap: 30000000,
      tong_bhxh: 20000000,
      tong_bhyt: 3750000,
      tong_bhtn: 2500000,
      tong_thue_tncn: 18750000,
    };
  }
}
