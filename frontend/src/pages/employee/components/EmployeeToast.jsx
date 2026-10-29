import React from "react";
import { X } from "lucide-react";

/**
 * EmployeeToast – Thông báo nổi dùng chung cho các trang Cổng Nhân viên.
 * type: "success" | "error" | "info" (chỉ đổi màu viền bên trái)
 */
export default function EmployeeToast({ message, type = "info", onClose }) {
  if (!message) return null;

  const accent =
    type === "error" ? "border-l-rose-400" : type === "success" ? "border-l-emerald-400" : "border-l-gold-400";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[60] animate-slide-up">
      <div
        role={type === "error" ? "alert" : "status"}
        aria-live={type === "error" ? "assertive" : "polite"}
        className={`bg-coffee-900/95 text-white pl-4 pr-2 py-2.5 rounded-xl shadow-xl flex items-start justify-between gap-2 text-xs font-semibold border border-coffee-700 border-l-4 ${accent} backdrop-blur-md`}
      >
        <span className="leading-relaxed pt-0.5">{message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-coffee-200 hover:text-white hover:bg-white/10"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
