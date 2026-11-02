import React, { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import ManagerSidebar from "./components/ManagerSidebar";
import ManagerHeader from "./components/ManagerHeader";
import StatMetricCards from "./components/StatMetricCards";
import DepartmentStructureCard from "./components/DepartmentStructureCard";
import AttendanceTrendCard from "./components/AttendanceTrendCard";
import ExpiringContractsCard from "./components/ExpiringContractsCard";
import EducationChartCard from "./components/EducationChartCard";
import TenureStatsCard from "./components/TenureStatsCard";
import PayrollDepartmentCard from "./components/PayrollDepartmentCard";
import EmployeeManagement from "./EmployeeManagement";
import LeaveApprovals from "./LeaveApprovals";
import AttendanceManagement from "./AttendanceManagement";
import PayrollManagement from "./PayrollManagement";
import RolePermissions from "./RolePermissions";
import ContractManagement from "./ContractManagement";
import DepartmentsPanel from "../shared/DepartmentsPanel";
import PositionsPanel from "../shared/PositionsPanel";
import ProfileRequestsPanel from "./components/ProfileRequestsPanel";
import { getManagerDashboardStats } from "../../services/managerService";
import { getPendingPayrollApprovals } from "../../services/payrollService";
import { getManagerAccess } from "./managerUtils";

export default function ManagerDashboard({ userSession, onLogout, onOpenEmployeeLogin }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingProfileCount, setPendingProfileCount] = useState(0);
  // Số bảng lương Kế toán đã gửi, đang chờ người đăng nhập duyệt (chỉ người có quyền duyệt lương)
  const [pendingPayrollCount, setPendingPayrollCount] = useState(0);
  const access = getManagerAccess(userSession);
  const canApprovePayroll = access.can("PAYROLL_APPROVE");
  // Số liệu Tổng quan được xem theo quyền (khớp quyền của API backend tương ứng)
  const canViewPayroll = access.can("PAYROLL_MANAGE") || canApprovePayroll;
  const dashboardAccess = {
    employees: access.can("EMPLOYEE_VIEW"),
    attendance: access.can("ATTENDANCE_MANAGE") || canViewPayroll,
    leaves: access.can("LEAVE_APPROVE"),
    profileRequests: access.can("EMPLOYEE_UPDATE"),
    payroll: canViewPayroll,
    reports: access.can("REPORT_VIEW"),
  };
  const hasAnyDashboardData = Object.values(dashboardAccess).some(Boolean);

  const refreshPendingPayroll = useCallback(() => {
    if (!canApprovePayroll) return;
    getPendingPayrollApprovals()
      .then((res) => setPendingPayrollCount(Number(res?.tong_bang_luong) || 0))
      .catch(() => {});
  }, [canApprovePayroll]);

  useEffect(() => {
    refreshPendingPayroll();
  }, [activeTab, refreshPendingPayroll]);
  // Kỳ công cần mở khi chuyển từ Bảng lương sang Chấm công (vd: để chốt công tháng của bảng lương)
  const [attendancePeriod, setAttendancePeriod] = useState(null);

  // Chỉ chuyển sang mục mà tài khoản có quyền (nút / liên kết trong trang cũng đi qua hàm này)
  const navigateTab = (tab, options) => {
    if (!access.canOpen(tab)) return;
    setAttendancePeriod(tab === "attendance" ? options?.period || null : null);
    setActiveTab(tab);
  };
  // Mục đang mở nhưng không có quyền (vd: vừa bị thu hồi quyền) thì quay về Tổng quan
  const visibleTab = access.canOpen(activeTab) ? activeTab : "dashboard";

  useEffect(() => {
    if (visibleTab !== "dashboard") return undefined;
    let isMounted = true;
    const loadStats = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await getManagerDashboardStats({
          canViewPayroll: dashboardAccess.payroll,
          canViewEmployees: dashboardAccess.employees,
          canViewAttendance: dashboardAccess.attendance,
          canViewLeaves: dashboardAccess.leaves,
          canViewReports: dashboardAccess.reports,
          canViewProfileRequests: dashboardAccess.profileRequests,
        });
        if (isMounted) {
          setDashboardData(data);
          if (data?.summary?.pendingProfileCount != null) {
            setPendingProfileCount(data.summary.pendingProfileCount);
          }
        }
      } catch (err) {
        if (isMounted) setLoadError(err?.message || "Không tải được số liệu tổng quan.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [visibleTab, userSession]);

  const errors = dashboardData?.errors || {};

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* ───────────────── LEFT SIDEBAR ───────────────── */}
      <ManagerSidebar
        activeTab={visibleTab}
        onTabChange={navigateTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onClose={() => setSidebarCollapsed(true)}
        userSession={userSession}
        pendingProfileCount={pendingProfileCount}
        pendingPayrollCount={pendingPayrollCount}
      />

      {/* ───────────────── TOP HEADER BAR ───────────────── */}
      <ManagerHeader
        userSession={userSession}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onOpenEmployeeLogin={onOpenEmployeeLogin}
      />

      {/* ───────────────── MAIN CONTENT AREA ───────────────── */}
      <div className={`${sidebarCollapsed ? "pl-20" : "pl-64"} transition-all duration-300`}>
        <main className="pt-16 pb-14 min-h-screen">
          <div className="max-w-[1480px] mx-auto px-8 py-8 flex flex-col gap-6">
            {/* 1. TAB: Quản lý & Báo cáo nhân sự (Hợp nhất) */}
            {visibleTab === "employees" && <EmployeeManagement initialTab="list" userSession={userSession} />}
            {visibleTab === "reports" && <EmployeeManagement initialTab="reports" userSession={userSession} />}

            {/* 1b. TAB: Duyệt yêu cầu sửa hồ sơ của nhân viên */}
            {visibleTab === "profile-requests" && (
              <ProfileRequestsPanel userSession={userSession} onPendingCountChange={setPendingProfileCount} />
            )}

            {/* 2. TAB: Duyệt đơn từ */}
            {visibleTab === "leaves" && <LeaveApprovals userSession={userSession} />}

            {/* 3. TAB: Chấm công & Ca làm */}
            {visibleTab === "attendance" && (
              <AttendanceManagement userSession={userSession} initialPeriod={attendancePeriod} />
            )}

            {/* 4. TAB: Bảng tính lương */}
            {visibleTab === "payroll" && (
              <PayrollManagement
                userSession={userSession}
                onNavigateTab={navigateTab}
                onPendingApprovalsChange={refreshPendingPayroll}
              />
            )}

            {/* 4b. TAB: Hợp đồng lao động & Cơ cấu tổ chức (nghiệp vụ nhân sự, chuyển từ Cổng Quản trị) */}
            {visibleTab === "contracts" && <ContractManagement />}
            {visibleTab === "departments" && <DepartmentsPanel />}
            {visibleTab === "positions" && <PositionsPanel />}

            {/* 5. TAB: Cấp quyền sử dụng web & Bổ nhiệm chức danh */}
            {(visibleTab === "permissions" || visibleTab === "role-permissions") && (
              <RolePermissions userSession={userSession} />
            )}

            {/* 6. TAB: Tổng quan (Default) */}
            {visibleTab === "dashboard" && (
              <>
                {/* Header Tiêu đề trang */}
                <div className="flex flex-col gap-1">
                  <h1 className="font-bold text-2xl text-slate-900 tracking-tight uppercase">
                    TỔNG QUAN
                  </h1>
                  <p className="text-xs text-slate-500">
                    Dữ liệu vận hành thời gian thực toàn hệ thống
                  </p>
                </div>

                {/* Loading state indicator */}
                {isLoading && !dashboardData ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                    <span className="text-xs font-medium">Đang tải số liệu tổng quan nhân sự...</span>
                  </div>
                ) : loadError && !dashboardData ? (
                  <div
                    role="alert"
                    className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs"
                  >
                    {loadError}
                  </div>
                ) : (
                  <>
                    {/* 1. KHỐI 4 THẺ CHỈ SỐ CỐT LÕI (Real-time Metric Cards) */}
                    {!hasAnyDashboardData && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                        Tài khoản của bạn chưa được cấp quyền xem số liệu tổng quan nào.
                      </div>
                    )}

                    <StatMetricCards
                      stats={dashboardData?.summary}
                      errors={errors}
                      onNavigateTab={navigateTab}
                      visible={dashboardAccess}
                    />

                    {/* 2. KHỐI VẬN HÀNH: Cơ cấu phòng ban, Xu hướng chấm công 7 ngày, Hợp đồng sắp hết hạn (theo quyền) */}
                    {(dashboardAccess.employees || dashboardAccess.attendance || dashboardAccess.reports) && (
                      <div
                        className={`grid grid-cols-1 gap-6 ${
                          ["lg:grid-cols-1", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3"][
                            [dashboardAccess.employees, dashboardAccess.attendance, dashboardAccess.reports].filter(Boolean)
                              .length
                          ]
                        }`}
                      >
                        {/* Cơ cấu theo phòng ban */}
                        {dashboardAccess.employees && (
                          <DepartmentStructureCard departments={dashboardData?.departments} error={errors.employees} />
                        )}

                        {/* Xu hướng chấm công 7 ngày (Line Chart) */}
                        {dashboardAccess.attendance && (
                          <AttendanceTrendCard attendanceData={dashboardData?.attendance7Days} error={errors.trend} />
                        )}

                        {/* Hợp đồng lao động sắp hết hạn */}
                        {dashboardAccess.reports && (
                          <ExpiringContractsCard
                            contracts={dashboardData?.expiringContracts}
                            error={errors.statistics}
                            onNavigateTab={access.canOpen("employees") ? navigateTab : undefined}
                          />
                        )}
                      </div>
                    )}

                    {/* 3. BÁO CÁO THỐNG KÊ NHÂN SỰ: Trình độ, Thâm niên, Mức lương (cần quyền REPORT_VIEW) */}
                    {dashboardAccess.reports && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <EducationChartCard educationData={dashboardData?.education} error={errors.statistics} />
                        <TenureStatsCard tenureData={dashboardData?.tenure} error={errors.statistics} />
                        <PayrollDepartmentCard payrollData={dashboardData?.salaryByDept} error={errors.statistics} />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
