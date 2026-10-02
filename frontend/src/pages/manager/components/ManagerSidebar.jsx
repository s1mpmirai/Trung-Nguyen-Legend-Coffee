import React from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Clock,
  CreditCard,
  Shield,
  Settings,
  Coffee,
  ArrowLeftRight,
  FileBarChart2,
} from "lucide-react";

export default function ManagerSidebar({ activeTab = "dashboard", onTabChange, onSwitchToEmployee }) {
  const navItems = [
    { id: "dashboard", label: "Tổng quan KPI", icon: LayoutDashboard },
    { id: "reports", label: "Báo cáo nhân sự", icon: FileBarChart2 },
    { id: "employees", label: "Quản lý nhân sự", icon: Users },
    { id: "leaves", label: "Duyệt đơn từ", icon: ClipboardCheck },
    { id: "attendance", label: "Chấm công & Ca làm", icon: Clock },
    { id: "payroll", label: "Bảng tính lương", icon: CreditCard },
    { id: "roles", label: "Phân quyền & Vai trò", icon: Shield },
    { id: "settings", label: "Cài đặt hệ thống", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between py-6 select-none">
      <div className="flex flex-col gap-7">
        {/* Logo Branding Trung Nguyên */}
        <div className="px-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0369a1] via-[#0284c7] to-[#0ea5e9] flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg tracking-tight leading-tight">
              TrungNguyen
            </span>
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[11px] text-sky-600 tracking-wider uppercase">
              HR Legend Portal
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange && onTabChange(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? "bg-sky-50 text-sky-600 border-l-[3px] border-sky-600 pl-3 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom System Status */}
      <div className="px-4">

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
      </div>
    </aside>
  );
}
