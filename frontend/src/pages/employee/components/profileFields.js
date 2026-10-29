import { formatDate } from "../../../services/employeeService";

/**
 * Các trường hồ sơ nhân viên được phép yêu cầu chỉnh sửa (đồng bộ với backend
 * employee_repository.create_profile_update_request -> allowed_fields).
 */
export const PROFILE_FIELD_LABELS = {
  ngay_sinh: "Ngày sinh",
  gioi_tinh: "Giới tính",
  sdt: "Số điện thoại",
  email: "Email",
  dia_chi: "Địa chỉ",
  so_tai_khoan: "Số tài khoản",
  ngan_hang: "Ngân hàng",
  ma_so_thue: "Mã số thuế",
  so_bhxh: "Số sổ BHXH",
};

const GENDER_LABELS = { Nam: "Nam", Nu: "Nữ", Khac: "Khác" };

/** Hiển thị giá trị 1 trường hồ sơ theo định dạng thân thiện */
export function formatProfileValue(key, value) {
  if (value == null || String(value).trim() === "") return "Chưa cập nhật";
  if (key === "ngay_sinh") return formatDate(value);
  if (key === "gioi_tinh") return GENDER_LABELS[value] || String(value);
  return String(value);
}

/** Giá trị hiện tại trong hồ sơ (đã map ở employeeService) theo khóa backend */
export function currentProfileValues(employee) {
  return {
    ngay_sinh: employee?.birthDateRaw || "",
    gioi_tinh: employee?.genderRaw || "",
    sdt: employee?.phoneRaw || "",
    email: employee?.emailRaw || "",
    dia_chi: employee?.address || "",
    so_tai_khoan: employee?.bankAccount || "",
    ngan_hang: employee?.bankName || "",
    ma_so_thue: employee?.taxCode || "",
    so_bhxh: employee?.socialInsuranceNo || "",
  };
}
