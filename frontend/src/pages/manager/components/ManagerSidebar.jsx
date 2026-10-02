import React from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Clock,
  CreditCard,
  Shield,
  Settings,
  ArrowLeftRight,
  FileBarChart2,
} from "lucide-react";
import logoImg from "../../../assets/logo/Logo Trung Nguyên_black.png";

export default function ManagerSidebar({ activeTab = "dashboard", onTabChange, onSwitchToEmployee }) {
  const navItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
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
        {/* Logo Branding Trung Nguyên Legend */}
        <div
          onClick={() => onTabChange && onTabChange("dashboard")}
          className="px-6 flex items-center gap-3 cursor-pointer group"
          title="Quay về Tổng quan"
        >
          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs group-hover:border-sky-500 group-hover:shadow transition-all">
            <img
              src={logoImg}
              alt="Trung Nguyên Legend Logo"
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-lg tracking-tight leading-tight group-hover:text-sky-600 transition-colors">
              TrungNguyen<span className="text-sky-600">HR</span>
            </span>
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[10px] text-slate-400 tracking-wider uppercase mt-0.5">
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

      {/* Bottom Actions & System Status */}
      <div className="px-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            if (onSwitchToEmployee) {
              onSwitchToEmployee();
            } else {
              window.location.hash = "#/attendance";
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-sky-600 hover:bg-sky-50 border border-slate-200/80 transition-all cursor-pointer"
          title="Chuyển sang xem giao diện Cá nhân / Chấm công của Nhân viên"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Giao diện Nhân viên</span>
        </button>

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
