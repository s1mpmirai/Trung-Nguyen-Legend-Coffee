import React from "react";
import { ShieldOff } from "lucide-react";
import SharedEmployeeHeader from "./SharedEmployeeHeader";
import BottomNavBar from "./BottomNavBar";

/**
 * NoPermissionNotice – Màn hình thay thế khi tài khoản đã bị thu hồi quyền cá nhân
 * (vd: Xem phiếu lương) trong phần Phân quyền của Cổng Quản trị.
 */
export default function NoPermissionNotice({ activeTab, title, message, onLogout }) {
  return (
    <div className="flex-1 flex flex-col bg-cream min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] relative">
      <SharedEmployeeHeader onLogout={onLogout} />

      <main className="px-4 py-6">
        <div
          role="alert"
          className="bg-white rounded-2xl p-6 border border-coffee-100 shadow-[0_2px_10px_rgba(14,165,233,0.06)] text-center space-y-3"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-coffee-50 flex items-center justify-center">
            <ShieldOff size={28} className="text-coffee-600" aria-hidden="true" />
          </div>
          <h1 className="text-base font-extrabold text-coffee-900">{title}</h1>
          <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
          <p className="text-[11px] text-slate-500">
            Vui lòng liên hệ Phòng Nhân sự hoặc Quản trị viên hệ thống nếu bạn cần sử dụng chức năng này.
          </p>
        </div>
      </main>

      <BottomNavBar activeTab={activeTab} />
    </div>
  );
}
