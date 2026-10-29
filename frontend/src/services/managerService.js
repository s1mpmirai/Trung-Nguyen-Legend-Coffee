/**
 * managerService.js
 *
 * Tổng hợp số liệu cho Dashboard Cổng Quản lý. Toàn bộ số liệu lấy từ CSDL thật qua API.
 * Các API được gọi song song bằng Promise.allSettled: một API lỗi (mạng / 403 không đủ quyền)
 * không làm trống cả Dashboard; khối tương ứng nhận thông báo lỗi riêng qua `errors`.
 */

import apiClient from "./apiClient";

const DEPT_COLORS = [
  "#0284c7", // sky-600
  "#0ea5e9", // sky-500
  "#38bdf8", // sky-400
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#6366f1", // indigo-500
  "#8b5cf6", // purple-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
];

const EDUCATION_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#94a3b8"];
const TENURE_COLORS = ["bg-sky-400", "bg-sky-500", "bg-sky-600", "bg-emerald-500"];

const CONTRACT_TYPE_LABELS = {
  THU_VIEC: { label: "HĐ Thử việc", badge: "bg-amber-50 text-amber-700 border-amber-200", action: "Đánh giá thử việc" },
  XAC_DINH_1_NAM: { label: "HĐ Xác định 1 năm", badge: "bg-sky-50 text-sky-700 border-sky-200", action: "Chuẩn bị tái ký" },
  XAC_DINH_3_NAM: { label: "HĐ Xác định 3 năm", badge: "bg-sky-50 text-sky-700 border-sky-200", action: "Chuẩn bị tái ký" },
  THOI_VU: { label: "HĐ Thời vụ", badge: "bg-slate-50 text-slate-700 border-slate-200", action: "Theo dõi gia hạn" },
};

