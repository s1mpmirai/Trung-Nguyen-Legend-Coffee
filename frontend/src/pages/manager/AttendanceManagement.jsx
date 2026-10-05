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
  Award,
  Lock,
  Unlock,
  Layers,
  Eye,
  Save,
} from "lucide-react";
import {
  getDailyAttendanceForManager,
  getMonthlyAttendanceSummaryForManager,
  adjustAttendanceRecord,
  getShifts,
  getAttendanceLockStatus,
  toggleAttendanceLock,
  getAttendanceHistory,
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

  // Danh mục ca làm việc & Trạng thái Chốt công tháng
  const [availableShifts, setAvailableShifts] = useState([
    { ma_ca: "CA01", ten_ca: "Hành chính", gio_vao: "08:00", gio_ra: "17:00", he_so: 1.0 },
    { ma_ca: "CA02", ten_ca: "Ca sáng", gio_vao: "06:00", gio_ra: "14:00", he_so: 1.0 },
    { ma_ca: "CA03", ten_ca: "Ca chiều", gio_vao: "14:00", gio_ra: "22:00", he_so: 1.0 },
  ]);
  const [adjustedShift, setAdjustedShift] = useState("CA01");
  const [isMonthLocked, setIsMonthLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState({ nguoi_chot: "", ngay_chot: "", ghi_chu: "" });
  const [isLocking, setIsLocking] = useState(false);

  // Modal điều chỉnh giờ / duyệt giải trình
  const [adjustModalData, setAdjustModalData] = useState(null);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustedTime, setAdjustedTime] = useState("");
  const [adjustedCheckOutTime, setAdjustedCheckOutTime] = useState("");
  const [adjustedWorkType, setAdjustedWorkType] = useState("CONG_DU");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Modal từ chối duyệt công riêng biệt (Icon X)
  const [rejectModalData, setRejectModalData] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Modal xem chi tiết lịch sử chấm công tháng của nhân viên
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);
  const [employeeDetailHistory, setEmployeeDetailHistory] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Checkbox tick chọn & Phê duyệt hàng loạt
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Tải dữ liệu chấm công theo ngày
  const loadDailyData = async (date = selectedDate, dept = selectedDept) => {
    setIsLoading(true);
    setSelectedRowIds([]);
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

  // Tải ca làm việc & Kiểm tra khóa công
  const loadShifts = async () => {
    try {
      const data = await getShifts();
      if (Array.isArray(data) && data.length > 0) {
        setAvailableShifts(data);
      }
    } catch (e) {
      console.error("Lỗi tải danh mục ca:", e);
    }
  };

  const checkMonthLock = async (m = selectedMonth, y = selectedYear) => {
    try {
      const status = await getAttendanceLockStatus(m, y);
      setIsMonthLocked(Boolean(status?.is_locked));
      setLockInfo(status || {});
    } catch (e) {
      console.error("Lỗi kiểm tra khóa công:", e);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  useEffect(() => {
    checkMonthLock(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (viewMode === "daily") {
      loadDailyData(selectedDate, selectedDept);
    } else {
      loadMonthlyData(selectedMonth, selectedYear, selectedDept);
    }
  }, [viewMode, selectedDate, selectedDept, selectedMonth, selectedYear]);

  // Chốt hoặc mở khóa bảng công tháng
  const handleToggleLockMonth = async () => {
    setIsLocking(true);
    try {
      const willLock = !isMonthLocked;
      const res = await toggleAttendanceLock({
        thang: selectedMonth,
        nam: selectedYear,
        khoa: willLock,
        nguoi_chot: "Quản lý nhân sự",
        ghi_chu: willLock
          ? `Đã chốt công tháng ${selectedMonth}/${selectedYear} để đối soát và tính lương`
          : `Mở khóa điều chỉnh bổ sung công tháng ${selectedMonth}/${selectedYear}`,
      });
      setIsMonthLocked(Boolean(res?.is_locked));
      setLockInfo(res || {});
      setSyncToast(
        willLock
          ? `Đã chốt và khóa thành công bảng công Tháng ${selectedMonth}/${selectedYear}!`
          : `Đã mở khóa bảng công Tháng ${selectedMonth}/${selectedYear}!`
      );
      setTimeout(() => setSyncToast(""), 4000);
    } catch (err) {
      setSyncToast(`Lỗi: ${err.message}`);
      setTimeout(() => setSyncToast(""), 4500);
    } finally {
      setIsLocking(false);
    }
  };


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

  // Tự động tính toán loại công hợp lý dựa trên ca làm việc và giờ vào / ra
  const computeWorkType = (shiftCode, inTime, outTime) => {
    if (!inTime || inTime === "--:--") return "CONG_DU";
    const [h, m] = inTime.split(":").map(Number);
    const inMins = (h || 0) * 60 + (m || 0);
    let shiftStart = 8 * 60; // mặc định CA01 08:00
    if (shiftCode === "CA02") shiftStart = 6 * 60;
    else if (shiftCode === "CA03") shiftStart = 14 * 60;

    let diff = inMins - shiftStart;
    const isLate = diff > 15;

    if (outTime && outTime !== "--:--" && outTime !== "Đang làm việc") {
      const [oh, om] = outTime.split(":").map(Number);
      let outMins = (oh || 0) * 60 + (om || 0);
      if (outMins < inMins) outMins += 24 * 60;
      let dur = (outMins - inMins) / 60;
      if (shiftCode === "CA01" && dur >= 5) dur -= 1; // 1h nghỉ trưa
      if (dur < 4) return "VE_SOM";
      if (dur < 7.5 && isLate) return "DI_TRE";
      if (dur < 7.5) return "NUA_CONG";
    }

    return isLate ? "DI_TRE" : "CONG_DU";
  };

  // Phê duyệt xác nhận công cho bản ghi (giữ đúng tình trạng Đi trễ nếu nhân viên đi trễ)
  const handleApprove = async (row) => {
    if (!row.ma_cc) {
      setSyncToast(`Nhân viên ${row.ho_ten} chưa có bản ghi chấm công ngày này để chốt.`);
      setTimeout(() => setSyncToast(""), 3500);
      return;
    }
    try {
      const isLateRecord = row.loai_cong === "DI_TRE";
      const targetLoaiCong = row.loai_cong || "CONG_DU";
      const targetSoCong = row.so_cong != null && row.so_cong > 0 ? row.so_cong : 1.0;
      const ghiChuText = isLateRecord
        ? (row.ghi_chu ? `${row.ghi_chu} (Đã duyệt xác nhận đi trễ)` : "Quản lý duyệt xác nhận đi trễ")
        : (row.ghi_chu || "Quản lý chốt công đủ");

      await adjustAttendanceRecord(row.ma_cc, {
        loai_cong: targetLoaiCong,
        so_cong: targetSoCong,
        trang_thai_duyet: "DA_DUYET",
        ghi_chu: ghiChuText,
      });
      setSyncToast(
        isLateRecord
          ? `Đã duyệt xác nhận đi trễ cho ${row.ho_ten}!`
          : `Đã phê duyệt công cho ${row.ho_ten}!`
      );
      setTimeout(() => setSyncToast(""), 3500);
      loadDailyData(selectedDate, selectedDept);
    } catch (err) {
      setSyncToast(`Lỗi: ${err.message}`);
      setTimeout(() => setSyncToast(""), 4500);
    }
  };

  // Mở modal điều chỉnh
  const handleOpenAdjust = (row) => {
    if (isMonthLocked) {
      setSyncToast(`Bảng công tháng ${selectedMonth}/${selectedYear} đã được Chốt và Khóa. Vui lòng mở khóa trước khi điều chỉnh!`);
      setTimeout(() => setSyncToast(""), 4000);
      return;
    }
    const initIn = row.gio_vao && row.gio_vao !== "--:--" ? row.gio_vao : "08:00";
    const initOut = row.gio_ra && row.gio_ra !== "--:--" && row.gio_ra !== "Đang làm việc" ? row.gio_ra : "17:00";
    const initShift = row.ma_ca || "CA01";

    setAdjustModalData(row);
    // Giữ lại lý do / giải trình hiện tại nếu có
    setAdjustReason(row.ghi_chu || "");
    setAdjustedTime(initIn);
    setAdjustedCheckOutTime(initOut);
    setAdjustedShift(initShift);

    // Tính toán ca và kiểm tra giờ vào thực tế
    const [h, m] = initIn.split(":").map(Number);
    const inMins = (h || 0) * 60 + (m || 0);
    let shiftStart = 8 * 60;
    if (initShift === "CA02") shiftStart = 6 * 60;
    else if (initShift === "CA03") shiftStart = 14 * 60;
    const isLateCheckIn = (inMins - shiftStart) > 15;

    let defaultWorkType = row.loai_cong || computeWorkType(initShift, initIn, initOut);
    if (isLateCheckIn && defaultWorkType === "CONG_DU") {
      defaultWorkType = "DI_TRE";
    }
    setAdjustedWorkType(defaultWorkType);
    setAdjustError("");
  };

  // Lưu điều chỉnh từ modal (có thể chọn chỉ lưu hoặc lưu & xác nhận duyệt luôn)
  const handleSaveAdjust = async (shouldApprove = false) => {
    if (!adjustModalData) return;
    if (!adjustModalData.ma_cc) {
      setAdjustError("Nhân viên này chưa có bản ghi chấm công để điều chỉnh.");
      return;
    }
    setIsAdjusting(true);
    setAdjustError("");
    try {
      let formattedInTime = adjustedTime;
      if (formattedInTime && formattedInTime.length === 5) {
        formattedInTime = `${formattedInTime}:00`;
      }
      let formattedOutTime = adjustedCheckOutTime;
      if (formattedOutTime && formattedOutTime.length === 5) {
        formattedOutTime = `${formattedOutTime}:00`;
      }

      const soCongValue =
        adjustedWorkType === "CONG_DU" || adjustedWorkType === "DI_TRE"
          ? (adjustModalData.so_cong != null && adjustModalData.so_cong > 0 ? adjustModalData.so_cong : 1.0)
          : adjustedWorkType === "NUA_CONG"
          ? 0.5
          : adjustedWorkType === "NGHI_KHONG_PHEP" || adjustedWorkType === "VE_SOM"
          ? 0.0
          : 1.0;

      const targetTrangThaiDuyet = shouldApprove
        ? (adjustedWorkType === "NGHI_KHONG_PHEP" ? "TU_CHOI" : "DA_DUYET")
        : (adjustModalData.trang_thai_duyet || "CHO_DUYET");

      const defaultNote = adjustedWorkType === "DI_TRE"
        ? (shouldApprove ? "Quản lý duyệt xác nhận đi trễ" : "Ghi nhận đi trễ")
        : "Quản lý điều chỉnh giờ vào/ra hợp lệ";

      await adjustAttendanceRecord(adjustModalData.ma_cc, {
        ma_ca: adjustedShift,
        gio_vao: formattedInTime || undefined,
        gio_ra: formattedOutTime || undefined,
        loai_cong: adjustedWorkType,
        so_cong: soCongValue,
        trang_thai_duyet: targetTrangThaiDuyet,
        ghi_chu: adjustReason || defaultNote,
      });
      setAdjustModalData(null);
      setSyncToast(
        shouldApprove
          ? (adjustedWorkType === "DI_TRE"
              ? `Đã duyệt xác nhận đi trễ cho ${adjustModalData.ho_ten}!`
              : `Đã phê duyệt công cho ${adjustModalData.ho_ten}!`)
          : `Đã lưu điều chỉnh giờ chấm công cho ${adjustModalData.ho_ten}!`
      );
      setTimeout(() => setSyncToast(""), 3500);
      loadDailyData(selectedDate, selectedDept);
    } catch (err) {
      setAdjustError(err.message || "Lỗi khi lưu điều chỉnh.");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Mở Popup Từ chối duyệt công riêng biệt (Icon X)
  const handleOpenReject = (row) => {
    if (isMonthLocked) {
      setSyncToast(`Bảng công tháng ${selectedMonth}/${selectedYear} đã được Chốt và Khóa! Vui lòng mở khóa trước.`);
      setTimeout(() => setSyncToast(""), 4000);
      return;
    }
    setAdjustModalData(null);
    setRejectModalData(row);
    setRejectionReason(row.ghi_chu && !row.ghi_chu.includes("Đi muộn") ? `Bác bỏ giải trình: "${row.ghi_chu}"` : "");
    setRejectError("");
  };

  // Xác nhận từ chối duyệt công từ Popup X (0 công, chuyển thành nghỉ không phép / vi phạm)
  const handleConfirmReject = async () => {
    if (!rejectModalData) return;
    if (!rejectionReason.trim()) {
      setRejectError("Vui lòng nhập lý do từ chối công trước khi xác nhận.");
      return;
    }
    if (!rejectModalData.ma_cc) {
      setRejectError("Nhân viên này chưa có bản ghi chấm công để từ chối.");
      return;
    }
    setIsRejecting(true);
    setRejectError("");
    try {
      await adjustAttendanceRecord(rejectModalData.ma_cc, {
        loai_cong: "NGHI_KHONG_PHEP",
        so_cong: 0.0,
        so_gio_lam: 0.0,
        trang_thai_duyet: "TU_CHOI",
        ghi_chu: rejectionReason.trim(),
      });
      const name = rejectModalData.ho_ten;
      setRejectModalData(null);
      setSyncToast(`Đã TỪ CHỐI duyệt công cho ${name} (0 công)!`);
      setTimeout(() => setSyncToast(""), 3500);
      loadDailyData(selectedDate, selectedDept);
    } catch (err) {
      setRejectError(err.message || "Lỗi khi từ chối duyệt công.");
    } finally {
      setIsRejecting(false);
    }
  };

  // Xem chi tiết lịch sử chấm công tháng của nhân viên
  const handleOpenEmployeeDetail = async (row) => {
    setSelectedEmployeeDetail(row);
    setIsLoadingDetail(true);
    setEmployeeDetailHistory(null);
    try {
      const res = await getAttendanceHistory(row.ma_nv, selectedMonth, selectedYear);
      setEmployeeDetailHistory(res);
    } catch (e) {
      console.error("Lỗi tải chi tiết chấm công nhân viên:", e);
    } finally {
      setIsLoadingDetail(false);
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
      csvContent += "Mã NV,Họ tên,Phòng ban,Chức vụ,Tháng,Năm,Tổng ngày công,Số lần đi trễ,Số ngày phép\n";
      filteredMonthly.forEach((r) => {
        csvContent += `"${r.ma_nv}","${r.ho_ten}","${r.ten_pb || ''}","${r.ten_cv || ''}","${r.thang}","${r.nam}","${r.tong_ngay_cong}","${r.so_lan_di_tre}","${r.so_ngay_phep}"\n`;
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
  const lateCount = dailyAttendance.filter((r) => r.loai_cong === "DI_TRE" || r.loai_cong === "VE_SOM").length;
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

    const isLate = item.loai_cong === "DI_TRE";
    const isOntime = item.loai_cong === "CONG_DU" && item.gio_vao && item.gio_vao !== "--:--";
    const isWorking = item.gio_vao && item.gio_vao !== "--:--" && (item.gio_ra === "--:--" || !item.gio_ra);
    const isAbsent = !item.gio_vao || item.gio_vao === "--:--" || item.gio_vao === "-";

    const isApproved = item.trang_thai_duyet === "DA_DUYET";
    const isPending = (!item.trang_thai_duyet || item.trang_thai_duyet === "CHO_DUYET") && item.ma_cc;

    const matchStatus =
      selectedStatus === "all" ||
      (selectedStatus === "approved" && isApproved) ||
      (selectedStatus === "pending" && isPending) ||
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

  // Kiểm tra nhân sự có công đang CHỜ DUYỆT (có ma_cc, có giờ vào hợp lệ và chưa được duyệt hoặc từ chối)
  const isPendingApprovalRow = (r) => {
    const isCheckedIn = r.gio_vao && r.gio_vao !== "--:--" && r.gio_vao !== "-";
    const isApproved = r.trang_thai_duyet === "DA_DUYET";
    const isRejected = r.trang_thai_duyet === "TU_CHOI" || r.loai_cong === "NGHI_KHONG_PHEP";
    return Boolean(r.ma_cc) && isCheckedIn && !isApproved && !isRejected;
  };

  // Sắp xếp Daily: ƯU TIÊN CHỜ DUYỆT CÔNG LÊN ĐẦU TIÊN -> Đã duyệt/từ chối -> Chưa có công -> Ban Giám đốc -> Phòng ban -> Tên
  const sortDailyByPendingFirst = (a, b) => {
    const getPriority = (r) => {
      // 0: Chờ duyệt công (ưu tiên hàng đầu)
      if (isPendingApprovalRow(r)) return 0;
      // 1: Đã có công (đã duyệt, từ chối, v.v.)
      if (r.ma_cc && r.gio_vao && r.gio_vao !== "--:--" && r.gio_vao !== "-") return 1;
      // 2: Chưa có công / Chưa chấm
      return 2;
    };

    const prioA = getPriority(a);
    const prioB = getPriority(b);
    if (prioA !== prioB) return prioA - prioB;

    // Trong cùng nhóm: Ban Giám đốc (PB01)
    const aIsBGD = (a.ma_pb === "PB01") ? 0 : 1;
    const bIsBGD = (b.ma_pb === "PB01") ? 0 : 1;
    if (aIsBGD !== bIsBGD) return aIsBGD - bIsBGD;

    // Theo phòng ban
    const deptA = (a.ten_pb || "").toLowerCase();
    const deptB = (b.ten_pb || "").toLowerCase();
    if (deptA !== deptB) return deptA.localeCompare(deptB, "vi");

    // Theo tên nhân viên
    const nameA = (a.ho_ten || "").toLowerCase();
    const nameB = (b.ho_ten || "").toLowerCase();
    return nameA.localeCompare(nameB, "vi");
  };

  // Sắp xếp Monthly: Nhân viên 0 công lên đầu -> Ban Giám đốc (PB01) -> theo phòng ban -> theo tên
  const sortMonthlyByZeroWorkDaysFirst = (a, b) => {
    const aZero = (Number(a.tong_ngay_cong) === 0) ? 0 : 1;
    const bZero = (Number(b.tong_ngay_cong) === 0) ? 0 : 1;
    if (aZero !== bZero) return aZero - bZero;

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

  filteredDaily.sort(sortDailyByPendingFirst);
  filteredMonthly.sort(sortMonthlyByZeroWorkDaysFirst);

  // Tiêu chí kiểm tra trạng thái dòng công:
  const isLateRow = (r) =>
    r.loai_cong === "DI_TRE" ||
    r.loai_cong === "VE_SOM";

  const isRejectedRow = (r) => r.trang_thai_duyet === "TU_CHOI" || r.loai_cong === "NGHI_KHONG_PHEP";

  const isApprovedRow = (r) => r.trang_thai_duyet === "DA_DUYET";

  // Tiêu chí ĐƯỢC PHÊ DUYỆT (bỏ qua người đã duyệt hoặc bị từ chối):
  const isEligibleToApprove = (r) =>
    Boolean(r.ma_cc) && !isApprovedRow(r) && !isRejectedRow(r);

  // Danh sách các dòng được tick chọn và THỰC SỰ ĐỦ ĐIỀU KIỆN PHÊ DUYỆT
  const selectedEligibleDailyRows = dailyAttendance.filter(
    (r) => r.ma_cc && selectedRowIds.includes(r.ma_cc) && isEligibleToApprove(r)
  );

  // Danh sách các dòng có thể tick chọn trên bảng (các dòng có ma_cc và chưa duyệt công)
  const selectableDailyRows = filteredDaily.filter(
    (r) => r.ma_cc && !isApprovedRow(r)
  );

  const isAllDailySelected =
    selectableDailyRows.length > 0 &&
    selectableDailyRows.every((r) => selectedRowIds.includes(r.ma_cc));

  const handleToggleSelectAllDaily = () => {
    if (isAllDailySelected) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(selectableDailyRows.map((r) => r.ma_cc));
    }
  };

  const handleToggleSelectRow = (maCc) => {
    if (!maCc) return;
    setSelectedRowIds((prev) =>
      prev.includes(maCc) ? prev.filter((id) => id !== maCc) : [...prev, maCc]
    );
  };

  // Phê duyệt phụ thuộc vào số lượng người dùng tick vào (duyệt đúng theo tình trạng: đi trễ duyệt theo đi trễ, đúng giờ duyệt theo công đủ)
  const handleBulkApprove = async () => {
    if (isMonthLocked) {
      setSyncToast(`Bảng công tháng ${selectedMonth}/${selectedYear} đã được Chốt và Khóa! Vui lòng mở khóa trước.`);
      setTimeout(() => setSyncToast(""), 4000);
      return;
    }

    if (selectedEligibleDailyRows.length === 0) {
      if (selectedRowIds.length > 0) {
        setSyncToast("Các nhân sự bạn đã tick chọn đều đã được duyệt hoặc đang bị từ chối.");
      } else {
        setSyncToast("Vui lòng tick chọn ít nhất 1 nhân sự hợp lệ để phê duyệt.");
      }
      setTimeout(() => setSyncToast(""), 4000);
      return;
    }

    setIsBulkApproving(true);
    try {
      let lateCount = 0;
      await Promise.all(
        selectedEligibleDailyRows.map((r) => {
          const isLate = r.loai_cong === "DI_TRE";
          if (isLate) lateCount += 1;
          const targetLoaiCong = r.loai_cong || "CONG_DU";
          const targetSoCong = r.so_cong != null && r.so_cong > 0 ? r.so_cong : 1.0;
          const targetGhiChu = isLate
            ? (r.ghi_chu ? `${r.ghi_chu} (Đã xác nhận đi trễ)` : "Quản lý duyệt xác nhận đi trễ hàng loạt")
            : (r.ghi_chu || "Quản lý phê duyệt công hàng loạt");

          return adjustAttendanceRecord(r.ma_cc, {
            loai_cong: targetLoaiCong,
            so_cong: targetSoCong,
            trang_thai_duyet: "DA_DUYET",
            ghi_chu: targetGhiChu,
          });
        })
      );

      const skippedCount = selectedRowIds.length - selectedEligibleDailyRows.length;
      let toastMsg = `Đã phê duyệt thành công cho ${selectedEligibleDailyRows.length} nhân sự`;
      if (lateCount > 0) {
        toastMsg += ` (bao gồm ${lateCount} nhân sự xác nhận đi trễ)`;
      }
      if (skippedCount > 0) {
        toastMsg += ` (đã bỏ qua ${skippedCount} người đã duyệt hoặc bị từ chối)`;
      }
      setSyncToast(`${toastMsg}!`);

      setSelectedRowIds([]);
      setTimeout(() => setSyncToast(""), 4000);
      await loadDailyData(selectedDate, selectedDept);
    } catch (err) {
      setSyncToast(`Lỗi khi phê duyệt hàng loạt: ${err.message}`);
      setTimeout(() => setSyncToast(""), 4500);
    } finally {
      setIsBulkApproving(false);
    }
  };

  // Phân trang cho cả daily và monthly
  const activeFiltered = viewMode === "daily" ? filteredDaily : filteredMonthly;
  const isPageSizeAll = pageSize === "all" || Number(pageSize) >= 9999;
  const effectivePageSize = isPageSizeAll ? Math.max(1, activeFiltered.length) : Number(pageSize);
  const totalPages = isPageSizeAll ? 1 : Math.max(1, Math.ceil(activeFiltered.length / effectivePageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = isPageSizeAll ? 0 : (safePage - 1) * effectivePageSize;
  const endIdx = isPageSizeAll ? activeFiltered.length : Math.min(startIdx + effectivePageSize, activeFiltered.length);
  const paginatedDaily = isPageSizeAll ? filteredDaily : filteredDaily.slice(startIdx, endIdx);
  const paginatedMonthly = isPageSizeAll ? filteredMonthly : filteredMonthly.slice(startIdx, endIdx);

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
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleToggleLockMonth}
            disabled={isLocking}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 ${
              isMonthLocked
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20"
            }`}
            title={isMonthLocked ? "Mở khóa bảng chấm công tháng" : "Chốt và khóa bảng công tháng để tính lương"}
          >
            {isLocking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isMonthLocked ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>
              {isLocking
                ? "Đang xử lý..."
                : isMonthLocked
                ? `Đã chốt công Th.${selectedMonth} (Mở khóa)`
                : `Chốt công Th.${selectedMonth}`}
            </span>
          </button>

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
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Banner thông báo trạng thái Chốt công tháng */}
      {isMonthLocked && (
        <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-800 text-xs block">
                Bảng chấm công Tháng {selectedMonth}/{selectedYear} đã được Chốt & Khóa an toàn!
              </span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Dữ liệu ngày công đã cố định cho phòng Kế toán tính lương. Bảng công đã được khóa chống chỉnh sửa.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-white/90 border border-emerald-200 text-[11px] font-semibold text-emerald-700 self-start sm:self-center shrink-0">
            {lockInfo.nguoi_chot ? `Chốt bởi: ${lockInfo.nguoi_chot}` : "Đã khóa số liệu"}
          </span>
        </div>
      )}


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
              <span className="text-xs font-medium text-slate-500">Đi muộn / Vi phạm</span>
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
              <span className="text-xs font-medium text-slate-500">Nhân sự tính công</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-emerald-600">
                {monthlyAttendance.length}
              </span>
              <span className="text-xs text-slate-400">nhân sự</span>
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
                <option value="approved">Đã duyệt công</option>
                <option value="pending">Chờ duyệt công</option>
                <option value="ontime">Đúng giờ</option>
                <option value="late">Đi muộn</option>
                <option value="working">Đang làm việc</option>
                <option value="absent">Vắng mặt / Chưa chấm</option>
              </select>
            )}


          </div>
        </div>

        {/* Thanh tác vụ nhanh khi có tick chọn nhân sự */}
        {!isLoading && viewMode === "daily" && selectedRowIds.length > 0 && (
          <div className="mx-4 my-2.5 p-3 bg-sky-50 border border-sky-200/90 rounded-xl flex items-center justify-between gap-3 text-xs text-sky-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping"></span>
              <span>
                Đang tick chọn: <strong className="text-sky-800 font-bold">{selectedRowIds.length}</strong> nhân sự
                {selectedRowIds.length > selectedEligibleDailyRows.length && (
                  <span className="ml-1.5 text-amber-700 font-medium">
                    (Có {selectedRowIds.length - selectedEligibleDailyRows.length} người đi muộn hoặc bị từ chối sẽ không được duyệt)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedRowIds([])}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-800 hover:bg-white/80 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={isBulkApproving || selectedEligibleDailyRows.length === 0}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Phê duyệt ${selectedEligibleDailyRows.length} nhân sự hợp lệ`}
              >
                {isBulkApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>Phê duyệt ({selectedEligibleDailyRows.length} người)</span>
              </button>
            </div>
          </div>
        )}

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
            <table className="w-full text-left border-collapse min-w-[1150px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllDailySelected}
                      onChange={handleToggleSelectAllDaily}
                      disabled={isMonthLocked || selectableDailyRows.length === 0}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isAllDailySelected ? "Bỏ chọn tất cả" : "Chọn tất cả nhân sự chưa duyệt"}
                    />
                  </th>
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4">Ca làm việc</th>
                  <th className="py-3 px-4">Check-in</th>
                  <th className="py-3 px-4">Check-out</th>
                  <th className="py-3 px-4 text-center">Đi muộn</th>
                  <th className="py-3 px-4 text-center">Số giờ làm</th>
                  <th className="py-3 px-4 text-center">Số công</th>
                  
                  <th className="py-3 px-4">Tình trạng</th>
                  <th className="py-3 px-4 text-center">Phê duyệt</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredDaily.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400">
                      Không có bản ghi chấm công nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedDaily.map((row) => {
                    const initials = getInitials(row.ho_ten);
                    const isLate = row.loai_cong === "DI_TRE";
                    const lateMins = getLateMinutes(row.gio_vao, row.loai_cong);
                    const isCheckedIn = row.gio_vao && row.gio_vao !== "--:--" && row.gio_vao !== "-";
                    const isApproved = row.trang_thai_duyet === "DA_DUYET";
                    const isRejected = row.trang_thai_duyet === "TU_CHOI" || row.loai_cong === "NGHI_KHONG_PHEP";
                    const hasExplanation = isLate || Boolean(row.ghi_chu && row.ghi_chu.length > 0);

                    return (
                      <tr key={row.ma_nv} className={`hover:bg-slate-50/80 transition-colors ${selectedRowIds.includes(row.ma_cc) ? "bg-sky-50/50" : ""}`}>
                        {/* Checkbox chọn */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(row.ma_cc && selectedRowIds.includes(row.ma_cc))}
                            onChange={() => handleToggleSelectRow(row.ma_cc)}
                            disabled={!row.ma_cc || isApproved || isMonthLocked}
                            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={!row.ma_cc ? "Chưa có công để chọn" : isApproved ? "Đã duyệt công đủ" : "Chọn để duyệt công"}
                          />
                        </td>

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

                        {/* Số công */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            (row.so_cong >= 1) ? "bg-emerald-50 text-emerald-700" :
                            (row.so_cong >= 0.5) ? "bg-blue-50 text-blue-700" :
                            row.ma_cc ? "bg-slate-100 text-slate-500" : ""
                          }`}>
                            {row.so_cong != null && row.ma_cc ? Number(row.so_cong).toFixed(1) : "-"}
                          </span>
                        </td>

                        

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${row.loai_cong === "CONG_DU"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.loai_cong === "VE_SOM"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : isLate
                                    ? "bg-amber-50 text-amber-700"
                                    : row.loai_cong === "NUA_CONG"
                                      ? "bg-blue-50 text-blue-700"
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
                                  : row.loai_cong === "VE_SOM"
                                    ? "bg-rose-500"
                                    : isLate
                                      ? "bg-amber-500"
                                      : row.loai_cong === "NUA_CONG"
                                        ? "bg-blue-500"
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

                        {/* Phê duyệt */}
                        <td className="py-3 px-4 text-center">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.4]" />
                              <span>Đã duyệt</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs">
                              <XCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.4]" />
                              <span>Từ chối</span>
                            </span>
                          ) : row.ma_cc ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
                              <Clock className="w-3.5 h-3.5 text-amber-500 stroke-[2.2]" />
                              <span>Chờ duyệt</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[11px] italic">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isMonthLocked ? (
                              <span
                                className="w-8 h-8 rounded-lg text-slate-400 bg-slate-100 flex items-center justify-center cursor-not-allowed"
                                title="Bảng công tháng đã khóa, không thể điều chỉnh"
                              >
                                <Lock className="w-4 h-4" />
                              </span>
                            ) : !row.ma_cc ? (
                              <span className="text-slate-300 text-xs italic px-2">Chưa có công</span>
                            ) : isApproved ? (
                              <>
                                {/* 1. Cây bút: Chỉnh sửa bổ sung (Nằm bên trái ngoài cùng) */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdjust(row)}
                                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                                  title="Chỉnh sửa bổ sung"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                {/* 2. Nút X: Hủy duyệt / Từ chối (Nằm ở giữa) */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenReject(row)}
                                  className="w-8 h-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                                  title="Từ chối / Hủy duyệt công ngày này"
                                >
                                  <X className="w-4 h-4 stroke-[2.5]" />
                                </button>

                                {/* 3. Tick xanh: Đã duyệt (Nằm bên phải ngoài cùng) */}
                                <span
                                  className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"
                                  title={isLate ? "Đã duyệt xác nhận đi trễ" : "Đã chốt duyệt công đủ"}
                                >
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                </span>
                              </>
                            ) : isRejected ? (
                              <>
                                {/* 1. Cây bút: Xem lại / Sửa (Nằm bên trái ngoài cùng) */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdjust(row)}
                                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                                  title="Xem lại / Chỉnh sửa bổ sung"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                {/* 2. Nút X: Đã từ chối (Nằm ở giữa) */}
                                <span
                                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"
                                  title="Đã từ chối duyệt công ngày này (0 công)"
                                >
                                  <X className="w-4 h-4 stroke-[2.5]" />
                                </span>

                                {/* 3. Tick xanh: Phê duyệt lại công (Nằm bên phải ngoài cùng) */}
                                <button
                                  type="button"
                                  onClick={() => handleApprove(row)}
                                  className="w-8 h-8 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                                  title={isLate ? "Phê duyệt lại (Xác nhận đi trễ)" : "Phê duyệt lại công đủ (1.0 ngày công)"}
                                >
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                </button>
                              </>
                            ) : (
                              <>
                                {/* 1. Nút cây bút: Nằm bên trái ngoài cùng */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdjust(row)}
                                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                                  title={row.ghi_chu ? `Giải trình: "${row.ghi_chu}" - Bấm để điều chỉnh giờ` : "Điều chỉnh giờ chấm công"}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                {/* 2. Nút X (Từ chối): Nằm ở giữa */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenReject(row)}
                                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-2xs flex items-center justify-center cursor-pointer active:scale-95"
                                  title="Từ chối duyệt công ngày này (0 công - Vi phạm / Nghỉ không phép)"
                                >
                                  <X className="w-4 h-4 stroke-[2.5]" />
                                </button>

                                {/* 3. Nút Tick xanh (Phê duyệt): Nằm bên phải ngoài cùng */}
                                <button
                                  type="button"
                                  onClick={() => handleApprove(row)}
                                  className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs flex items-center justify-center cursor-pointer active:scale-95"
                                  title={isLate ? "Xác nhận duyệt đi trễ" : "Chốt duyệt công đủ (1.0 ngày công)"}
                                >
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                </button>
                              </>
                            )}
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
                    onChange={(e) => {
                      setPageSize(e.target.value === "all" ? "all" : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white border border-slate-200/80 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value="all">Tất cả</option>
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
                  
                  <th className="py-3 px-4 text-center">Số lần đi trễ</th>
                  <th className="py-3 px-4 text-center">Số ngày phép</th>
                  <th className="py-3 px-4 text-center">Tình trạng kỷ luật</th>
                  <th className="py-3 px-4 text-center">Chu kỳ</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
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
                        <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                          T{row.thang}/{row.nam}
                        </td>

                        {/* Thao tác */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEmployeeDetail(row)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors"
                            title="Xem chi tiết từng ngày công trong tháng của nhân viên"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </button>
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
                    onChange={(e) => {
                      setPageSize(e.target.value === "all" ? "all" : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white border border-slate-200/80 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value="all">Tất cả</option>
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
        <div
          onClick={() => setAdjustModalData(null)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600" />
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-base">
                  Điều chỉnh giờ chấm công
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
                  Ca làm việc phân công:
                </label>
                <select
                  value={adjustedShift}
                  onChange={(e) => {
                    const newShift = e.target.value;
                    setAdjustedShift(newShift);
                    setAdjustedWorkType(computeWorkType(newShift, adjustedTime, adjustedCheckOutTime));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white text-xs text-slate-800"
                >
                  {availableShifts.map((s) => (
                    <option key={s.ma_ca} value={s.ma_ca}>
                      {s.ten_ca} ({s.gio_vao} - {s.gio_ra}) {s.he_so > 1 ? `• Hệ số đêm x${s.he_so}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Hệ thống tự động nhận diện ca theo giờ chấm công, quản lý có thể điều chỉnh lại ca nếu cần.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giờ Vào (Check-in):
                  </label>
                  <input
                    type="text"
                    value={adjustedTime}
                    onChange={(e) => {
                      const newIn = e.target.value;
                      setAdjustedTime(newIn);
                      if (newIn.length >= 4) {
                        setAdjustedWorkType(computeWorkType(adjustedShift, newIn, adjustedCheckOutTime));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-xs"
                    placeholder="08:00:00"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giờ Ra (Check-out):
                  </label>
                  <input
                    type="text"
                    value={adjustedCheckOutTime}
                    onChange={(e) => {
                      const newOut = e.target.value;
                      setAdjustedCheckOutTime(newOut);
                      if (newOut.length >= 4) {
                        setAdjustedWorkType(computeWorkType(adjustedShift, adjustedTime, newOut));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-xs"
                    placeholder="17:00:00"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quy đổi loại công duyệt:
                </label>
                <select
                  value={adjustedWorkType}
                  onChange={(e) => setAdjustedWorkType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white text-xs text-slate-800"
                >
                  <option value="CONG_DU">Công đủ (1.0 ngày công - Hợp lệ)</option>
                  <option value="DI_TRE">Đi trễ (Ghi nhận vi phạm)</option>
                  <option value="NUA_CONG">Nửa ngày công (0.5 công)</option>
                  <option value="NGHI_PHEP">Nghỉ phép (Hưởng chế độ phép)</option>
                  <option value="VE_SOM">Về sớm (0.0 ngày công)</option>
                  <option value="NGHI_KHONG_PHEP">Từ chối duyệt (0.0 công - Nghỉ không phép / Bỏ ca)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Quy định: Quản lý chỉ được sửa giờ chấm công tối đa 3 lần/tháng đối với mỗi nhân viên.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do điều chỉnh của Quản lý:
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-xs"
                  placeholder="Nhập lý do điều chỉnh giờ / ca làm việc..."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustModalData(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleSaveAdjust(false)}
                disabled={isAdjusting}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.2]" />}
                <span>Lưu thay đổi</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveAdjust(true)}
                disabled={isAdjusting}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{adjustedWorkType === "DI_TRE" ? "Xác nhận duyệt đi trễ" : "Xác nhận duyệt"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── POPUP TỪ CHỐI DUYỆT CÔNG (NÚT X) ──────────────── */}
      {rejectModalData && (
        <div
          onClick={() => setRejectModalData(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-150 cursor-default"
          >
            {/* Header Popup */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Từ chối duyệt công</h3>
                  <p className="text-[11px] text-slate-500">Chuyển thành 0 ngày công (Nghỉ không phép / Vi phạm)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalData(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin nhân viên & ca công */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">{rejectModalData.ho_ten}</span>
                <span className="font-mono text-[11px] text-slate-500">{rejectModalData.ma_nv} • {rejectModalData.ten_pb || "Văn phòng"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                <span>Ca: {rejectModalData.ca_lam_viec || "Hành chính"}</span>
                <span>Vào: <strong className="text-slate-800">{rejectModalData.gio_vao || "--:--"}</strong> — Ra: <strong className="text-slate-800">{rejectModalData.gio_ra || "--:--"}</strong></span>
              </div>
              {rejectModalData.ghi_chu && (
                <div className="pt-1.5 mt-0.5 border-t border-slate-200 text-[11px] text-amber-700 italic">
                  Giải trình: "{rejectModalData.ghi_chu}"
                </div>
              )}
            </div>

            {/* Form nhập lý do từ chối */}
            <div className="flex flex-col gap-2 text-xs">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>Lý do từ chối (Bắt buộc)*:</span>
                <span className="text-[10px] text-slate-400 font-normal">Gửi phản hồi cho nhân viên</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                placeholder="Nhập lý do từ chối duyệt công cụ thể (ví dụ: Nghỉ không phép, đi muộn quá quy định không có giải trình chính đáng, v.v.)..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all leading-relaxed"
                autoFocus
              />

              {rejectError && (
                <span className="text-rose-600 text-[11px] font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {rejectError}
                </span>
              )}

              {/* Gợi ý lý do nhanh */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
                {[
                  "Đi muộn không có lý do",
                  "Nghỉ không phép / Bỏ ca",
                  "Chưa đủ giờ làm tối thiểu",
                  "Sai lệch dữ liệu chấm công",
                ].map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRejectionReason(tag);
                      if (rejectError) setRejectError("");
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions Popup */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRejectModalData(null)}
                disabled={isRejecting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isRejecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>Xác nhận từ chối</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL XEM CHI TIẾT 30 NGÀY CÔNG CỦA NHÂN VIÊN */}
      {selectedEmployeeDetail && (
        <div
          onClick={() => setSelectedEmployeeDetail(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl p-6 text-sm relative animate-in fade-in zoom-in-95 duration-150 my-8 cursor-default"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-sm shrink-0">
                  {getInitials(selectedEmployeeDetail.ho_ten)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>Chi tiết chấm công: {selectedEmployeeDetail.ho_ten}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-normal">
                      {selectedEmployeeDetail.ma_nv}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedEmployeeDetail.ten_pb || "Văn phòng"} • {selectedEmployeeDetail.ten_cv || "Nhân viên"} • Chu kỳ Tháng {selectedMonth}/{selectedYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployeeDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Tổng ngày công</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {Number(selectedEmployeeDetail.tong_ngay_cong).toFixed(1)} <span className="text-xs font-normal text-slate-500">ngày</span>
                </p>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-medium">Số ngày đúng giờ</span>
                <p className="text-lg font-bold text-emerald-800 mt-0.5">
                  {selectedEmployeeDetail.so_lan_dung_gio ?? (selectedEmployeeDetail.tong_ngay_cong ? Math.floor(selectedEmployeeDetail.tong_ngay_cong) : 0)} <span className="text-xs font-normal text-emerald-600">ngày</span>
                </p>
              </div>
              <div className={`p-3 rounded-xl border ${selectedEmployeeDetail.so_lan_di_tre >= 3 ? "bg-rose-50 border-rose-200" : "bg-amber-50/70 border-amber-100"}`}>
                <span className={`text-[11px] font-medium ${selectedEmployeeDetail.so_lan_di_tre >= 3 ? "text-rose-700" : "text-amber-700"}`}>Số lần đi trễ</span>
                <p className={`text-lg font-bold mt-0.5 ${selectedEmployeeDetail.so_lan_di_tre >= 3 ? "text-rose-800" : "text-amber-800"}`}>
                  {selectedEmployeeDetail.so_lan_di_tre} <span className="text-xs font-normal">lần</span>
                </p>
              </div>
              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100">
                <span className="text-[11px] text-sky-700 font-medium">Số ngày phép</span>
                <p className="text-lg font-bold text-sky-800 mt-0.5">
                  {selectedEmployeeDetail.so_ngay_phep || 0} <span className="text-xs font-normal text-sky-600">ngày</span>
                </p>
              </div>
            </div>

            {/* Records Table */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
              {isLoadingDetail ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                  <span className="text-xs">Đang tải chi tiết các ngày công...</span>
                </div>
              ) : !employeeDetailHistory || !employeeDetailHistory.records || employeeDetailHistory.records.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Không tìm thấy bản ghi chấm công nào của nhân viên trong tháng {selectedMonth}/{selectedYear}.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Ca làm việc</th>
                      <th className="py-2.5 px-3 text-center">Giờ vào</th>
                      <th className="py-2.5 px-3 text-center">Giờ ra</th>
                      <th className="py-2.5 px-3 text-center">Thời gian làm</th>
                      <th className="py-2.5 px-3 text-center">Trạng thái</th>
                      <th className="py-2.5 px-3 text-center">Phê duyệt</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {employeeDetailHistory.records.map((rec, idx) => (
                      <tr key={rec.ma_cc || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{rec.ngay_cong_formatted || rec.ngay_cong}</div>
                          <div className="text-[10px] text-slate-400">{rec.thu_day_du}</div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {rec.ca_lam_viec || "Hành chính"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium">
                          {rec.gio_vao || "--:--"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium">
                          {rec.gio_ra || "--:--"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-semibold text-slate-800">{rec.so_gio_lam || 0}h</span>
                          
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            rec.loai_cong === "CONG_DU"
                              ? "bg-emerald-50 text-emerald-700"
                              : rec.loai_cong === "DI_TRE"
                              ? "bg-amber-50 text-amber-700"
                              : rec.loai_cong === "NUA_CONG"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {rec.trang_thai || (rec.loai_cong === "CONG_DU" ? "Đúng giờ" : rec.loai_cong)}
                          </span>
                        </td>
                        {/* Phê duyệt */}
                        <td className="py-2.5 px-3 text-center">
                          {rec.trang_thai_duyet === "DA_DUYET" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã duyệt
                            </span>
                          ) : rec.trang_thai_duyet === "TU_CHOI" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              Từ chối
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Chờ duyệt
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 italic max-w-[200px] truncate" title={rec.ghi_chu || ""}>
                          {rec.ghi_chu || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedEmployeeDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
