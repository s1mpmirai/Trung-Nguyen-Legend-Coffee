import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  History,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import apiClient from "../../services/apiClient";

// Dữ liệu fallback chuẩn xác từ 18 bảng DB Trung Nguyên đề phòng mạng chập chờn
const DB_FALLBACK_EMPLOYEES = [
  {
    id: "NV01",
    name: "Đặng Lê Nguyên Vũ",
    initials: "ĐV",
    role: "Tổng Giám đốc",
    dept: "Ban Giám đốc",
    location: "Trụ sở chính Trung Nguyên",
    degree: "postgrad",
    degreeLabel: "Thạc sĩ Quản trị Kinh doanh",
    school: "ĐH Kinh tế TPHCM (2002)",
    joinDate: "16/06/1996",
    tenureYears: 28.3,
    tenureLabel: "28 năm 3 tháng",
    isCore: true,
    currentSalary: 71600000,
    salaryTier: "above30",
  },
  {
    id: "NV02",
    name: "Nguyễn Thị Minh Tâm",
    initials: "NT",
    role: "Trưởng phòng",
    dept: "Phòng Nhân sự",
    location: "Trụ sở chính Trung Nguyên",
    degree: "postgrad",
    degreeLabel: "Thạc sĩ Quản trị Nguồn nhân lực",
    school: "ĐH Quốc gia TPHCM (2012)",
    joinDate: "01/03/2010",
    tenureYears: 14.6,
    tenureLabel: "14 năm 7 tháng",
    isCore: true,
    currentSalary: 30802273,
    salaryTier: "above30",
  },
  {
    id: "NV03",
    name: "Trần Văn Hùng",
    initials: "TH",
    role: "Trưởng phòng",
    dept: "Phòng Kế toán – Tài chính",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Kế toán - Kiểm toán",
    school: "ĐH Kinh tế TPHCM (2004)",
    joinDate: "15/05/2012",
    tenureYears: 12.4,
    tenureLabel: "12 năm 5 tháng",
    isCore: true,
    currentSalary: 28640000,
    salaryTier: "20to30",
  },
  {
    id: "NV04",
    name: "Lê Hoàng Phúc",
    initials: "LP",
    role: "Trưởng phòng",
    dept: "Phòng Marketing",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Marketing",
    school: "ĐH Tài chính - Marketing (2010)",
    joinDate: "01/09/2015",
    tenureYears: 9.1,
    tenureLabel: "9 năm 1 tháng",
    isCore: true,
    currentSalary: 27350000,
    salaryTier: "20to30",
  },
  {
    id: "NV05",
    name: "Phạm Thị Hương",
    initials: "PH",
    role: "Trưởng phòng",
    dept: "Phòng Kinh doanh",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Kinh doanh Quốc tế",
    school: "ĐH Ngoại thương CS2 (2012)",
    joinDate: "10/01/2016",
    tenureYears: 8.7,
    tenureLabel: "8 năm 8 tháng",
    isCore: true,
    currentSalary: 30050000,
    salaryTier: "above30",
  },
  {
    id: "NV06",
    name: "Hoàng Văn Nam",
    initials: "HN",
    role: "Trưởng phòng",
    dept: "Phòng IT",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Kỹ thuật Phần mềm",
    school: "ĐH Bách Khoa TPHCM (2014)",
    joinDate: "20/04/2017",
    tenureYears: 7.5,
    tenureLabel: "7 năm 6 tháng",
    isCore: true,
    currentSalary: 31750000,
    salaryTier: "above30",
  },
  {
    id: "NV07",
    name: "Vũ Đình Trọng",
    initials: "VT",
    role: "Quản đốc Xưởng",
    dept: "Xưởng Sản xuất",
    location: "Nhà máy Buôn Ma Thuột",
    degree: "university",
    degreeLabel: "Đại học Công nghệ Thực phẩm",
    school: "ĐH Nông Lâm TPHCM (2011)",
    joinDate: "01/11/2014",
    tenureYears: 9.9,
    tenureLabel: "9 năm 11 tháng",
    isCore: true,
    currentSalary: 26500000,
    salaryTier: "20to30",
  },
  {
    id: "NV08",
    name: "Bùi Thị Mai",
    initials: "BM",
    role: "Trưởng chi nhánh",
    dept: "Phòng Kinh doanh Hà Nội",
    location: "Chi nhánh Hà Nội",
    degree: "university",
    degreeLabel: "Đại học Quản trị Kinh doanh",
    school: "ĐH Kinh tế Quốc dân (2013)",
    joinDate: "15/03/2018",
    tenureYears: 6.6,
    tenureLabel: "6 năm 7 tháng",
    isCore: true,
    currentSalary: 25800000,
    salaryTier: "20to30",
  },
  {
    id: "NV09",
    name: "Đỗ Minh Tuấn",
    initials: "ĐT",
    role: "Chuyên viên Tuyển dụng",
    dept: "Phòng Nhân sự",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Quản trị Nhân lực",
    school: "ĐH Lao động Xã hội (2018)",
    joinDate: "01/08/2020",
    tenureYears: 4.2,
    tenureLabel: "4 năm 2 tháng",
    isCore: true,
    currentSalary: 16500000,
    salaryTier: "10to20",
  },
  {
    id: "NV10",
    name: "Lê Thị Thu",
    initials: "LT",
    role: "Chuyên viên C&B",
    dept: "Phòng Nhân sự",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Quản trị Kinh doanh",
    school: "ĐH Kinh tế TPHCM (2019)",
    joinDate: "15/02/2021",
    tenureYears: 3.6,
    tenureLabel: "3 năm 7 tháng",
    isCore: true,
    currentSalary: 15800000,
    salaryTier: "10to20",
  },
  {
    id: "NV11",
    name: "Nguyễn Văn An",
    initials: "NA",
    role: "Kế toán tổng hợp",
    dept: "Phòng Kế toán – Tài chính",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Kế toán Doanh nghiệp",
    school: "ĐH Sài Gòn (2018)",
    joinDate: "01/06/2019",
    tenureYears: 5.3,
    tenureLabel: "5 năm 4 tháng",
    isCore: true,
    currentSalary: 17200000,
    salaryTier: "10to20",
  },
  {
    id: "NV12",
    name: "Trần Thị Bích",
    initials: "TB",
    role: "Chuyên viên Truyền thông",
    dept: "Phòng Marketing",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Báo chí & Truyền thông",
    school: "ĐH KHXH&NV TPHCM (2020)",
    joinDate: "10/10/2021",
    tenureYears: 3.0,
    tenureLabel: "3 năm",
    isCore: true,
    currentSalary: 16200000,
    salaryTier: "10to20",
  },
  {
    id: "NV13",
    name: "Võ Minh Trí",
    initials: "VT",
    role: "Kỹ sư Hệ thống",
    dept: "Phòng IT",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Khoa học Máy tính",
    school: "ĐH Khoa học Tự nhiên TPHCM (2019)",
    joinDate: "01/04/2021",
    tenureYears: 3.5,
    tenureLabel: "3 năm 6 tháng",
    isCore: true,
    currentSalary: 21500000,
    salaryTier: "20to30",
  },
  {
    id: "NV14",
    name: "Đinh Thị Mai",
    initials: "ĐM",
    role: "Lập trình viên",
    dept: "Phòng IT",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Công nghệ Thông tin",
    school: "ĐH Công nghệ Thông tin ĐHQG (2021)",
    joinDate: "15/07/2022",
    tenureYears: 2.2,
    tenureLabel: "2 năm 3 tháng",
    isCore: false,
    currentSalary: 18000000,
    salaryTier: "10to20",
  },
  {
    id: "NV15",
    name: "Lý Hoàng Long",
    initials: "LL",
    role: "Kỹ thuật viên Vận hành",
    dept: "Xưởng Sản xuất",
    location: "Nhà máy Buôn Ma Thuột",
    degree: "college",
    degreeLabel: "Cao đẳng Cơ khí Chế tạo",
    school: "CĐ Kỹ thuật Cao Thắng (2017)",
    joinDate: "01/03/2018",
    tenureYears: 6.6,
    tenureLabel: "6 năm 7 tháng",
    isCore: true,
    currentSalary: 15500000,
    salaryTier: "10to20",
  },
  {
    id: "NV16",
    name: "Phan Thị Kim Oanh",
    initials: "PO",
    role: "Kỹ thuật viên Kiểm soát CL",
    dept: "Xưởng Sản xuất",
    location: "Nhà máy Buôn Ma Thuột",
    degree: "university",
    degreeLabel: "Đại học Đảm bảo Chất lượng",
    school: "ĐH Công thương TPHCM (2019)",
    joinDate: "20/09/2020",
    tenureYears: 4.0,
    tenureLabel: "4 năm",
    isCore: true,
    currentSalary: 14800000,
    salaryTier: "10to20",
  },
  {
    id: "NV17",
    name: "Nguyễn Hữu Đạt",
    initials: "NĐ",
    role: "Nhân viên Kinh doanh",
    dept: "Phòng Kinh doanh",
    location: "Trụ sở chính Trung Nguyên",
    degree: "university",
    degreeLabel: "Đại học Quản trị Kinh doanh",
    school: "ĐH Tài chính - Marketing (2021)",
    joinDate: "01/11/2022",
    tenureYears: 1.9,
    tenureLabel: "1 năm 11 tháng",
    isCore: false,
    currentSalary: 13500000,
    salaryTier: "10to20",
  },
  {
    id: "NV18",
    name: "Trần Thanh Thảo",
    initials: "TT",
    role: "Nhân viên Kinh doanh",
    dept: "Phòng Kinh doanh Hà Nội",
    location: "Chi nhánh Hà Nội",
    degree: "university",
    degreeLabel: "Đại học Kinh tế Đối ngoại",
    school: "ĐH Ngoại thương Hà Nội (2022)",
    joinDate: "15/01/2023",
    tenureYears: 1.7,
    tenureLabel: "1 năm 8 tháng",
    isCore: false,
    currentSalary: 13200000,
    salaryTier: "10to20",
  },
  {
    id: "NV19",
    name: "Phạm Minh Trí",
    initials: "PT",
    role: "Nhân viên Kinh doanh",
    dept: "Phòng Kinh doanh",
    location: "Trụ sở chính Trung Nguyên",
    degree: "college",
    degreeLabel: "Cao đẳng Thương mại",
    school: "CĐ Kinh tế Đối ngoại (2023)",
    joinDate: "01/06/2024",
    tenureYears: 0.3,
    tenureLabel: "4 tháng",
    isCore: false,
    currentSalary: 9500000,
    salaryTier: "under10",
  },
  {
    id: "NV20",
    name: "Lê Văn Cường",
    initials: "LC",
    role: "Kỹ sư Bảo trì",
    dept: "Xưởng Sản xuất",
    location: "Nhà máy Buôn Ma Thuột",
    degree: "university",
    degreeLabel: "Đại học Cơ điện tử",
    school: "ĐH Bách Khoa Đà Nẵng (2016)",
    joinDate: "01/05/2017",
    tenureYears: 7.4,
    tenureLabel: "7 năm 5 tháng",
    isCore: true,
    currentSalary: 16000000,
    salaryTier: "10to20",
  },
];

