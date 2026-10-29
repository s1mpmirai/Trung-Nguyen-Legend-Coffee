/**
 * allServices.js
 *
 * File tổng hợp và xuất toàn bộ các Service API trong hệ thống:
 * - employeeService   : Hồ sơ nhân viên, yêu cầu cập nhật hồ sơ, đổi mật khẩu
 * - payrollService    : Tính toán bảng lương, phiếu thu nhập, chi tiết bảng kê, in PDF
 * - attendanceService : Chấm công trên web, lịch sử vào/ra, thống kê ngày công tháng
 * - leaveService      : Đơn xin nghỉ phép, duyệt đơn từ
 * - managerService    : Số liệu tổng hợp cho Dashboard Cổng Quản lý
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
