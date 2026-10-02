import React from "react";
import { Search, Building2, Bell, LogOut } from "lucide-react";

export default function ManagerHeader({ userSession, onLogout, searchQuery, setSearchQuery }) {
  const userName = userSession?.ho_ten || "Đặng Lê Nguyên Vũ";
  const userRole = userSession?.ten_vai_tro || "Tổng Giám Đốc";
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
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-8 flex items-center justify-between">
      {/* Search & Location Info */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            className="w-72 sm:w-80 pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
            placeholder="Tìm kiếm nhân sự, mã NV, phòng ban..."
          />
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-100/70 border border-slate-200/60">
          <Building2 className="w-3.5 h-3.5 text-sky-600" />
          <span>Trụ sở chính Trung Nguyên</span>
        </div>
      </div>

      {/* User Actions & Avatar Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          title="Thông báo hệ thống"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200"></div>

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#0ea5e9] text-white font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-xs text-slate-800 leading-tight">
              {userName}
            </span>
            <span className="text-[11px] text-slate-400 leading-none mt-0.5">{userRole}</span>
          </div>
        </div>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer ml-1"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
