import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Calendar,
  Building2,
  Download,
  RefreshCw,
  Edit3,
  MapPin,
  Fingerprint,
  X,
  ShieldCheck,
  Check,
  CalendarDays,
  UserCheck,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";
import {
  getDailyAttendanceForManager,
  getMonthlyAttendanceSummaryForManager,
  adjustAttendanceRecord,
} from "../../services/attendanceService";

const DEPARTMENTS = [
  { id: "all", label: "Tất cả phòng ban" },
  { id: "PB01", label: "Ban Giám đốc" },
  { id: "PB02", label: "Phòng Nhân sự" },
  { id: "PB03", label: "Phòng Kế toán – Tài chính" },
  { id: "PB04", label: "Phòng Marketing" },
  { id: "PB05", label: "Phòng Kinh doanh" },
  { id: "PB06", label: "Phòng IT" },
  { id: "PB07", label: "Xưởng Sản xuất" },
  { id: "PB08", label: "Phòng Kinh doanh Hà Nội" },
];

const getInitials = (name) => {
  if (!name) return "NV";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getLateMinutes = (gio_vao, loai_cong) => {
  if (loai_cong !== "DI_TRE" || !gio_vao || gio_vao === "--:--") return 0;
  const [h, m] = gio_vao.split(":").map(Number);
  const totalMins = (h || 0) * 60 + (m || 0);
  const standardMins = 8 * 60; // 08:00
  return totalMins > standardMins ? totalMins - standardMins : 0;
};

// Định dạng ngày hiện tại YYYY-MM-DD
const getTodayDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function AttendanceManagement() {
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "monthly"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState("");

  // Dữ liệu API thực tế
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);

  // Modal điều chỉnh giờ / duyệt giải trình
  const [adjustModalData, setAdjustModalData] = useState(null);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustedTime, setAdjustedTime] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Tải dữ liệu chấm công theo ngày
  const loadDailyData = async (date = selectedDate, dept = selectedDept) => {
    setIsLoading(true);
    try {
      const data = await getDailyAttendanceForManager(date, dept);
      setDailyAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi khi tải bảng chấm công ngày:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Tải bảng tổng hợp công tháng
  const loadMonthlyData = async (m = selectedMonth, y = selectedYear, dept = selectedDept) => {
    setIsLoading(true);
    try {
      const data = await getMonthlyAttendanceSummaryForManager(m, y, dept);
      setMonthlyAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi khi tải bảng tổng hợp công tháng:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "daily") {
      loadDailyData(selectedDate, selectedDept);
    } else {
      loadMonthlyData(selectedMonth, selectedYear, selectedDept);
    }
  }, [viewMode, selectedDate, selectedDept, selectedMonth, selectedYear]);

  // Đồng bộ thủ công
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      if (viewMode === "daily") {
        await loadDailyData(selectedDate, selectedDept);
      } else {
        await loadMonthlyData(selectedMonth, selectedYear, selectedDept);
      }
      setSyncToast("Đã đồng bộ dữ liệu thời gian thực thành công!");
      setTimeout(() => setSyncToast(""), 3500);
    } catch (_) {
      setSyncToast("Lỗi khi đồng bộ dữ liệu!");
      setTimeout(() => setSyncToast(""), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  // Chốt duyệt công đủ nhanh cho bản ghi
  const handleApprove = async (row) => {
    if (!row.ma_cc) {
      setSyncToast(`Nhân viên ${row.ho_ten} chưa có bản ghi chấm công ngày này để chốt.`);
      setTimeout(() => setSyncToast(""), 3500);
      return;
    }
    try {
      await adjustAttendanceRecord(row.ma_cc, {
        loai_cong: "CONG_DU",
        so_cong: 1.0,
        ghi_chu: "Quản lý chốt công đủ",
      });
      setSyncToast(`Đã chốt duyệt công đủ cho ${row.ho_ten}!`);
      setTimeout(() => setSyncToast(""), 3500);
      loadDailyData(selectedDate, selectedDept);
    } catch (err) {
      setSyncToast(`Lỗi: ${err.message}`);
      setTimeout(() => setSyncToast(""), 4500);
    }
  };

  // Mở modal điều chỉnh
  const handleOpenAdjust = (row) => {
    setAdjustModalData(row);
    setAdjustReason(row.ghi_chu || "");
    setAdjustedTime(row.gio_vao !== "--:--" ? row.gio_vao : "08:00");
    setAdjustError("");
  };

  // Lưu điều chỉnh từ modal
  const handleSaveAdjust = async () => {
    if (!adjustModalData) return;
    if (!adjustModalData.ma_cc) {
      setAdjustError("Nhân viên này chưa có bản ghi chấm công để điều chỉnh.");
      return;
    }
    setIsAdjusting(true);
    setAdjustError("");
    try {
      let formattedTime = adjustedTime;
      if (formattedTime && formattedTime.length === 5) {
        formattedTime = `${formattedTime}:00`;
      }
      await adjustAttendanceRecord(adjustModalData.ma_cc, {
        gio_vao: formattedTime || undefined,
        loai_cong: "CONG_DU",
        so_cong: 1.0,
        ghi_chu: adjustReason || "Quản lý điều chỉnh & duyệt giải trình",
      });
      setAdjustModalData(null);
      setSyncToast(`Đã duyệt điều chỉnh giờ chấm công cho ${adjustModalData.ho_ten}!`);
      setTimeout(() => setSyncToast(""), 3500);
      loadDailyData(selectedDate, selectedDept);
    } catch (err) {
      setAdjustError(err.message || "Lỗi khi lưu điều chỉnh.");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Xuất file CSV / Excel
  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    if (viewMode === "daily") {
      csvContent += "Mã NV,Họ tên,Phòng ban,Chức vụ,Ca làm việc,Giờ vào,Giờ ra,Số giờ làm,Loại công,Trạng thái,Ghi chú\n";
      filteredDaily.forEach((r) => {
        csvContent += `"${r.ma_nv}","${r.ho_ten}","${r.ten_pb || ''}","${r.ten_cv || ''}","${r.ca_lam_viec || 'Hành chính'}","${r.gio_vao || ''}","${r.gio_ra || ''}","${r.so_gio_lam || 0}","${r.loai_cong || ''}","${r.trang_thai || ''}","${(r.ghi_chu || '').replace(/"/g, '""')}"\n`;
      });
    } else {
      csvContent += "Mã NV,Họ tên,Phòng ban,Chức vụ,Tháng,Năm,Tổng ngày công,Tổng giờ OT,Số lần đi trễ,Số ngày phép\n";
      filteredMonthly.forEach((r) => {
        csvContent += `"${r.ma_nv}","${r.ho_ten}","${r.ten_pb || ''}","${r.ten_cv || ''}","${r.thang}","${r.nam}","${r.tong_ngay_cong}","${r.tong_gio_ot}","${r.so_lan_di_tre}","${r.so_ngay_phep}"\n`;
      });
    }
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Bang_Cham_Cong_${viewMode === "daily" ? selectedDate : `Thang_${selectedMonth}_${selectedYear}`}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSyncToast("Đã xuất file bảng chấm công thành công!");
    setTimeout(() => setSyncToast(""), 3500);
  };

  // KPI Calculations cho Bảng ngày
  const totalEmployees = dailyAttendance.length;
  const checkedInCount = dailyAttendance.filter((r) => r.gio_vao && r.gio_vao !== "--:--" && r.gio_vao !== "-").length;
  const onTimeCount = dailyAttendance.filter((r) => r.loai_cong === "CONG_DU" && r.gio_vao && r.gio_vao !== "--:--").length;
  const lateCount = dailyAttendance.filter((r) => r.loai_cong === "DI_TRE" || (r.gio_vao && r.gio_vao > "08:15:00")).length;
  const absentCount = dailyAttendance.filter((r) => !r.gio_vao || r.gio_vao === "--:--" || r.gio_vao === "-").length;
  const leaveCount = dailyAttendance.filter((r) => r.loai_cong === "NGHI_PHEP").length;
  const unauthorizedCount = Math.max(0, absentCount - leaveCount);
  const attendanceRate = totalEmployees > 0 ? ((checkedInCount / totalEmployees) * 100).toFixed(1) : "0.0";
  const onTimeRate = checkedInCount > 0 ? ((onTimeCount / checkedInCount) * 100).toFixed(1) : "100.0";

  // KPI Calculations cho Bảng tháng
  const totalWorkDays = monthlyAttendance.reduce((acc, r) => acc + (Number(r.tong_ngay_cong) || 0), 0);
  const totalOTHours = monthlyAttendance.reduce((acc, r) => acc + (Number(r.tong_gio_ot) || 0), 0);
  const totalLateTimes = monthlyAttendance.reduce((acc, r) => acc + (Number(r.so_lan_di_tre) || 0), 0);
  const totalLeaveDays = monthlyAttendance.reduce((acc, r) => acc + (Number(r.so_ngay_phep) || 0), 0);

  // Lọc Daily
  const filteredDaily = dailyAttendance.filter((item) => {
    const matchSearch =
      (item.ho_ten || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ma_nv || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ten_pb || "").toLowerCase().includes(searchQuery.toLowerCase());

    const isLate = item.loai_cong === "DI_TRE" || (item.gio_vao && item.gio_vao > "08:15:00");
    const isOntime = item.loai_cong === "CONG_DU" && item.gio_vao && item.gio_vao !== "--:--";
    const isWorking = item.gio_vao && item.gio_vao !== "--:--" && (item.gio_ra === "--:--" || !item.gio_ra);
    const isAbsent = !item.gio_vao || item.gio_vao === "--:--" || item.gio_vao === "-";

    const matchStatus =
      selectedStatus === "all" ||
      (selectedStatus === "ontime" && isOntime) ||
      (selectedStatus === "late" && isLate) ||
      (selectedStatus === "working" && isWorking) ||
      (selectedStatus === "absent" && isAbsent);

    return matchSearch && matchStatus;
  });

  // Lọc Monthly
  const filteredMonthly = monthlyAttendance.filter((item) => {
    return (
      (item.ho_ten || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ma_nv || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ten_pb || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Sắp xếp: Ban Giám đốc (PB01) đầu tiên -> theo phòng ban -> theo tên
  const sortByDeptThenName = (a, b) => {
    const aIsBGD = (a.ma_pb === "PB01") ? 0 : 1;
    const bIsBGD = (b.ma_pb === "PB01") ? 0 : 1;
    if (aIsBGD !== bIsBGD) return aIsBGD - bIsBGD;

    const deptA = (a.ten_pb || "").toLowerCase();
    const deptB = (b.ten_pb || "").toLowerCase();
    if (deptA !== deptB) return deptA.localeCompare(deptB, "vi");

    const nameA = (a.ho_ten || "").toLowerCase();
    const nameB = (b.ho_ten || "").toLowerCase();
    return nameA.localeCompare(nameB, "vi");
  };

  filteredDaily.sort(sortByDeptThenName);
  filteredMonthly.sort(sortByDeptThenName);

  // Phân trang cho cả daily và monthly
  const activeFiltered = viewMode === "daily" ? filteredDaily : filteredMonthly;
  const totalPages = Math.max(1, Math.ceil(activeFiltered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, activeFiltered.length);
  const paginatedDaily = filteredDaily.slice(startIdx, endIdx);
  const paginatedMonthly = filteredMonthly.slice(startIdx, endIdx);

  // Reset page khi đổi bộ lọc hoặc chế độ xem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedStatus, viewMode, pageSize]);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* ──────────────── HEADER BAR ──────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight">
              Chấm công & Ca làm việc
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dữ liệu kết nối trực tiếp từ hệ thống chấm công, máy vân tay và API Quản lý vận hành.
          </p>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSync}
            disabled={isSyncing || isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-sky-700 shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isLoading ? "animate-spin text-sky-600" : ""}`} />
            <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white rounded-xl text-xs font-semibold shadow-sm shadow-sky-600/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file Excel</span>
          </button>
        </div>
      </div>

      {/* Sync Toast Notice */}
      {syncToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* ──────────────── 4 KPI CARDS (Dữ liệu thời gian thực) ──────────────── */}
      {viewMode === "daily" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Đã check-in */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-sky-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đã chấm công vào</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900">
                  {checkedInCount}
                </span>
                <span className="text-xs text-slate-400">/ {totalEmployees} nhân sự</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-sky-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[11px] font-semibold text-sky-600 mt-1">
                <span>Tỷ lệ có mặt</span>
                <span>{attendanceRate}%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Đúng giờ */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đi đúng giờ</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900">
                  {onTimeCount}
                </span>
                <span className="text-xs text-slate-400">nhân viên</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${onTimeRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[11px] font-semibold text-emerald-600 mt-1">
                <span>Kỷ luật đúng giờ</span>
                <span>{onTimeRate}%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Đi muộn */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đi muộn sau 08:15</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-amber-600">
                  {lateCount}
                </span>
                <span className="text-xs text-slate-400">trường hợp</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalEmployees > 0 ? (lateCount / totalEmployees) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>Quản lý có thể sửa ≤ 3 lần</span>
                <span className="text-amber-600 font-semibold">Theo quy định</span>
              </div>
            </div>
          </div>

          {/* Card 4: Vắng mặt */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Vắng mặt hôm nay</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900">
                  {absentCount}
                </span>
                <span className="text-xs text-slate-400">nhân sự</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 px-2 py-1 rounded-md text-center border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Có phép</span>
                  <span className="text-xs font-bold text-slate-800">{leaveCount}</span>
                </div>
                <div className="flex-1 bg-rose-50 px-2 py-1 rounded-md text-center border border-rose-100">
                  <span className="text-[10px] text-rose-600 block">Chưa chấm</span>
                  <span className="text-xs font-bold text-rose-600">{unauthorizedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Card 1 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tổng ngày công tích lũy</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900">
                {totalWorkDays.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">công toàn công ty</span>
            </div>
          </div>

          {/* Monthly Card 2 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tổng giờ tăng ca (OT)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-emerald-600">
                +{totalOTHours.toFixed(1)}h
              </span>
              <span className="text-xs text-slate-400">hệ số x1.5</span>
            </div>
          </div>

          {/* Monthly Card 3 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Lượt đi trễ trong tháng</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-amber-600">
                {totalLateTimes}
              </span>
              <span className="text-xs text-slate-400">lượt trễ</span>
            </div>
          </div>

          {/* Monthly Card 4 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Ngày nghỉ phép đã duyệt</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-indigo-600">
                {totalLeaveDays}
              </span>
              <span className="text-xs text-slate-400">ngày nghỉ hợp lệ</span>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MAIN CONTAINER CARD ──────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Switcher & Secondary Filter Bar */}
        <div className="px-6 pt-4 pb-0 bg-slate-50/70 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl self-start">
            <button
              onClick={() => setViewMode("daily")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "daily"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bảng chấm công ngày</span>
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "monthly"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Tổng hợp công tháng</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 pb-3 lg:pb-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Chuẩn ca: 08:00 - 17:00
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Grace: 15 phút (trước 08:15)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Sau 8h15: Giới hạn sửa ≤ 3 lần/tháng
            </span>
          </div>
        </div>

        {/* Toolbar Filter */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Tên nhân viên, Mã NV (NV01, NV10)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bộ chọn Ngày hoặc Tháng tuỳ chế độ */}
            {viewMode === "daily" ? (
              <div className="relative flex items-center bg-slate-50 px-3 py-1.5 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-sky-600 mr-2 shrink-0" />
                <span className="mr-2 text-slate-500">Ngày:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-medium"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-medium"
                >
                  <option value={2025}>Năm 2025</option>
                  <option value={2026}>Năm 2026</option>
                  <option value={2027}>Năm 2027</option>
                </select>
              </div>
            )}

            {/* Department filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.label}
                </option>
              ))}
            </select>

            {/* Status filter (chỉ dùng cho Daily) */}
            {viewMode === "daily" && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ontime">Đúng giờ</option>
                <option value="late">Đi muộn</option>
                <option value="working">Đang làm việc</option>
                <option value="absent">Vắng mặt / Chưa chấm</option>
              </select>
            )}
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span className="text-xs font-medium">Đang tải dữ liệu từ API máy chủ...</span>
          </div>
        )}

        {/* VIEW 1: DAILY TABLE */}
        {!isLoading && viewMode === "daily" && (
          <>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4">Ca làm việc</th>
                  <th className="py-3 px-4">Check-in</th>
                  <th className="py-3 px-4">Check-out</th>
                  <th className="py-3 px-4 text-center">Đi muộn</th>
                  <th className="py-3 px-4 text-center">Số giờ làm</th>
                  <th className="py-3 px-4">Tình trạng</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredDaily.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Không có bản ghi chấm công nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedDaily.map((row) => {
                    const initials = getInitials(row.ho_ten);
                    const isLate = row.loai_cong === "DI_TRE" || (row.gio_vao && row.gio_vao > "08:15:00");
                    const lateMins = getLateMinutes(row.gio_vao, row.loai_cong);
                    const isCheckedIn = row.gio_vao && row.gio_vao !== "--:--" && row.gio_vao !== "-";
                    const isApproved = row.so_cong >= 1.0 && row.loai_cong === "CONG_DU";
                    const hasExplanation = isLate || Boolean(row.ghi_chu && row.ghi_chu.length > 0);

                    return (
                      <tr key={row.ma_nv} className="hover:bg-slate-50/80 transition-colors">
                        {/* NV */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">{row.ho_ten}</span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {row.ma_nv} • {row.ten_cv || "Nhân viên"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Dept */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">{row.ten_pb || "Văn phòng"}</span>
                        </td>

                        {/* Shift */}
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {row.ca_lam_viec || "Hành chính (08:00 - 17:00)"}
                          </span>
                        </td>

                        {/* Check In */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-semibold ${isLate ? "text-amber-600 font-bold" : "text-slate-800"
                                }`}
                            >
                              {isCheckedIn ? row.gio_vao : "--:--"}
                            </span>
                          </div>
                        </td>

                        {/* Check Out */}
                        <td className="py-3 px-4">
                          <span
                            className={
                              row.gio_ra === "--:--" || !row.gio_ra
                                ? isCheckedIn
                                  ? "italic text-sky-600 font-medium"
                                  : "text-slate-300"
                                : "font-semibold text-slate-800"
                            }
                          >
                            {row.gio_ra === "--:--" || !row.gio_ra
                              ? isCheckedIn
                                ? "Đang làm việc"
                                : "--:--"
                              : row.gio_ra}
                          </span>
                        </td>

                        {/* Late Minutes */}
                        <td className="py-3 px-4 text-center">
                          {isLate ? (
                            <span className="inline-flex px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[11px]">
                              {lateMins > 0 ? `+${lateMins}p` : "Đi trễ"}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Actual Hours */}
                        <td className="py-3 px-4 text-center font-semibold text-slate-800">
                          {row.so_gio_lam > 0 ? `${row.so_gio_lam}h` : "-"}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${row.loai_cong === "CONG_DU"
                                ? "bg-emerald-50 text-emerald-700"
                                : isLate
                                  ? "bg-amber-50 text-amber-700"
                                  : row.loai_cong === "NGHI_PHEP"
                                    ? "bg-sky-50 text-sky-700"
                                    : isCheckedIn && (row.gio_ra === "--:--" || !row.gio_ra)
                                      ? "bg-sky-50 text-sky-700"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${row.loai_cong === "CONG_DU"
                                  ? "bg-emerald-500"
                                  : isLate
                                    ? "bg-amber-500"
                                    : row.loai_cong === "NGHI_PHEP"
                                      ? "bg-sky-500"
                                      : isCheckedIn && (row.gio_ra === "--:--" || !row.gio_ra)
                                        ? "bg-sky-500 animate-pulse"
                                        : "bg-slate-400"
                                }`}
                            ></span>
                            {row.trang_thai || (row.loai_cong === "CONG_DU" ? "Đúng giờ" : "Chưa chấm")}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasExplanation && row.ghi_chu && (
                              <button
                                onClick={() => handleOpenAdjust(row)}
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                title={`Ghi chú: ${row.ghi_chu} - Bấm để duyệt`}
                              >
                                <AlertCircle className="w-4 h-4" />
                              </button>
                            )}

                            {isApproved ? (
                              <span
                                className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50"
                                title="Đã chốt công chuẩn"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </span>
                            ) : (
                              <button
                                onClick={() => handleApprove(row)}
                                disabled={!row.ma_cc}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={row.ma_cc ? "Chốt duyệt ngày công đủ" : "Chưa có bản ghi chấm công"}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenAdjust(row)}
                              disabled={!row.ma_cc}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={row.ma_cc ? "Điều chỉnh giờ chấm công (Tối đa 3 lần/tháng)" : "Chưa có bản ghi chấm công"}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang Daily */}
          {filteredDaily.length > 0 && (
            <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  Đang hiển thị{" "}
                  <span className="font-semibold text-slate-800">{startIdx + 1}</span> -{" "}
                  <span className="font-semibold text-slate-800">{endIdx}</span> trong tổng số{" "}
                  <span className="font-semibold text-slate-800">{filteredDaily.length}</span> bản ghi
                </span>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 bg-white border border-slate-200/80 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                  <span className="text-slate-500">người/trang</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trước</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-semibold transition-all text-xs ${page === safePage
                        ? "bg-sky-600 text-white shadow-xs"
                        : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          </>
        )}

        {/* VIEW 2: MONTHLY SUMMARY TABLE */}
        {!isLoading && viewMode === "monthly" && (
          <>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4 text-center">Tổng ngày công</th>
                  <th className="py-3 px-4 text-center">Giờ tăng ca (OT)</th>
                  <th className="py-3 px-4 text-center">Số lần đi trễ</th>
                  <th className="py-3 px-4 text-center">Số ngày phép</th>
                  <th className="py-3 px-4 text-center">Tình trạng kỷ luật</th>
                  <th className="py-3 px-4 text-right">Chu kỳ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredMonthly.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Không có dữ liệu tổng hợp công tháng cho bộ lọc đã chọn.
                    </td>
                  </tr>
                ) : (
                  paginatedMonthly.map((row) => {
                    const initials = getInitials(row.ho_ten);
                    const isExcessiveLate = row.so_lan_di_tre >= 3;

                    return (
                      <tr key={row.ma_nv} className="hover:bg-slate-50/80 transition-colors">
                        {/* NV */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">{row.ho_ten}</span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {row.ma_nv} • {row.ten_cv || "Nhân viên"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Dept */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">{row.ten_pb || "Văn phòng"}</span>
                        </td>

                        {/* Tổng ngày công */}
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono">
                            {Number(row.tong_ngay_cong).toFixed(1)} ngày
                          </span>
                        </td>

                        {/* Tổng giờ OT */}
                        <td className="py-3 px-4 text-center font-semibold text-emerald-600">
                          {Number(row.tong_gio_ot) > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">
                              +{Number(row.tong_gio_ot).toFixed(1)}h
                            </span>
                          ) : (
                            <span className="text-slate-300">0h</span>
                          )}
                        </td>

                        {/* Số lần đi trễ */}
                        <td className="py-3 px-4 text-center">
                          {row.so_lan_di_tre > 0 ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-xs ${isExcessiveLate
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-amber-50 text-amber-700"
                                }`}
                            >
                              {row.so_lan_di_tre} lần
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">0</span>
                          )}
                        </td>

                        {/* Số ngày phép */}
                        <td className="py-3 px-4 text-center font-medium text-slate-700">
                          {row.so_ngay_phep > 0 ? `${row.so_ngay_phep} ngày` : "-"}
                        </td>

                        {/* Tình trạng kỷ luật */}
                        <td className="py-3 px-4 text-center">
                          {isExcessiveLate ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Vượt mức trễ (&gt;=3 lần)
                            </span>
                          ) : row.so_lan_di_tre === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Chuyên cần tốt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Đi trễ {row.so_lan_di_tre} lần
                            </span>
                          )}
                        </td>

                        {/* Chu kỳ */}
                        <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">
                          T{row.thang}/{row.nam}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang Monthly */}
          {filteredMonthly.length > 0 && (
            <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  Đang hiển thị{" "}
                  <span className="font-semibold text-slate-800">{startIdx + 1}</span> -{" "}
                  <span className="font-semibold text-slate-800">{endIdx}</span> trong tổng số{" "}
                  <span className="font-semibold text-slate-800">{filteredMonthly.length}</span> bản ghi
                </span>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 bg-white border border-slate-200/80 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                  <span className="text-slate-500">người/trang</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trước</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-semibold transition-all text-xs ${page === safePage
                        ? "bg-sky-600 text-white shadow-xs"
                        : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* ──────────────── MODAL ĐIỀU CHỈNH GIỜ / DUYỆT GIẢI TRÌNH ──────────────── */}
      {adjustModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600" />
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-base">
                  Điều chỉnh giờ & Duyệt giải trình
                </h3>
              </div>
              <button
                onClick={() => setAdjustModalData(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4 text-xs">
              {/* Error notice if quota exceeded or bad request */}
              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{adjustError}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {adjustModalData.ho_ten}
                  </span>
                  <span className="text-slate-400">
                    {adjustModalData.ma_nv} • {adjustModalData.ten_pb || "Văn phòng"}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-mono font-medium">
                  {adjustModalData.ca_lam_viec || "Hành chính"}
                </span>
              </div>

              {adjustModalData.ghi_chu && (
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Ghi chú / Giải trình hiện tại:</span>
                  </div>
                  <p className="text-slate-700 italic">"{adjustModalData.ghi_chu}"</p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Giờ Check-in điều chỉnh (HH:MM hoặc HH:MM:SS):
                </label>
                <input
                  type="text"
                  value={adjustedTime}
                  onChange={(e) => setAdjustedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                  placeholder="08:00:00"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * Quy định: Quản lý chỉ được sửa giờ check-in tối đa 3 lần/tháng đối với mỗi nhân viên.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do điều chỉnh / Phê duyệt của Quản lý:
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-xs"
                  placeholder="Xác nhận lý do chính đáng, duyệt công đủ..."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustModalData(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveAdjust}
                disabled={isAdjusting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
              >
                {isAdjusting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isAdjusting ? "Đang lưu..." : "Xác nhận & Duyệt công"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
