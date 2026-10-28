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
 */

import apiClient from "./apiClient";

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
