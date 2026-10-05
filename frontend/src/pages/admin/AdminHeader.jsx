import React from "react";
import { Bell, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import logoImg from "../../assets/logo/Logo Trung Nguyên_black.png";

export default function AdminHeader({ userSession, onLogout, collapsed = false }) {
  const userName = userSession?.ho_ten || "Đặng Lê Nguyên Vũ";
  const userRole = "Quản Trị Viên Hệ Thống (ADMIN)";
  const initials = userName
    ? userName
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "NV";

  return (
    <header
      className={`fixed top-0 ${
        collapsed ? "left-20" : "left-64"
      } right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-8 flex items-center justify-between transition-all duration-300`}
    >
      {/* Enterprise Brand / Headquarters Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200/80 shadow-2xs">
          <img src={logoImg} alt="Trung Nguyên" className="w-4 h-4 object-contain" />
          <span>TRỤ SỞ CHÍNH TRUNG NGUYÊN LEGEND</span>
        </div>

        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
          <ShieldCheck size={13} className="text-sky-600" />
          <span>Admin Master Control</span>
        </div>
      </div>

      {/* User Actions & Avatar Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          title="Thông báo quản trị"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white"></span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200"></div>

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#0ea5e9] text-white font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-xs text-slate-900 leading-tight">
              {userName}
            </span>
            <span className="text-[11px] text-sky-700 font-medium leading-none mt-0.5">{userRole}</span>
          </div>
        </div>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer ml-1"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
