import React from "react";
import { LogOut } from "lucide-react";
import logoImg from "../../assets/logo/Logo Trung Nguyên_black.png";
import { getRoleLabel } from "../../utils/navigation";
import EmployeeLoginButton from "../../components/common/EmployeeLoginButton";

/**
 * AdminHeader – thanh trên cùng của Cổng Quản trị:
 * thông tin người đăng nhập (lấy từ GET /auth/me) và nút mở trang đăng nhập Cổng Nhân viên.
 * Cổng Quản trị và Cổng Quản lý khác cấp nên không có nút chuyển ngang giữa hai cổng.
 */
export default function AdminHeader({ userSession, onLogout, collapsed = false, onOpenEmployeeLogin }) {
  const userName = userSession?.ho_ten || userSession?.ma_nv || "Người dùng";
  const roleLabel = getRoleLabel(userSession?.role);
  const subtitle = [roleLabel, userSession?.ma_nv].filter(Boolean).join(" • ");
  const initials =
    (userSession?.ho_ten || "")
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || String(userSession?.ma_nv || "NV").slice(0, 2).toUpperCase();

  return (
    <header
      className={`fixed top-0 ${
        collapsed ? "left-20" : "left-64"
      } right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-6 xl:px-8 flex items-center justify-between gap-4 transition-all duration-300`}
    >
      {/* Thương hiệu & cổng hiện tại */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200/80">
          <img src={logoImg} alt="" className="w-4 h-4 object-contain" />
          <span className="truncate">Trung Nguyên Legend</span>
        </div>

        {onOpenEmployeeLogin && <EmployeeLoginButton onClick={onOpenEmployeeLogin} />}
      </div>

      {/* Người dùng & đăng xuất */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#0ea5e9] text-white font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs flex items-center justify-center shadow-xs"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="hidden sm:flex flex-col text-left min-w-0">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-xs text-slate-900 leading-tight truncate max-w-[180px]">
              {userName}
            </span>
            <span className="text-[11px] text-sky-700 font-medium leading-none mt-0.5 truncate max-w-[200px]">{subtitle}</span>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