const formatDateVN = (isoDate) => {
  if (!isoDate) return "";
  const [y, m, d] = String(isoDate).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

const formatMoneyShort = (value) => {
  const num = Number(value) || 0;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)} tỷ`;
  return `${(num / 1e6).toFixed(1)} tr`;
};

const valueOf = (settled) => (settled.status === "fulfilled" ? settled.value : null);

/** Thông báo lỗi ngắn gọn cho từng khối Dashboard (null nếu tải thành công) */
const errorOf = (settled) => {
  if (settled.status === "fulfilled") return null;
  const err = settled.reason || {};
  if (err.status === 403) return "Bạn không có quyền xem số liệu này.";
  return err.message ? `Không tải được dữ liệu: ${err.message}` : "Không tải được dữ liệu.";
};

/** Tháng liền trước: bảng lương được tính sau khi kết thúc tháng */
const previousMonth = () => {
  const now = new Date();
  return now.getMonth() === 0
    ? { thang: 12, nam: now.getFullYear() - 1 }
    : { thang: now.getMonth(), nam: now.getFullYear() };
};

export const getManagerDashboardStats = async () => {
  const kyLuong = previousMonth();
  const [empSettled, attSettled, leaveSettled, payrollSettled, trendSettled, statsSettled, profileSettled] =
    await Promise.allSettled([
      apiClient.get("/employees/get_employee_list", { params: { page: 1, page_size: 200 } }),
      apiClient.get("/attendance/daily"),
      apiClient.get("/leaves/pending"),
      apiClient.get("/payroll/summary", { params: kyLuong }),
      apiClient.get("/attendance/trend", { params: { days: 7 } }),
      apiClient.get("/employees/reports/statistics"),
      apiClient.get("/employees/manager/profile-requests", { params: { trang_thai: "CHO_DUYET" } }),
    ]);

  // 1. Quân số & cơ cấu phòng ban (nhân sự đang làm việc)
  const employees = valueOf(empSettled)?.items || [];
  const activeEmps = employees.filter((emp) => emp.trang_thai === "DANG_LAM");
  const totalEmployees = activeEmps.length;
  const deptMap = {};
  activeEmps.forEach((emp) => {
    const deptName = emp.ten_pb || "Chưa phân bổ";
    deptMap[deptName] = (deptMap[deptName] || 0) + 1;
  });
  const departments = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], idx) => ({
      id: name,
      name,
      count,
      color: DEPT_COLORS[idx % DEPT_COLORS.length],
    }));

  // 2. Chấm công hôm nay
  const daily = valueOf(attSettled) || [];
  const isCheckedIn = (item) =>
    Boolean(item.gio_vao && item.gio_vao !== "--:--" && item.gio_vao !== "-" && item.loai_cong !== "CHUA_CHAM");
  const activeToday = daily.filter(isCheckedIn).length;
  const lateToday = daily.filter((item) => isCheckedIn(item) && item.loai_cong === "DI_TRE").length;
  const onTimeToday = activeToday - lateToday;

  // 3. Đơn chờ duyệt (đã lọc theo phạm vi quản lý ở backend) & yêu cầu sửa hồ sơ chờ duyệt
  const pendingLeavesCount = (valueOf(leaveSettled) || []).length;
  const profileRequests = valueOf(profileSettled);
  const pendingProfileCount = Array.isArray(profileRequests) ? profileRequests.length : null;

  // 4. Quỹ lương tháng trước
  const payroll = valueOf(payrollSettled);
  const hasPayroll = payroll && payroll.tong_nhan_vien > 0;

  // 5. Xu hướng chấm công 7 ngày làm việc gần nhất
  const attendance7Days = (valueOf(trendSettled) || []).map((d) => ({
    label: d.la_hom_nay ? "Nay" : d.thu,
    date: formatDateVN(d.ngay).slice(0, 5),
    onTime: d.dung_gio,
    late: d.di_tre,
    total: d.tong_nhan_su,
  }));

  // 6. Thống kê trình độ, thâm niên, quỹ lương phòng ban, hợp đồng sắp hết hạn
  const stats = valueOf(statsSettled);
  const education = stats
    ? stats.trinh_do.map((t, idx) => ({
        label: t.nhom,
        count: t.so_luong,
        percentage: t.ty_le,
        color: EDUCATION_COLORS[idx % EDUCATION_COLORS.length],
      }))
    : null;
  const tenure = stats
    ? {
        averageYears: stats.tham_nien_trung_binh,
        totalEmployees: stats.tong_nhan_su,
        brackets: stats.tham_nien.map((t, idx) => ({
          label: t.nhom,
          percentage: t.ty_le,
          count: t.so_luong,
          color: TENURE_COLORS[idx % TENURE_COLORS.length],
        })),
      }
    : null;
  const salaryByDept = stats
    ? {
        totalCost: formatMoneyShort(stats.luong_theo_phong_ban.reduce((sum, d) => sum + d.tong_quy_luong, 0)),
        averageSalary: formatMoneyShort(stats.luong_trung_binh),
        salaryRange: `${formatMoneyShort(stats.luong_thap_nhat)} – ${formatMoneyShort(stats.luong_cao_nhat)}`,
        brackets: stats.muc_luong,
        departments: stats.luong_theo_phong_ban.map((d) => ({
          name: d.ten_pb,
          employees: d.so_nhan_su,
          totalBudget: formatMoneyShort(d.tong_quy_luong),
          avgSalary: `${formatMoneyShort(d.luong_trung_binh)}/tháng`,
        })),
      }
    : null;
  const expiringContracts = stats
    ? stats.hop_dong_sap_het_han.map((c) => {
        const meta = CONTRACT_TYPE_LABELS[c.loai_hd] || CONTRACT_TYPE_LABELS.THOI_VU;
        return {
          contractId: c.ma_hd,
          employeeId: c.ma_nv,
          name: c.ho_ten,
          role: c.ten_cv || "",
          dept: c.ten_pb || "",
          type: meta.label,
          typeBadge: meta.badge,
          endDate: formatDateVN(c.ngay_ket_thuc),
          remainingDays: c.so_ngay_con_lai,
          action: meta.action,
        };
      })
    : [];

  return {
    summary: {
      totalEmployees,
      fullTimeCount: activeEmps.filter((e) => (e.hinh_thuc_lam_viec || "FULL_TIME") === "FULL_TIME").length,
      partTimeCount: activeEmps.filter((e) => e.hinh_thuc_lam_viec === "PART_TIME").length,
      attendanceRate: totalEmployees > 0 ? ((activeToday / totalEmployees) * 100).toFixed(1) : "0.0",
      activeToday,
      onTimeToday,
      lateToday,
      notCheckedIn: Math.max(0, totalEmployees - activeToday),
      pendingLeavesCount,
      pendingProfileCount,
      totalPendingCount: pendingLeavesCount + (pendingProfileCount || 0),
      monthlyPayroll: hasPayroll
        ? `${Number(payroll.tong_tien_net).toLocaleString("vi-VN")} đ`
        : `Chưa tính lương T${kyLuong.thang}/${kyLuong.nam}`,
      payrollPeriod: `Kỳ lương tháng ${kyLuong.thang}/${kyLuong.nam}`,
      payrollStatus: hasPayroll ? `${payroll.tong_nhan_vien} nhân sự có bảng lương` : "Chưa có bảng lương",
    },
    departments,
    attendance7Days,
    expiringContracts,
    education,
    tenure,
    salaryByDept,
    errors: {
      employees: errorOf(empSettled),
      attendanceToday: errorOf(attSettled),
      leaves: errorOf(leaveSettled),
      profileRequests: errorOf(profileSettled),
      payroll: errorOf(payrollSettled),
      trend: errorOf(trendSettled),
      statistics: errorOf(statsSettled),
    },
  };
};
