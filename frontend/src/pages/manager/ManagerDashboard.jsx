import React, { useState, useEffect } from "react";
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
import ProfileRequestsPanel from "./components/ProfileRequestsPanel";
import { getManagerDashboardStats } from "../../services/managerService";
import { getManagerAccess } from "./managerUtils";

export default function ManagerDashboard({ userSession, onLogout, onSwitchToEmployee, onSwitchToAdmin }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingProfileCount, setPendingProfileCount] = useState(0);
  // Kỳ công cần mở khi chuyển từ Bảng lương sang Chấm công (vd: để chốt công tháng của bảng lương)
  const [attendancePeriod, setAttendancePeriod] = useState(null);

  const navigateTab = (tab, options) => {
    setAttendancePeriod(tab === "attendance" ? options?.period || null : null);
    setActiveTab(tab);
  };

  useEffect(() => {
    if (activeTab !== "dashboard") return undefined;
    let isMounted = true;
    const loadStats = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await getManagerDashboardStats({
          canViewPayroll: getManagerAccess(userSession).can("PAYROLL_MANAGE"),
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
  }, [activeTab, userSession]);

  const errors = dashboardData?.errors || {};

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* ───────────────── LEFT SIDEBAR ───────────────── */}
      <ManagerSidebar
        activeTab={activeTab}
        onTabChange={navigateTab}
        onSwitchToEmployee={onSwitchToEmployee}
        onSwitchToAdmin={onSwitchToAdmin}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onClose={() => setSidebarCollapsed(true)}
        userSession={userSession}
        pendingProfileCount={pendingProfileCount}
      />

      {/* ───────────────── TOP HEADER BAR ───────────────── */}
      <ManagerHeader
        userSession={userSession}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onSwitchToAdmin={onSwitchToAdmin}
        onSwitchToEmployee={onSwitchToEmployee}
      />

      {/* ───────────────── MAIN CONTENT AREA ───────────────── */}
      <div className={`${sidebarCollapsed ? "pl-20" : "pl-64"} transition-all duration-300`}>
        <main className="pt-16 pb-14 min-h-screen">
          <div className="max-w-[1480px] mx-auto px-8 py-8 flex flex-col gap-6">
            {/* 1. TAB: Quản lý & Báo cáo nhân sự (Hợp nhất) */}
            {activeTab === "employees" && <EmployeeManagement initialTab="list" userSession={userSession} />}
            {activeTab === "reports" && <EmployeeManagement initialTab="reports" userSession={userSession} />}

            {/* 1b. TAB: Duyệt yêu cầu sửa hồ sơ của nhân viên */}
            {activeTab === "profile-requests" && (
              <ProfileRequestsPanel userSession={userSession} onPendingCountChange={setPendingProfileCount} />
            )}

            {/* 2. TAB: Duyệt đơn từ */}
            {activeTab === "leaves" && <LeaveApprovals userSession={userSession} />}

            {/* 3. TAB: Chấm công & Ca làm */}
            {activeTab === "attendance" && (
              <AttendanceManagement userSession={userSession} initialPeriod={attendancePeriod} />
            )}

            {/* 4. TAB: Bảng tính lương */}
            {activeTab === "payroll" && (
              <PayrollManagement userSession={userSession} onNavigateTab={navigateTab} />
            )}

            {/* 5. TAB: Cấp quyền sử dụng web & Bổ nhiệm chức danh */}
            {(activeTab === "permissions" || activeTab === "role-permissions") && (
              <RolePermissions userSession={userSession} />
            )}

            {/* 6. TAB: Tổng quan (Default) */}
            {activeTab === "dashboard" && (
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
                    <StatMetricCards
                      stats={dashboardData?.summary}
                      errors={errors}
                      onNavigateTab={setActiveTab}
                    />

                    {/* 2. KHỐI 3 CỘT VẬN HÀNH: Cơ cấu phòng ban, Xu hướng chấm công 7 ngày, Hợp đồng sắp hết hạn */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Cơ cấu theo phòng ban */}
                      <DepartmentStructureCard
                        departments={dashboardData?.departments}
                        error={errors.employees}
                      />

                      {/* Xu hướng chấm công 7 ngày (Line Chart) */}
                      <AttendanceTrendCard
                        attendanceData={dashboardData?.attendance7Days}
                        error={errors.trend}
                      />

                      {/* Hợp đồng lao động sắp hết hạn */}
                      <ExpiringContractsCard
                        contracts={dashboardData?.expiringContracts}
                        error={errors.statistics}
                        onNavigateTab={setActiveTab}
                      />
                    </div>

                    {/* 3. BÁO CÁO THỐNG KÊ NHÂN SỰ: Trình độ, Thâm niên, Mức lương (cần quyền REPORT_VIEW) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <EducationChartCard educationData={dashboardData?.education} error={errors.statistics} />
                      <TenureStatsCard tenureData={dashboardData?.tenure} error={errors.statistics} />
                      <PayrollDepartmentCard payrollData={dashboardData?.salaryByDept} error={errors.statistics} />
                    </div>
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
