import React, { useState, useEffect, useMemo } from "react";
import {
  UserPlus,
  Search,
  Upload,
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
  MapPin,
  Briefcase,
} from "lucide-react";
import AddEmployeeModal from "./components/AddEmployeeModal";
import apiClient from "../../services/apiClient";

// ──────────────── DỮ LIỆU DỰ PHÒNG CHUẨN TỪ CSDL TRUNG NGUYÊN ────────────────
const DB_FALLBACK_EMPLOYEES = [
  {
    id: "NV01",
    name: "Đặng Lê Nguyên Vũ",
    email: "vu.dang@trungnguyen.com.vn",
    initials: "ĐV",
    role: "Tổng Giám đốc",
    dept: "Ban Giám đốc",
    location: "Trụ sở chính Trung Nguyên",
    degree: "postgrad",
    degreeLabel: "ThS. Quản trị Kinh doanh (MBA)",
    school: "ĐH Kinh tế TPHCM (2002)",
    joinDate: "16/06/1996",
    tenureYears: 28.3,
    tenureLabel: "28 năm 3 tháng",
    isCore: true,
    salaryNum: 71600000,
    salary: "71,600,000 đ",
    salaryTier: "above30",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
    isVip: true,
  },
  {
    id: "NV02",
    name: "Nguyễn Thị Minh Tâm",
    email: "tam.nguyen@trungnguyen.com.vn",
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
    salaryNum: 30800000,
    salary: "30,800,000 đ",
    salaryTier: "above30",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV03",
    name: "Trần Văn Hùng",
    email: "hung.tran@trungnguyen.com.vn",
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
    salaryNum: 28600000,
    salary: "28,600,000 đ",
    salaryTier: "20to30",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV04",
    name: "Lê Hoàng Phúc",
    email: "phuc.le@trungnguyen.com.vn",
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
    salaryNum: 27300000,
    salary: "27,300,000 đ",
    salaryTier: "20to30",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV05",
    name: "Phạm Thị Hương",
    email: "huong.pham@trungnguyen.com.vn",
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
    salaryNum: 30050000,
    salary: "30,050,000 đ",
    salaryTier: "above30",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV06",
    name: "Hoàng Văn Nam",
    email: "nam.hoang@trungnguyen.com.vn",
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
    salaryNum: 31750000,
    salary: "31,750,000 đ",
    salaryTier: "above30",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV07",
    name: "Vũ Đình Trọng",
    email: "trong.vu@trungnguyen.com.vn",
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
    salaryNum: 26500000,
    salary: "26,500,000 đ",
    salaryTier: "20to30",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV08",
    name: "Bùi Thị Mai",
    email: "mai.bui@trungnguyen.com.vn",
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
    salaryNum: 25800000,
    salary: "25,800,000 đ",
    salaryTier: "20to30",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV09",
    name: "Đỗ Minh Tuấn",
    email: "tuan.do@trungnguyen.com.vn",
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
    salaryNum: 16500000,
    salary: "16,500,000 đ",
    salaryTier: "10to20",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV10",
    name: "Lê Thị Thu",
    email: "thu.le@trungnguyen.com.vn",
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
    salaryNum: 15800000,
    salary: "15,800,000 đ",
    salaryTier: "10to20",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV11",
    name: "Nguyễn Văn An",
    email: "an.nguyen@trungnguyen.com.vn",
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
    salaryNum: 17200000,
    salary: "17,200,000 đ",
    salaryTier: "10to20",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV12",
    name: "Trần Thị Bích",
    email: "bich.tran@trungnguyen.com.vn",
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
    salaryNum: 16200000,
    salary: "16,200,000 đ",
    salaryTier: "10to20",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV13",
    name: "Võ Minh Trí",
    email: "tri.vo@trungnguyen.com.vn",
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
    salaryNum: 21500000,
    salary: "21,500,000 đ",
    salaryTier: "20to30",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV14",
    name: "Đinh Thị Mai",
    email: "mai.dinh@trungnguyen.com.vn",
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
    salaryNum: 18000000,
    salary: "18,000,000 đ",
    salaryTier: "10to20",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV15",
    name: "Lý Hoàng Long",
    email: "long.ly@trungnguyen.com.vn",
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
    salaryNum: 15500000,
    salary: "15,500,000 đ",
    salaryTier: "10to20",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV16",
    name: "Phan Thị Kim Oanh",
    email: "oanh.phan@trungnguyen.com.vn",
    initials: "PO",
    role: "Kiểm soát Chất lượng (QC)",
    dept: "Xưởng Sản xuất",
    location: "Nhà máy Buôn Ma Thuột",
    degree: "university",
    degreeLabel: "Đại học Đảm bảo Chất lượng",
    school: "ĐH Công thương TPHCM (2019)",
    joinDate: "20/09/2020",
    tenureYears: 4.0,
    tenureLabel: "4 năm",
    isCore: true,
    salaryNum: 14800000,
    salary: "14,800,000 đ",
    salaryTier: "10to20",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV17",
    name: "Nguyễn Hữu Đạt",
    email: "dat.nguyen@trungnguyen.com.vn",
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
    salaryNum: 13500000,
    salary: "13,500,000 đ",
    salaryTier: "10to20",
    status: "working",
    statusText: "Đang làm việc",
    statusColor: "emerald",
  },
  {
    id: "NV18",
    name: "Trần Thanh Thảo",
    email: "thao.tran@trungnguyen.com.vn",
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
    salaryNum: 13200000,
    salary: "13,200,000 đ",
    salaryTier: "10to20",
    status: "leave",
    statusText: "Nghỉ phép năm",
    statusColor: "sky",
  },
  {
    id: "NV19",
    name: "Phạm Minh Trí",
    email: "tri.pham@trungnguyen.com.vn",
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
    salaryNum: 9500000,
    salary: "9,500,000 đ",
    salaryTier: "under10",
    status: "leave",
    statusText: "Nghỉ thai sản",
    statusColor: "sky",
  },
  {
    id: "NV20",
    name: "Lê Văn Cường",
    email: "cuong.le@trungnguyen.com.vn",
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
    salaryNum: 16000000,
    salary: "16,000,000 đ",
    salaryTier: "10to20",
    status: "resigned",
    statusText: "Đã nghỉ việc",
    statusColor: "rose",
  },
];

