import React, { useState, useEffect } from "react";
import { Download, ChevronDown, Check, Loader2, Sparkles } from "lucide-react";
import ManagerSidebar from "./components/ManagerSidebar";
import ManagerHeader from "./components/ManagerHeader";
import StatMetricCards from "./components/StatMetricCards";
import EducationChartCard from "./components/EducationChartCard";
import TenureStatsCard from "./components/TenureStatsCard";
import PayrollDepartmentCard from "./components/PayrollDepartmentCard";
import RecentPersonnelTable from "./components/RecentPersonnelTable";
import EmployeeManagement from "./EmployeeManagement";
import LeaveApprovals from "./LeaveApprovals";
import RolePermissions from "./RolePermissions";
import AttendanceManagement from "./AttendanceManagement";
import PayrollManagement from "./PayrollManagement";
import PersonnelReport from "./PersonnelReport";
import { getManagerDashboardStats } from "../../services/managerService";

export default function ManagerDashboard({ userSession, onLogout, onSwitchToEmployee }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("Tháng 10/2026");
  const [selectedDept, setSelectedDept] = useState("Tất cả phòng ban");
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const data = await getManagerDashboardStats(selectedPeriod, selectedDept);
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
  }, [selectedPeriod, selectedDept]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportNotice("Đã xuất báo cáo phân tích nhân sự thành công!");
      setTimeout(() => setExportNotice(""), 3500);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-['Be_Vietnam_Pro',sans-serif] selection:bg-sky-100 selection:text-sky-900">
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
            {/* 1. TAB: Quản lý nhân sự */}
            {activeTab === "employees" && <EmployeeManagement />}

            {/* 2. TAB: Duyệt đơn từ */}
            {activeTab === "leaves" && <LeaveApprovals />}

            {/* 3. TAB: Chấm công & Ca làm (Từ Stitch) */}
            {activeTab === "attendance" && <AttendanceManagement />}

            {/* 4. TAB: Bảng tính lương (Từ Stitch) */}
            {activeTab === "payroll" && <PayrollManagement />}

            {/* 5. TAB: Báo cáo Thông tin Nhân sự Chuyên sâu (Từ Stitch) */}
            {activeTab === "reports" && <PersonnelReport />}

            {/* 6. TAB: Phân quyền & Vai trò (Từ Stitch) */}
            {activeTab === "roles" && <RolePermissions />}

            {/* 7. TAB: Tổng quan & Báo cáo (Default) */}
            {activeTab === "dashboard" && (
              <>
                {/* Header & Controls Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight">
                        Tổng quan Nhân sự
                      </h1>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/50">
                        <Sparkles className="w-3 h-3 text-sky-500" />
                        Báo cáo trực quan
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Dữ liệu hợp nhất toàn tập đoàn • {selectedPeriod}
                    </p>
                  </div>

                  {/* Filter Controls & Export */}
                  <div className="flex items-center flex-wrap gap-2.5">
                    {/* Period Selector */}
                    <div className="relative">
                      <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer shadow-xs appearance-none"
                      >
                        <option value="Tháng 10/2026">Tháng 10/2026</option>
                        <option value="Tháng 09/2026">Tháng 09/2026</option>
                        <option value="Tháng 08/2026">Tháng 08/2026</option>
                        <option value="Quý IV/2026">Quý IV/2026</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Department Filter */}
                    <div className="relative">
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer shadow-xs appearance-none"
                      >
                        <option value="Tất cả phòng ban">Tất cả phòng ban</option>
                        <option value="Khối Văn phòng Tập đoàn">Khối Văn phòng Tập đoàn</option>
                        <option value="Chuỗi Không Gian Cà Phê">Chuỗi Không Gian Cà Phê</option>
                        <option value="Nhà máy & Sản xuất">Nhà máy & Sản xuất</option>
                        <option value="R&D Hương vị Cà phê">R&D Hương vị Cà phê</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Export Button */}
                    <button
                      type="button"
                      onClick={handleExport}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-75"
                    >
                      {isExporting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{isExporting ? "Đang xuất..." : "Xuất báo cáo"}</span>
                    </button>
                  </div>
                </div>

                {/* Notification Toast */}
                {exportNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{exportNotice}</span>
                  </div>
                )}

                {/* Loading state indicator if fetching */}
                {isLoading && !dashboardData ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                    <span className="text-xs font-medium">Đang tải số liệu báo cáo nhân sự...</span>
                  </div>
                ) : (
                  <>
                    {/* 1. 4 Key Stat Metrics Cards */}
                    <StatMetricCards stats={dashboardData?.summary} />

                    {/* 2. 3 In-depth Analytics Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Trình độ học vấn */}
                      <EducationChartCard educationData={dashboardData?.education} />

                      {/* Thâm niên công tác */}
                      <TenureStatsCard tenureData={dashboardData?.tenure} />

                      {/* Quỹ lương theo khối */}
                      <PayrollDepartmentCard payrollData={dashboardData?.payrollByDept} />
                    </div>

                    {/* 3. Recent Personnel Fluctuations Table */}
                    <RecentPersonnelTable data={dashboardData?.recentChanges} />
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
