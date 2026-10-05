import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import ManagerSidebar from "./components/ManagerSidebar";
import ManagerHeader from "./components/ManagerHeader";
import StatMetricCards from "./components/StatMetricCards";
import DepartmentStructureCard from "./components/DepartmentStructureCard";
import AttendanceTrendCard from "./components/AttendanceTrendCard";
import ExpiringContractsCard from "./components/ExpiringContractsCard";
import EmployeeManagement from "./EmployeeManagement";
import LeaveApprovals from "./LeaveApprovals";
import RolePermissions from "./RolePermissions";
import AttendanceManagement from "./AttendanceManagement";
import PayrollManagement from "./PayrollManagement";
import PersonnelReport from "./PersonnelReport";
import { getManagerDashboardStats } from "../../services/managerService";

export default function ManagerDashboard({ userSession, onLogout, onSwitchToEmployee }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const data = await getManagerDashboardStats();
        if (isMounted) {
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Lỗi khi tải số liệu thống kê quản lý:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* ───────────────── LEFT SIDEBAR ───────────────── */}
      <ManagerSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSwitchToEmployee={onSwitchToEmployee}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onClose={() => setSidebarCollapsed(true)}
      />

      {/* ───────────────── TOP HEADER BAR ───────────────── */}
      <ManagerHeader
        userSession={userSession}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
      />

      {/* ───────────────── MAIN CONTENT AREA ───────────────── */}
      <div className={`${sidebarCollapsed ? "pl-20" : "pl-64"} transition-all duration-300`}>
        <main className="pt-16 pb-14 min-h-screen">
          <div className="max-w-[1480px] mx-auto px-8 py-8 flex flex-col gap-6">
            {/* 1. TAB: Quản lý & Báo cáo nhân sự (Hợp nhất) */}
            {activeTab === "employees" && <EmployeeManagement initialTab="list" />}
            {activeTab === "reports" && <EmployeeManagement initialTab="reports" />}

            {/* 2. TAB: Duyệt đơn từ */}
            {activeTab === "leaves" && <LeaveApprovals />}

            {/* 3. TAB: Chấm công & Ca làm */}
            {activeTab === "attendance" && <AttendanceManagement />}

            {/* 4. TAB: Bảng tính lương */}
            {activeTab === "payroll" && <PayrollManagement />}

            {/* 5. TAB: Phân quyền & Vai trò */}
            {activeTab === "roles" && <RolePermissions />}

            {/* 7. TAB: Tổng quan (Default) */}
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
                ) : (
                  <>
                    {/* 1. KHỐI 4 THẺ CHỈ SỐ CỐT LÕI (Real-time Metric Cards) */}
                    <StatMetricCards
                      stats={dashboardData?.summary}
                      onNavigateTab={setActiveTab}
                    />

                    {/* 2. KHỐI 3 CỘT VẬN HÀNH: Cơ cấu phòng ban, Xu hướng chấm công 7 ngày, Hợp đồng sắp hết hạn */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Cơ cấu theo phòng ban */}
                      <DepartmentStructureCard departments={dashboardData?.departments} />

                      {/* Xu hướng chấm công 7 ngày (Line Chart) */}
                      <AttendanceTrendCard attendanceData={dashboardData?.attendance7Days} />

                      {/* Hợp đồng lao động sắp hết hạn */}
                      <ExpiringContractsCard
                        contracts={dashboardData?.expiringContracts}
                        onNavigateTab={setActiveTab}
                      />
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