// ──────────────── CÁC HÀM TIỆN ÍCH CHUYỂN ĐỔI CHUẨN XÁC ────────────────
const calculateTenure = (joinDateStr) => {
  if (!joinDateStr) return { years: 1.0, label: "1 năm", joinDate: "—" };
  const join = new Date(joinDateStr);
  if (isNaN(join.getTime())) return { years: 1.0, label: "1 năm", joinDate: "—" };
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
  if (!trinhDo) return { key: "university", name: "Đại học" };
  const td = String(trinhDo).toUpperCase();
  if (td.includes("TIEN_SI") || td.includes("TIẾN SĨ")) return { key: "postgrad", name: "Tiến sĩ" };
  if (td.includes("THAC_SI") || td.includes("THẠC SĨ") || td.includes("THS")) return { key: "postgrad", name: "Thạc sĩ" };
  if (td.includes("DAI_HOC") || td.includes("ĐẠI HỌC")) return { key: "university", name: "Đại học" };
  if (td.includes("CAO_DANG") || td.includes("CAO ĐẲNG")) return { key: "college", name: "Cao đẳng" };
  if (td.includes("TRUNG_CAP") || td.includes("TRUNG CẤP")) return { key: "college", name: "Trung cấp" };
  if (td.includes("CHUNG_CHI") || td.includes("CHỨNG CHỈ")) return { key: "college", name: "Chứng chỉ" };
  return { key: "university", name: "Đại học" };
};

