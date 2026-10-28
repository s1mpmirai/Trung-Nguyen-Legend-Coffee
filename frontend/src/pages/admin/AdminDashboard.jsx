import React, { useState } from "react";
import AdminSidebar, { getAdminNavItems } from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminOverviewTab from "./tabs/AdminOverviewTab";
import AdminEmployeesTab from "./tabs/AdminEmployeesTab";
import AdminAccountsTab from "./tabs/AdminAccountsTab";
import AdminPermissionsTab from "./tabs/AdminPermissionsTab";
import AdminDepartmentsTab from "./tabs/AdminDepartmentsTab";
import AdminPositionsTab from "./tabs/AdminPositionsTab";
import AdminContractsTab from "./tabs/AdminContractsTab";

export default function AdminDashboard({
  userSession,
  onLogout,
  onSwitchToManager,
  onSwitchToEmployee,
}) {
  const allowedTabs = getAdminNavItems(userSession).map((item) => item.id);

  const [activeTab, setActiveTab] = useState(allowedTabs[0] || "accounts");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Chỉ chuyển sang tab mà tài khoản hiện tại được phép xem
  const handleTabChange = (tabId) => {
    if (allowedTabs.includes(tabId)) setActiveTab(tabId);
  };

  const renderTab = () => {
    if (!allowedTabs.includes(activeTab)) return <AdminAccountsTab />;
    switch (activeTab) {
      case "overview":
        return <AdminOverviewTab onNavigateTab={handleTabChange} />;
      case "employees":
        return <AdminEmployeesTab />;
      case "permissions":
        return <AdminPermissionsTab />;
      case "departments":
        return <AdminDepartmentsTab />;
      case "positions":
        return <AdminPositionsTab />;
      case "contracts":
        return <AdminContractsTab />;
      case "accounts":
      default:
        return <AdminAccountsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-['Be_Vietnam_Pro',sans-serif] selection:bg-sky-100 selection:text-sky-900">
      {/* ───────────────── LEFT SIDEBAR ───────────────── */}
      <AdminSidebar
        userSession={userSession}
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
