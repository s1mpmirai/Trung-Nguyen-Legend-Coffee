/**
 * adminService.js
 * 
 * Tầng giao tiếp dữ liệu cho Cổng Quản Trị Viên (System Admin Portal)
 * Tích hợp toàn bộ API Quản trị theo chuẩn api_link.txt:
 * - Dashboard Stats tổng quan
 * - Quản lý Tài khoản (ACCOUNT_MANAGE)
 * - Phân quyền RBAC & Thăng chức (PERMISSION_ASSIGN)
 * - Quản lý Cơ cấu phòng ban (DEPARTMENTS)
 * - Quản lý Chức vụ & Bậc lương (POSITIONS)
 * - Quản lý Hợp đồng lao động (CONTRACTS)
 * - Danh bạ nhân sự: tìm kiếm nâng cao, lọc, sắp xếp (EMPLOYEES)
 * - Phiên đăng nhập (/auth/me, đổi mật khẩu lần đầu, đăng nhập Cổng Điều hành)
 */

import apiClient from "./apiClient";

// ── 0. AUTH / PHIÊN ĐĂNG NHẬP ─────────────────────────────────────────
// Đăng nhập Cổng Điều hành (Admin / Quản lý / Trưởng nhóm / nhân sự được cấp quyền nghiệp vụ)
export async function loginManagePortal(ma_nv, mat_khau) {
  return apiClient.post("/auth/manager-login", { ma_nv, mat_khau });
}

// Nguồn sự thật về vai trò / quyền / họ tên của phiên hiện tại (thay cho dữ liệu localStorage)
export async function getMe() {
  return apiClient.get("/auth/me");
}

// Đổi mật khẩu tạm ở lần đăng nhập đầu: bắt buộc gửi token trả về từ bước đăng nhập
export async function firstTimeChangePassword(mat_khau_moi, token) {
  return apiClient.post(
    "/auth/first-time-change-password",
    { mat_khau_moi },
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
}

// ── 1. ADMIN DASHBOARD STATS ──────────────────────────────────────────
export async function getAdminStats() {
  return apiClient.get("/admin/dashboard/stats");
}

// ── 2. ACCOUNTS (QUẢN LÝ TÀI KHOẢN) ───────────────────────────────────
export async function getAccountsList(params = {}) {
  return apiClient.get("/accounts", { params });
}

export async function createAccount(accountData) {
  return apiClient.post("/accounts/create_account", accountData);
}

export async function updateAccount(ma_nv, accountData) {
  return apiClient.put(`/accounts/${ma_nv}`, accountData);
}

export async function updateAccountStatus(ma_nv, status) {
  return apiClient.put(`/accounts/${ma_nv}/status`, { trang_thai: status });
}
export async function getEmployeesWithoutAccount() {
  return apiClient.get("/accounts/without_account");
}

export async function getEmployeesWithoutAccountDetails() {
  return apiClient.get("/accounts/without_account_details");
}

// ── 3. PERMISSIONS & RBAC ─────────────────────────────────────────────
export async function getRoles() {
  return apiClient.get("/permissions/roles");
}

export async function getAllPermissions() {
  return apiClient.get("/permissions/all-permissions");
}

export async function getRoleMatrix() {
  return apiClient.get("/permissions/matrix");
}

export async function getEmployeePermissions(ma_nv) {
  return apiClient.get(`/permissions/employee/${ma_nv}`);
}

export async function assignRoleToEmployee(ma_nv, roleData) {
  return apiClient.put(`/permissions/employee/${ma_nv}/role`, roleData);
}

export async function updateCustomPermissions(ma_nv, permissionData) {
  return apiClient.put(`/permissions/employee/${ma_nv}/custom-permissions`, permissionData);
}

// [Chỉ ADMIN] Thay toàn bộ quyền mặc định của một vai trò (không áp dụng cho vai trò ADMIN).
// Trả về ma trận mới cùng cấu trúc GET /permissions/matrix.
export async function updateRolePermissions(ma_vai_tro, ma_quyen = []) {
  return apiClient.put(`/permissions/roles/${ma_vai_tro}`, { ma_quyen });
}

// ── 4. DEPARTMENTS (PHÒNG BAN) ────────────────────────────────────────
export async function getDepartments(params = {}) {
  return apiClient.get("/departments", { params });
}

export async function getDepartmentDetail(ma_pb) {
  return apiClient.get(`/departments/${ma_pb}`);
}

export async function createDepartment(departmentData) {
  return apiClient.post("/departments", departmentData);
}

export async function updateDepartment(ma_pb, departmentData) {
  return apiClient.put(`/departments/${ma_pb}`, departmentData);
}

export async function deleteDepartment(ma_pb) {
  return apiClient.delete(`/departments/${ma_pb}`);
}

// ── 5. POSITIONS & SALARY SCALES (CHỨC VỤ & BẬC LƯƠNG) ───────────────
export async function getPositions(params = {}) {
  return apiClient.get("/positions", { params });
}

export async function getPositionDetail(ma_cv) {
  return apiClient.get(`/positions/${ma_cv}`);
}

export async function createPosition(positionData) {
  return apiClient.post("/positions", positionData);
}

export async function updatePosition(ma_cv, positionData) {
  return apiClient.put(`/positions/${ma_cv}`, positionData);
}

export async function deletePosition(ma_cv) {
  return apiClient.delete(`/positions/${ma_cv}`);
}

export async function getSalaryScales(ma_cv) {
  return apiClient.get(`/positions/${ma_cv}/salary-scales`);
}

export async function createSalaryScale(ma_cv, scaleData) {
  return apiClient.post(`/positions/${ma_cv}/salary-scales`, scaleData);
}

// ── 6. CONTRACTS (HỢP ĐỒNG LAO ĐỘNG) ──────────────────────────────────
export async function getContracts(params = {}) {
  return apiClient.get("/contracts", { params });
}

export async function getContractDetail(ma_hd) {
  return apiClient.get(`/contracts/${ma_hd}`);
}

export async function createContract(contractData) {
  return apiClient.post("/contracts", contractData);
}

export async function updateContract(ma_hd, contractData) {
  return apiClient.put(`/contracts/${ma_hd}`, contractData);
}

export async function liquidateContract(ma_hd, data = {}) {
  // Backend nhận ngày thanh lý qua query string (?ngay_ket_thuc=YYYY-MM-DD), không đọc body
  // (API không có trường lý do thanh lý).
  return apiClient.put(`/contracts/${ma_hd}/liquidate`, null, {
    params: { ngay_ket_thuc: data.ngay_ket_thuc || undefined },
  });
}

export async function restoreContract(ma_hd) {
  return apiClient.put(`/contracts/${ma_hd}/restore`, {});
}

export async function deleteContract(ma_hd) {
  return apiClient.delete(`/contracts/${ma_hd}`);
}

// ── 7. EMPLOYEES (DANH BẠ NHÂN SỰ – TÌM KIẾM NÂNG CAO) ──────────────
export async function getEmployeesList(params = {}) {
  return apiClient.get("/employees/get_employee_list", { params });
}
