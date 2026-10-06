import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  Lock,
  Download,
  RefreshCw,
  Send,
  Search,
  Filter,
  FileText,
  Mail,
  Printer,
  X,
  Building2,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Eye,
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Loader2
} from "lucide-react";
import {
  getCompanyPayroll,
  calculatePayroll,
  updatePayrollStatus,
} from "../../services/payrollService";
import { getAttendanceLockStatus } from "../../services/attendanceService";

const getInitials = (name) => {
  if (!name) return "NV";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function PayrollManagement() {
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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

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
        const mapped = res.items.map((item) => ({
          ma_bl: item.ma_bl,
          id: item.ma_nv,
          name: item.ho_ten || `Nhân viên ${item.ma_nv}`,
          initials: getInitials(item.ho_ten),
          role: item.ten_cv || "Nhân viên",
          dept: item.ten_pb ? item.ten_pb.toLowerCase() : "hq",
          deptLabel: item.ten_pb || "Trụ sở chính",
          standardDays: Number(item.so_cong_chuan) || 26,
          actualDays: Number(item.so_cong_thuc_te) || 0,
          baseSalary: Number(item.luong_co_ban) || 0,
          allowance: Number(item.tong_phu_cap) || 0,
          otPay: Number(item.tien_tang_ca) || 0,
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
              ? "Đã chi trả"
              : item.trang_thai === "DA_DUYET"
              ? "Đã duyệt chi"
              : "Chờ kiểm tra",
          bankAccount: "Vietcombank • **** 6889",
        }));

        setPayrollData(mapped);
        const totalNet = res.tong_tien_net || mapped.reduce((s, r) => s + r.netSalary, 0);
        setSummaryStats({
          totalNet,
          avgIncome: mapped.length > 0 ? Math.round(totalNet / mapped.length) : 0,
          totalEmployees: res.tong_nhan_vien || mapped.length,
        });
      } else {
        setPayrollData([]);
        setSummaryStats({ totalNet: 0, avgIncome: 0, totalEmployees: 0 });
      }
    } catch (err) {
      console.error("Lỗi khi tải bảng lương:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // Tính lại lương tự động từ DB chấm công
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const res = await calculatePayroll(selectedMonth, selectedYear);
      showToast(
        res?.message ||
          `Đã tính toán lại toàn bộ bảng lương tự động từ bảng chấm công Tháng ${selectedMonth}/${selectedYear}!`
      );
      await loadPayrollData(selectedMonth, selectedYear);
    } catch (err) {
      showToast(`Lỗi tính lương: ${err.message}`);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Khóa bảng lương & Duyệt chi
  const handleLockPayroll = async () => {
    if (!attendanceLock.is_locked) {
      const confirmProceed = window.confirm(
        `⚠️ Chú ý: Bảng chấm công Tháng ${selectedMonth}/${selectedYear} chưa được Chốt & Khóa bên trang Chấm công.\n\nBạn có chắc chắn muốn Duyệt chi lương ngay không? Khuyến nghị nên chốt công trước để tránh phát sinh sai lệch!`
      );
      if (!confirmProceed) return;
    }

    if (payrollData.length === 0) {
      showToast("Chưa có bản ghi lương nào trong tháng để duyệt. Vui lòng bấm 'Tính lại lương' trước!");
      return;
    }

    setIsLocking(true);
    try {
      const isCurrentlyApproved = payrollData.every((r) => r.status === "ready" || r.status === "paid");
      const targetStatus = isCurrentlyApproved ? "NHAP" : "DA_DUYET";

      // Cập nhật từng bản ghi
      for (const item of payrollData) {
        if (item.ma_bl) {
          await updatePayrollStatus(item.ma_bl, targetStatus);
        }
      }

      await loadPayrollData(selectedMonth, selectedYear);
      showToast(
        targetStatus === "DA_DUYET"
          ? `Đã khóa bảng lương Tháng ${selectedMonth}/${selectedYear} và duyệt chi thành công!`
          : `Đã mở lại bảng lương để kiểm tra và điều chỉnh thêm!`
      );
    } catch (err) {
      showToast(`Lỗi cập nhật bảng lương: ${err.message}`);
    } finally {
      setIsLocking(false);
    }
  };

  const handleSendEmail = (name) => {
    showToast(`Đã gửi email phiếu lương điện tử bảo mật đến hòm thư của ${name}!`);
  };

  const filteredData = payrollData.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deptLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = selectedDept === "all" || item.dept.includes(selectedDept);
    const matchStatus = selectedStatus === "all" || item.status === selectedStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const isAllLocked = payrollData.length > 0 && payrollData.every((r) => r.status === "ready" || r.status === "paid");

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
            onClick={handleRecalculate}
            disabled={isRecalculating || isLocking}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 transition-all shadow-xs text-xs font-semibold active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isRecalculating ? "animate-spin" : ""}`} />
            <span>{isRecalculating ? "Đang tính..." : "Tính lại lương"}</span>
          </button>

          <button
            onClick={() => showToast("Đã xuất tệp bảng lương chi tiết PDF / Excel thành công!")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all text-xs font-semibold active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Xuất phiếu lương</span>
          </button>

          <button
            onClick={handleLockPayroll}
            disabled={isLocking || isRecalculating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-all active:scale-95 ${
              isAllLocked
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 shadow-sky-600/20"
            }`}
          >
            {isLocking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isAllLocked ? (
              <RotateCcw className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>{isAllLocked ? "Mở khóa bảng lương" : "Khóa bảng lương & Duyệt chi"}</span>
          </button>
        </div>
      </div>

      {/* Cảnh báo nếu phân hệ Chấm công chưa chốt */}
      {!attendanceLock.is_locked && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Lưu ý đối soát công:</strong> Bảng chấm công Tháng {selectedMonth}/{selectedYear} chưa được Chốt & Khóa bên trang Chấm công. Vui lòng kiểm tra và bấm "Chốt công" bên phân hệ Chấm công trước khi khóa bảng lương để đảm bảo an toàn số liệu.
            </span>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
              <TrendingUp className="w-3 h-3" />
              Tự động đối soát
            </span>
            <span className="text-[11px] text-slate-400">
              {payrollData.length} nhân sự có dữ liệu lương
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
                {isAllLocked ? "Lương: Đã duyệt" : "Lương: Đang nháp"}
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
            <option value="all">Tất cả khối phòng ban</option>
            <option value="kinh doanh">Phòng Kinh doanh</option>
            <option value="sản xuất">Xưởng Sản xuất</option>
            <option value="nhân sự">Phòng Nhân sự</option>
            <option value="kế toán">Phòng Kế toán – Tài chính</option>
            <option value="it">Phòng IT</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Mọi trạng thái chi</option>
            <option value="ready">Đã duyệt chi</option>
            <option value="pending">Chờ kiểm tra</option>
            <option value="paid">Đã chi trả</option>
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
            onClick={() => showToast("Đã tải tệp bảng lương chi tiết!")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 transition-colors"
            title="Tải Excel bảng lương"
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
              Nhấn nút <strong>"Tính lại lương"</strong> ở góc trên bên phải để hệ thống tự động tổng hợp từ Bảng chấm công và tính toán bảng lương ngay.
            </p>
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
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
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        <span className="font-bold text-emerald-600">{row.actualDays}</span> / {row.standardDays}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      {row.baseSalary.toLocaleString("vi-VN")}
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
                          onClick={() => setSelectedPayslip(row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Xem chi tiết phiếu lương cá nhân"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendEmail(row.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Gửi email phiếu lương"
                        >
                          <Mail className="w-4 h-4" />
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
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 cursor-default"
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
                onClick={() => setSelectedPayslip(null)}
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

            {/* Detailed Salary Items */}
            <div className="mt-4 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Lương cơ bản theo hợp đồng:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedPayslip.baseSalary.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Ngày công chuẩn / Thực tế:</span>
                <span className="font-mono text-slate-800">
                  {selectedPayslip.actualDays} / {selectedPayslip.standardDays} ngày
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Phụ cấp chức vụ / làm việc:</span>
                <span className="font-mono text-emerald-600">
                  +{selectedPayslip.allowance.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Thưởng hiệu suất kinh doanh (KPI):</span>
                <span className="font-mono text-emerald-600 font-semibold">
                  +{selectedPayslip.kpiBonus.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Trích BHXH (8%), BHYT (1.5%), BHTN (1%) & Thuế TNCN:</span>
                <span className="font-mono text-rose-600">
                  -{selectedPayslip.deductions.toLocaleString("vi-VN")} đ
                </span>
              </div>

              {/* Net total */}
              <div className="flex items-center justify-between p-3.5 mt-2 rounded-xl bg-sky-50 border border-sky-100">
                <div>
                  <span className="text-xs font-bold text-sky-900 block">THỰC LĨNH CHUYỂN KHOẢN (NET)</span>
                  <span className="text-[11px] text-sky-600">
                    {attendanceLock.is_locked ? "Đã đối soát công hợp lệ" : "Chưa chốt bảng công"}
                  </span>
                </div>
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-sky-700 font-mono">
                  {selectedPayslip.netSalary.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  showToast("Đang chuẩn bị bản in phiếu lương...");
                  window.print();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handleSendEmail(selectedPayslip.name);
                    setSelectedPayslip(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
                >
                  <Mail className="w-4 h-4" />
                  <span>Gửi email phiếu lương</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
