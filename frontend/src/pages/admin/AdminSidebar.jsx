import React from "react";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  ShieldCheck,
  Building2,
  Briefcase,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import logoImg from "../../assets/logo/Logo Trung Nguyên_black.png";
import { isAdminRole } from "../../utils/navigation";

// Menu Cổng Quản trị theo nhóm nghiệp vụ. Mỗi mục mở cho vai trò ADMIN hoặc tài khoản có quyền tương ứng;
// mục không khai báo "permission" (Tổng quan) mở cho mọi người dùng được vào Cổng Quản trị.
export const ADMIN_NAV_SECTIONS = [
  {
    id: "general",
    label: "Tổng quan",
    items: [{ id: "overview", label: "Tổng quan hệ thống", icon: LayoutDashboard }],
  },
  {
    id: "org",
    label: "Tổ chức",
    items: [
      { id: "departments", label: "Phòng ban", icon: Building2, permission: "ORG_MANAGE" },
      { id: "positions", label: "Chức vụ & Thang lương", icon: Briefcase, permission: "ORG_MANAGE" },
    ],
  },
  {
    id: "hr",
    label: "Nhân sự",
    items: [
      { id: "employees", label: "Danh bạ nhân sự", icon: Users, permission: "EMPLOYEE_VIEW" },
      { id: "contracts", label: "Hợp đồng lao động", icon: FileText, permission: "CONTRACT_MANAGE" },
    ],
  },
  {
    id: "access",
    label: "Tài khoản & Phân quyền",
    items: [
      { id: "accounts", label: "Tài khoản người dùng", icon: KeyRound, permission: "ACCOUNT_MANAGE" },
      { id: "permissions", label: "Phân quyền RBAC", icon: ShieldCheck, permission: "PERMISSION_ASSIGN" },
    ],
  },
];

const canSeeItem = (item, isAdmin, perms) => isAdmin || !item.permission || perms.includes(item.permission);

/** Các nhóm menu mà phiên hiện tại được xem (bỏ nhóm rỗng). */
export function getAdminNavSections(userSession) {
  const isAdmin = isAdminRole(userSession?.role);
  const perms = Array.isArray(userSession?.permissions) ? userSession.permissions : [];
  return ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canSeeItem(item, isAdmin, perms)),
  })).filter((section) => section.items.length > 0);
}

/** Danh sách phẳng các mục menu được phép xem (dùng để kiểm tra tab hợp lệ). */
export function getAdminNavItems(userSession) {
  return getAdminNavSections(userSession).flatMap((section) => section.items);
}

export default function AdminSidebar({ userSession, activeTab = "overview", onTabChange, collapsed = false, onToggleCollapse }) {
  const sections = getAdminNavSections(userSession);
  const homeTab = sections[0]?.items[0]?.id || "overview";

  return (
    <aside
      aria-label="Menu Cổng Quản trị"
      className={`fixed left-0 top-0 h-full ${
        collapsed ? "w-20" : "w-64"
      } bg-white border-r border-slate-200/80 z-50 flex flex-col py-5 select-none transition-[width] duration-300`}
    >
      {/* Logo & nút thu gọn */}
      <div className={`px-4 flex items-center ${collapsed ? "justify-center flex-col gap-2" : "justify-between"}`}>
        <button
          type="button"
          onClick={() => onTabChange && onTabChange(homeTab)}
          className="flex items-center gap-3 overflow-hidden cursor-pointer group rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          aria-label="Về trang Tổng quan"
          title="Về trang Tổng quan"
        >
          <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs group-hover:border-sky-500 transition-all shrink-0">
            <img src={logoImg} alt="" className="w-full h-full object-contain pointer-events-none" />
          </span>
          {!collapsed && (
            <span className="flex flex-col min-w-0 text-left">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg tracking-tight leading-tight group-hover:text-sky-600 transition-colors truncate">
                TrungNguyen<span className="text-sky-600">HR</span>
              </span>
              <span className="font-semibold text-[10px] text-slate-400 tracking-wider uppercase mt-0.5 truncate">
                Cổng Quản trị
              </span>
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onToggleCollapse && onToggleCollapse()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4 text-sky-600" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Điều hướng theo nhóm */}
      <nav
        aria-label="Chức năng quản trị"
        className={`mt-6 flex-1 flex flex-col gap-4 ${collapsed ? "px-2" : "px-3 overflow-y-auto no-scrollbar"}`}
      >
        {sections.map((section, idx) => (
          <div key={section.id} className="flex flex-col gap-1" role="group" aria-label={section.label}>
            {collapsed ? (
              idx > 0 && <div className="mx-3 mb-1 border-t border-slate-100" aria-hidden="true" />
            ) : (
              <div className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.label}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange && onTabChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={`group relative flex items-center ${
                    collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
                  } rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    isActive
                      ? collapsed
                        ? "bg-sky-50 text-sky-700 shadow-xs"
                        : "bg-sky-50 text-sky-700 border-l-[3px] border-sky-600 pl-3 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-600"}`}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}

                  {/* Tooltip khi menu thu gọn */}
                  {collapsed && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity z-50"
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
