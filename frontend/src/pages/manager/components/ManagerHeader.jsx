import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import logoImg from "../../../assets/logo/Logo Trung Nguyên_black.png";
import { getEmployeeProfile } from "../../../services/employeeService";
import EmployeeLoginButton from "../../../components/common/EmployeeLoginButton";

/**
 * ManagerHeader – thanh trên cùng của Cổng Quản lý.
 * Cổng Quản lý và Cổng Quản trị khác cấp nên không có nút chuyển ngang; chỉ có nút mở trang đăng nhập Cổng Nhân viên.
 */
export default function ManagerHeader({ userSession, onLogout, collapsed = false, onOpenEmployeeLogin }) {
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

        {onOpenEmployeeLogin && <EmployeeLoginButton onClick={onOpenEmployeeLogin} />}
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
