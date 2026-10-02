/**
 * allServices.js
 *
 * File tổng hợp và xuất toàn bộ các Service API trong hệ thống:
 * - employeeService   : Quản lý hồ sơ nhân viên, cập nhật liên hệ, đổi mật khẩu
 * - payrollService    : Tính toán bảng lương, phiếu thu nhập, chi tiết bảng kê, in PDF
 * - attendanceService : Chấm công GPS, lịch sử vào/ra, thống kê ngày công tháng
 * - leaveService      : Đơn xin nghỉ phép, duyệt đơn từ
 * - apiClient         : Cấu hình Axios/Fetch gọi API Backend chung
 *
 * Cách dùng gọn gàng:
 *   import { getEmployeeProfile, getPayrollMonth } from "../../services/allServices";
 */

export * from "./employeeService";
export * from "./payrollService";
export * from "./attendanceService";
export * from "./leaveService";
export * from "./managerService";
export { default as apiClient } from "./apiClient";
