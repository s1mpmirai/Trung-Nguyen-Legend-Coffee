import React from "react";
import { Smartphone } from "lucide-react";

/**
 * EmployeeLoginButton – nút trên header Cổng Quản trị / Cổng Quản lý,
 * mở trang đăng nhập Cổng Nhân viên (chấm công, đơn từ, phiếu lương).
 */
export default function EmployeeLoginButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      title="Mở trang đăng nhập Cổng Nhân viên (chấm công, đơn từ, phiếu lương)"
    >
      <Smartphone size={13} aria-hidden="true" />
      Đăng nhập Cổng Nhân viên
    </button>
  );
}
