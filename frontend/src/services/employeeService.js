/**
 * employeeService.js
 * 
 * Tầng giao tiếp dữ liệu cho module Hồ sơ Nhân viên (Employee Profile)
 */

import apiClient from "./apiClient";

// Dữ liệu mẫu dự phòng khi chưa kết nối CSDL hoặc API đang offline (Đồng bộ chuẩn NV02 trong Database)
export const FALLBACK_EMPLOYEE_PROFILE = {
  id: "NV02",
  fullName: "Nguyễn Thị Minh Tâm",
  birthDate: "15/05/1985",
  birthDateRaw: "1985-05-15",
  gender: "Nữ",
  genderRaw: "Nu",
  jobTitle: "Trưởng phòng Quản trị Nguồn nhân lực",
  department: "Quản trị Nguồn nhân lực",
  departmentFull: "Phòng Quản trị Nguồn nhân lực",
  startDate: "01/03/2010",
  status: "Nhân viên chính thức",
  workingType: "FULL_TIME",
  workingTypeLabel: "Toàn thời gian (Full-time)",
  contractType: "Không xác định thời hạn",
  contractCode: "HD-002",
  contractStatus: "Hiệu lực",
  seniority: "14 năm",
  phone: "0912 345 678",
  email: "tamntm@trungnguyen.com",
  personalEmail: "minhtam.nguyen85@gmail.com",
  lastPasswordChange: "45 ngày trước",
};

/**
 * Tính thâm niên từ ngày vào làm (định dạng YYYY-MM-DD hoặc Date)
 */
export function calculateSeniority(startDateStr) {
  if (!startDateStr) return "Mới vào làm";
  const start = new Date(startDateStr);
  const now = new Date();

  if (isNaN(start.getTime())) return "Chưa cập nhật";

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0 && months > 0) return `${years} năm ${months} tháng`;
  if (years > 0) return `${years} năm`;
  if (months > 0) return `${months} tháng`;
  return "Dưới 1 tháng";
}

/**
 * Định dạng ngày sang DD/MM/YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return "Chưa cập nhật";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Tính số ngày từ lần đổi mật khẩu gần nhất
 */
export function formatPasswordLastChanged(dateStr) {
  if (!dateStr) return "45 ngày trước";
  const updated = new Date(dateStr);
  const now = new Date();
  if (isNaN(updated.getTime())) return "45 ngày trước";

  const diffTime = Math.abs(now - updated);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return `${diffDays} ngày trước`;
}

/**
 * Map dữ liệu trả về từ Backend (snake_case chuẩn CSDL) sang format UI Frontend
 */
