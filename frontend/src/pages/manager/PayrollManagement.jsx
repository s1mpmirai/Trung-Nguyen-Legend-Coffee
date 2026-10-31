import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  Download,
  RefreshCw,
  Search,
  FileText,
  Printer,
  X,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Loader2,
  Banknote,
  BadgeCheck,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  getCompanyPayroll,
  calculatePayroll,
  updatePayrollStatus,
} from "../../services/payrollService";
import { getAttendanceLockStatus } from "../../services/attendanceService";
import ConfirmDialog, { useEscapeKey } from "./components/ConfirmDialog";
import { getApiErrorMessage } from "./managerUtils";

const formatVnd = (value) => (Number(value) || 0).toLocaleString("vi-VN");

const PAYROLL_STATUS_LABELS = {
  pending: "Nháp – chờ duyệt",
  ready: "Đã duyệt",
  paid: "Đã chi trả",
};

// Các thao tác chuyển trạng thái bảng lương (NHAP <-> DA_DUYET -> DA_TRA)
const STATUS_ACTIONS = {
  approve: { from: "pending", to: "DA_DUYET", label: "Duyệt bảng lương", tone: "primary" },
  reopen: { from: "ready", to: "NHAP", label: "Mở lại về Nháp", tone: "warning" },
  pay: { from: "ready", to: "DA_TRA", label: "Xác nhận đã chi trả", tone: "success" },
};

