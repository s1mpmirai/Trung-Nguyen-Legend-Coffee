import React, { useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Clock,
  CreditCard,
  Shield,
  ArrowLeftRight,
  FileBarChart2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import logoImg from "../../../assets/logo/Logo Trung Nguyên_black.png";

export default function ManagerSidebar({
  activeTab = "dashboard",
  onTabChange,
  onSwitchToEmployee,
  collapsed = false,
  onToggleCollapse,
  onClose,
}) {
  const sidebarRef = useRef(null);

  // Tự động thu gọn menu khi click ra vùng bên ngoài
  useEffect(() => {
    if (collapsed) return;

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        if (onClose) {
          onClose();
        } else if (onToggleCollapse) {
          onToggleCollapse();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [collapsed, onToggleCollapse, onClose]);

  const navItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "reports", label: "Báo cáo nhân sự", icon: FileBarChart2 },
    { id: "employees", label: "Quản lý nhân sự", icon: Users },
    { id: "leaves", label: "Duyệt đơn", icon: ClipboardCheck },
    { id: "attendance", label: "Chấm công & Ca làm", icon: Clock },
    { id: "payroll", label: "Bảng tính lương", icon: CreditCard },
    { id: "roles", label: "Phân quyền & Vai trò", icon: Shield },
  ];

  return (
    <aside
      ref={sidebarRef}
      onClick={(e) => {
        if (collapsed) {
          onToggleCollapse && onToggleCollapse();
        }
      }}
      className={`fixed left-0 top-0 h-full ${collapsed
          ? "w-20 cursor-pointer hover:border-sky-300 hover:shadow-md"
          : "w-64"
        } bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between py-6 select-none transition-all duration-300`}
      title={collapsed ? "Bấm vào bất kỳ đâu để mở rộng menu" : undefined}
    >
      <div className="flex flex-col gap-6">
        {/* Logo Branding Trung Nguyên & Nút Thu Gọn Menu Bên Phải Logo */}
        <div className={`px-4 flex items-center ${collapsed ? "justify-center flex-col gap-2" : "justify-between"}`}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onTabChange && onTabChange("dashboard");
            }}
            className="flex items-center gap-3 overflow-hidden cursor-pointer group"
            title="Quay về Tổng quan"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs group-hover:border-sky-500 group-hover:shadow transition-all shrink-0">
              <img
                src={logoImg}
                alt="Trung Nguyên Legend Logo"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg tracking-tight leading-tight group-hover:text-sky-600 transition-colors truncate">
                  TrungNguyen<span className="text-sky-600">HR</span>
                </span>
                <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[10px] text-slate-400 tracking-wider uppercase mt-0.5 truncate">
                  HR Legend Portal
                </span>
              </div>
            )}
          </div>

          {/* Button nằm bên phải logo để thu vào / mở ra */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse && onToggleCollapse();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-sky-600" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className={`flex flex-col gap-1 ${collapsed ? "px-2" : "px-3"}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  onTabChange && onTabChange(item.id);
                  if (collapsed) {
                    onToggleCollapse && onToggleCollapse();
                  }
                }}
                title={item.label}
                className={`flex items-center ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
                  } rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${isActive
                    ? collapsed
                      ? "bg-sky-50 text-sky-600 shadow-xs"
                      : "bg-sky-50 text-sky-600 border-l-[3px] border-sky-600 pl-3 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & System Status */}
      <div className={collapsed ? "px-2 flex flex-col items-center gap-2" : "px-4 flex flex-col gap-2"}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSwitchToEmployee) {
              onSwitchToEmployee();
            } else {
              window.location.hash = "#/attendance";
            }
          }}
          className={`${
            collapsed ? "w-10 h-10 p-0" : "w-full py-2.5 px-3"
          } flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-sky-600 hover:bg-sky-50 border border-slate-200/80 transition-all cursor-pointer`}
          title="Chuyển sang giao diện Nhân viên"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          {!collapsed && <span>Giao diện Nhân viên</span>}
        </button>

        {collapsed ? (
          <div
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center cursor-default"
            title="Máy chủ ổn định (v2.4)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium text-slate-600">Máy chủ ổn định</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">v2.4</span>
          </div>
        )}
      </div>
    </aside>
  );
}
