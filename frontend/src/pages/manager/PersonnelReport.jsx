import React, { useState } from "react";
import {
  GraduationCap,
  History,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Search,
  Filter,
  Building2,
  Calendar,
  Award,
  ChevronDown,
  X,
  Sparkles,
  BadgePercent,
  CheckCircle2,
  Eye,
  Briefcase,
  Layers
} from "lucide-react";

export default function PersonnelReport() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("all");
  const [selectedTenure, setSelectedTenure] = useState("all");
  const [selectedSalaryRange, setSelectedSalaryRange] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [toastMessage, setToastMessage] = useState("");

  // Modals
  const [selectedProfileModal, setSelectedProfileModal] = useState(null);
  const [selectedHistoryModal, setSelectedHistoryModal] = useState(null);

  // Danh sách nhân sự mẫu trong báo cáo chi tiết
  const [reportEmployees] = useState([
    {
      id: "NV-1281",
      name: "Lê Hoàng Nam",
      initials: "HN",
      role: "Chuyên viên Trưởng R&D Hương vị",
      dept: "Viện Nghiên cứu Cà phê TN",
      location: "Khu Công nghệ Cao TP.HCM",
      degree: "postgrad",
      degreeLabel: "Thạc sĩ Hóa Thực phẩm",
      school: "ĐH Bách Khoa TP.HCM (2018)",
      joinDate: "15/06/2018",
      tenureYears: 5.7,
      tenureLabel: "5 năm 8 tháng",
      isCore: true,
      currentSalary: 42500000,
      salaryTier: "above30",
      salaryNote: "+15% so với sàn R&D",
      history: [
        { date: "06/2018", title: "Thử việc R&D", salary: "18.000.000 đ", reason: "Gia nhập tập đoàn" },
        { date: "06/2020", title: "Chuyên viên R&D bậc 2", salary: "26.500.000 đ", reason: "Tăng định kỳ & KPI xuất sắc" },
        { date: "10/2022", title: "Chuyên viên Chính", salary: "34.000.000 đ", reason: "Đột phá công thức pha chế Legend" },
        { date: "01/2025", title: "Chuyên viên Trưởng", salary: "42.500.000 đ", reason: "Bổ nhiệm phụ trách nhóm sáng tạo" }
      ]
    },
    {
      id: "NV-0842",
      name: "Trần Quốc Quân",
      initials: "TQ",
      role: "Kỹ sư Vận hành Rang Xay",
      dept: "Nhà máy Buôn Ma Thuột",
      location: "KCN Tân An, Buôn Ma Thuột",
      degree: "engineer",
      degreeLabel: "Kỹ sư Cơ khí Chế tạo máy",
      school: "ĐH Bách Khoa Đà Nẵng (2020)",
      joinDate: "01/09/2020",
      tenureYears: 3.5,
      tenureLabel: "3 năm 6 tháng",
      isCore: true,
      currentSalary: 24000000,
      salaryTier: "20to30",
      salaryNote: "Chuẩn bậc kỹ sư cấp 3",
      history: [
        { date: "09/2020", title: "Kỹ sư tập sự", salary: "14.000.000 đ", reason: "Gia nhập nhà máy" },
        { date: "03/2022", title: "Kỹ sư vận hành", salary: "19.000.000 đ", reason: "Hoàn thành quy trình tự động hóa" },
        { date: "08/2024", title: "Kỹ sư bậc 3", salary: "24.000.000 đ", reason: "Nâng bậc tay nghề kỹ thuật" }
      ]
    },
    {
      id: "NV-2204",
      name: "Lê Thị Mai",
      initials: "LM",
      role: "Trưởng ca Barista",
      dept: "Chuỗi Legend F&B",
      location: "Cửa Hàng Legend Đồng Khởi",
      degree: "college",
      degreeLabel: "Cao đẳng Quản trị Khách sạn",
      school: "CĐ Du lịch Sài Gòn (2021)",
      joinDate: "10/02/2022",
      tenureYears: 2.7,
      tenureLabel: "2 năm 8 tháng",
      isCore: false,
      currentSalary: 14500000,
      salaryTier: "10to20",
      salaryNote: "+ Phụ cấp ca trưởng",
      history: [
        { date: "02/2022", title: "Barista tập sự", salary: "8.500.000 đ", reason: "Gia nhập cửa hàng" },
        { date: "11/2022", title: "Barista chính thức", salary: "10.500.000 đ", reason: "Đạt chuẩn tay nghề pha chế" },
        { date: "04/2024", title: "Trưởng ca Barista", salary: "14.500.000 đ", reason: "Thăng cấp quản lý ca làm việc" }
      ]
    },
    {
      id: "NV-3091",
      name: "Phạm Hải Đăng",
      initials: "HD",
      role: "Giám đốc Chiến lược Thương hiệu",
      dept: "Khối Văn phòng Điều hành",
      location: "Trụ sở chính, TP.HCM",
      degree: "postgrad",
      degreeLabel: "Thạc sĩ Quản trị Marketing (MBA)",
      school: "RMIT University (2016)",
      joinDate: "01/03/2019",
      tenureYears: 5.1,
      tenureLabel: "5 năm 1 tháng",
      isCore: true,
      currentSalary: 45000000,
      salaryTier: "above30",
      salaryNote: "Mức trần cấp lãnh đạo",
      history: [
        { date: "03/2019", title: "Trưởng phòng Tiếp thị", salary: "28.000.000 đ", reason: "Tuyển dụng nhân tài cấp cao" },
        { date: "06/2021", title: "Phó GĐ Thương hiệu", salary: "36.000.000 đ", reason: "Mở rộng hệ thống chuỗi" },
        { date: "12/2023", title: "Giám đốc Chiến lược", salary: "45.000.000 đ", reason: "Bổ nhiệm Ban điều hành" }
      ]
    },
    {
      id: "NV-4412",
      name: "Ngô Quốc Thịnh",
      initials: "QT",
      role: "Nhân viên Barista",
      dept: "Chuỗi Legend F&B",
      location: "Cửa Hàng Diamond Plaza",
      degree: "college",
      degreeLabel: "Trung cấp Nghề Pha Chế",
      school: "Trường CĐ Kinh tế Kỹ thuật (2023)",
      joinDate: "15/01/2024",
      tenureYears: 0.8,
      tenureLabel: "9 tháng",
      isCore: false,
      currentSalary: 9500000,
      salaryTier: "under10",
      salaryNote: "Khởi điểm Barista",
      history: [
        { date: "01/2024", title: "Nhân viên pha chế", salary: "9.500.000 đ", reason: "Tiếp nhận nhân sự mới" }
      ]
    },
    {
      id: "NV-1903",
      name: "Đỗ Bích Ngân",
      initials: "BN",
      role: "Chuyên viên Phân tích Dữ liệu Chuỗi cung ứng",
      dept: "Khối Văn phòng Điều hành",
      location: "Trụ sở chính, TP.HCM",
      degree: "university",
      degreeLabel: "Cử nhân Hệ thống Thông tin Quản lý",
      school: "ĐH Kinh Tế TP.HCM (2021)",
      joinDate: "12/07/2021",
      tenureYears: 3.2,
      tenureLabel: "3 năm 3 tháng",
      isCore: true,
      currentSalary: 26000000,
      salaryTier: "20to30",
      salaryNote: "Bậc phân tích dữ liệu chuyên sâu",
      history: [
        { date: "07/2021", title: "Chuyên viên phân tích tập sự", salary: "13.000.000 đ", reason: "Gia nhập tập đoàn" },
        { date: "01/2023", title: "Chuyên viên chính thức", salary: "19.500.000 đ", reason: "Đạt thành tích tự động hóa tồn kho" },
        { date: "06/2024", title: "Chuyên viên Data bậc 2", salary: "26.000.000 đ", reason: "Điều chỉnh lương thu hút nhân tài" }
      ]
    }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const filteredEmployees = reportEmployees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchDegree =
      selectedDegree === "all" ||
      (selectedDegree === "postgrad" && emp.degree === "postgrad") ||
      (selectedDegree === "university" && emp.degree === "university") ||
      (selectedDegree === "college" && emp.degree === "college") ||
      (selectedDegree === "engineer" && emp.degree === "engineer");

    const matchTenure =
      selectedTenure === "all" ||
      (selectedTenure === "under1" && emp.tenureYears < 1) ||
      (selectedTenure === "1to3" && emp.tenureYears >= 1 && emp.tenureYears < 3) ||
      (selectedTenure === "3to5" && emp.tenureYears >= 3 && emp.tenureYears <= 5) ||
      (selectedTenure === "above5" && emp.tenureYears > 5);

    const matchSalary =
      selectedSalaryRange === "all" || emp.salaryTier === selectedSalaryRange;

    const matchDept = selectedDept === "all" || emp.dept === selectedDept;

    return matchSearch && matchDegree && matchTenure && matchSalary && matchDept;
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* ──────────────── HEADER BAR ──────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase">
            BÁO CÁO THÔNG TIN NHÂN SỰ
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => showToast("Đã tải xuống file Báo cáo Thông tin Nhân sự (Excel) đầy đủ!")}
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

      {/* ──────────────── 3-AXIS EXECUTIVE SUMMARY CARDS ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Trình độ học vấn */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Khối Trí Thức & Chuyên Môn
              </span>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg mt-0.5 uppercase">
                TRÌNH ĐỘ HỌC VẤN
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-extrabold text-slate-900">
              68%
            </span>
            <span className="text-xs text-slate-500 font-medium">Đại học chính quy</span>
          </div>

          {/* Inline Ratio Bar */}
          <div className="flex flex-col gap-2">
            <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
              <div className="h-full bg-sky-600" style={{ width: "68%" }} title="Đại học: 68%"></div>
              <div className="h-full bg-emerald-500" style={{ width: "24%" }} title="Cao đẳng/Nghề: 24%"></div>
              <div className="h-full bg-amber-500" style={{ width: "8%" }} title="Sau Đại học: 8%"></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span> ĐH: 870 NV
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> CĐ: 308 NV
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Sau ĐH: 102 NV
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Thâm niên công tác */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Độ Gắn Kết Tổ Chức
              </span>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg mt-0.5 uppercase">
                THÂM NIÊN CÔNG TÁC
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <History className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-extrabold text-slate-900">
              3.4
            </span>
            <span className="text-xs text-slate-500 font-medium">năm bình quân / người</span>
          </div>

          {/* Inline Ratio Bar */}
          <div className="flex flex-col gap-2">
            <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: "33%" }} title=">3 năm Nòng cốt: 33%"></div>
              <div className="h-full bg-sky-500" style={{ width: "45%" }} title="1-3 năm: 45%"></div>
              <div className="h-full bg-slate-300" style={{ width: "22%" }} title="<1 năm: 22%"></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> &gt;3 năm (Nòng cốt): 33%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span> 1-3 năm: 45%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> &lt;1 năm: 22%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Mặt bằng đãi ngộ */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Mặt Bằng Đãi Ngộ
              </span>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg mt-0.5 uppercase">
                MỨC LƯƠNG HIỆN TẠI
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-extrabold text-slate-900">
              16.280.000
            </span>
            <span className="text-xs font-bold text-sky-600">VNĐ / người</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-500">Khoảng dao động lương:</span>
            <span className="font-bold text-slate-800">9.5tr - 45.0tr VNĐ</span>
          </div>
        </div>
      </div>

      {/* ──────────────── SMART FILTERS TOOLBAR ──────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-1 relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên, mã NV, chức danh..."
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Trình độ */}
          <select
            value={selectedDegree}
            onChange={(e) => setSelectedDegree(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tất cả Trình độ</option>
            <option value="postgrad">Thạc sĩ / Sau ĐH</option>
            <option value="university">Đại học chính quy</option>
            <option value="college">Cao đẳng / Nghề</option>
            <option value="engineer">Kỹ sư công nghệ</option>
          </select>

          {/* Thâm niên */}
          <select
            value={selectedTenure}
            onChange={(e) => setSelectedTenure(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tất cả Thâm niên</option>
            <option value="under1">Dưới 1 năm (Mới)</option>
            <option value="1to3">1 - 3 năm</option>
            <option value="3to5">3 - 5 năm</option>
            <option value="above5">Trên 5 năm (Nòng cốt)</option>
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

          {/* Khối bộ phận */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tất cả Khối / Bộ phận</option>
            <option value="Viện Nghiên cứu Cà phê TN">Viện Nghiên cứu R&D</option>
            <option value="Chuỗi Legend F&B">Chuỗi Legend F&B</option>
            <option value="Nhà máy Buôn Ma Thuột">Nhà máy Buôn Ma Thuột</option>
            <option value="Khối Văn phòng Điều hành">Khối Văn phòng Điều hành</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Tìm thấy {filteredEmployees.length} nhân sự phù hợp điều kiện lọc</span>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDegree("all");
              setSelectedTenure("all");
              setSelectedSalaryRange("all");
              setSelectedDept("all");
            }}
            className="text-sky-600 font-semibold hover:underline"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      </div>

      {/* ──────────────── DETAILED HR TABLE ──────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3.5 px-5">Mã & Họ tên Nhân sự</th>
                <th className="py-3.5 px-4">Phòng ban / Chi nhánh</th>
                <th className="py-3.5 px-4">Trình độ & Chuyên môn</th>
                <th className="py-3.5 px-4">Thâm niên & Ngày vào</th>
                <th className="py-3.5 px-5 text-right">Mức lương Hiện tại</th>
                <th className="py-3.5 px-4 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredEmployees.map((emp) => (
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
                        <span className="text-[11px] text-slate-400 mt-0.5">{emp.role}</span>
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

                  {/* Trình độ */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5 items-start">
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-semibold text-[11px]">
                        {emp.degreeLabel}
                      </span>
                      <span className="text-slate-400 text-[10px]">{emp.school}</span>
                    </div>
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

                  {/* Mức lương */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-sm">
                        {emp.currentSalary.toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-emerald-600 text-[10px] font-semibold">
                        {emp.salaryNote}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedProfileModal(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Xem hồ sơ học vấn & chuyên môn"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedHistoryModal(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Xem lịch sử tăng lương"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────────────── MODAL HỒ SƠ CHUYÊN MÔN ──────────────── */}
      {selectedProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-sky-600" />
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-base">
                  Hồ sơ Học vấn & Năng lực
                </h3>
              </div>
              <button
                onClick={() => setSelectedProfileModal(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-bold text-sm flex items-center justify-center">
                  {selectedProfileModal.initials}
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {selectedProfileModal.name}
                  </span>
                  <span className="text-slate-500">
                    {selectedProfileModal.id} • {selectedProfileModal.role}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 flex flex-col gap-1">
                <span className="text-sky-800 font-semibold text-xs">Bằng cấp & Học hàm cao nhất:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedProfileModal.degreeLabel}</span>
                <span className="text-slate-500">{selectedProfileModal.school}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Thâm niên công tác:</span>
                  <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                    {selectedProfileModal.tenureLabel}
                  </span>
                  <span className="text-[11px] text-slate-500">Từ {selectedProfileModal.joinDate}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Mức lương hiện tại:</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {selectedProfileModal.currentSalary.toLocaleString("vi-VN")} đ
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    {selectedProfileModal.salaryNote}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-1">
                  Đánh giá phân loại nhân sự:
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Nhân sự thuộc nhóm {selectedProfileModal.isCore ? "Nhân sự Nòng cốt chiến lược" : "Đội ngũ vận hành kế thừa"}, đạt chuẩn năng lực chuyên môn và lộ trình thăng tiến của Trung Nguyên Legend.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedProfileModal(null)}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL LỊCH SỬ TĂNG LƯƠNG ──────────────── */}
      {selectedHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-base">
                  Lịch sử Điều chỉnh Lương & Chức vụ
                </h3>
              </div>
              <button
                onClick={() => setSelectedHistoryModal(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {selectedHistoryModal.name}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {selectedHistoryModal.id} • {selectedHistoryModal.dept}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Hiện tại:</span>
                  <span className="font-bold text-sky-700 font-mono text-sm">
                    {selectedHistoryModal.currentSalary.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              {/* Timeline of salary increases */}
              <div className="flex flex-col gap-3 mt-2">
                <span className="font-semibold text-slate-700">Các mốc điều chỉnh lương:</span>
                <div className="flex flex-col gap-2.5 pl-2 border-l-2 border-sky-200">
                  {selectedHistoryModal.history.map((item, idx) => (
                    <div key={idx} className="relative pl-4 flex flex-col gap-0.5">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-sky-600 ring-2 ring-white"></span>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{item.title}</span>
                        <span className="font-mono font-bold text-emerald-700">{item.salary}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{item.reason}</span>
                        <span>Mốc: {item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedHistoryModal(null)}
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
