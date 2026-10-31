import React, { useEffect, useState } from "react";
import AdminSidebar, { getAdminNavItems } from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminOverviewTab from "./tabs/AdminOverviewTab";
import AdminEmployeesTab from "./tabs/AdminEmployeesTab";
import AdminAccountsTab from "./tabs/AdminAccountsTab";
import AdminPermissionsTab from "./tabs/AdminPermissionsTab";
import AdminDepartmentsTab from "./tabs/AdminDepartmentsTab";
import AdminPositionsTab from "./tabs/AdminPositionsTab";
import AdminContractsTab from "./tabs/AdminContractsTab";
import { navigateClean, replaceClean } from "../../utils/navigation";

const COLLAPSE_KEY = "admin_sidebar_collapsed";

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * AdminDashboard – khung Cổng Quản trị. Tab đang mở nằm trên URL (/admin/<tab>)
 * nên tải lại trang hoặc mở liên kết trực tiếp vẫn giữ đúng tab.
 */
export default function AdminDashboard({ userSession, routeTab = "", onLogout, onOpenEmployeeLogin }) {
  const allowedTabs = getAdminNavItems(userSession).map((item) => item.id);
  const activeTab = allowedTabs.includes(routeTab) ? routeTab : allowedTabs[0] || "overview";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* trình duyệt chặn localStorage: bỏ qua */
    }
  }, [sidebarCollapsed]);

  // URL thiếu tab hoặc tab không được phép → đồng bộ URL với tab thực sự hiển thị
  useEffect(() => {
    if (routeTab !== activeTab) {
      replaceClean(`admin/${activeTab}`);
      window.dispatchEvent(new CustomEvent("app-route-change", { detail: { route: `admin/${activeTab}` } }));
    }
  }, [routeTab, activeTab]);

  // Chỉ chuyển sang tab mà tài khoản hiện tại được phép xem
  const handleTabChange = (tabId) => {
    if (allowedTabs.includes(tabId) && tabId !== routeTab) navigateClean(`admin/${tabId}`);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverviewTab onNavigateTab={handleTabChange} allowedTabs={allowedTabs} />;
      case "employees":
        return <AdminEmployeesTab />;
      case "accounts":
        return <AdminAccountsTab userSession={userSession} />;
      case "permissions":
        return <AdminPermissionsTab userSession={userSession} />;
      case "departments":
        return <AdminDepartmentsTab />;
      case "positions":
        return <AdminPositionsTab />;
      case "contracts":
        return <AdminContractsTab />;
      default:
        return <AdminOverviewTab onNavigateTab={handleTabChange} allowedTabs={allowedTabs} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-['Be_Vietnam_Pro',sans-serif] selection:bg-sky-100 selection:text-sky-900">
      <AdminSidebar
        userSession={userSession}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <AdminHeader
        userSession={userSession}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onOpenEmployeeLogin={onOpenEmployeeLogin}
      />

      <div className={`${sidebarCollapsed ? "pl-20" : "pl-64"} transition-all duration-300`}>
        <main className="pt-16 pb-14 min-h-screen">
          <div className="max-w-[1480px] mx-auto px-8 py-8 flex flex-col gap-6">
            {/* key: mỗi lần đổi tab, tab mới được khởi tạo lại sạch sẽ */}
            <React.Fragment key={activeTab}>{renderTab()}</React.Fragment>
          </div>
        </main>
      </div>
    </div>
  );
}
