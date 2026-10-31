import React, { useEffect, useState } from "react";
import { ShieldCheck, Briefcase, Smartphone, LogOut } from "lucide-react";
import logoImg from "../../../assets/logo/Logo Trung Nguyên_black.png";
import { getEmployeeProfile } from "../../../services/employeeService";

const portalButton =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all";

export default function ManagerHeader({
  userSession,
  onLogout,
  collapsed = false,
  onSwitchToAdmin,
  onSwitchToEmployee,
}) {
  // Hiển thị đúng họ tên / chức vụ của tài khoản đang đăng nhập
  const maNv = userSession?.ma_nv || localStorage.getItem("user_ma_nv");
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (maNv) getEmployeeProfile(maNv).then(setProfile);
  }, [maNv]);

  const userName = profile?.fullName || maNv || "";
  const userRole = profile?.jobTitle || userSession?.role || "";
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
      {/* Enterprise Brand & Portal Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200/80">
          <img src={logoImg} alt="Trung Nguyên" className="w-4 h-4 object-contain" />
          <span className="truncate">TRỤ SỞ CHÍNH TRUNG NGUYÊN LEGEND</span>
        </div>

        {/* Bộ chuyển cổng đồng bộ */}
        <nav aria-label="Chuyển cổng làm việc" className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200/70">
          {onSwitchToAdmin && (
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className={`${portalButton} text-slate-600 hover:text-slate-900 hover:bg-white/70 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`}
              title="Chuyển sang Cổng Quản Trị Viên (Admin)"
            >
              <ShieldCheck size={13} aria-hidden="true" />
              Cổng Quản trị
            </button>
          )}

          <span className={`${portalButton} bg-white text-sky-700 shadow-xs`} aria-current="page">
            <Briefcase size={13} aria-hidden="true" />
            Cổng Quản lý
          </span>

          {onSwitchToEmployee && (
            <button
              type="button"
              onClick={onSwitchToEmployee}
              className={`${portalButton} text-slate-600 hover:text-slate-900 hover:bg-white/70 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`}
              title="Chuyển sang Cổng Nhân viên (chấm công, đơn từ, phiếu lương của bạn)"
            >
              <Smartphone size={13} aria-hidden="true" />
              Cổng Nhân viên
            </button>
          )}
        </nav>
      </div>

      {/* User Actions & Avatar Profile */}
      <div className="flex items-center gap-4">
        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#0ea5e9] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-xs text-slate-800 leading-tight">
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
