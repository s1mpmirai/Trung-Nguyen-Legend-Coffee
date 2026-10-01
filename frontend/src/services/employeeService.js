/**
 * employeeService.js
 * 
 * Tầng giao tiếp dữ liệu cho module Hồ sơ Nhân viên (Employee Profile)
 */

import apiClient from "./apiClient";

// Dữ liệu mẫu dự phòng khi chưa kết nối CSDL hoặc API đang offline
export const FALLBACK_EMPLOYEE_PROFILE = {
  id: "NV-8824",
  fullName: "Nguyễn Thị Mai Linh",
  jobTitle: "Chuyên viên Truyền thông & Thương hiệu",
  department: "Tiếp thị & Truyền thông",
  departmentFull: "Phòng Tiếp thị & Truyền thông",
  startDate: "15/03/2021",
  status: "Nhân viên chính thức",
  seniority: "3 năm 5 tháng",
  phone: "0982 739 418",
  email: "linh.nguyen@trungnguyen.vn",
  contractType: "Không xác định thời hạn",
  contractStatus: "Hiệu lực",
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

  return {
    id: data.ma_nv || "NV01",
    fullName: data.ho_ten || "Chưa đặt tên",
    avatarUrl: data.avatarUrl || null,
    jobTitle: data.ten_cv || "Chuyên viên",
    department: data.ten_pb || "Phòng ban",
    departmentFull: data.ten_pb ? `Phòng ${data.ten_pb}` : "Trụ sở chính",
    startDate: formatDate(data.ngay_vao_lam),
    status: statusMap[data.trang_thai] || "Nhân viên chính thức",
    seniority: calculateSeniority(data.ngay_vao_lam),
    phone: data.sdt || "Chưa cập nhật",
    email: data.email || "chua_co_email@trungnguyen.com",
    contractType: contractMap[data.loai_hd] || "Hợp đồng chính thức",
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