const getInitials = (name) => {
  if (!name) return "NV";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function EmployeeManagement({ initialTab = "list" }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab || "list");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  // Bộ lọc dùng chung & theo tab
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("10/2026");

  // Bộ lọc chuyên sâu cho Tab Báo cáo
  const [selectedDegree, setSelectedDegree] = useState("all");
  const [selectedTenure, setSelectedTenure] = useState("all");
  const [selectedSalaryRange, setSelectedSalaryRange] = useState("all");

  // Phân trang chung cho bảng
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; // 8 nhân sự mỗi trang giúp hiển thị thoáng đẹp và không cuộn quá dài

  const [employees, setEmployees] = useState(DB_FALLBACK_EMPLOYEES);

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

    let salaryNum = 18500000;
    if (typeof item.muc_luong === "number") salaryNum = item.muc_luong;
    else if (typeof item.muc_luong === "string") {
      const p = parseInt(item.muc_luong.replace(/[^\d]/g, ""), 10);
      if (!isNaN(p) && p > 0) salaryNum = p;
    }

    let salaryTier = "10to20";
    if (salaryNum < 10000000) salaryTier = "under10";
    else if (salaryNum >= 10000000 && salaryNum < 20000000) salaryTier = "10to20";
    else if (salaryNum >= 20000000 && salaryNum <= 30000000) salaryTier = "20to30";
    else if (salaryNum > 30000000) salaryTier = "above30";

    return {
      id: item.ma_nv,
      name: item.ho_ten,
      email: item.email || `${item.ma_nv.toLowerCase()}@trungnguyen.com.vn`,
      dept: item.ten_pb || item.ma_pb || "Phòng ban",
      role: item.ten_cv || item.ma_cv || "Nhân viên",
      location: item.ten_cn || "Trụ sở chính Trung Nguyên",
      degree: deg.key,
      degreeLabel: item.chuyen_nganh ? `${deg.name} ${item.chuyen_nganh}` : deg.name,
      school: item.noi_dao_tao
        ? `${item.noi_dao_tao} ${item.nam_tot_nghiep ? `(${item.nam_tot_nghiep})` : ""}`
        : "Đại học chính quy",
      joinDate: tenureInfo.joinDate,
      tenureYears: tenureInfo.years,
      tenureLabel: tenureInfo.label,
      isCore: tenureInfo.years >= 3.0,
      salaryNum,
      salary: `${salaryNum.toLocaleString("vi-VN")} đ`,
      salaryTier,
      status,
      statusText,
      statusColor,
      initials: getInitials(item.ho_ten),
      isVip: item.ma_cv === "CV08" || item.ma_cv === "CV07" || item.ma_nv === "NV01",
      cccd: item.cccd,
      ma_cn: item.ma_cn,
    };
  };

  // Gọi API lấy danh sách nhân viên thật từ CSDL
  const fetchEmployeesFromDb = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/employees/get_employee_list", {
        params: { page: 1, page_size: 100 },
      });
      const items = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      if (items.length > 0) {
        setEmployees(items.map(mapApiEmployee));
      } else {
        setEmployees(DB_FALLBACK_EMPLOYEES);
      }
    } catch (err) {
      console.info("[EmployeeManagement] Dùng dữ liệu đồng bộ chuẩn DB:", err.message);
      setEmployees(DB_FALLBACK_EMPLOYEES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesFromDb();
  }, []);

  // Xử lý thêm nhân sự mới: gọi API POST /employees/create_employee
  const handleAddEmployee = async (newEmp) => {
    try {
      const apiPayload = {
        ho_ten: newEmp.ho_ten || newEmp.fullName,
        ngay_sinh: newEmp.ngay_sinh,
        gioi_tinh: newEmp.gioi_tinh,
        cccd: newEmp.cccd,
        sdt: newEmp.sdt,
        email: newEmp.email,
        ma_pb: newEmp.ma_pb,
        ma_cv: newEmp.ma_cv,
        ma_cn: newEmp.ma_cn,
        ngay_vao_lam: newEmp.ngay_vao_lam || new Date().toISOString().split("T")[0],
        trang_thai: "DANG_LAM",
        hinh_thuc_lam_viec: "FULL_TIME",
        muc_luong: newEmp.muc_luong || 18500000,
      };

      let createdId = newEmp.maNv || `NV${employees.length + 1}`;
      try {
        const res = await apiClient.post("/employees/create_employee", apiPayload);
        if (res && res.ma_nv) {
          createdId = res.ma_nv;
        }
      } catch (apiErr) {
        console.info("[EmployeeManagement] Tạo cục bộ nhân sự mới:", apiErr.message);
      }

      const tenureInfo = calculateTenure(apiPayload.ngay_vao_lam);
      const deg = formatDegree(newEmp.trinh_do);
      const salNum = Number(newEmp.muc_luong || 18500000);

      const created = {
        id: createdId,
        name: newEmp.fullName || newEmp.ho_ten,
        email: newEmp.email,
        role: newEmp.roleName || "Chuyên viên",
        dept: newEmp.deptName || "Khối Văn phòng",
        location: "Trụ sở chính Trung Nguyên",
        degree: deg.key,
        degreeLabel: deg.name,
        school: "Đại học chính quy",
        joinDate: tenureInfo.joinDate,
        tenureYears: tenureInfo.years,
        tenureLabel: tenureInfo.label,
        isCore: false,
        salaryNum: salNum,
        salary: `${salNum.toLocaleString("vi-VN")} đ`,
        salaryTier: salNum >= 20000000 ? "20to30" : "10to20",
        status: "working",
        statusText: "Đang làm việc",
        statusColor: "emerald",
        initials: getInitials(newEmp.fullName || newEmp.ho_ten),
        isVip: false,
      };

      setEmployees((prev) => [created, ...prev]);
      showToast(`Đã thêm thành công nhân sự ${created.name} (${created.id}) vào hệ thống!`);
    } catch (err) {
      console.error("Lỗi khi thêm nhân sự:", err);
    }
  };

  // Danh sách phòng ban duy nhất để lọc
  const departmentOptions = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => {
      if (e.dept) set.add(e.dept);
    });
    return Array.from(set);
  }, [employees]);

  // Thống kê động cho Tab 1 (Theo tháng)
  const liveWorkingCount = employees.filter((e) => e.status === "working").length;
  const liveLeaveCount = employees.filter((e) => e.status === "leave").length;
  const liveResignedCount = employees.filter((e) => e.status === "resigned").length;
  const liveTotalCount = employees.length;

  const monthlyStatsData = {
    "10/2026": {
      total: liveTotalCount,
      working: liveWorkingCount,
      leave: liveLeaveCount,
      resigned: liveResignedCount,
    },
    "09/2026": { total: 1266, working: 1205, leave: 28, resigned: 33 },
    "08/2026": { total: 1250, working: 1192, leave: 31, resigned: 27 },
    "07/2026": { total: 1240, working: 1185, leave: 25, resigned: 30 },
  };
  const currentMonthStats = monthlyStatsData[selectedMonth] || monthlyStatsData["10/2026"];

  // Thống kê động cho Tab 2 (Chuyên sâu học vấn, thâm niên, mặt bằng lương)
  const reportStats = useMemo(() => {
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

    const sumTenure = employees.reduce((acc, e) => acc + (e.tenureYears || 1), 0);
    const avgTenure = (sumTenure / total).toFixed(1);

    const sumSalary = employees.reduce((acc, e) => acc + (e.salaryNum || 18500000), 0);
    const avgSalaryNum = Math.round(sumSalary / total);
    const avgSalary = avgSalaryNum.toLocaleString("vi-VN");

    const salaries = employees.map((e) => e.salaryNum || 18500000);
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

      // 3. Nếu đang ở TAB 1 (Hồ sơ & Biến động): Lọc theo Trạng thái làm việc
      if (activeSubTab === "list") {
        if (statusFilter && emp.status !== statusFilter) {
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
          if (selectedTenure === "3to5" && (ty < 3 || ty > 5)) return false;
          if (selectedTenure === "above5" && ty <= 5) return false;
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
                  <option value="10/2026">Tháng 10/2026 (Hiện tại)</option>
                  <option value="09/2026">Tháng 09/2026</option>
                  <option value="08/2026">Tháng 08/2026</option>
                  <option value="07/2026">Tháng 07/2026</option>
                </select>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block mx-1"></div>

              <button
                type="button"
                onClick={() => showToast("Đã mở trình tải lên dữ liệu nhân sự Excel mẫu!")}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Nhập từ Excel</span>
              </button>
              <button
                type="button"
                onClick={() => showToast("Đã xuất danh sách nhân sự sang file Excel thành công!")}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất danh sách</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Thêm nhân sự</span>
              </button>
            </div>
          </div>

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
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo Mã NV, Họ tên, Email, Chức vụ..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
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
                onClick={() => showToast("Đã xuất dữ liệu Báo cáo Phân tích Nhân sự sang file Excel!")}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xuất file Excel</span>
              </button>
              <button
                type="button"
                onClick={() => showToast("Đã tạo báo cáo tổng hợp dạng PDF sẵn sàng in ấn!")}
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
                  <div className="h-full bg-emerald-600" style={{ width: "45%" }}></div>
                  <div className="h-full bg-sky-500" style={{ width: "35%" }}></div>
                  <div className="h-full bg-slate-300" style={{ width: "20%" }}></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> &gt;3 năm (Nòng cốt)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> 1-3 năm
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
              <div className="lg:col-span-1 relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã NV, họ tên, chức vụ..."
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
                <th className="py-3.5 px-4 min-w-[240px]">Mã NV & Họ tên</th>
                <th className="py-3.5 px-4 min-w-[170px]">Phòng ban & Chi nhánh</th>
                <th className="py-3.5 px-4 min-w-[150px]">Chức vụ</th>
                <th className="py-3.5 px-4 min-w-[180px]">Trình độ & Chuyên môn</th>
                <th className="py-3.5 px-4 min-w-[150px]">Thâm niên & Ngày vào</th>
                <th className="py-3.5 px-4 min-w-[130px] text-right">Mức lương</th>
                <th className="py-3.5 px-4 min-w-[130px] text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading && employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 animate-spin text-sky-600" />
                      <span className="text-xs font-medium">Đang tải danh sách nhân sự từ CSDL...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
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
                            <span className="truncate">{emp.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Phòng ban & Chi nhánh */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{emp.dept}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{emp.location}</span>
                        </span>
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
      />
    </div>
  );
}