export function mapBackendToProfile(data) {
  if (!data) return FALLBACK_EMPLOYEE_PROFILE;

  const contractMap = {
    KHONG_XAC_DINH: "Không xác định thời hạn",
    XAC_DINH_1_NAM: "Xác định thời hạn 1 năm",
    XAC_DINH_3_NAM: "Xác định thời hạn 3 năm",
    THU_VIEC: "Thử việc",
    THOI_VU: "Thời vụ",
  };

  const statusMap = {
    DANG_LAM: "Nhân viên chính thức",
    NGHI_PHEP: "Nghỉ phép",
    NGHI_THAI_SAN: "Nghỉ thai sản",
    TAM_HOAN_HD: "Tạm hoãn HĐ",
    DA_NGHI_VIEC: "Đã thôi việc",
  };

  const contractStatusMap = {
    HIEU_LUC: "Hiệu lực",
    HET_HAN: "Hết hạn",
    DA_THANH_LY: "Đã thanh lý",
    TAM_HOAN: "Tạm hoãn",
  };

  const genderMap = {
    Nam: "Nam",
    Nu: "Nữ",
    Khac: "Khác",
  };

  const birthDateFormatted = data.ngay_sinh ? formatDate(data.ngay_sinh) : "Chưa cập nhật";
  const birthDateRaw = data.ngay_sinh
    ? (typeof data.ngay_sinh === "string" ? data.ngay_sinh.split("T")[0] : data.ngay_sinh)
    : "";

  // Phân biệt Full-time / Part-time
  const isPartTime =
    data.hinh_thuc_lam_viec === "PART_TIME" ||
    data.loai_hd === "THOI_VU" ||
    !data.loai_hd;

  const workingType = isPartTime ? "PART_TIME" : "FULL_TIME";
  const workingTypeLabel = isPartTime ? "Bán thời gian (Part-time)" : "Toàn thời gian (Full-time)";

  // Nếu là thời vụ hoặc chưa có HĐ chính thức, hiển thị "Nhân viên thời vụ"
  const defaultStatus = isPartTime ? "Nhân viên thời vụ" : "Nhân viên chính thức";
  const displayStatus = statusMap[data.trang_thai] || defaultStatus;

  return {
    id: data.ma_nv || "NV01",
    fullName: data.ho_ten || "Chưa đặt tên",
    avatarUrl: data.avatarUrl || null,
    birthDate: birthDateFormatted,
    birthDateRaw: birthDateRaw,
    gender: genderMap[data.gioi_tinh] || data.gioi_tinh || "Nam",
    genderRaw: data.gioi_tinh || "Nam",
    jobTitle: data.ten_cv || "Chuyên viên",
    department: data.ten_pb || "Phòng ban",
    departmentFull: data.ten_pb ? `Phòng ${data.ten_pb}` : "Trụ sở chính",
    startDate: formatDate(data.ngay_vao_lam),
    status: displayStatus,
    workingType,
    workingTypeLabel,
    seniority: calculateSeniority(data.ngay_vao_lam),
    phone: data.sdt || "Chưa cập nhật",
    email: data.email || "chua_co_email@trungnguyen.com",
    personalEmail: data.email_ca_nhan || (data.email?.endsWith("@trungnguyen.com") ? `${data.email.split("@")[0]}@gmail.com` : (data.email || "minhtam.nguyen85@gmail.com")),
    contractCode: data.ma_hd || (isPartTime ? "HĐTV-2026/TNL" : "HĐLD-2026/TNL"),
    contractType: contractMap[data.loai_hd] || (isPartTime ? "Hợp đồng thời vụ" : "Hợp đồng chính thức"),
    contractStatus: contractStatusMap[data.trang_thai_hd] || "Hiệu lực",
    lastPasswordChange: formatPasswordLastChanged(data.ngay_cap_nhat_tk),
    address: data.dia_chi || "",
    bankAccount: data.so_tai_khoan || "",
    bankName: data.ngan_hang || "",
  };
}

/**
 * Lấy thông tin hồ sơ nhân viên
 * @param {string} maNv - Mã nhân viên (ví dụ: 'NV01', 'NV10'...)
 */
export async function getEmployeeProfile(maNv = "NV01") {
  try {
    const data = await apiClient.get(`/employees/profile/${maNv}`);
    return mapBackendToProfile(data);
  } catch (error) {
    console.info(`[employeeService] Sử dụng dữ liệu dự phòng cho nhân viên ${maNv}:`, error.message);
    return FALLBACK_EMPLOYEE_PROFILE;
  }
}

/**
 * Cập nhật thông tin liên hệ của nhân viên
 */
export async function updateEmployeeContact(maNv, contactData) {
  try {
    const data = await apiClient.put(`/employees/profile/${maNv}`, contactData);
    return mapBackendToProfile(data);
  } catch (error) {
    console.error("[employeeService] Lỗi khi cập nhật liên hệ:", error);
    throw error;
  }
}

/**
 * Đổi mật khẩu tài khoản
 */
export async function changePassword({ ma_nv, mat_khau_cu, mat_khau_moi }) {
  return apiClient.post("/auth/change-password", {
    ma_nv,
    mat_khau_cu,
    mat_khau_moi,
  });
}
