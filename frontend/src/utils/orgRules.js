/**
 * orgRules.js – Quy tắc cơ cấu tổ chức khi lập hồ sơ nhân sự mới.
 * Giữ khớp với backend/app/core/org_rules.py (máy chủ kiểm tra lại khi lưu).
 */

export const COMPANY_EMAIL_DOMAIN = "trungnguyen.com.vn";
// Phần trước @: chữ thường không dấu, số; ngăn cách bởi một dấu chấm, gạch dưới hoặc gạch ngang
const EMAIL_LOCAL_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const EMAIL_LOCAL_MAX_LENGTH = 64;

export const BOARD_DEPARTMENT = "PB01"; // Ban Giám đốc
export const DIRECTOR_POSITION = "CV07"; // Giám đốc
export const HEAD_POSITION = "CV05"; // Trưởng phòng
export const STAFF_POSITION = "CV01"; // Nhân viên

/** Chức vụ được phép chọn theo phòng ban. */
export const allowedPositions = (maPb) =>
  String(maPb || "").toUpperCase() === BOARD_DEPARTMENT ? [DIRECTOR_POSITION] : [HEAD_POSITION, STAFF_POSITION];

/** Chức vụ mặc định khi chọn phòng ban: Giám đốc cho Ban Giám đốc, Nhân viên cho phòng ban khác. */
export const defaultPosition = (maPb) =>
  String(maPb || "").toUpperCase() === BOARD_DEPARTMENT ? DIRECTOR_POSITION : STAFF_POSITION;

/**
 * Chuẩn hóa phần người dùng gõ: chữ thường, bỏ khoảng trắng, bỏ phần từ dấu @ trở đi
 * (dán cả địa chỉ "ten@trungnguyen.com.vn" vẫn chỉ giữ "ten").
 */
export const cleanEmailLocalPart = (value) => String(value || "").toLowerCase().replace(/\s+/g, "").split("@")[0];

/** Thông báo lỗi định dạng của phần trước @, hoặc "" nếu hợp lệ. */
export const emailLocalPartError = (local) => {
  if (!local) return "Vui lòng nhập email doanh nghiệp.";
  if (local.length > EMAIL_LOCAL_MAX_LENGTH || !EMAIL_LOCAL_PATTERN.test(local)) {
    return "Email không hợp lệ. Chỉ dùng chữ không dấu, số và dấu chấm, gạch dưới hoặc gạch ngang ở giữa.";
  }
  return "";
};

export const toCompanyEmail = (local) => `${local}@${COMPANY_EMAIL_DOMAIN}`;
