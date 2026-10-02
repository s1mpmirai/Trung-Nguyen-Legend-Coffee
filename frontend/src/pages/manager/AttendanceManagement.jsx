import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Calendar,
  Building2,
  Download,
  RefreshCw,
  Edit3,
  FileText,
  MapPin,
  Fingerprint,
  ChevronDown,
  X,
  ShieldCheck,
  Check,
  Sparkles,
  CalendarDays,
  UserCheck,
  AlertCircle
} from "lucide-react";

export default function AttendanceManagement() {
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "monthly"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-10-16");

  // Modal điều chỉnh giờ / duyệt giải trình
  const [adjustModalData, setAdjustModalData] = useState(null);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustedTime, setAdjustedTime] = useState("");

  // Dữ liệu mẫu danh sách chấm công ngày
  const [dailyAttendance, setDailyAttendance] = useState([
    {
      id: "TN-1092",
      name: "Nguyễn Văn An",
      initials: "AN",
      role: "Quản lý Vận hành",
      dept: "Khối Chiến Lược",
      branch: "Trụ sở chính",
      shift: "Hành chính (08:00 - 17:30)",
      checkIn: "07:52",
      checkInMethod: "GPS Hợp lệ",
      checkOut: "17:35",
      checkOutMethod: "GPS",
      lateMinutes: 0,
      actualHours: "8.5h",
      status: "ontime",
      statusLabel: "Đúng giờ",
      isApproved: true,
      hasExplanation: false,
    },
    {
      id: "TN-2204",
      name: "Lê Thị Mai",
      initials: "LM",
      role: "Trưởng ca Barista",
      dept: "Cửa Hàng Legend Đồng Khởi",
      branch: "Chuỗi Cửa hàng F&B",
      shift: "Ca Barista (06:30 - 14:30)",
      checkIn: "06:45",
      checkInMethod: "GPS Hợp lệ",
      checkOut: "14:32",
      checkOutMethod: "GPS",
      lateMinutes: 15,
      actualHours: "7.75h",
      status: "late",
      statusLabel: "Đi muộn 15p",
      isApproved: false,
      hasExplanation: true,
      explanationNote: "Kẹt xe tuyến đường Cách Mạng Tháng 8 do sự cố phân luồng",
    },
    {
      id: "TN-5519",
      name: "Trần Quốc Bảo",
      initials: "QB",
      role: "Kỹ sư Rang xay",
      dept: "Phân Xưởng Sơ Chế A",
      branch: "Nhà máy Buôn Ma Thuột",
      shift: "Ca 1 (06:00 - 14:00)",
      checkIn: "05:50",
      checkInMethod: "Vân tay Cổng 2",
      checkOut: "Chưa check-out",
      checkOutMethod: null,
      lateMinutes: 0,
      actualHours: "6.2h+",
      status: "working",
      statusLabel: "Đang làm việc",
      isApproved: false,
      hasExplanation: false,
    },
    {
      id: "TN-0841",
      name: "Hoàng Thu Trang",
      initials: "TT",
      role: "Chuyên viên R&D",
      dept: "Trung Tâm Sáng Tạo Cà Phê",
      branch: "Trụ sở chính",
      shift: "Hành chính (08:00 - 17:30)",
      checkIn: "-",
      checkInMethod: null,
      checkOut: "-",
      checkOutMethod: null,
      lateMinutes: 0,
      actualHours: "0h",
      status: "absent",
      statusLabel: "Nghỉ phép năm (Đã duyệt)",
      isApproved: true,
      hasExplanation: false,
    },
    {
      id: "TN-3312",
      name: "Phạm Đăng Khoa",
      initials: "PK",
      role: "Barista",
      dept: "Cửa Hàng Diamond Plaza",
      branch: "Chuỗi Cửa hàng F&B",
      shift: "Ca Chiều (14:30 - 22:30)",
      checkIn: "14:22",
      checkInMethod: "GPS Hợp lệ",
      checkOut: "Chưa check-out",
      checkOutMethod: null,
      lateMinutes: 0,
      actualHours: "4.1h+",
      status: "working",
      statusLabel: "Đang làm việc",
      isApproved: false,
      hasExplanation: false,
    },
    {
      id: "TN-4011",
      name: "Võ Minh Trí",
      initials: "MT",
      role: "Nhân viên Tiếp vận",
      dept: "Kho Tổng Tân Bình",
      branch: "Trụ sở chính",
      shift: "Hành chính (08:00 - 17:30)",
      checkIn: "08:20",
      checkInMethod: "GPS Hợp lệ",
      checkOut: "17:40",
      checkOutMethod: "GPS",
      lateMinutes: 20,
      actualHours: "7.7h",
      status: "late",
      statusLabel: "Đi muộn 20p",
      isApproved: false,
      hasExplanation: true,
      explanationNote: "Hỗ trợ bốc dỡ lô hàng cà phê mẫu xuất khẩu khẩn cấp",
    },
    {
      id: "TN-1188",
      name: "Đặng Thùy Dương",
      initials: "TD",
      role: "Chuyên viên Đào tạo",
      dept: "Học Viện Cà Phê Legend",
      branch: "Trụ sở chính",
      shift: "Hành chính (08:00 - 17:30)",
      checkIn: "07:58",
      checkInMethod: "Vân tay Cổng 1",
      checkOut: "17:32",
      checkOutMethod: "Vân tay Cổng 1",
      lateMinutes: 0,
      actualHours: "8.5h",
      status: "ontime",
      statusLabel: "Đúng giờ",
      isApproved: true,
      hasExplanation: false,
    }
  ]);

  // Dữ liệu mẫu bảng Grid tháng (31 ngày)
  const monthlyGrid = [
    { id: "TN-1092", name: "Nguyễn Văn An", role: "QL Vận hành", totalHours: 184, days: ["X","X","X","X","X","X","T7","CN","X","X","X","X","X","T7","CN","X","X","X","X","X","T7","CN","X","X","X","X","X","T7","CN","X","X"] },
    { id: "TN-2204", name: "Lê Thị Mai", role: "Trưởng ca Barista", totalHours: 176, days: ["X","X","M","X","X","OFF","OFF","X","X","X","M","X","OFF","OFF","X","X","X","X","X","OFF","OFF","X","X","X","X","M","OFF","OFF","X","X","X"] },
    { id: "TN-5519", name: "Trần Quốc Bảo", role: "Kỹ sư Rang xay", totalHours: 192, days: ["C1","C1","C1","C1","C1","OFF","OFF","C2","C2","C2","C2","C2","OFF","OFF","C1","C1","C1","C1","C1","OFF","OFF","C3","C3","C3","C3","C3","OFF","OFF","C1","C1","C1"] },
    { id: "TN-0841", name: "Hoàng Thu Trang", role: "Chuyên viên R&D", totalHours: 168, days: ["X","X","X","X","X","T7","CN","P","P","X","X","X","T7","CN","X","X","X","X","X","T7","CN","X","X","X","X","X","T7","CN","X","X","X"] },
    { id: "TN-3312", name: "Phạm Đăng Khoa", role: "Barista", totalHours: 172, days: ["C2","C2","OFF","OFF","C2","C2","C2","C2","OFF","OFF","C2","C2","C2","C2","OFF","OFF","C1","C1","C1","OFF","OFF","C2","C2","C2","C2","C2","OFF","OFF","C2","C2","C2"] },
  ];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncToast("Đã đồng bộ thành công dữ liệu từ 24 máy chấm công và ứng dụng mobile!");
      setTimeout(() => setSyncToast(""), 3500);
    }, 1200);
  };

  const handleApprove = (id) => {
    setDailyAttendance((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isApproved: true } : item))
    );
  };

  const handleOpenAdjust = (item) => {
    setAdjustModalData(item);
    setAdjustReason(item.explanationNote || "");
    setAdjustedTime(item.checkIn);
  };

  const handleSaveAdjust = () => {
    if (!adjustModalData) return;
    setDailyAttendance((prev) =>
      prev.map((item) =>
        item.id === adjustModalData.id
          ? {
              ...item,
              checkIn: adjustedTime,
              lateMinutes: 0,
              status: "ontime",
              statusLabel: "Đúng giờ (Đã duyệt GT)",
              isApproved: true,
              hasExplanation: false,
            }
          : item
      )
    );
    setAdjustModalData(null);
    setSyncToast(`Đã duyệt điều chỉnh giờ chấm công cho ${adjustModalData.name}!`);
    setTimeout(() => setSyncToast(""), 3500);
  };

  const filteredAttendance = dailyAttendance.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dept.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBranch = selectedBranch === "all" || item.branch === selectedBranch;
    const matchStatus =
      selectedStatus === "all" ||
      (selectedStatus === "ontime" && item.status === "ontime") ||
      (selectedStatus === "late" && item.status === "late") ||
      (selectedStatus === "working" && item.status === "working") ||
      (selectedStatus === "absent" && item.status === "absent");
    return matchSearch && matchBranch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* ──────────────── HEADER BAR ──────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight">
              Chấm công & Ca làm việc
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Mobile GPS Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dữ liệu đồng bộ trực tiếp từ ứng dụng chấm công di động GPS và máy quét vân tay thời gian thực.
          </p>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-sky-700 shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-sky-600" : ""}`} />
            <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}</span>
          </button>
          <button
            onClick={() => {
              setSyncToast("Đã xuất file bảng chấm công (Excel) thành công!");
              setTimeout(() => setSyncToast(""), 3500);
            }}
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

      {/* ──────────────── 4 KPI CARDS ──────────────── */}
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
                1,215
              </span>
              <span className="text-xs text-slate-400">/ 1,280 nhân sự</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-sky-600 h-full rounded-full transition-all duration-500" style={{ width: "94.9%" }}></div>
            </div>
            <div className="flex justify-between items-center text-[11px] font-semibold text-sky-600 mt-1">
              <span>Tỷ lệ có mặt</span>
              <span>94.9%</span>
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
                1,180
              </span>
              <span className="text-xs text-slate-400">nhân viên</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: "97.1%" }}></div>
            </div>
            <div className="flex justify-between items-center text-[11px] font-semibold text-emerald-600 mt-1">
              <span>Chuẩn mực kỷ luật</span>
              <span>97.1% đúng hạn</span>
            </div>
          </div>
        </div>

        {/* Card 3: Đi muộn / Về sớm */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đi muộn / Về sớm</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-amber-600">
                35
              </span>
              <span className="text-xs text-slate-400">trường hợp</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: "2.9%" }}></div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
              <span>22 muộn • 13 về sớm</span>
              <span className="text-amber-600 font-semibold">Cần duyệt GT</span>
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
                30
              </span>
              <span className="text-xs text-slate-400">nhân sự</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 px-2 py-1 rounded-md text-center border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Có phép</span>
                <span className="text-xs font-bold text-slate-800">28</span>
              </div>
              <div className="flex-1 bg-rose-50 px-2 py-1 rounded-md text-center border border-rose-100">
                <span className="text-[10px] text-rose-600 block">Không phép</span>
                <span className="text-xs font-bold text-rose-600">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── MAIN CONTAINER CARD ──────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Switcher & Secondary Filter Bar */}
        <div className="px-6 pt-4 pb-0 bg-slate-50/70 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl self-start">
            <button
              onClick={() => setViewMode("daily")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "daily"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bảng chấm công ngày</span>
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "monthly"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Tổng hợp công tháng (Grid 31 ngày)</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 pb-3 lg:pb-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Khối Cửa Hàng: 100%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Khối Văn Phòng: 93%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Nhà máy: 96%
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
              placeholder="Tìm theo Tên nhân viên, Mã NV (TN-1092)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date filter */}
            <div className="relative flex items-center bg-slate-50 px-3 py-2 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-sky-600 mr-2" />
              <span>Hôm nay: Thứ Sáu, 16/10/2026</span>
            </div>

            {/* Branch filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Tất cả chi nhánh / Văn phòng</option>
              <option value="Trụ sở chính">Trụ sở chính</option>
              <option value="Chuỗi Cửa hàng F&B">Chuỗi Cửa hàng F&B</option>
              <option value="Nhà máy Buôn Ma Thuột">Nhà máy Buôn Ma Thuột</option>
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ontime">Đúng giờ</option>
              <option value="late">Đi muộn</option>
              <option value="working">Đang làm việc</option>
              <option value="absent">Vắng mặt/Nghỉ phép</option>
            </select>
          </div>
        </div>

        {/* VIEW 1: DAILY TABLE */}
        {viewMode === "daily" && (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Phòng ban / Chi nhánh</th>
                  <th className="py-3 px-4">Ca làm việc</th>
                  <th className="py-3 px-4">Check-in</th>
                  <th className="py-3 px-4">Check-out</th>
                  <th className="py-3 px-4 text-center">Đi muộn</th>
                  <th className="py-3 px-4 text-center">Thực tế</th>
                  <th className="py-3 px-4">Tình trạng</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredAttendance.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* NV */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {row.initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{row.name}</span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {row.id} • {row.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Dept */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{row.dept}</span>
                        <span className="text-[11px] text-slate-400">{row.branch}</span>
                      </div>
                    </td>

                    {/* Shift */}
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {row.shift}
                      </span>
                    </td>

                    {/* Check In */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            row.lateMinutes > 0 ? "text-amber-600" : "text-slate-800"
                          }`}
                        >
                          {row.checkIn}
                        </span>
                        {row.checkInMethod && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-medium"
                            title={row.checkInMethod}
                          >
                            {row.checkInMethod.includes("GPS") ? (
                              <MapPin className="w-2.5 h-2.5" />
                            ) : (
                              <Fingerprint className="w-2.5 h-2.5" />
                            )}
                            {row.checkInMethod.includes("GPS") ? "GPS" : "Vân tay"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Check Out */}
                    <td className="py-3 px-4">
                      <span
                        className={
                          row.checkOut === "Chưa check-out"
                            ? "italic text-slate-400"
                            : "font-semibold text-slate-800"
                        }
                      >
                        {row.checkOut}
                      </span>
                    </td>

                    {/* Late Minutes */}
                    <td className="py-3 px-4 text-center">
                      {row.lateMinutes > 0 ? (
                        <span className="inline-flex px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[11px]">
                          +{row.lateMinutes}p
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Actual Hours */}
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">
                      {row.actualHours}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          row.status === "ontime"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.status === "late"
                            ? "bg-amber-50 text-amber-700"
                            : row.status === "working"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            row.status === "ontime"
                              ? "bg-emerald-500"
                              : row.status === "late"
                              ? "bg-amber-500"
                              : row.status === "working"
                              ? "bg-sky-500 animate-pulse"
                              : "bg-slate-400"
                          }`}
                        ></span>
                        {row.statusLabel}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.hasExplanation ? (
                          <button
                            onClick={() => handleOpenAdjust(row)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                            title="Có đơn giải trình - Bấm để duyệt"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        ) : null}

                        {row.isApproved ? (
                          <span
                            className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50"
                            title="Đã chốt công chuẩn"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApprove(row.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Chốt duyệt ngày công"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenAdjust(row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                          title="Điều chỉnh giờ chấm công"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: MONTHLY GRID 31 DAYS */}
        {viewMode === "monthly" && (
          <div className="overflow-x-auto w-full p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>Chu kỳ: 01/10/2026 - 31/10/2026</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-100 text-emerald-700 text-center leading-none text-[9px] flex items-center justify-center font-bold">X</span> Đủ công
                </span>
                <span className="flex items-center gap-1 font-semibold text-sky-700">
                  <span className="w-2.5 h-2.5 rounded bg-sky-100 text-sky-700 text-center leading-none text-[9px] flex items-center justify-center font-bold">P</span> Phép năm
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-700">
                  <span className="w-2.5 h-2.5 rounded bg-amber-100 text-amber-700 text-center leading-none text-[9px] flex items-center justify-center font-bold">M</span> Đi muộn
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded bg-slate-100 text-slate-500 text-center leading-none text-[9px] flex items-center justify-center font-bold">OFF</span> Nghỉ tuần
                </span>
              </div>
            </div>

            <table className="w-full text-center border-collapse text-[11px] min-w-[1300px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 text-left w-48">Nhân viên</th>
                  <th className="py-2.5 px-2 w-16">Tổng giờ</th>
                  {Array.from({ length: 31 }, (_, i) => (
                    <th key={i} className="py-2 px-1 w-7 font-mono text-[10px]">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyGrid.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-left font-semibold text-slate-900">
                      {row.name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {row.id} • {row.role}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono font-bold text-sky-700">
                      {row.totalHours}h
                    </td>
                    {row.days.map((code, idx) => {
                      let chipColor = "bg-emerald-50 text-emerald-700 font-medium";
                      if (code === "M") chipColor = "bg-amber-100 text-amber-800 font-bold";
                      if (code === "P") chipColor = "bg-sky-100 text-sky-800 font-bold";
                      if (code === "OFF" || code === "CN" || code === "T7")
                        chipColor = "bg-slate-100 text-slate-400";
                      if (code.startsWith("C")) chipColor = "bg-indigo-50 text-indigo-700 font-medium";

                      return (
                        <td key={idx} className="p-0.5">
                          <span
                            className={`inline-block w-6 py-0.5 rounded text-[10px] ${chipColor}`}
                          >
                            {code}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {adjustModalData.name}
                  </span>
                  <span className="text-slate-400">
                    {adjustModalData.id} • {adjustModalData.dept}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-mono font-medium">
                  {adjustModalData.shift}
                </span>
              </div>

              {adjustModalData.hasExplanation && (
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Đơn giải trình đi muộn từ nhân sự:</span>
                  </div>
                  <p className="text-slate-700 italic">"{adjustModalData.explanationNote}"</p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Giờ Check-in điều chỉnh:
                </label>
                <input
                  type="text"
                  value={adjustedTime}
                  onChange={(e) => setAdjustedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                  placeholder="08:00"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú phê duyệt của Quản lý:
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-xs"
                  placeholder="Xác nhận lý do chính đáng, duyệt xóa trừ công đi muộn..."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAdjustModalData(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveAdjust}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs"
              >
                Xác nhận & Duyệt công
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
