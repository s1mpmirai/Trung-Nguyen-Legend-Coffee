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
   QUY TẮC TÍNH LƯƠNG (đồng bộ với backend payroll_service.py)
   Dùng cho phần giải thích công thức trên phiếu lương của nhân viên.
   ═══════════════════════════════════════════════════════════════ */
export const PAYROLL_RULES = {
  TY_LE_HUONG_THU_VIEC: 0.85,
  TY_LE_BHXH: 0.08,
  TY_LE_BHYT: 0.015,
  TY_LE_BHTN: 0.01,
  TRAN_BHXH_BHYT: 46_800_000,
  TRAN_BHTN: 106_200_000,
  GIAM_TRU_BAN_THAN: 15_500_000,
  GIAM_TRU_NGUOI_PHU_THUOC: 6_200_000,
  THUE_SUAT_THU_VIEC: 0.1,
  NGUONG_KHAU_TRU_THU_VIEC: 2_000_000,
  NGUONG_NGAY_KHONG_DONG_BH: 14,
  // Biểu thuế lũy tiến từng phần theo thu nhập tính thuế/tháng: [mức trần bậc, thuế suất]
  BIEU_THUE: [
    [10_000_000, 0.05],
    [30_000_000, 0.1],
    [60_000_000, 0.2],
    [100_000_000, 0.3],
    [Infinity, 0.35],
  ],
};

/**
 * Tách thuế TNCN lũy tiến thành từng bậc để hiển thị cách tính.
 * Trả về [{ bac, tu, den, thueSuat, phanThuNhap, thue }]
 */
export function breakdownProgressiveTax(thuNhapTinhThue) {
  const income = Math.max(0, Number(thuNhapTinhThue) || 0);
  const rows = [];
  let mucDuoi = 0;
  PAYROLL_RULES.BIEU_THUE.forEach(([mucTran, thueSuat], idx) => {
    if (income <= mucDuoi) return;
    const phan = Math.min(income, mucTran) - mucDuoi;
    rows.push({
      bac: idx + 1,
      tu: mucDuoi,
      den: mucTran,
      thueSuat,
      phanThuNhap: phan,
      thue: phan * thueSuat,
    });
    mucDuoi = mucTran;
  });
  return rows;
}

/**
 * Nhận biết bảng lương áp dụng chế độ thử việc (85% lương, không đóng BH, khấu trừ 10%).
 * Backend ghi chú "Thử việc..." và không áp dụng giảm trừ gia cảnh cho HĐ thử việc.
 */
export function isProbationPayroll(payroll) {
  if (!payroll) return false;
  if (/thử việc/i.test(payroll.ghi_chu || "")) return true;
  return Number(payroll.luong_gross) > 0 && Number(payroll.giam_tru_gia_canh) === 0;
}

/* ═══════════════════════════════════════════════════════════════
   API CALLS - DÀNH CHO NHÂN VIÊN
   ═══════════════════════════════════════════════════════════════ */

/**
 * Bảng lương 1 tháng. Nhân viên chỉ nhận bảng lương ĐÃ DUYỆT / ĐÃ TRẢ;
 * tháng còn ở bản nháp hoặc chưa tính -> API trả null (200 OK).
 * options.signal: AbortSignal để hủy yêu cầu cũ khi đổi tháng liên tục.
 */
export async function getPayrollMonth(maNv, thang, nam, options = {}) {
  const data = await apiClient.get(`/payroll/${maNv}/month`, {
    params: { thang, nam },
    signal: options.signal,
  });
  if (data && (data.ma_bl != null || data.luong_net != null)) {
    return { ...data, hasData: true };
  }
  return null;
}

export async function getPayrollMonths(maNv) {
  const data = await apiClient.get(`/payroll/${maNv}/months`);
  return data?.items || [];
}

export async function getPayrollYearSummary(maNv, nam, options = {}) {
  return apiClient.get(`/payroll/${maNv}/year`, { params: { nam }, signal: options.signal });
}

/* ═══════════════════════════════════════════════════════════════
   API CALLS - DÀNH CHO QUẢN LÝ
   ═══════════════════════════════════════════════════════════════ */

/**
 * Lấy bảng lương tháng của toàn bộ nhân viên
 * GET /api/v1/payroll/company-summary?thang=...&nam=...
 */
export async function getCompanyPayroll(thang, nam) {
  return apiClient.get("/payroll/company-summary", { params: { thang, nam } });
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
