import React, { useState, useEffect, useMemo } from "react";
import {
  UserPlus,
  Search,
  Download,
  RotateCcw,
  CheckCircle2,
  Users,
  ShieldCheck,
  Palmtree,
  Sparkles,
  UserX,
  Calendar,
  Loader2,
  FileBarChart2,
  FileSpreadsheet,
  GraduationCap,
  History,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  AlertTriangle,
  X,
  CalendarClock,
  CalendarX,
} from "lucide-react";
import AddEmployeeModal from "./components/AddEmployeeModal";
import ConfirmDialog, { useEscapeKey } from "./components/ConfirmDialog";
import apiClient from "../../services/apiClient";
import {
  formatDateVN,
  getApiErrorMessage,
  getManagerAccess,
  isForbiddenError,
  todayISO,
} from "./managerUtils";

// Kỳ báo cáo: 12 tháng gần nhất, định dạng "MM/YYYY"
const buildReportMonths = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  });
};
const REPORT_MONTHS = buildReportMonths();

// Xuất danh sách nhân sự ra file CSV (mở được bằng Excel)
const exportEmployeesCsv = (rows, fileName) => {
  const header = ["Mã NV", "Họ tên", "Phòng ban", "Chức vụ", "Trình độ", "Ngày vào làm", "Thâm niên", "Lương hợp đồng", "Trạng thái"];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((e) =>
    [e.id, e.name, e.dept, e.role, e.degreeLabel, e.joinDate, e.tenureLabel, e.salaryNum, e.statusText].map(escape).join(",")
  );
  const blob = new Blob(["\uFEFF" + [header.map(escape).join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

// ──────────────── CÁC HÀM TIỆN ÍCH CHUYỂN ĐỔI CHUẨN XÁC ────────────────
const calculateTenure = (joinDateStr) => {
  if (!joinDateStr) return { years: 0, label: "—", joinDate: "—" };
  const join = new Date(joinDateStr);
  if (isNaN(join.getTime())) return { years: 0, label: "—", joinDate: "—" };
  const now = new Date();
  const diffMonths = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  const years = Math.max(0, Math.floor(diffMonths / 12));
  const months = Math.max(0, diffMonths % 12);
  const totalYearsDecimal = +(diffMonths / 12).toFixed(1);

  let label = "";
  if (years === 0) {
    label = `${months || 1} tháng`;
  } else if (months === 0) {
    label = `${years} năm`;
  } else {
    label = `${years} năm ${months} tháng`;
  }

  let joinDateFormatted = joinDateStr;
  if (joinDateStr.includes("-")) {
    const [y, m, d] = joinDateStr.split("-");
    joinDateFormatted = `${d}/${m}/${y}`;
  }

  return { years: totalYearsDecimal, label, joinDate: joinDateFormatted };
};

const formatDegree = (trinhDo) => {
  if (!trinhDo) return { key: "unknown", name: "Chưa cập nhật" };
  const td = String(trinhDo).toUpperCase();
  if (td.includes("TIEN_SI") || td.includes("TIẾN SĨ")) return { key: "postgrad", name: "Tiến sĩ" };
  if (td.includes("THAC_SI") || td.includes("THẠC SĨ") || td.includes("THS")) return { key: "postgrad", name: "Thạc sĩ" };
  if (td.includes("DAI_HOC") || td.includes("ĐẠI HỌC")) return { key: "university", name: "Đại học" };
  if (td.includes("CAO_DANG") || td.includes("CAO ĐẲNG")) return { key: "college", name: "Cao đẳng" };
  if (td.includes("TRUNG_CAP") || td.includes("TRUNG CẤP")) return { key: "college", name: "Trung cấp" };
  if (td.includes("CHUNG_CHI") || td.includes("CHỨNG CHỈ")) return { key: "college", name: "Chứng chỉ" };
  if (td.includes("THPT")) return { key: "highschool", name: "THPT" };
  return { key: "unknown", name: "Chưa cập nhật" };
};

const getInitials = (name) => {
  if (!name) return "NV";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function EmployeeManagement({ initialTab = "list", userSession }) {
  const access = getManagerAccess(userSession);
  const canCreate = access.can("EMPLOYEE_CREATE");
  const canDelete = access.can("EMPLOYEE_DELETE");
  const canUpdate = access.can("EMPLOYEE_UPDATE");

  const [activeSubTab, setActiveSubTab] = useState(initialTab || "list");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [reportError, setReportError] = useState("");

  // Quản lý Cho thôi việc / Xóa nhân sự (có ngày hiệu lực)
  const [deactivateModalEmp, setDeactivateModalEmp] = useState(null);
  const [reactivateModalEmp, setReactivateModalEmp] = useState(null);
  const [cancelScheduleEmp, setCancelScheduleEmp] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState("Nghỉ việc theo nguyện vọng cá nhân");
  const [deactivateNote, setDeactivateNote] = useState("");
  const [deactivateDate, setDeactivateDate] = useState(() => todayISO());
  const [deactivateError, setDeactivateError] = useState("");
  const [statusActionError, setStatusActionError] = useState("");
  const [isSubmittingDeactivate, setIsSubmittingDeactivate] = useState(false);

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), type === "error" ? 6000 : 4500);
  };

  const closeDeactivateModal = () => {
    if (!isSubmittingDeactivate) setDeactivateModalEmp(null);
  };
  useEscapeKey(Boolean(deactivateModalEmp), closeDeactivateModal, isSubmittingDeactivate);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  // Bộ lọc dùng chung & theo tab
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(REPORT_MONTHS[0]);
  const [monthlyReport, setMonthlyReport] = useState(null);

  const handleTriggerSearch = () => {
    setSearchQuery(searchInput.trim());
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim()) {
      setSearchQuery("");
      setCurrentPage(1);
    }
  };

  // Bộ lọc chuyên sâu cho Tab Báo cáo
  const [selectedDegree, setSelectedDegree] = useState("all");
  const [selectedTenure, setSelectedTenure] = useState("all");
  const [selectedSalaryRange, setSelectedSalaryRange] = useState("all");

  // Phân trang chung cho bảng
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; // 8 nhân sự mỗi trang giúp hiển thị thoáng đẹp và không cuộn quá dài

  const [employees, setEmployees] = useState([]);

  // Chuẩn hóa một bản ghi nhân sự từ Backend API
  const mapApiEmployee = (item) => {
    const isWorking = item.trang_thai === "DANG_LAM";
    const isLeave = item.trang_thai === "NGHI_PHEP" || item.trang_thai === "NGHI_THAI_SAN";
    const isResigned = item.trang_thai === "DA_NGHI_VIEC";

    let status = "working";
    let statusText = "Đang làm việc";
    let statusColor = "emerald";

    if (isLeave) {
      status = "leave";
      statusText = item.trang_thai === "NGHI_THAI_SAN" ? "Nghỉ thai sản" : "Nghỉ phép";
      statusColor = "sky";
    } else if (isResigned) {
      status = "resigned";
      statusText = "Đã nghỉ việc";
      statusColor = "rose";
    }

    const tenureInfo = calculateTenure(item.ngay_vao_lam);
    const deg = formatDegree(item.trinh_do);

    const salaryNum = Number(item.muc_luong) || 0;

    // Cùng ngưỡng với khung lương của báo cáo backend: [0;10), [10;20), [20;30), từ 30 triệu trở lên
    let salaryTier = "10to20";
    if (salaryNum < 10000000) salaryTier = "under10";
    else if (salaryNum < 20000000) salaryTier = "10to20";
    else if (salaryNum < 30000000) salaryTier = "20to30";
    else salaryTier = "above30";

    // Thôi việc đã lên lịch: vẫn DANG_LAM nhưng có ngày nghỉ việc trong tương lai
    const terminationDate = item.ngay_nghi_viec ? String(item.ngay_nghi_viec).slice(0, 10) : null;
    const scheduledTerminationDate =
      isWorking && terminationDate && terminationDate > todayISO() ? terminationDate : null;

    return {
      id: item.ma_nv,
      name: item.ho_ten,
      email: item.email || "",
      rawStatus: item.trang_thai,
      scheduledTerminationDate,
      managerId: item.ma_nql || null,
      dept: item.ten_pb || item.ma_pb || "Phòng ban",
      role: item.ten_cv || item.ma_cv || "Nhân viên",
      location: item.ten_cn || "Trụ sở chính Trung Nguyên",
      degree: deg.key,
      degreeLabel: item.chuyen_nganh ? `${deg.name} ${item.chuyen_nganh}` : deg.name,
      school: item.noi_dao_tao
        ? `${item.noi_dao_tao} ${item.nam_tot_nghiep ? `(${item.nam_tot_nghiep})` : ""}`
        : "—",
      joinDate: tenureInfo.joinDate,
      tenureYears: tenureInfo.years,
      tenureLabel: tenureInfo.label,
      isCore: tenureInfo.years >= 3.0,
      salaryNum,
      salary: salaryNum > 0 ? `${salaryNum.toLocaleString("vi-VN")} đ` : "Chưa có HĐ",
      salaryTier,
      status,
      statusText,
      statusColor,
      initials: getInitials(item.ho_ten),
      isVip: item.ma_cv === "CV08" || item.ma_cv === "CV07" || item.ma_nv === "NV01",
      cccd: item.cccd,
    };
  };

  // Gọi API lấy danh sách nhân viên thật từ CSDL
  const fetchEmployeesFromDb = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/employees/get_employee_list", {
        params: { page: 1, page_size: 200 },
      });
      setEmployees((res?.items || []).map(mapApiEmployee));
    } catch (err) {
      setEmployees([]);
      showToast(`Không tải được danh sách nhân sự: ${getApiErrorMessage(err)}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Báo cáo tình hình nhân sự của kỳ được chọn (đang làm / nghỉ phép / nghỉ việc)
  const fetchMonthlyReport = async (monthKey = selectedMonth) => {
    const [thang, nam] = monthKey.split("/").map(Number);
    try {
      setMonthlyReport(await apiClient.get("/employees/reports/monthly", { params: { thang, nam } }));
      setReportError("");
    } catch (err) {
      setMonthlyReport(null);
      setReportError(
        isForbiddenError(err)
          ? "Bạn không có quyền xem báo cáo nhân sự (cần quyền REPORT_VIEW). Danh sách bên dưới hiển thị toàn bộ nhân sự thay vì theo kỳ báo cáo."
          : `Không tải được báo cáo tháng ${monthKey}: ${getApiErrorMessage(err)}`
      );
    }
  };

  const refreshAll = () => {
    fetchEmployeesFromDb();
    fetchMonthlyReport();
  };

  useEffect(() => {
    fetchEmployeesFromDb();
  }, []);

  useEffect(() => {
    fetchMonthlyReport(selectedMonth);
  }, [selectedMonth]);

  // Xử lý thêm nhân sự mới: gọi API POST /employees/create_employee
  const handleAddEmployee = async (newEmp) => {
    const apiPayload = {
      ho_ten: newEmp.ho_ten || newEmp.fullName,
      ngay_sinh: newEmp.ngay_sinh,
      gioi_tinh: newEmp.gioi_tinh,
      cccd: newEmp.cccd,
      sdt: newEmp.sdt,
      email: newEmp.email,
      ma_pb: newEmp.ma_pb,
      ma_cv: newEmp.ma_cv,
      ngay_vao_lam: newEmp.ngay_vao_lam || new Date().toISOString().split("T")[0],
      trang_thai: "DANG_LAM",
      hinh_thuc_lam_viec: "FULL_TIME",
      muc_luong: newEmp.muc_luong,
      loai_hd: newEmp.loai_hd,
      trinh_do: newEmp.trinh_do,
      chuyen_nganh: newEmp.chuyen_nganh,
      // Bỏ trống = backend tự gán Trưởng phòng ban làm quản lý trực tiếp
      ma_nql: newEmp.ma_nql || null,
    };
    try {
      const res = await apiClient.post("/employees/create_employee", apiPayload);
      showToast(`Đã thêm thành công nhân sự ${res.ho_ten} (${res.ma_nv}) vào hệ thống!`);
      refreshAll();
      return true;
    } catch (err) {
      showToast(`Thêm nhân sự thất bại: ${getApiErrorMessage(err)}`, "error");
      return false;
    }
  };

  // Danh sách chọn "Quản lý trực tiếp" khi thêm nhân sự: chỉ nhân sự chưa nghỉ việc
  const managerOptions = useMemo(
    () =>
      employees
        .filter((e) => e.status !== "resigned")
        .map((e) => ({ id: e.id, name: e.name, dept: e.dept, role: e.role })),
    [employees]
  );

  // Mở modal xác nhận cho thôi việc / xóa
  const handleOpenDeactivateModal = (emp) => {
    setDeactivateModalEmp(emp);
    setDeactivateReason("Nghỉ việc theo nguyện vọng cá nhân");
    setDeactivateNote("");
    setDeactivateDate(emp.scheduledTerminationDate || todayISO());
    setDeactivateError("");
  };

  // Mở modal xác nhận khôi phục trạng thái làm việc
  const handleOpenReactivateModal = (emp) => {
    setReactivateModalEmp(emp);
    setStatusActionError("");
  };

  // Mở hộp thoại hủy lịch thôi việc đã lên lịch
  const handleOpenCancelSchedule = (emp) => {
    setCancelScheduleEmp(emp);
    setStatusActionError("");
  };

  const isFutureTermination = Boolean(deactivateDate) && deactivateDate > todayISO();

  // Xác nhận cho thôi việc với ngày hiệu lực:
  // - Hôm nay / quá khứ: chuyển "Đã nghỉ việc", khóa tài khoản, thanh lý hợp đồng ngay
  // - Tương lai: lên lịch, nhân sự vẫn làm việc & đăng nhập đến ngày hiệu lực
  // (không xóa dữ liệu, không xóa tài khoản)
  const handleConfirmDeactivate = async () => {
    if (!deactivateModalEmp || isSubmittingDeactivate) return;
    if (!deactivateDate) {
      setDeactivateError("Vui lòng chọn ngày hiệu lực thôi việc.");
      return;
    }
    const emp = deactivateModalEmp;
    setIsSubmittingDeactivate(true);
    setDeactivateError("");
    try {
      const fullReason = deactivateNote.trim() ? `${deactivateReason}: ${deactivateNote.trim()}` : deactivateReason;
      const res = await apiClient.delete(`/employees/${emp.id}`, {
        params: { ly_do: fullReason, ngay_hieu_luc: deactivateDate },
      });
      showToast(
        res?.message ||
          (isFutureTermination
            ? `Đã lên lịch thôi việc cho ${emp.name} (${emp.id}) từ ngày ${formatDateVN(deactivateDate)}.`
            : `Đã cho thôi việc ${emp.name} (${emp.id}) và khóa tài khoản đăng nhập.`)
      );
      setDeactivateModalEmp(null);
      refreshAll();
    } catch (err) {
      setDeactivateError(getApiErrorMessage(err, "Không thể cho thôi việc nhân sự này."));
    } finally {
      setIsSubmittingDeactivate(false);
    }
  };

  // Đưa nhân sự về "Đang làm việc": dùng cho Khôi phục (đã nghỉ) và Hủy lịch thôi việc (chưa đến ngày hiệu lực)
  const submitBackToWorking = async (emp, successMessage, onDone) => {
    if (isSubmittingDeactivate) return;
    setIsSubmittingDeactivate(true);
    setStatusActionError("");
    try {
      // khoa_tai_khoan = true: đồng bộ tài khoản theo trạng thái (Đang làm -> mở khóa đăng nhập)
      await apiClient.put(`/employees/${emp.id}/status`, {
        trang_thai: "DANG_LAM",
        khoa_tai_khoan: true,
      });
      showToast(successMessage);
      onDone();
      refreshAll();
    } catch (err) {
      setStatusActionError(getApiErrorMessage(err, "Không thể cập nhật trạng thái nhân sự."));
    } finally {
      setIsSubmittingDeactivate(false);
    }
  };

  const handleConfirmReactivate = () => {
    if (!reactivateModalEmp) return;
    const emp = reactivateModalEmp;
    submitBackToWorking(emp, `Đã khôi phục trạng thái Đang làm việc cho nhân sự ${emp.name} (${emp.id})!`, () =>
      setReactivateModalEmp(null)
    );
  };

  const handleConfirmCancelSchedule = () => {
    if (!cancelScheduleEmp) return;
    const emp = cancelScheduleEmp;
    submitBackToWorking(emp, `Đã hủy lịch thôi việc của ${emp.name} (${emp.id}).`, () => setCancelScheduleEmp(null));
  };


  // Danh sách phòng ban duy nhất để lọc
  const departmentOptions = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => {
      if (e.dept) set.add(e.dept);
    });
    return Array.from(set);
  }, [employees]);

  // Thống kê Tab 1 lấy từ báo cáo tháng của backend; map trạng thái của từng nhân sự trong kỳ
  const currentMonthStats = {
    total: monthlyReport?.tong_nhan_su ?? 0,
    working: monthlyReport?.so_dang_lam ?? 0,
    leave: monthlyReport?.so_nghi_phep ?? 0,
    resigned: monthlyReport?.so_da_nghi_viec ?? 0,
  };
  const monthlyStatusMap = useMemo(() => {
    const map = {};
    if (!monthlyReport) return map;
    monthlyReport.danh_sach_dang_lam.forEach((e) => (map[e.ma_nv] = "working"));
    monthlyReport.danh_sach_nghi_phep.forEach((e) => (map[e.ma_nv] = "leave"));
    monthlyReport.danh_sach_da_nghi_viec.forEach((e) => (map[e.ma_nv] = "resigned"));
    return map;
  }, [monthlyReport]);

  // Thống kê động cho Tab 2 (Chuyên sâu học vấn, thâm niên, mặt bằng lương)
  const reportStats = useMemo(() => {
    // Chỉ thống kê nhân sự còn làm việc; bỏ qua người chưa có dữ liệu lương / ngày vào làm
    const active = employees.filter((e) => e.status !== "resigned");
    const withSalary = active.filter((e) => e.salaryNum > 0);
    const withTenure = active.filter((e) => e.joinDate !== "—");
    const tenureTotal = withTenure.length || 1;
    const tenureShare = {
      core: Math.round((withTenure.filter((e) => e.tenureYears >= 3).length / tenureTotal) * 100),
      mid: Math.round(
        (withTenure.filter((e) => e.tenureYears >= 1 && e.tenureYears < 3).length / tenureTotal) * 100
      ),
    };
    tenureShare.junior = withTenure.length ? Math.max(0, 100 - tenureShare.core - tenureShare.mid) : 0;
    if (active.length === 0 || withSalary.length === 0) {
      return {
        degreePct: 0,
        avgTenure: "0",
        avgSalary: "0",
        minSalary: "0tr",
        maxSalary: "0tr",
        tenureShare: { core: 0, mid: 0, junior: 0 },
      };
    }

    const uniOrPost = active.filter(
      (e) => e.degree === "university" || e.degree === "postgrad"
    ).length;
    const degreePct = Math.round((uniOrPost / active.length) * 100);

    const sumTenure = withTenure.reduce((acc, e) => acc + e.tenureYears, 0);
    const avgTenure = withTenure.length ? (sumTenure / withTenure.length).toFixed(1) : "0";

    const sumSalary = withSalary.reduce((acc, e) => acc + e.salaryNum, 0);
    const avgSalary = Math.round(sumSalary / withSalary.length).toLocaleString("vi-VN");

    const salaries = withSalary.map((e) => e.salaryNum);
    const minSal = Math.min(...salaries);
    const maxSal = Math.max(...salaries);

    return {
      degreePct,
      avgTenure,
      avgSalary,
      minSalary: `${(minSal / 1000000).toFixed(1)}tr`,
      maxSalary: `${(maxSal / 1000000).toFixed(1)}tr`,
      tenureShare,
    };
  }, [employees]);

  // Bộ lọc dữ liệu tập trung cho BẢNG CHUNG
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Tìm kiếm theo từ khóa (Mã NV, Họ tên, Email, Chức vụ, Nơi đào tạo)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = emp.name?.toLowerCase().includes(q);
        const matchId = emp.id?.toLowerCase().includes(q);
        const matchEmail = emp.email?.toLowerCase().includes(q);
        const matchRole = emp.role?.toLowerCase().includes(q);
        const matchDept = emp.dept?.toLowerCase().includes(q);
        const matchSchool = emp.school?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchEmail && !matchRole && !matchDept && !matchSchool) {
          return false;
        }
      }

      // 2. Lọc theo phòng ban
      if (deptFilter && deptFilter !== "all") {
        if (!emp.dept?.toLowerCase().includes(deptFilter.toLowerCase())) {
          return false;
        }
      }

      // 3. TAB 1: lọc theo tình trạng của nhân sự TRONG KỲ BÁO CÁO đã chọn
      if (activeSubTab === "list" && monthlyReport) {
        const monthStatus = monthlyStatusMap[emp.id];
        if (!monthStatus) return false; // chưa vào làm hoặc đã nghỉ trước kỳ này
        if (statusFilter && monthStatus !== statusFilter) {
          return false;
        }
      }

      // 4. Nếu đang ở TAB 2 (Báo cáo & Phân tích chuyên sâu): Lọc theo Học vấn, Thâm niên, Dải lương
      if (activeSubTab === "reports") {
        if (selectedDegree !== "all" && emp.degree !== selectedDegree) {
          return false;
        }
        if (selectedTenure !== "all") {
          const ty = emp.tenureYears || 0;
          if (selectedTenure === "under1" && ty >= 1) return false;
          if (selectedTenure === "1to3" && (ty < 1 || ty >= 3)) return false;
          if (selectedTenure === "3to5" && (ty < 3 || ty >= 5)) return false;
          if (selectedTenure === "above5" && ty < 5) return false;
        }
        if (selectedSalaryRange !== "all") {
          if (emp.salaryTier !== selectedSalaryRange) return false;
        }
      }

      return true;
    });
  }, [
    employees,
    activeSubTab,
    searchQuery,
    deptFilter,
    statusFilter,
    selectedDegree,
    selectedTenure,
    selectedSalaryRange,
    monthlyReport,
    monthlyStatusMap,
  ]);

  // Tự động quay về trang 1 khi thay đổi tab hoặc điều kiện lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeSubTab,
    searchQuery,
    deptFilter,
    statusFilter,
    selectedDegree,
    selectedTenure,
    selectedSalaryRange,
  ]);

  // Phân trang dữ liệu bảng
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const pagedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(startIndex, startIndex + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  return (
    <div className="flex flex-col gap-6 max-w-[1520px] mx-auto py-2">
      {/* ──────────────── MASTER HEADER BAR & SUB-TAB SWITCHER ──────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
            QUẢN LÝ NHÂN SỰ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeSubTab === "list"
              ? "Quản trị danh sách nhân sự, tiếp nhận nhân sự mới và theo dõi biến động lao động"
              : "Báo cáo phân tích chuyên sâu về cơ cấu học vấn, thâm niên công tác và mặt bằng đãi ngộ"}
          </p>
        </div>

        {/* 2 Sub-Tabs Chuyển đổi linh hoạt */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "list"
                ? "bg-white text-sky-700 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hồ sơ & Biến động</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("reports")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "reports"
                ? "bg-white text-sky-700 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileBarChart2 className="w-4 h-4" />
            <span>Báo cáo & Phân tích chuyên sâu</span>
          </button>
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ──────────────── PHẦN THỐNG KÊ & BỘ LỌC CỦA TAB 1: HỒ SƠ & BIẾN ĐỘNG ──────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === "list" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Header Bar của Tab 1 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>BÁO CÁO THỐNG KÊ TÌNH HÌNH NHÂN SỰ THEO THÁNG</span>
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Kỳ báo cáo:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
                >
                  {REPORT_MONTHS.map((m, idx) => (
                    <option key={m} value={m}>
                      Tháng {m}
                      {idx === 0 ? " (Hiện tại)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block mx-1"></div>


              <button
                type="button"
                onClick={() =>
                  exportEmployeesCsv(filteredEmployees, `danh-sach-nhan-su-${selectedMonth.replace("/", "-")}.csv`)
                }
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất danh sách</span>
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Thêm nhân sự</span>
                </button>
              )}
            </div>
          </div>

          {reportError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{reportError}</span>
            </div>
          )}

          {/* 4 Thẻ KPI Trạng thái nhân sự (Nhấp để lọc nhanh) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Tổng nhân sự */}
            <div
              onClick={() => setStatusFilter("")}
              className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                statusFilter === ""
                  ? "border-sky-500 ring-2 ring-sky-100 shadow-sm"
                  : "border-slate-200/80 shadow-xs hover:border-slate-300"
              }`}
              title="Xem tất cả nhân sự"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                  TỔNG NHÂN SỰ
                </span>
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Users className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {currentMonthStats.total.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500">nhân sự</span>
              </div>
            </div>

            {/* 2. Đang làm việc */}
            <div
              onClick={() => setStatusFilter("working")}
              className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                statusFilter === "working"
                  ? "border-emerald-500 ring-2 ring-emerald-100 shadow-sm"
                  : "border-slate-200/80 shadow-xs hover:border-slate-300"
              }`}
              title="Lọc nhân sự đang làm việc"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                  ĐANG LÀM VIỆC
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {currentMonthStats.working.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500">nhân sự</span>
              </div>
            </div>

            {/* 3. Nghỉ phép */}
            <div
              onClick={() => setStatusFilter("leave")}
              className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                statusFilter === "leave"
                  ? "border-sky-500 ring-2 ring-sky-100 shadow-sm"
                  : "border-slate-200/80 shadow-xs hover:border-slate-300"
              }`}
              title="Lọc nhân sự đang nghỉ phép"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                  NGHỈ PHÉP
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <Palmtree className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-sky-700">
                  {currentMonthStats.leave.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500">nhân sự</span>
              </div>
            </div>

            {/* 4. Đã nghỉ việc */}
            <div
              onClick={() => setStatusFilter("resigned")}
              className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                statusFilter === "resigned"
                  ? "border-rose-500 ring-2 ring-rose-100 shadow-sm"
                  : "border-slate-200/80 shadow-xs hover:border-slate-300"
              }`}
              title="Lọc nhân sự đã nghỉ việc"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                  ĐÃ NGHỈ VIỆC
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <UserX className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-600">
                  {currentMonthStats.resigned.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500">nhân sự</span>
              </div>
            </div>
          </div>

          {/* Thanh công cụ tìm kiếm & lọc Tab 1 */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  placeholder="Tìm theo Mã NV, Họ tên, Email, Chức vụ..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
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

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="">Tất cả Phòng ban</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="">Trạng thái: Tất cả</option>
                <option value="working">● Đang làm việc</option>
                <option value="leave">● Nghỉ phép / Thai sản</option>
                <option value="resigned">● Đã nghỉ việc</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDeptFilter("");
                  setStatusFilter("");
                }}
                title="Đặt lại bộ lọc"
                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ──────────────── PHẦN THỐNG KÊ & BỘ LỌC CỦA TAB 2: BÁO CÁO CHUYÊN SÂU ──────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === "reports" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Header Bar của Tab 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileBarChart2 className="w-4 h-4 text-sky-600" />
              <span>BÁO CÁO PHÂN TÍCH NHÂN SỰ CHUYÊN SÂU</span>
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchEmployeesFromDb}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Làm mới dữ liệu từ Database"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoading ? "animate-spin" : ""}`} />
                <span>Đồng bộ DB</span>
              </button>
              <button
                type="button"
                onClick={() => exportEmployeesCsv(filteredEmployees, "bao-cao-phan-tich-nhan-su.csv")}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xuất file Excel</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất PDF tổng hợp</span>
              </button>
            </div>
          </div>

          {/* 3 Thẻ phân tích chỉ số chuyên sâu */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: Trình độ học vấn */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                  TRÌNH ĐỘ HỌC VẤN
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <GraduationCap className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {reportStats.degreePct}%
                </span>
                <span className="text-xs font-medium text-slate-500">Đại học & Sau Đại học</span>
              </div>

              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                <div className="w-full h-1.5 rounded-full bg-slate-100 flex overflow-hidden">
                  <div
                    className="h-full bg-sky-600 transition-all duration-500"
                    style={{ width: `${reportStats.degreePct}%` }}
                  ></div>
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${100 - reportStats.degreePct}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span> ĐH / Sau ĐH: {reportStats.degreePct}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> CĐ / Khác: {100 - reportStats.degreePct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Thâm niên công tác */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                  THÂM NIÊN CÔNG TÁC
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <History className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {reportStats.avgTenure}
                </span>
                <span className="text-xs font-medium text-slate-500">năm bình quân</span>
              </div>

              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                <div className="w-full h-1.5 rounded-full bg-slate-100 flex overflow-hidden">
                  <div className="h-full bg-emerald-600" style={{ width: `${reportStats.tenureShare.core}%` }}></div>
                  <div className="h-full bg-sky-500" style={{ width: `${reportStats.tenureShare.mid}%` }}></div>
                  <div className="h-full bg-slate-300" style={{ width: `${reportStats.tenureShare.junior}%` }}></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Từ 3 năm (Nòng cốt):{" "}
                    {reportStats.tenureShare.core}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> 1–3 năm: {reportStats.tenureShare.mid}%
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Mặt bằng đãi ngộ */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                  MỨC LƯƠNG BÌNH QUÂN
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {reportStats.avgSalary}
                </span>
                <span className="text-xs font-bold text-sky-600">VNĐ / người</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                <span className="text-slate-500">Khoảng dao động lương:</span>
                <span className="font-semibold text-slate-700">
                  {reportStats.minSalary} - {reportStats.maxSalary} VNĐ
                </span>
              </div>
            </div>
          </div>

          {/* Thanh công cụ lọc thông minh Tab 2 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="lg:col-span-1 relative flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 text-slate-400 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm mã NV, họ tên, chức vụ..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleTriggerSearch();
                      }
                    }}
                    className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTriggerSearch}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                  title="Tìm kiếm (Enter)"
                >
                  <Search size={13} />
                  <span>Tìm</span>
                </button>
              </div>

              {/* Trình độ */}
              <select
                value={selectedDegree}
                onChange={(e) => setSelectedDegree(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Tất cả Trình độ Học vấn</option>
                <option value="postgrad">Sau Đại học (Thạc sĩ, TS)</option>
                <option value="university">Đại học chính quy</option>
                <option value="college">Cao đẳng / Nghề</option>
              </select>

              {/* Thâm niên */}
              <select
                value={selectedTenure}
                onChange={(e) => setSelectedTenure(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Tất cả Thâm niên</option>
                <option value="under1">Dưới 1 năm</option>
                <option value="1to3">1 - 3 năm</option>
                <option value="3to5">3 - 5 năm (Nòng cốt)</option>
                <option value="above5">Trên 5 năm</option>
              </select>

              {/* Dải lương */}
              <select
                value={selectedSalaryRange}
                onChange={(e) => setSelectedSalaryRange(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Tất cả Dải lương</option>
                <option value="under10">Dưới 10 triệu</option>
                <option value="10to20">10 - 20 triệu</option>
                <option value="20to30">20 - 30 triệu</option>
                <option value="above30">Trên 30 triệu</option>
              </select>

              {/* Khối phòng ban */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Tất cả Khối / Phòng ban</option>
                {departmentOptions.map((deptName) => (
                  <option key={deptName} value={deptName}>
                    {deptName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>Tìm thấy {filteredEmployees.length} nhân sự phù hợp điều kiện lọc chuyên sâu</span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDeptFilter("");
                  setSelectedDegree("all");
                  setSelectedTenure("all");
                  setSelectedSalaryRange("all");
                }}
                className="text-sky-600 font-semibold hover:underline cursor-pointer"
              >
                Đặt lại tất cả bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ──────────────── BẢNG MASTER DATA DUY NHẤT (DÙNG CHUNG CHO CẢ 2 TAB) ──────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Table Title Bar */}
        <div className="px-5 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              DANH SÁCH NHÂN SỰ
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold">
              {filteredEmployees.length} nhân sự
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Dữ liệu đồng bộ tập trung toàn hệ thống
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3.5 px-4 min-w-[220px]">Mã NV & Họ tên</th>
                <th className="py-3.5 px-4 min-w-[160px]">Phòng ban</th>
                <th className="py-3.5 px-4 min-w-[140px]">Chức vụ</th>
                <th className="py-3.5 px-4 min-w-[170px]">Trình độ & Chuyên môn</th>
                <th className="py-3.5 px-4 min-w-[140px]">Thâm niên & Ngày vào</th>
                <th className="py-3.5 px-4 min-w-[120px] text-right">Mức lương</th>
                <th className="py-3.5 px-4 min-w-[120px] text-center">Trạng thái</th>
                <th className="py-3.5 px-4 min-w-[130px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading && employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 animate-spin text-sky-600" />
                      <span className="text-xs font-medium">Đang tải danh sách nhân sự từ CSDL...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-semibold text-slate-600">
                        Không tìm thấy nhân sự nào phù hợp với điều kiện lọc hiện tại.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setDeptFilter("");
                          setStatusFilter("");
                          setSelectedDegree("all");
                          setSelectedTenure("all");
                          setSelectedSalaryRange("all");
                        }}
                        className="mt-1 text-xs text-sky-600 font-semibold hover:underline cursor-pointer"
                      >
                        Đặt lại toàn bộ bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Cột 1: Mã NV & Họ tên */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {emp.initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate">{emp.name}</span>
                            {emp.isVip && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Cán bộ Quản lý Cấp cao" />}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-mono font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded text-[10px]">
                              {emp.id}
                            </span>
                            <span className="truncate">{emp.email || "Chưa có email"}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Phòng ban */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{emp.dept}</span>
                      </div>
                    </td>

                    {/* Cột 3: Chức vụ */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{emp.role}</span>
                      </div>
                    </td>

                    {/* Cột 4: Trình độ & Chuyên môn */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5 items-start">
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                          emp.degree === "postgrad"
                            ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                            : emp.degree === "university"
                            ? "bg-sky-50 text-sky-700 border border-sky-200/60"
                            : "bg-slate-100 text-slate-700 border border-slate-200/60"
                        }`}>
                          {emp.degreeLabel}
                        </span>
                        <span className="text-slate-400 text-[10px] truncate max-w-[200px]" title={emp.school}>
                          {emp.school}
                        </span>
                      </div>
                    </td>

                    {/* Cột 5: Thâm niên & Ngày vào làm */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-700">{emp.tenureLabel}</span>
                          {emp.isCore && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-200/50">
                              Nòng cốt
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-[10px]">Vào làm: {emp.joinDate}</span>
                      </div>
                    </td>

                    {/* Cột 6: Mức lương */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-slate-900 text-xs font-mono">
                        {emp.salary}
                      </span>
                    </td>

                    {/* Cột 7: Trạng thái */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          emp.statusColor === "emerald"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : emp.statusColor === "sky"
                            ? "bg-sky-50 text-sky-700 border border-sky-200/60"
                            : emp.statusColor === "rose"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                            : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            emp.statusColor === "emerald"
                              ? "bg-emerald-500"
                              : emp.statusColor === "sky"
                              ? "bg-sky-500"
                              : emp.statusColor === "rose"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        ></span>
                        {emp.statusText}
                      </span>
                      {emp.scheduledTerminationDate && (
                        <span
                          className="mt-1.5 mx-auto w-fit flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap"
                          title="Đã lên lịch thôi việc: nhân sự vẫn làm việc và đăng nhập đến ngày hiệu lực"
                        >
                          <CalendarClock className="w-3 h-3" />
                          Nghỉ việc từ {formatDateVN(emp.scheduledTerminationDate)}
                        </span>
                      )}
                    </td>

                    {/* Cột 8: Thao tác (Cho thôi việc / Xóa nhân sự / Khôi phục) */}
                    <td className="py-3.5 px-4 text-center">
                      {access.maNv && emp.id === access.maNv ? (
                        <span className="text-[11px] italic text-slate-400" title="Không thể tự thay đổi trạng thái của chính mình">
                          Tài khoản của bạn
                        </span>
                      ) : emp.status === "resigned" ? (
                        canUpdate ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReactivateModal(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                            title="Khôi phục trạng thái Đang làm việc cho nhân sự này"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Khôi phục</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          {emp.scheduledTerminationDate && canUpdate && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancelSchedule(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                              title="Hủy quyết định thôi việc đã lên lịch, nhân sự tiếp tục làm việc"
                            >
                              <CalendarX className="w-3.5 h-3.5 text-amber-600" />
                              <span>Hủy lịch thôi việc</span>
                            </button>
                          )}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => handleOpenDeactivateModal(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                              title={
                                emp.scheduledTerminationDate
                                  ? "Đổi ngày hiệu lực hoặc cho thôi việc ngay"
                                  : "Cho thôi việc với ngày hiệu lực (khóa tài khoản khi đến ngày)"
                              }
                            >
                              <UserX className="w-3.5 h-3.5 text-rose-600" />
                              <span>{emp.scheduledTerminationDate ? "Đổi ngày thôi việc" : "Thôi việc / Xóa"}</span>
                            </button>
                          ) : (
                            !emp.scheduledTerminationDate && <span className="text-slate-300">—</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ──────────────── PHÂN TRANG (REAL PAGINATION) ──────────────── */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị{" "}
            <span className="font-bold text-slate-800">
              {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * pageSize, filteredEmployees.length)}
            </span>{" "}
            trên tổng số{" "}
            <span className="font-bold text-slate-800">
              {filteredEmployees.length}
            </span>{" "}
            nhân sự {activeSubTab === "list" && `(Kỳ ${selectedMonth})`}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-sky-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Thêm nhân sự mới */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddEmployee}
        managerOptions={managerOptions}
      />

      {/* ──────────────── MODAL XÁC NHẬN: CHO THÔI VIỆC / XÓA NHÂN SỰ ──────────────── */}
      {deactivateModalEmp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDeactivateModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-dialog-title"
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="deactivate-dialog-title" className="font-bold text-sm text-slate-900">
                    Xác nhận Thôi việc / Xóa nhân sự
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ngừng công tác và khóa quyền truy cập của nhân sự từ ngày hiệu lực
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDeactivateModal}
                disabled={isSubmittingDeactivate}
                aria-label="Đóng"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 text-xs overflow-y-auto">
              {/* Card tóm tắt nhân viên */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {deactivateModalEmp.initials}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {deactivateModalEmp.name}
                    </span>
                    <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[11px]">
                      {deactivateModalEmp.id}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {deactivateModalEmp.role} • {deactivateModalEmp.dept}
                  </div>
                </div>
              </div>

              {/* Ngày hiệu lực thôi việc (bắt buộc) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ngay-hieu-luc-thoi-viec" className="font-bold text-slate-700">
                  Ngày hiệu lực thôi việc <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ngay-hieu-luc-thoi-viec"
                  type="date"
                  required
                  value={deactivateDate}
                  onChange={(e) => {
                    setDeactivateDate(e.target.value);
                    if (deactivateError) setDeactivateError("");
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 shadow-2xs w-full sm:w-56"
                />
                <p className="text-[11px] text-slate-500">
                  Mặc định là hôm nay. Có thể chọn một ngày trong tương lai để lên lịch thôi việc.
                </p>
              </div>

              {(
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Lý do thôi việc:</label>
                  <select
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer shadow-2xs"
                  >
                    <option value="Nghỉ việc theo nguyện vọng cá nhân">Nghỉ việc theo nguyện vọng cá nhân</option>
                    <option value="Hết hạn hợp đồng lao động">Hết hạn hợp đồng lao động</option>
                    <option value="Thỏa thuận chấm dứt hợp đồng lao động">Thỏa thuận chấm dứt hợp đồng lao động</option>
                    <option value="Kỷ luật sa thải / Chấm dứt đơn phương">Kỷ luật sa thải / Chấm dứt đơn phương</option>
                    <option value="Chuyển công tác / Lý do khác">Chuyển công tác / Lý do khác</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Ghi chú bổ sung (tùy chọn):</label>
                <textarea
                  rows={2}
                  value={deactivateNote}
                  onChange={(e) => setDeactivateNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc biên bản bàn giao nếu có..."
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 resize-none shadow-2xs"
                />
              </div>

              {/* Thông báo chính sách theo ngày hiệu lực */}
              {isFutureTermination ? (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-900 text-[11px] leading-relaxed flex items-start gap-2">
                  <CalendarClock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Lên lịch thôi việc từ ngày {formatDateVN(deactivateDate)}.</strong> Đến trước ngày đó nhân sự vẫn
                    ở trạng thái Đang làm việc, vẫn chấm công và đăng nhập bình thường. Đến ngày hiệu lực, hệ thống tự động
                    chuyển sang "Đã nghỉ việc", khóa tài khoản và thanh lý hợp đồng. Có thể hủy lịch trước ngày hiệu lực.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Thôi việc có hiệu lực ngay.</strong> Nhân sự chuyển sang "Đã nghỉ việc", tài khoản đăng nhập bị
                    KHÓA NGAY và hợp đồng được thanh lý (không xóa tài khoản). Toàn bộ hồ sơ, hợp đồng, chấm công, bảng lương
                    được giữ lại để đối soát và báo cáo.
                  </span>
                </div>
              )}

              {deactivateError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{deactivateError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeDeactivateModal}
                disabled={isSubmittingDeactivate}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={isSubmittingDeactivate || !deactivateDate}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingDeactivate ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>{isFutureTermination ? "Lên lịch thôi việc" : "Cho thôi việc ngay"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── HỘP THOẠI XÁC NHẬN: KHÔI PHỤC TRẠNG THÁI LÀM VIỆC ──────────────── */}
      <ConfirmDialog
        open={Boolean(reactivateModalEmp)}
        tone="success"
        icon={RotateCcw}
        title="Khôi phục trạng thái làm việc"
        description={
          reactivateModalEmp && (
            <>
              Khôi phục nhân sự <strong>{reactivateModalEmp.name}</strong> ({reactivateModalEmp.id}) trở lại trạng thái{" "}
              <strong>Đang làm việc</strong> và mở khóa tài khoản đăng nhập?
            </>
          )
        }
        confirmLabel="Xác nhận khôi phục"
        busy={isSubmittingDeactivate}
        error={statusActionError}
        onCancel={() => !isSubmittingDeactivate && setReactivateModalEmp(null)}
        onConfirm={handleConfirmReactivate}
      />

      {/* ──────────────── HỘP THOẠI XÁC NHẬN: HỦY LỊCH THÔI VIỆC ──────────────── */}
      <ConfirmDialog
        open={Boolean(cancelScheduleEmp)}
        tone="warning"
        icon={CalendarX}
        title="Hủy lịch thôi việc"
        description={
          cancelScheduleEmp && (
            <>
              Hủy quyết định thôi việc từ ngày{" "}
              <strong>{formatDateVN(cancelScheduleEmp.scheduledTerminationDate)}</strong> của{" "}
              <strong>{cancelScheduleEmp.name}</strong> ({cancelScheduleEmp.id})? Nhân sự tiếp tục làm việc bình thường,
              tài khoản không bị khóa khi đến ngày đó.
            </>
          )
        }
        confirmLabel="Hủy lịch thôi việc"
        cancelLabel="Giữ nguyên"
        busy={isSubmittingDeactivate}
        error={statusActionError}
        onCancel={() => !isSubmittingDeactivate && setCancelScheduleEmp(null)}
        onConfirm={handleConfirmCancelSchedule}
      />

      {/* Toast thông báo */}
      {toastMessage && (
        <div
          role={toastType === "error" ? "alert" : "status"}
          className={`fixed bottom-6 right-6 z-[90] max-w-md p-4 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastType === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
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
    </div>
  );
}
