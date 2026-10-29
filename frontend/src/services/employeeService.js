/**
 * employeeService.js
 *
 * Tầng giao tiếp dữ liệu cho module Hồ sơ Nhân viên (Employee Profile)
 * Nguyên tắc: chỉ hiển thị dữ liệu thật từ CSDL; trường nào trống -> "Chưa cập nhật".
 */

import apiClient from "./apiClient";

const NOT_UPDATED = "Chưa cập nhật";

/**
 * Tính thâm niên từ ngày vào làm (định dạng YYYY-MM-DD hoặc Date)
 */
export function calculateSeniority(startDateStr) {
  if (!startDateStr) return NOT_UPDATED;
  const start = new Date(startDateStr);
  const now = new Date();

  if (isNaN(start.getTime())) return NOT_UPDATED;

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
  if (!dateStr) return NOT_UPDATED;
  // Ngày dạng YYYY-MM-DD: tách chuỗi để tránh lệch múi giờ khi new Date()
  const iso = String(dateStr).split("T")[0];
  const parts = iso.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Tính số ngày từ lần đổi mật khẩu / cập nhật tài khoản gần nhất
 */
export function formatPasswordLastChanged(dateStr) {
  if (!dateStr) return NOT_UPDATED;
  const updated = new Date(dateStr);
  const now = new Date();
  if (isNaN(updated.getTime())) return NOT_UPDATED;

  const diffTime = Math.abs(now - updated);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return `${diffDays} ngày trước`;
}

/** YYYY-MM-DD theo giờ máy người dùng */
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const toIsoDate = (val) => (val ? String(val).split("T")[0] : "");

/**
 * Map dữ liệu trả về từ Backend (snake_case chuẩn CSDL) sang format UI Frontend
 */
export function mapBackendToProfile(data) {
  if (!data) return null;

  const contractMap = {
    KHONG_XAC_DINH: "Không xác định thời hạn",
    XAC_DINH_1_NAM: "Xác định thời hạn 1 năm",
    XAC_DINH_3_NAM: "Xác định thời hạn 3 năm",
    THU_VIEC: "Thử việc",
    THOI_VU: "Thời vụ",
  };

  const statusMap = {
    DANG_LAM: "Đang làm việc",
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

  // Phân biệt Full-time / Part-time chuẩn hóa theo Database
  const isPartTime = data.hinh_thuc_lam_viec === "PART_TIME";
  const workingType = isPartTime ? "PART_TIME" : "FULL_TIME";
  const workingTypeLabel = isPartTime ? "Bán thời gian (Part-time)" : "Toàn thời gian (Full-time)";

  // Ngày nghỉ việc có thể ở TƯƠNG LAI (đã lên lịch thôi việc, vẫn đang làm)
  const terminationDateRaw = toIsoDate(data.ngay_nghi_viec);
  const isTerminationScheduled = Boolean(terminationDateRaw && terminationDateRaw > todayIso());

  const startDateRaw = toIsoDate(data.ngay_vao_lam);

  return {
    id: data.ma_nv || "",
    fullName: data.ho_ten || NOT_UPDATED,
    birthDate: data.ngay_sinh ? formatDate(data.ngay_sinh) : NOT_UPDATED,
    birthDateRaw: toIsoDate(data.ngay_sinh),
    gender: genderMap[data.gioi_tinh] || data.gioi_tinh || NOT_UPDATED,
    genderRaw: data.gioi_tinh || "",
    jobTitle: data.ten_cv || NOT_UPDATED,
    department: data.ten_pb || NOT_UPDATED,
    startDate: formatDate(data.ngay_vao_lam),
    startDateRaw,
    startYear: startDateRaw ? Number(startDateRaw.slice(0, 4)) : null,
    status: statusMap[data.trang_thai] || data.trang_thai || NOT_UPDATED,
    statusRaw: data.trang_thai || "",
    workingType,
    workingTypeLabel,
    seniority: calculateSeniority(data.ngay_vao_lam),
    phone: data.sdt || NOT_UPDATED,
    phoneRaw: data.sdt || "",
    email: data.email || NOT_UPDATED,
    emailRaw: data.email || "",
    address: data.dia_chi || "",
    bankAccount: data.so_tai_khoan || "",
    bankName: data.ngan_hang || "",
    taxCode: data.ma_so_thue || "",
    socialInsuranceNo: data.so_bhxh || "",
    dependents: data.so_nguoi_pt ?? null,
    managerId: data.ma_nql || "",
    managerName: data.ten_nql || "",
    contractCode: data.ma_hd || NOT_UPDATED,
    contractTypeRaw: data.loai_hd || "",
    contractType: contractMap[data.loai_hd] || NOT_UPDATED,
    contractStatus: contractStatusMap[data.trang_thai_hd] || NOT_UPDATED,
    lastPasswordChange: formatPasswordLastChanged(data.ngay_cap_nhat_tk),
    terminationDateRaw,
    terminationDate: terminationDateRaw ? formatDate(terminationDateRaw) : "",
    terminationReason: data.ly_do_nghi_viec || "",
    isTerminationScheduled,
  };
}

/**
 * Lấy thông tin hồ sơ nhân viên
 * @param {string} maNv - Mã nhân viên (ví dụ: 'NV01', 'NV10'...)
 */
export async function getEmployeeProfile(maNv) {
  try {
    const data = await apiClient.get(`/employees/profile/${maNv}`);
    return mapBackendToProfile(data);
  } catch (error) {
    console.error(`[employeeService] Không tải được hồ sơ nhân viên ${maNv}:`, error.message);
    return null;
  }
}

/**
 * [Quản lý] Ghi trực tiếp thông tin liên hệ vào hồ sơ (cần quyền EMPLOYEE_UPDATE).
 * Nhân viên tự sửa hồ sơ phải dùng requestProfileUpdate (chờ Quản lý duyệt).
 */
export async function updateEmployeeContact(maNv, contactData) {
  const data = await apiClient.put(`/employees/profile/${maNv}`, contactData);
  return mapBackendToProfile(data);
}

/* ═══════════════════════════════════════════════════════════════
   QUY TRÌNH NHÂN VIÊN GỬI YÊU CẦU SỬA HỒ SƠ -> QUẢN LÝ DUYỆT
   ═══════════════════════════════════════════════════════════════ */

/**
 * Gửi yêu cầu chỉnh sửa hồ sơ (gửi lại sẽ thay thế yêu cầu đang chờ duyệt)
 * POST /employees/profile/{ma_nv}/request-update  body { thong_tin_moi, ly_do }
 * Các trường được phép: ngay_sinh, gioi_tinh, sdt, email, dia_chi, so_tai_khoan, ngan_hang, ma_so_thue, so_bhxh
 */
export async function requestProfileUpdate(maNv, { thong_tin_moi, ly_do }) {
  return apiClient.post(`/employees/profile/${maNv}/request-update`, { thong_tin_moi, ly_do });
}

/**
 * Yêu cầu chỉnh sửa hồ sơ đang chờ duyệt (null nếu không có)
 * GET /employees/profile/{ma_nv}/pending-request
 */
export async function getPendingProfileRequest(maNv) {
  return apiClient.get(`/employees/profile/${maNv}/pending-request`);
}

/**
 * Nhân viên tự hủy yêu cầu chỉnh sửa hồ sơ đang chờ duyệt
 * PUT /employees/profile-request/{ma_yc}/cancel
 */
export async function cancelProfileRequest(maYc) {
  return apiClient.put(`/employees/profile-request/${encodeURIComponent(maYc)}/cancel`, {});
}

/**
 * Đổi mật khẩu tài khoản đang đăng nhập (mã NV lấy từ token phía server)
 * POST /accounts/change-password  body { mat_khau_cu, mat_khau_moi }
 */
export async function changePassword({ mat_khau_cu, mat_khau_moi }) {
  return apiClient.post("/accounts/change-password", {
    mat_khau_cu,
    mat_khau_moi,
  });
}
