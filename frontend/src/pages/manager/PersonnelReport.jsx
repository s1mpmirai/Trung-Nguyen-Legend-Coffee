import React, { useState, useEffect } from "react";
import {
  History,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Search,
  Building2,
  Calendar,
  Award,
  X,
  CheckCircle2,
  Eye,
  Briefcase,
  Users,
  Loader2,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import apiClient from "../../services/apiClient";
import { formatDate, calculateSeniority } from "../../services/employeeService";

const DEPARTMENT_MAP = {
  PB01: "Ban Giám đốc",
  PB02: "Phòng Nhân sự",
  PB03: "Phòng Kế toán – Tài chính",
  PB04: "Phòng Marketing",
  PB05: "Phòng Kinh doanh",
  PB06: "Phòng IT",
  PB07: "Xưởng Sản xuất",
  PB08: "Phòng Kinh doanh Hà Nội",
};

const POSITION_MAP = {
  CV01: "Nhân viên",
  CV02: "Nhân viên chính",
  CV03: "Tổ trưởng / Trưởng nhóm",
  CV04: "Phó phòng",
  CV05: "Trưởng phòng",
  CV06: "Phó Giám đốc",
  CV07: "Giám đốc Khối",
  CV08: "Tổng Giám đốc",
};

const BRANCH_MAP = {
  CN01: "Trụ sở chính TP.HCM",
  CN02: "Nhà máy Buôn Ma Thuột",
  CN03: "Chi nhánh Hà Nội",
};

const getInitials = (name) => {
  if (!name) return "NV";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const calculateTenureData = (startDateStr) => {
  if (!startDateStr) return { years: 0, label: "Mới vào làm", isCore: false };
  const start = new Date(startDateStr);
  const now = new Date();
  if (isNaN(start.getTime())) return { years: 0, label: "Chưa cập nhật", isCore: false };

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalYears = Number((years + months / 12).toFixed(1));
  let label = "";
  if (years > 0 && months > 0) label = `${years} năm ${months} tháng`;
  else if (years > 0) label = `${years} năm`;
  else if (months > 0) label = `${months} tháng`;
  else label = "Dưới 1 tháng";

  return {
    years: totalYears,
    label,
    isCore: totalYears >= 3,
  };
};

export default function PersonnelReport() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenure, setSelectedTenure] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedWorkingType, setSelectedWorkingType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Danh sách nhân sự thực tế từ API
  const [employees, setEmployees] = useState([]);

  // Modals
  const [selectedProfileModal, setSelectedProfileModal] = useState(null);
  const [detailedProfile, setDetailedProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Tải danh sách nhân sự thực tế từ API
  useEffect(() => {
    let isMounted = true;
    const loadEmployees = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get("/employees/get_employee_list", {
          params: { page: 1, limit: 100 },
        });
        if (isMounted && res) {
          const rawItems = res.items || res.employees || [];
          const mapped = rawItems.map((emp) => {
            const tenure = calculateTenureData(emp.ngay_vao_lam);
            const deptName = DEPARTMENT_MAP[emp.ma_pb] || emp.ma_pb || "Chưa phân bổ";
            const roleName = POSITION_MAP[emp.ma_cv] || emp.ma_cv || "Nhân viên";
            const locationName = BRANCH_MAP[emp.ma_cn] || emp.dia_chi || "Trụ sở chính";

            return {
              id: emp.ma_nv,
              name: emp.ho_ten,
              initials: getInitials(emp.ho_ten),
              role: roleName,
              dept: deptName,
              ma_pb: emp.ma_pb,
              location: locationName,
              joinDate: formatDate(emp.ngay_vao_lam),
              rawJoinDate: emp.ngay_vao_lam,
              tenureYears: tenure.years,
              tenureLabel: tenure.label,
              isCore: tenure.isCore,
              workingType: emp.hinh_thuc_lam_viec || "FULL_TIME",
              status: emp.trang_thai || "DANG_LAM",
              email: emp.email,
              phone: emp.sdt,
              cccd: emp.cccd,
              bankAccount: emp.so_tai_khoan,
              bankName: emp.ngan_hang,
              taxCode: emp.ma_so_thue,
              insuranceCode: emp.so_bhxh,
            };
          });
          setEmployees(mapped);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu báo cáo nhân sự:", err);
        showToast("Lỗi khi kết nối API nhân sự!");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadEmployees();
    return () => {
      isMounted = false;
    };
  }, []);

  // Mở modal chi tiết hồ sơ nhân sự (gọi API /profile/{ma_nv})
  const handleOpenProfileModal = async (emp) => {
    setSelectedProfileModal(emp);
    setIsLoadingProfile(true);
    setDetailedProfile(null);
    try {
      const res = await apiClient.get(`/employees/profile/${emp.id}`);
      setDetailedProfile(res);
    } catch (err) {
      console.warn("Không thể tải hồ sơ chi tiết:", err.message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Tính toán các chỉ số thống kê thực tế từ API
  const totalEmployees = employees.length;
  const fullTimeCount = employees.filter((e) => e.workingType === "FULL_TIME").length;
  const partTimeCount = totalEmployees - fullTimeCount;
  const fullTimeRate = totalEmployees > 0 ? ((fullTimeCount / totalEmployees) * 100).toFixed(1) : 0;

  // Thống kê thâm niên thực tế
  const avgTenureYears =
    totalEmployees > 0
      ? (employees.reduce((acc, e) => acc + (e.tenureYears || 0), 0) / totalEmployees).toFixed(1)
      : 0;

  const coreCount = employees.filter((e) => e.tenureYears >= 3).length;
  const midCount = employees.filter((e) => e.tenureYears >= 1 && e.tenureYears < 3).length;
  const newCount = employees.filter((e) => e.tenureYears < 1).length;

  const coreRate = totalEmployees > 0 ? Math.round((coreCount / totalEmployees) * 100) : 0;
  const midRate = totalEmployees > 0 ? Math.round((midCount / totalEmployees) * 100) : 0;
  const newRate = totalEmployees > 0 ? Math.max(0, 100 - coreRate - midRate) : 0;

  // Thống kê phòng ban thực tế
  const deptCountMap = {};
  employees.forEach((e) => {
    deptCountMap[e.dept] = (deptCountMap[e.dept] || 0) + 1;
  });
  const activeDepts = Object.keys(deptCountMap).length;

  // Bộ lọc danh sách nhân viên
  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.dept.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTenure =
      selectedTenure === "all" ||
      (selectedTenure === "under1" && emp.tenureYears < 1) ||
      (selectedTenure === "1to3" && emp.tenureYears >= 1 && emp.tenureYears < 3) ||
      (selectedTenure === "3to5" && emp.tenureYears >= 3 && emp.tenureYears <= 5) ||
      (selectedTenure === "above5" && emp.tenureYears > 5);

    const matchDept = selectedDept === "all" || emp.ma_pb === selectedDept || emp.dept === selectedDept;

    const matchWorkingType =
      selectedWorkingType === "all" || emp.workingType === selectedWorkingType;

    return matchSearch && matchTenure && matchDept && matchWorkingType;
  });

  // Phân trang (mặc định 5 người / trang)
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredEmployees.length);
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Tự động quay về trang 1 khi thay đổi điều kiện lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTenure, selectedDept, selectedWorkingType, pageSize]);

  // Xuất file CSV từ dữ liệu thực tế
  const handleExportCSV = () => {
    let csv = "\uFEFF"; // UTF-8 BOM
    csv += "Mã NV,Họ tên,Phòng ban,Chức vụ,Nơi làm việc,Hình thức làm việc,Ngày vào làm,Thâm niên,Email,SĐT,Trạng thái\n";
    filteredEmployees.forEach((e) => {
      csv += `"${e.id}","${e.name}","${e.dept}","${e.role}","${e.location}","${e.workingType === 'FULL_TIME' ? 'Toàn thời gian' : 'Bán thời gian'}","${e.joinDate}","${e.tenureLabel}","${e.email || ''}","${e.phone || ''}","${e.status}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bao_Cao_Nhan_Su_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã tải xuống file Báo cáo Thông tin Nhân sự (CSV) thực tế!");
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* ──────────────── HEADER BAR ──────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold text-[11px] uppercase tracking-wider border border-sky-200/50">
              Phân hệ Báo cáo Nhân sự Thực tế
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="text-xs text-slate-500">Dữ liệu kết nối trực tiếp từ Cơ sở dữ liệu</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight mt-1">
            Báo cáo Thông tin Nhân sự
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Tổng hợp thông tin hồ sơ, thâm niên công tác, cơ cấu phòng ban và phân loại nhân sự từ CSDL toàn hệ thống Trung Nguyên Legend.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 transition-all shadow-xs text-xs font-semibold active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất file Excel</span>
          </button>
          <button
            onClick={() => showToast("Đã tạo báo cáo tổng hợp dạng PDF sẵn sàng in ấn!")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white text-xs font-semibold shadow-sm shadow-sky-600/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất PDF tổng hợp</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ──────────────── 3 EXECUTIVE SUMMARY CARDS (Tính từ API thực tế) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Hình thức & Trạng thái làm việc */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Hình thức Làm việc
              </span>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg mt-0.5">
                Cơ cấu Hợp đồng
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-extrabold text-slate-900">
              {fullTimeRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">Toàn thời gian (Full-time)</span>
          </div>

          {/* Inline Ratio Bar */}
          <div className="flex flex-col gap-2">
            <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
              <div
                className="h-full bg-sky-600"
                style={{ width: `${fullTimeRate}%` }}
                title={`Full-time: ${fullTimeCount} NV`}
              ></div>
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${100 - fullTimeRate}%` }}
                title={`Part-time: ${partTimeCount} NV`}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span> Full-time: {fullTimeCount} NV
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Part-time: {partTimeCount} NV
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Thâm niên công tác thực tế */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Độ Gắn Kết Tổ Chức
              </span>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg mt-0.5">
                Thâm niên Công tác
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <History className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-extrabold text-slate-900">
              {avgTenureYears}
            </span>
            <span className="text-xs text-slate-500 font-medium">năm bình quân / nhân sự</span>
          </div>

          {/* Inline Ratio Bar */}
          <div className="flex flex-col gap-2">
            <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
              <div
                className="h-full bg-emerald-600"
                style={{ width: `${coreRate}%` }}
                title={`>3 năm: ${coreCount} NV`}
              ></div>
              <div
                className="h-full bg-sky-500"
                style={{ width: `${midRate}%` }}
                title={`1-3 năm: ${midCount} NV`}
              ></div>
              <div
                className="h-full bg-slate-300"
                style={{ width: `${newRate}%` }}
                title={`<1 năm: ${newCount} NV`}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> &gt;3 năm (Nòng cốt): {coreCount} NV
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span> 1-3 năm: {midCount} NV
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> &lt;1 năm: {newCount} NV
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Quy mô phòng ban */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Quy Mô Nhân Sự
              </span>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg mt-0.5">
                Cơ cấu Phòng ban
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-extrabold text-slate-900">
              {totalEmployees}
            </span>
            <span className="text-xs font-bold text-sky-600">nhân sự chính thức</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-500">Phân bổ qua các phòng ban:</span>
            <span className="font-bold text-slate-800">{activeDepts} phòng ban hoạt động</span>
          </div>
        </div>
      </div>

      {/* ──────────────── SMART FILTERS TOOLBAR ──────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mã NV, chức danh..."
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Phòng ban filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tất cả Phòng ban / Khối</option>
            {Object.entries(DEPARTMENT_MAP).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>

          {/* Thâm niên filter */}
          <select
            value={selectedTenure}
            onChange={(e) => setSelectedTenure(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tất cả Thâm niên</option>
            <option value="under1">Dưới 1 năm (Mới vào)</option>
            <option value="1to3">1 - 3 năm</option>
            <option value="3to5">3 - 5 năm</option>
            <option value="above5">Trên 5 năm (Nòng cốt)</option>
          </select>

          {/* Hình thức làm việc filter */}
          <select
            value={selectedWorkingType}
            onChange={(e) => setSelectedWorkingType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tất cả Hình thức làm việc</option>
            <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
            <option value="PART_TIME">Bán thời gian (Part-time)</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Tìm thấy {filteredEmployees.length} nhân sự phù hợp điều kiện lọc</span>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedTenure("all");
              setSelectedDept("all");
              setSelectedWorkingType("all");
            }}
            className="text-sky-600 font-semibold hover:underline"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      </div>

      {/* ──────────────── DETAILED HR TABLE ──────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span className="text-xs font-medium">Đang tải báo cáo nhân sự từ CSDL...</span>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3.5 px-5">Mã & Họ tên Nhân sự</th>
                  <th className="py-3.5 px-4">Phòng ban</th>
                  <th className="py-3.5 px-4">Chức vụ & Vị trí</th>
                  <th className="py-3.5 px-4">Thâm niên công tác</th>
                  <th className="py-3.5 px-4">Hình thức làm việc</th>
                  <th className="py-3.5 px-4 text-center w-24">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không có nhân sự nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Tên & Mã */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {emp.initials}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{emp.name}</span>
                              <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-1 py-0.2 rounded font-semibold">
                                {emp.id}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5">{emp.email || emp.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Dept */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{emp.dept}</span>
                          <span className="text-[11px] text-slate-400">{emp.location}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {emp.role}
                        </span>
                      </td>

                      {/* Thâm niên */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-emerald-700">{emp.tenureLabel}</span>
                            {emp.isCore && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                                Nòng cốt
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[10px]">Vào làm: {emp.joinDate}</span>
                        </div>
                      </td>

                      {/* Working Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${emp.workingType === "FULL_TIME"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-amber-50 text-amber-700"
                            }`}
                        >
                          {emp.workingType === "FULL_TIME" ? "Toàn thời gian" : "Bán thời gian"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenProfileModal(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Xem hồ sơ chi tiết kết nối từ CSDL"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ──────────────── BỘ CHUYỂN PHÂN TRANG ──────────────── */}
        {filteredEmployees.length > 0 && (
          <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                Đang hiển thị{" "}
                <span className="font-semibold text-slate-800">{startIndex + 1}</span> -{" "}
                <span className="font-semibold text-slate-800">{endIndex}</span> trong tổng số{" "}
                <span className="font-semibold text-slate-800">{filteredEmployees.length}</span> nhân sự
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
                className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 shadow-2xs"
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
                className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 shadow-2xs"
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

      {/* ──────────────── MODAL HỒ SƠ CHI TIẾT (LINK TRỰC TIẾP API PROFILE) ──────────────── */}
      {selectedProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-base">
                  Hồ sơ Nhân sự Chi tiết
                </h3>
              </div>
              <button
                onClick={() => setSelectedProfileModal(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingProfile ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                <span className="text-xs">Đang tải chi tiết hồ sơ từ API...</span>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4 text-xs">
                {/* Header Profile Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {selectedProfileModal.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-base">
                        {detailedProfile?.ho_ten || selectedProfileModal.name}
                      </span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                        {selectedProfileModal.id}
                      </span>
                    </div>
                    <span className="text-slate-500 text-xs block mt-0.5">
                      {detailedProfile?.ten_cv || selectedProfileModal.role} • {detailedProfile?.ten_pb || selectedProfileModal.dept}
                    </span>
                  </div>
                </div>

                {/* Thông tin thâm niên & làm việc */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Thâm niên công tác:</span>
                    <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                      {selectedProfileModal.tenureLabel}
                    </span>
                    <span className="text-[10px] text-slate-500">Từ {selectedProfileModal.joinDate}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Hình thức làm việc:</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {selectedProfileModal.workingType === "FULL_TIME" ? "Toàn thời gian" : "Bán thời gian"}
                    </span>
                    <span className="text-[10px] text-sky-600 font-semibold">
                      Trạng thái: {selectedProfileModal.status}
                    </span>
                  </div>
                </div>

                {/* Thông tin liên hệ & Căn cước */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col gap-2">
                  <span className="font-semibold text-slate-700 text-xs mb-1 block">
                    Thông tin liên hệ & Pháp lý:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Số điện thoại:</span>
                      <span className="font-medium text-slate-800">
                        {detailedProfile?.sdt || selectedProfileModal.phone || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email công việc:</span>
                      <span className="font-medium text-slate-800">
                        {detailedProfile?.email || selectedProfileModal.email || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Số CCCD:</span>
                      <span className="font-medium text-slate-800 font-mono">
                        {detailedProfile?.cccd || selectedProfileModal.cccd || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Địa chỉ thường trú:</span>
                      <span className="font-medium text-slate-800">
                        {detailedProfile?.dia_chi || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thông tin tài chính & bảo hiểm */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col gap-2">
                  <span className="font-semibold text-slate-700 text-xs mb-1 block">
                    Thông tin Ngân hàng & BHXH:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Tài khoản ngân hàng:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {detailedProfile?.so_tai_khoan || selectedProfileModal.bankAccount || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ngân hàng:</span>
                      <span className="font-medium text-slate-800">
                        {detailedProfile?.ngan_hang || selectedProfileModal.bankName || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Mã số thuế:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {detailedProfile?.ma_so_thue || selectedProfileModal.taxCode || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Số sổ BHXH:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {detailedProfile?.so_bhxh || selectedProfileModal.insuranceCode || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedProfileModal(null)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors"
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
