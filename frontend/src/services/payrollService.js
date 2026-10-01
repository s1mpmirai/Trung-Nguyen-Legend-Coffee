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
   FALLBACK DATA – Dùng khi backend chưa kết nối hoặc demo
   ═══════════════════════════════════════════════════════════════ */

export const FALLBACK_PAYROLL = {
  ma_bl: 2,
  thang: 8,
  nam: 2026,
  ma_nv: "NV02",
  ho_ten: "Nguyễn Thị Minh Tâm",
  luong_co_ban: 35000000,
  he_so_luong: 2.2,
  so_cong_chuan: 22,
  so_cong_thuc_te: 22,
  so_gio_tang_ca: 2,
  luong_theo_cong: 35000000,
  tien_tang_ca: 477273,
  tong_phu_cap: 3000000,
  tien_thuong: 0,
  luong_gross: 38477273,
  bhxh: 2800000,
  bhyt: 525000,
  bhtn: 350000,
  thue_tncn: 4000000,
  khau_tru_khac: 0,
  tong_khau_tru: 7675000,
  luong_net: 30802273,
  trang_thai: "DA_DUYET",
  ghi_chu: null,
  hasData: true,
};

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
 * Nếu chưa có trạng thái hoặc tháng chưa có lương -> hiển thị "Đang cập nhật"
 */
export function mapPayrollStatus(status) {
  const map = {
    NHAP: { label: "Đang xử lý", color: "warning" },
    DA_DUYET: { label: "Đã chốt", color: "info" },
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
   API CALLS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Lấy bảng lương 1 tháng cụ thể.
 * - Trả về Object đầy đủ nếu tháng đó ĐÃ CÓ dữ liệu trong DB.
 * - Trả về null nếu tháng đó CHƯA CÓ lương (hiển thị "Đang cập nhật").
 */
export async function getPayrollMonth(maNv, thang, nam) {
  try {
    const data = await apiClient.get(
      `/payroll/${maNv}/month?thang=${thang}&nam=${nam}`
    );
    if (data && (data.ma_bl != null || data.luong_net != null)) {
      return { ...data, hasData: true };
    }
    return null;
  } catch (error) {
    // Nếu API trả về 404 (Không tìm thấy bảng lương trong DB)
    if (error?.status === 404 || error?.message?.includes("404")) {
      return null;
    }
    // Khi lỗi kết nối ngoại lệ, chỉ fallback cho tháng mẫu 8/2026
    if (thang === 8 && nam === 2026) {
      return { ...FALLBACK_PAYROLL, thang, nam, ma_nv: maNv, hasData: true };
    }
    return null;
  }
}

/**
 * Lấy danh sách tháng đã có bảng lương của nhân viên
 */
export async function getPayrollMonths(maNv) {
  try {
    const data = await apiClient.get(`/payroll/${maNv}/months`);
    return data?.items || [];
  } catch (error) {
    console.info("[payrollService] Không thể lấy danh sách tháng:", error.message);
    return [{ thang: 8, nam: 2026, trang_thai: "DA_DUYET", luong_net: 30802273 }];
  }
}

/**
 * Lấy tổng hợp lương cả năm
 */
export async function getPayrollYearSummary(maNv, nam) {
  try {
    return await apiClient.get(`/payroll/${maNv}/year?nam=${nam}`);
  } catch (error) {
    console.info("[payrollService] Dữ liệu tổng hợp năm:", error.message);
    return null;
  }
}