// Xuất bảng lương ra CSV (mở bằng Excel) — đúng số liệu đã lưu trong CSDL, không tính lại
const exportPayrollCsv = (rows, thang, nam) => {
  const header = [
    "Mã NV", "Họ tên", "Phòng ban", "Chức vụ", "Công chuẩn", "Công thực tế", "Lương hợp đồng",
    "Lương theo công", "Phụ cấp", "Thưởng", "Lương Gross", "BHXH", "BHYT", "BHTN", "Thuế TNCN",
    "Tổng khấu trừ", "Thực nhận (Net)", "Trạng thái", "Ghi chú",
  ];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.id, r.name, r.deptLabel, r.role, r.standardDays, r.actualDays, r.baseSalary, r.salaryByDays,
      r.allowance, r.kpiBonus, r.grossSalary, r.bhxh, r.bhyt, r.bhtn, r.thue_tncn, r.deductions,
      r.netSalary, PAYROLL_STATUS_LABELS[r.status] || r.status, r.note,
    ]
      .map(escape)
      .join(",")
  );
  const blob = new Blob(["\uFEFF" + [header.map(escape).join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Bang_luong_T${thang}_${nam}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const getInitials = (name) => {
  if (!name) return "NV";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function PayrollManagement({ onNavigateTab }) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleTriggerSearch = () => {
    setSearchQuery(searchInput.trim());
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim()) {
      setSearchQuery("");
    }
  };
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isLoading, setIsLoading] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [calcError, setCalcError] = useState("");

  // Hộp thoại xác nhận chuyển trạng thái bảng lương (approve | reopen | pay)
  const [statusAction, setStatusAction] = useState(null);
  const [statusActionError, setStatusActionError] = useState("");

  // Dữ liệu bảng lương
  const [payrollData, setPayrollData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalNet: 0,
    avgIncome: 0,
    totalEmployees: 0,
  });

  // Trạng thái đối soát chốt công từ phân hệ Chấm công
  const [attendanceLock, setAttendanceLock] = useState({ is_locked: false, nguoi_chot: "", ngay_chot: "" });

  // Modal xem chi tiết phiếu lương (Payslip Drawer/Modal)
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), type === "error" ? 6000 : 4500);
  };

  useEscapeKey(Boolean(selectedPayslip), () => setSelectedPayslip(null));

  // Tải dữ liệu bảng lương và trạng thái chốt công
  const loadPayrollData = async (m = selectedMonth, y = selectedYear) => {
    setIsLoading(true);
    try {
      // 1. Kiểm tra trạng thái chốt công của tháng
      const lockRes = await getAttendanceLockStatus(m, y);
      setAttendanceLock(lockRes || { is_locked: false });

      // 2. Lấy dữ liệu bảng lương tháng
      const res = await getCompanyPayroll(m, y);
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        // Số liệu hiển thị đúng như đã lưu trong CSDL (bảng_lương), không tính lại ở trình duyệt
        const mapped = res.items.map((item) => ({
          ma_bl: item.ma_bl,
          id: item.ma_nv,
          name: item.ho_ten || `Nhân viên ${item.ma_nv}`,
          initials: getInitials(item.ho_ten),
          role: item.ten_cv || "Nhân viên",
          deptLabel: item.ten_pb || "Chưa phân bổ",
          standardDays: Number(item.so_cong_chuan) || 0,
          actualDays: Number(item.so_cong_thuc_te) || 0,
          baseSalary: Number(item.luong_co_ban) || 0,
          salaryByDays: Number(item.luong_theo_cong) || 0,
          allowance: Number(item.tong_phu_cap) || 0,
          deductions: Number(item.tong_khau_tru) || 0,
          kpiBonus: Number(item.tien_thuong) || 0,
          netSalary: Number(item.luong_net) || 0,
          grossSalary: Number(item.luong_gross) || 0,
          bhxh: Number(item.bhxh) || 0,
          bhyt: Number(item.bhyt) || 0,
          bhtn: Number(item.bhtn) || 0,
          thue_tncn: Number(item.thue_tncn) || 0,
          status: item.trang_thai === "DA_TRA" ? "paid" : item.trang_thai === "DA_DUYET" ? "ready" : "pending",
          statusLabel:
            item.trang_thai === "DA_TRA"
              ? PAYROLL_STATUS_LABELS.paid
              : item.trang_thai === "DA_DUYET"
              ? PAYROLL_STATUS_LABELS.ready
              : PAYROLL_STATUS_LABELS.pending,
          note: item.ghi_chu || "",
          bankAccount: item.tai_khoan_nhan_luong || "Chưa cập nhật",
        }));

        setPayrollData(mapped);
        // Tổng quỹ lương lấy từ máy chủ (tong_tien_net), không cộng lại ở trình duyệt
        const totalNet = Number(res.tong_tien_net) || 0;
        const totalEmployees = Number(res.tong_nhan_vien) || mapped.length;
        setSummaryStats({
          totalNet,
          avgIncome: totalEmployees > 0 ? Math.round(totalNet / totalEmployees) : 0,
          totalEmployees,
        });
      } else {
        setPayrollData([]);
        setSummaryStats({ totalNet: 0, avgIncome: 0, totalEmployees: 0 });
      }
    } catch (err) {
      showToast(`Không tải được bảng lương: ${getApiErrorMessage(err)}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // Tính lại lương tự động từ DB chấm công
  const handleRecalculate = async () => {
    if (isRecalculating) return;
    setIsRecalculating(true);
    setCalcError("");
    try {
      const res = await calculatePayroll(selectedMonth, selectedYear);
      showToast(res?.message || `Đã tính bảng lương tháng ${selectedMonth}/${selectedYear} từ bảng chấm công đã chốt.`);
      await loadPayrollData(selectedMonth, selectedYear);
    } catch (err) {
      // 400 khi bảng công tháng chưa được chốt: hiển thị đúng thông báo của máy chủ kèm lối tắt sang trang Chấm công
      setCalcError(getApiErrorMessage(err, "Không thể tính bảng lương."));
    } finally {
      setIsRecalculating(false);
    }
  };

  const pendingRows = payrollData.filter((r) => r.status === "pending");
  const readyRows = payrollData.filter((r) => r.status === "ready");
  const paidRows = payrollData.filter((r) => r.status === "paid");

  const openStatusAction = (action) => {
    setStatusActionError("");
    setStatusAction(action);
  };

  // Chuyển trạng thái hàng loạt theo quy trình NHAP <-> DA_DUYET -> DA_TRA (có xác nhận trước)
  const handleConfirmStatusAction = async () => {
    const action = STATUS_ACTIONS[statusAction];
    if (!action || isLocking) return;
    const targets = payrollData.filter((r) => r.ma_bl && r.status === action.from);
    if (targets.length === 0) {
      setStatusAction(null);
      return;
    }
    setIsLocking(true);
    setStatusActionError("");
    let done = 0;
    const failures = [];
    for (const item of targets) {
      try {
        await updatePayrollStatus(item.ma_bl, action.to);
        done += 1;
      } catch (err) {
        failures.push(`${item.name} (${item.id}): ${getApiErrorMessage(err)}`);
      }
    }
    setIsLocking(false);
    await loadPayrollData(selectedMonth, selectedYear);

    if (failures.length > 0) {
      setStatusActionError(
        `Đã cập nhật ${done}/${targets.length} bảng lương. Lỗi: ${failures.slice(0, 3).join("; ")}${
          failures.length > 3 ? ` (và ${failures.length - 3} lỗi khác)` : ""
        }`
      );
      return;
    }
    setStatusAction(null);
    const messages = {
      approve: `Đã duyệt ${done} bảng lương tháng ${selectedMonth}/${selectedYear}. Nhân viên đã xem được phiếu lương.`,
      reopen: `Đã mở lại ${done} bảng lương tháng ${selectedMonth}/${selectedYear} về trạng thái Nháp.`,
      pay: `Đã xác nhận chi trả ${done} bảng lương tháng ${selectedMonth}/${selectedYear}.`,
    };
    showToast(messages[statusAction]);
  };

  const departmentOptions = Array.from(new Set(payrollData.map((r) => r.deptLabel))).sort((a, b) =>
    a.localeCompare(b, "vi")
  );

  const filteredData = payrollData.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.deptLabel.toLowerCase().includes(q);
    const matchDept = selectedDept === "all" || item.deptLabel === selectedDept;
    const matchStatus = selectedStatus === "all" || item.status === selectedStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const isAllLocked = payrollData.length > 0 && payrollData.every((r) => r.status === "ready" || r.status === "paid");
  const actionMeta = statusAction ? STATUS_ACTIONS[statusAction] : null;
  const actionCount = actionMeta ? payrollData.filter((r) => r.status === actionMeta.from).length : 0;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* ──────────────── HEADER BAR ──────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-semibold">
            <span>Tài chính nhân sự</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-sky-600">
              Kỳ lương Tháng {selectedMonth}/{selectedYear}
            </span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight mt-1">
            Bảng tính lương nhân sự
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${attendanceLock.is_locked ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            Dữ liệu tổng hợp từ Bảng chấm công, ngày công thực tế và KPI
          </p>
        </div>

        {/* Action Buttons & Period Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ chọn tháng/năm */}
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-sky-600 mr-2 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pl-1 border-l border-slate-200"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleRecalculate}
            disabled={isRecalculating || isLocking}
            title={
              attendanceLock.is_locked
                ? "Tính / tính lại bảng lương từ bảng công đã chốt (bảng lương đã duyệt được giữ nguyên)"
                : "Cần chốt công tháng trước khi tính lương"
            }
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 transition-all shadow-xs text-xs font-semibold active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isRecalculating ? "animate-spin" : ""}`} />
            <span>{isRecalculating ? "Đang tính..." : "Tính lại lương"}</span>
          </button>

          <button
            type="button"
            onClick={() => exportPayrollCsv(filteredData, selectedMonth, selectedYear)}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all text-xs font-semibold active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất bảng lương (CSV)</span>
          </button>

          {pendingRows.length > 0 && (
            <button
              type="button"
              onClick={() => openStatusAction("approve")}
              disabled={isLocking || isRecalculating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-all active:scale-95 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 shadow-sky-600/20 disabled:opacity-50"
            >
              {isLocking && statusAction === "approve" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BadgeCheck className="w-3.5 h-3.5" />
              )}
              <span>Duyệt bảng lương ({pendingRows.length})</span>
            </button>
          )}
          {readyRows.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => openStatusAction("reopen")}
                disabled={isLocking || isRecalculating}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mở lại ({readyRows.length})</span>
              </button>
              <button
                type="button"
                onClick={() => openStatusAction("pay")}
                disabled={isLocking || isRecalculating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Đã chi trả ({readyRows.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cảnh báo nếu phân hệ Chấm công chưa chốt */}
      {!attendanceLock.is_locked && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Chưa chốt công tháng {selectedMonth}/{selectedYear}.</strong> Hệ thống chỉ tính lương từ bảng chấm
              công đã chốt (chỉ các ngày công đã duyệt được tính). Hãy chốt công ở trang Chấm công trước khi bấm "Tính lại
              lương".
            </span>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab("attendance", { period: { thang: selectedMonth, nam: selectedYear } })}
              className="self-start sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 font-semibold hover:bg-amber-100 cursor-pointer"
            >
              <span>Đi tới Chấm công để chốt công</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {calcError && (
        <div
          role="alert"
          className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              <strong>Không tính được bảng lương:</strong> {calcError}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigateTab && !attendanceLock.is_locked && (
              <button
                type="button"
                onClick={() => onNavigateTab("attendance", { period: { thang: selectedMonth, nam: selectedYear } })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 font-semibold hover:bg-rose-100 cursor-pointer"
              >
                <span>Chốt công tháng {selectedMonth}/{selectedYear}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCalcError("")}
              aria-label="Đóng thông báo lỗi"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-700 hover:bg-rose-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      {toastMessage && (
        <div
          role={toastType === "error" ? "alert" : "status"}
          className={`p-3 border text-xs rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            toastType === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toastType === "error" ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ──────────────── 3 BENTO SUMMARY METRICS ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Tổng quỹ lương thực chi (Net)
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900 tracking-tight">
                  {summaryStats.totalNet > 0
                    ? summaryStats.totalNet.toLocaleString("vi-VN")
                    : "0"}
                </span>
                <span className="text-xs font-bold text-sky-600">VNĐ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">
              {summaryStats.totalEmployees} nhân sự có bảng lương • {paidRows.length} đã chi trả
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Thu nhập bình quân
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900 tracking-tight">
                  {summaryStats.avgIncome > 0
                    ? summaryStats.avgIncome.toLocaleString("vi-VN")
                    : "0"}
                </span>
                <span className="text-xs text-slate-500">đ/người</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-slate-500">
            <span>Bao gồm lương ngày công, phụ cấp & thưởng</span>
          </div>
        </div>

        {/* Metric 3: Tiến độ đối soát công (Kết nối thực tế với Attendance Lock) */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Tiến độ đối soát công Tháng {selectedMonth}
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span
                  className={`font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold tracking-tight ${
                    attendanceLock.is_locked ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {attendanceLock.is_locked ? "Đã Chốt Công" : "Chưa Chốt"}
                </span>
                <span className="text-xs text-slate-400">
                  {attendanceLock.is_locked ? "• 100% Hoàn tất" : "• Cần đối soát"}
                </span>
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                attendanceLock.is_locked ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              }`}
            >
              {attendanceLock.is_locked ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className={attendanceLock.is_locked ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                {attendanceLock.is_locked
                  ? `Đã khóa an toàn (${attendanceLock.nguoi_chot || "Quản lý"})`
                  : "Chờ Quản lý chốt công"}
              </span>
              <span className="text-slate-400">
                {payrollData.length === 0
                  ? "Lương: Chưa tính"
                  : isAllLocked
                  ? "Lương: Đã duyệt"
                  : `Lương: ${pendingRows.length} bảng nháp`}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  attendanceLock.is_locked ? "bg-emerald-500 w-full" : "bg-amber-500 w-1/2"
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── FILTER & TOOLBAR ──────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
          {/* Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleTriggerSearch();
                  }
                }}
                placeholder="Tìm theo tên hoặc mã NV..."
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleTriggerSearch}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Tìm kiếm (Enter)"
            >
              <Search size={14} />
              <span>Tìm kiếm</span>
            </button>
          </div>

          {/* Department */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tất cả phòng ban</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="pending">{PAYROLL_STATUS_LABELS.pending}</option>
            <option value="ready">{PAYROLL_STATUS_LABELS.ready}</option>
            <option value="paid">{PAYROLL_STATUS_LABELS.paid}</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>
            Hiển thị {filteredData.length} / {payrollData.length} bản ghi
          </span>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDept("all");
              setSelectedStatus("all");
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exportPayrollCsv(filteredData, selectedMonth, selectedYear)}
            disabled={filteredData.length === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
            title="Tải bảng lương (CSV mở bằng Excel)"
            aria-label="Tải bảng lương CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ──────────────── PAYROLL TABLE ──────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span className="text-xs font-medium">Đang tải bảng lương Tháng {selectedMonth}/{selectedYear}...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <FileText className="w-10 h-10 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">
              Chưa có dữ liệu bảng lương Tháng {selectedMonth}/{selectedYear}
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm text-center">
              {attendanceLock.is_locked
                ? 'Nhấn "Tính toán bảng lương ngay" để hệ thống tổng hợp từ bảng chấm công đã chốt.'
                : `Bảng công tháng ${selectedMonth}/${selectedYear} chưa được chốt — cần chốt công trước khi tính lương.`}
            </p>
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? "animate-spin" : ""}`} />
              <span>Tính toán bảng lương ngay</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-3 text-center w-12">STT</th>
                  <th className="py-3 px-4">Mã & Nhân sự</th>
                  <th className="py-3 px-3 text-center">Công chuẩn / TT</th>
                  <th className="py-3 px-4 text-right">Lương CB (VNĐ)</th>
                  <th className="py-3 px-3 text-right">Phụ cấp</th>
                  <th className="py-3 px-3 text-right">Khấu trừ BH & Thuế</th>
                  <th className="py-3 px-3 text-right">Thưởng</th>
                  <th className="py-3 px-4 text-right bg-sky-50/60 text-sky-900 font-bold">
                    THỰC NHẬN (NET)
                  </th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredData.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {row.initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{row.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-1 py-0.2 rounded font-semibold">
                              {row.id}
                            </span>
                            <span className="text-[11px] text-slate-400">• {row.role}</span>
                          </div>
                          {row.note && (
                            <span className="mt-0.5 text-[10px] font-medium text-amber-700" title={row.note}>
                              {row.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        <span className="font-bold text-emerald-600">{row.actualDays}</span> / {row.standardDays}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      {formatVnd(row.baseSalary)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {row.allowance.toLocaleString("vi-VN")}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-rose-600">
                      -{row.deductions.toLocaleString("vi-VN")}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-medium">
                      {row.kpiBonus > 0 ? `+${row.kpiBonus.toLocaleString("vi-VN")}` : "-"}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sky-700 bg-sky-50/50 text-[13px]">
                      {row.netSalary.toLocaleString("vi-VN")} đ
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          row.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : row.status === "ready"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            row.status === "paid"
                              ? "bg-emerald-500"
                              : row.status === "ready"
                              ? "bg-sky-500"
                              : "bg-amber-500"
                          }`}
                        ></span>
                        {row.statusLabel}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslip(row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Xem chi tiết phiếu lương cá nhân"
                          aria-label={`Xem phiếu lương của ${row.name}`}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ──────────────── MODAL CHI TIẾT PHIẾU LƯƠNG ──────────────── */}
      {selectedPayslip && (
        <div
          onClick={() => setSelectedPayslip(null)}
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 cursor-pointer animate-fade-in"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Phiếu lương của ${selectedPayslip.name}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 cursor-default max-h-[92vh] overflow-y-auto"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-base">
                    Phiếu lương điện tử (Payslip)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Kỳ lương: Tháng {selectedMonth}/{selectedYear} • Tập đoàn Trung Nguyên Legend
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                aria-label="Đóng"
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Employee Info Header */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Họ và tên nhân sự:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedPayslip.name}</span>
                <span className="text-slate-500 block text-[11px]">
                  Mã: {selectedPayslip.id} • {selectedPayslip.role}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Bộ phận / Phòng ban:</span>
                <span className="font-semibold text-slate-800">{selectedPayslip.deptLabel}</span>
                <span className="text-slate-500 block text-[11px]">
                  Tài khoản: {selectedPayslip.bankAccount}
                </span>
              </div>
            </div>

            {/* Detailed Salary Items — đúng số liệu đã lưu trong bảng lương */}
            <div className="mt-4 flex flex-col gap-1.5 text-xs">
              {[
                { label: "Lương hợp đồng:", value: `${formatVnd(selectedPayslip.baseSalary)} đ`, cls: "text-slate-900 font-semibold" },
                {
                  label: "Ngày công thực tế / chuẩn:",
                  value: `${selectedPayslip.actualDays} / ${selectedPayslip.standardDays} ngày`,
                  cls: "text-slate-800",
                },
                { label: "Lương theo ngày công:", value: `${formatVnd(selectedPayslip.salaryByDays)} đ`, cls: "text-slate-800" },
                { label: "Phụ cấp chức vụ:", value: `+${formatVnd(selectedPayslip.allowance)} đ`, cls: "text-emerald-600" },
                { label: "Thưởng:", value: `+${formatVnd(selectedPayslip.kpiBonus)} đ`, cls: "text-emerald-600" },
                { label: "Tổng thu nhập (Gross):", value: `${formatVnd(selectedPayslip.grossSalary)} đ`, cls: "text-slate-900 font-bold" },
                { label: "BHXH (8%):", value: `-${formatVnd(selectedPayslip.bhxh)} đ`, cls: "text-rose-600" },
                { label: "BHYT (1,5%):", value: `-${formatVnd(selectedPayslip.bhyt)} đ`, cls: "text-rose-600" },
                { label: "BHTN (1%):", value: `-${formatVnd(selectedPayslip.bhtn)} đ`, cls: "text-rose-600" },
                { label: "Thuế TNCN:", value: `-${formatVnd(selectedPayslip.thue_tncn)} đ`, cls: "text-rose-600" },
                { label: "Tổng khấu trừ:", value: `-${formatVnd(selectedPayslip.deductions)} đ`, cls: "text-rose-700 font-semibold" },
              ].map((line) => (
                <div key={line.label} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">{line.label}</span>
                  <span className={`font-mono ${line.cls}`}>{line.value}</span>
                </div>
              ))}

              {selectedPayslip.note && (
                <div className="mt-1 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-px" />
                  <span>
                    <strong>Ghi chú:</strong> {selectedPayslip.note}
                  </span>
                </div>
              )}

              {/* Net total */}
              <div className="flex items-center justify-between p-3.5 mt-2 rounded-xl bg-sky-50 border border-sky-100">
                <div>
                  <span className="text-xs font-bold text-sky-900 block">THỰC NHẬN (NET)</span>
                  <span className="text-[11px] text-sky-600">
                    {selectedPayslip.statusLabel} • {attendanceLock.is_locked ? "Bảng công đã chốt" : "Bảng công chưa chốt"}
                  </span>
                </div>
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-sky-700 font-mono">
                  {formatVnd(selectedPayslip.netSalary)} đ
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── XÁC NHẬN CHUYỂN TRẠNG THÁI BẢNG LƯƠNG ──────────────── */}
      <ConfirmDialog
        open={Boolean(actionMeta)}
        tone={actionMeta?.tone || "primary"}
        icon={statusAction === "pay" ? Banknote : statusAction === "reopen" ? RotateCcw : BadgeCheck}
        title={actionMeta ? `${actionMeta.label} tháng ${selectedMonth}/${selectedYear}?` : ""}
        description={
          statusAction === "approve" ? (
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Duyệt <strong>{actionCount}</strong> bảng lương đang ở trạng thái Nháp.
              </li>
              <li>Sau khi duyệt, nhân viên xem được phiếu lương; "Tính lại lương" sẽ không ghi đè các bảng đã duyệt.</li>
              <li>Bảng công của tháng không thể mở khóa khi đã có bảng lương được duyệt.</li>
              {!attendanceLock.is_locked && (
                <li className="text-amber-700 font-semibold">Lưu ý: bảng chấm công tháng này hiện chưa được chốt.</li>
              )}
            </ul>
          ) : statusAction === "reopen" ? (
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Đưa <strong>{actionCount}</strong> bảng lương đã duyệt về trạng thái Nháp để kiểm tra / tính lại.
              </li>
              <li>Nhân viên sẽ không xem được phiếu lương cho đến khi được duyệt lại.</li>
            </ul>
          ) : statusAction === "pay" ? (
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Xác nhận đã chuyển lương cho <strong>{actionCount}</strong> nhân sự (bảng lương đã duyệt).
              </li>
              <li>Thao tác này không thể hoàn tác: bảng lương đã chi trả không thể mở lại hay tính lại.</li>
            </ul>
          ) : null
        }
        confirmLabel={actionMeta?.label || "Xác nhận"}
        busy={isLocking}
        error={statusActionError}
        onCancel={() => !isLocking && setStatusAction(null)}
        onConfirm={handleConfirmStatusAction}
      />
    </div>
  );
}
