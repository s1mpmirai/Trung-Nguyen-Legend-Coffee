/**
 * payrollService.js
 *
 * Tầng giao tiếp dữ liệu cho module Bảng Lương & Phiếu Thu Nhập.
 * Hỗ trợ cả chức năng Nhân viên (cá nhân) và Quản lý (toàn công ty).
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
  luong_theo_cong: 35000000,
  tong_phu_cap: 3000000,
  tien_thuong: 0,
  luong_gross: 38000000,
  bhxh: 2800000,
  bhyt: 525000,
  bhtn: 350000,
  thue_tncn: 4000000,
  khau_tru_khac: 0,
  tong_khau_tru: 7675000,
  luong_net: 30325000,
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
  try {
    const data = await apiClient.get(
      `/payroll/${maNv}/month?thang=${thang}&nam=${nam}`
    );
    if (data && (data.ma_bl != null || data.luong_net != null)) {
      return { ...data, hasData: true };
    }
    return null;
  } catch (error) {
    if (error?.status === 404 || error?.message?.includes("404")) {
      return null;
    }
    if (thang === 8 && nam === 2026) {
      return { ...FALLBACK_PAYROLL, thang, nam, ma_nv: maNv, hasData: true };
    }
    return null;
  }
}

export async function getPayrollMonths(maNv) {
  try {
    const data = await apiClient.get(`/payroll/${maNv}/months`);
    return data?.items || [];
  } catch (error) {
    console.info("[payrollService] Không thể lấy danh sách tháng:", error.message);
    return [{ thang: 8, nam: 2026, trang_thai: "DA_DUYET", luong_net: 30802273 }];
  }
}

export async function getPayrollYearSummary(maNv, nam) {
  try {
    const data = await apiClient.get(`/payroll/${maNv}/year?nam=${nam}`);
    if (data && (data.tong_gross > 0 || (data.chi_tiet_thang && data.chi_tiet_thang.length > 0))) {
      return data;
    }
    if (nam === 2026) {
      return getFallbackYearSummary(maNv, 2026);
    }
    return data;
  } catch (error) {
    console.info(`[payrollService] Lấy dữ liệu tổng hợp năm ${nam} cho ${maNv}:`, error.message);
    if (nam === 2026) {
      return getFallbackYearSummary(maNv, 2026);
    }
    return null;
  }
}

function getFallbackYearSummary(maNv, nam) {
  const baseMonth = FALLBACK_PAYROLL;
  const chiTiet = [
    {
      thang: 8,
      nam: nam,
      so_cong_thuc_te: baseMonth.so_cong_thuc_te,
      luong_gross: baseMonth.luong_gross,
      tong_khau_tru: baseMonth.tong_khau_tru,
      luong_net: baseMonth.luong_net,
      trang_thai: baseMonth.trang_thai,
    },
  ];

  return {
    ma_nv: maNv || baseMonth.ma_nv,
    ho_ten: baseMonth.ho_ten,
    nam: nam,
    so_thang_co_luong: chiTiet.length,
    tong_gross: baseMonth.luong_gross,
    tong_net: baseMonth.luong_net,
    tong_khau_tru: baseMonth.tong_khau_tru,
    tong_bhxh: baseMonth.bhxh,
    tong_bhyt: baseMonth.bhyt,
    tong_bhtn: baseMonth.bhtn,
    tong_thue_tncn: baseMonth.thue_tncn,
    tong_cong_thuc_te: baseMonth.so_cong_thuc_te,
    chi_tiet_thang: chiTiet,
  };
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
    const res = await fetch(`/api/v1/payroll/company-summary?thang=${thang}&nam=${nam}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error fetching company payroll:', e);
  }
  return null;
}

/**
 * Tính toán tự động bảng lương tháng từ bảng chấm công
 * POST /api/v1/payroll/calculate
 */
export async function calculatePayroll(thang, nam) {
  const res = await fetch('/api/v1/payroll/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thang, nam }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const msg = errData?.detail || errData?.message || `Lỗi tính lương (${res.status})`;
    throw new Error(msg);
  }
  return await res.json();
}

/**
 * Cập nhật trạng thái duyệt / chi trả bảng lương
 * PUT /api/v1/payroll/{ma_bl}/status
 */
export async function updatePayrollStatus(ma_bl, trang_thai) {
  const res = await fetch(`/api/v1/payroll/${ma_bl}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trang_thai }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const msg = errData?.detail || errData?.message || `Lỗi cập nhật trạng thái bảng lương (${res.status})`;
    throw new Error(msg);
  }
  return await res.json();
}