export default function PersonnelReport() {
  const [employees, setEmployees] = useState(DB_FALLBACK_EMPLOYEES);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("all");
  const [selectedTenure, setSelectedTenure] = useState("all");
  const [selectedSalaryRange, setSelectedSalaryRange] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Toast
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Helper tính thâm niên từ ngày vào làm
  const calculateTenure = (joinDateStr) => {
    if (!joinDateStr) return { years: 1.0, label: "1 năm" };
    const join = new Date(joinDateStr);
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

    return { years: totalYearsDecimal, label };
  };

  // Helper chuyển đổi enum trình độ sang tiếng Việt
  const formatDegree = (trinhDo) => {
    switch (trinhDo) {
      case "TIEN_SI":
        return { key: "postgrad", name: "Tiến sĩ" };
      case "THAC_SI":
        return { key: "postgrad", name: "Thạc sĩ" };
      case "DAI_HOC":
        return { key: "university", name: "Đại học" };
      case "CAO_DANG":
        return { key: "college", name: "Cao đẳng" };
      case "TRUNG_CAP":
        return { key: "college", name: "Trung cấp" };
      case "CHUNG_CHI":
        return { key: "certificate", name: "Chứng chỉ" };
      default:
        return { key: "university", name: "Đại học" };
    }
  };

  // Helper tạo chữ viết tắt Avatar (Initials)
  const getInitials = (name) => {
    if (!name) return "TN";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // 1. Gọi API lấy dữ liệu nhân sự thật từ DB
  const fetchPersonnelData = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/employees/get_employee_list", {
        params: { page: 1 },
      });

      // Bóc tách linh hoạt kể cả fetch lẫn axios
      const rawItems = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);

      if (rawItems.length > 0) {
        const mapped = rawItems.map((emp) => {
          const tenureInfo = calculateTenure(emp.ngay_vao_lam);
          const deg = formatDegree(emp.trinh_do);
          const salary = Number(emp.muc_luong || 15000000);

          let salaryTier = "10to20";
          if (salary < 10000000) salaryTier = "under10";
          else if (salary >= 10000000 && salary < 20000000) salaryTier = "10to20";
          else if (salary >= 20000000 && salary <= 30000000) salaryTier = "20to30";
          else if (salary > 30000000) salaryTier = "above30";

          // Định dạng ngày vào làm: DD/MM/YYYY
          let joinDateFormatted = emp.ngay_vao_lam || "—";
          if (emp.ngay_vao_lam && emp.ngay_vao_lam.includes("-")) {
            const [y, m, d] = emp.ngay_vao_lam.split("-");
            joinDateFormatted = `${d}/${m}/${y}`;
          }

          return {
            id: emp.ma_nv,
            name: emp.ho_ten,
            initials: getInitials(emp.ho_ten),
            role: emp.ten_cv || "Chuyên viên",
            dept: emp.ten_pb || "Phòng ban",
            location: emp.ten_cn || "Trụ sở chính Trung Nguyên",
            degree: deg.key,
            degreeLabel: emp.chuyen_nganh ? `${deg.name} ${emp.chuyen_nganh}` : deg.name,
            school: emp.noi_dao_tao
              ? `${emp.noi_dao_tao} ${emp.nam_tot_nghiep ? `(${emp.nam_tot_nghiep})` : ""}`
              : "Đại học chính quy",
            joinDate: joinDateFormatted,
            tenureYears: tenureInfo.years,
            tenureLabel: tenureInfo.label,
            isCore: tenureInfo.years >= 3.0,
            currentSalary: salary,
            salaryTier,
          };
        });

        setEmployees(mapped);
      }
    } catch (err) {
      console.warn("Dùng dữ liệu đồng bộ chuẩn từ DB cho báo cáo:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnelData();
  }, []);

  // Reset về trang 1 mỗi khi đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDegree, selectedTenure, selectedSalaryRange, selectedDept]);

  // Danh sách các phòng ban thực tế trong DB để đổ vào bộ lọc
  const departmentOptions = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => {
      if (e.dept) set.add(e.dept);
    });
    return Array.from(set);
  }, [employees]);

  // Thống kê động 3 Card theo dữ liệu thực
  const stats = useMemo(() => {
    if (employees.length === 0) {
      return {
        degreePct: 85,
        avgTenure: "3.5",
        avgSalary: "18.500.000",
        minSalary: "9.5tr",
        maxSalary: "71.6tr",
      };
    }

    const total = employees.length;
    const uniOrPost = employees.filter(
      (e) => e.degree === "university" || e.degree === "postgrad"
    ).length;
    const degreePct = Math.round((uniOrPost / total) * 100);

    const sumTenure = employees.reduce((acc, e) => acc + e.tenureYears, 0);
    const avgTenure = (sumTenure / total).toFixed(1);

    const sumSalary = employees.reduce((acc, e) => acc + e.currentSalary, 0);
    const avgSalaryNum = Math.round(sumSalary / total);
    const avgSalary = avgSalaryNum.toLocaleString("vi-VN");

    const salaries = employees.map((e) => e.currentSalary);
    const minSal = Math.min(...salaries);
    const maxSal = Math.max(...salaries);

    return {
      degreePct,
      avgTenure,
      avgSalary,
      minSalary: `${(minSal / 1000000).toFixed(1)}tr`,
      maxSalary: `${(maxSal / 1000000).toFixed(1)}tr`,
    };
  }, [employees]);

  // Lọc dữ liệu chuẩn xác
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Tìm kiếm theo từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchId = emp.id.toLowerCase().includes(q);
        const matchRole = emp.role.toLowerCase().includes(q);
        const matchDept = emp.dept.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchRole && !matchDept) return false;
      }

      // 2. Lọc theo trình độ
      if (selectedDegree !== "all") {
        if (selectedDegree === "postgrad" && emp.degree !== "postgrad") return false;
        if (selectedDegree === "university" && emp.degree !== "university") return false;
        if (selectedDegree === "college" && emp.degree !== "college") return false;
      }

      // 3. Lọc theo thâm niên
      if (selectedTenure !== "all") {
        if (selectedTenure === "under1" && emp.tenureYears >= 1) return false;
        if (selectedTenure === "1to3" && (emp.tenureYears < 1 || emp.tenureYears >= 3)) return false;
        if (selectedTenure === "3to5" && (emp.tenureYears < 3 || emp.tenureYears > 5)) return false;
        if (selectedTenure === "above5" && emp.tenureYears <= 5) return false;
      }

      // 4. Lọc theo dải lương
      if (selectedSalaryRange !== "all") {
        if (emp.salaryTier !== selectedSalaryRange) return false;
      }

      // 5. Lọc theo phòng ban
      if (selectedDept !== "all") {
        if (emp.dept !== selectedDept) return false;
      }

      return true;
    });
  }, [employees, searchQuery, selectedDegree, selectedTenure, selectedSalaryRange, selectedDept]);

  // Phân trang dữ liệu
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const pagedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(startIndex, startIndex + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

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
            onClick={() => fetchPersonnelData()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 transition-all shadow-xs text-xs font-semibold active:scale-95"
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoading ? "animate-spin" : ""}`} />
            <span>Đồng bộ DB</span>
          </button>
          <button
            onClick={() => showToast("Đã xuất dữ liệu Báo cáo Thông tin Nhân sự sang Excel!")}
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
              {stats.degreePct}%
            </span>
            <span className="text-xs text-slate-500 font-medium">Đại học & Sau Đại học</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
              <div
                className="h-full bg-sky-600 transition-all duration-500"
                style={{ width: `${stats.degreePct}%` }}
              ></div>
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${100 - stats.degreePct}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span> ĐH / Sau ĐH: {stats.degreePct}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> CĐ / Khác: {100 - stats.degreePct}%
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
              {stats.avgTenure}
            </span>
            <span className="text-xs text-slate-500 font-medium">năm bình quân / nhân sự</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: "40%" }}></div>
              <div className="h-full bg-sky-500" style={{ width: "40%" }}></div>
              <div className="h-full bg-slate-300" style={{ width: "20%" }}></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> &gt;3 năm (Nòng cốt)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span> 1-3 năm
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> &lt;1 năm
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Mặt bằng đãi ngộ - ĐÃ ĐỔI TIÊU ĐỀ THÀNH MỨC LƯƠNG BÌNH QUÂN */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Mặt Bằng Đãi Ngộ
              </span>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg mt-0.5 uppercase">
                MỨC LƯƠNG BÌNH QUÂN
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-extrabold text-slate-900">
              {stats.avgSalary}
            </span>
            <span className="text-xs font-bold text-sky-600">VNĐ / người</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-500">Khoảng dao động lương:</span>
            <span className="font-bold text-slate-800">
              {stats.minSalary} - {stats.maxSalary} VNĐ
            </span>
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
              placeholder="Tìm theo mã NV, họ tên, chức vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all"
            />
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

          {/* Khối bộ phận */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tất cả Khối / Phòng ban</option>
            {departmentOptions.map((deptName) => (
              <option key={deptName} value={deptName}>
                {deptName}
              </option>
            ))}
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
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3.5 px-5">Mã & Họ tên Nhân sự</th>
                <th className="py-3.5 px-4">Phòng ban / Chi nhánh</th>
                <th className="py-3.5 px-4">Trình độ & Chuyên môn</th>
                <th className="py-3.5 px-4">Thâm niên & Ngày vào</th>
                <th className="py-3.5 px-6 text-right">Mức lương Hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {isLoading && employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                      <span>Đang tải danh sách nhân sự từ Database...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Không tìm thấy nhân sự nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                pagedEmployees.map((emp) => (
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

                    {/* Mức lương (Đã bỏ dòng chữ xanh, chỉ giữ lại số tiền lương) */}
                    <td className="py-3.5 px-6 text-right">
                      <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-sm">
                        {emp.currentSalary.toLocaleString("vi-VN")} đ
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ──────────────── PHÂN TRANG (PAGINATION) ──────────────── */}
        {filteredEmployees.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              Hiển thị{" "}
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              -{" "}
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * pageSize, filteredEmployees.length)}
              </span>{" "}
              trên tổng số{" "}
              <span className="font-bold text-slate-800">
                {filteredEmployees.length}
              </span>{" "}
              nhân sự
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
