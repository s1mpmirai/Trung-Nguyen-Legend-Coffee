import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminOverviewTab from "./tabs/AdminOverviewTab";
import AdminAccountsTab from "./tabs/AdminAccountsTab";
import AdminPermissionsTab from "./tabs/AdminPermissionsTab";
import AdminDepartmentsTab from "./tabs/AdminDepartmentsTab";
import AdminPositionsTab from "./tabs/AdminPositionsTab";
import AdminContractsTab from "./tabs/AdminContractsTab";
import AdminWarehouseTab from "./tabs/AdminWarehouseTab";
import EmployeeManagement from "../manager/EmployeeManagement";

export default function AdminDashboard({
  userSession,
  onLogout,
  onSwitchToManager,
  onSwitchToEmployee,
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-['Be_Vietnam_Pro',sans-serif] selection:bg-sky-100 selection:text-sky-900">
      {/* ───────────────── LEFT SIDEBAR ───────────────── */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSwitchToManager={onSwitchToManager}
        onSwitchToEmployee={onSwitchToEmployee}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onClose={() => setSidebarCollapsed(true)}
      />

      {/* ───────────────── TOP HEADER BAR ───────────────── */}
      <AdminHeader
        userSession={userSession}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
      />

      {/* ───────────────── MAIN CONTENT AREA ───────────────── */}
      <div className={`${sidebarCollapsed ? "pl-20" : "pl-64"} transition-all duration-300`}>
        <main className="pt-16 pb-14 min-h-screen">
          <div className="max-w-[1480px] mx-auto px-8 py-8 flex flex-col gap-6">
            {/* 1. TAB: Tổng quan hệ thống */}
            {activeTab === "dashboard" && (
              <AdminOverviewTab onNavigateTab={setActiveTab} />
            )}

            {/* 2. TAB: Quản lý tài khoản (ACCOUNT_MANAGE) */}
            {activeTab === "accounts" && <AdminAccountsTab />}

            {/* 3. TAB: Phân quyền & RBAC (PERMISSION_ASSIGN) */}
            {activeTab === "permissions" && <AdminPermissionsTab />}

            {/* 4. TAB: Cơ cấu phòng ban */}
            {activeTab === "departments" && <AdminDepartmentsTab />}

            {/* 5. TAB: Chức vụ & Bậc lương */}
            {activeTab === "positions" && <AdminPositionsTab />}

            {/* 6. TAB: Hợp đồng lao động */}
            {activeTab === "contracts" && <AdminContractsTab />}

            {/* 7. TAB: Quản lý nhân sự */}
            {activeTab === "employees" && <EmployeeManagement />}

            {/* 8. TAB: Kho & Nhà cung cấp */}
            {activeTab === "warehouse" && <AdminWarehouseTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
