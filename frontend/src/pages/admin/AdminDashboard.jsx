import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminAccountsTab from "./tabs/AdminAccountsTab";

export default function AdminDashboard({
  userSession,
  onLogout,
  onSwitchToManager,
  onSwitchToEmployee,
}) {
  const rawRole = userSession?.role || localStorage.getItem("user_role") || "";
  const isAdmin = rawRole.toUpperCase() === "ADMIN" || userSession?.ma_nv === "NV01";
  const userPerms = userSession?.permissions || JSON.parse(localStorage.getItem("user_permissions") || "[]");

  const [activeTab, setActiveTab] = useState("accounts");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-['Be_Vietnam_Pro',sans-serif] selection:bg-sky-100 selection:text-sky-900">
      {/* ───────────────── LEFT SIDEBAR ───────────────── */}
      <AdminSidebar
        userSession={userSession}
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
            <AdminAccountsTab />
          </div>
        </main>
      </div>
    </div>
  );
}
