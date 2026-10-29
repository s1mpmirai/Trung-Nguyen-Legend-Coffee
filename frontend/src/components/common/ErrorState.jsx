import React from "react";
import { AlertCircle, ShieldOff, RefreshCw } from "lucide-react";

/**
 * ErrorState – trạng thái lỗi tải dữ liệu (khác với trạng thái rỗng).
 * - error: Error từ apiClient (có .status) hoặc chuỗi thông báo
 * - 403: hiển thị "Bạn không có quyền…" thay vì bảng trống
 * - onRetry: nút "Thử lại"
 */
export default function ErrorState({ error, onRetry, title, compact = false }) {
  const status = typeof error === "object" && error ? error.status : undefined;
  const message = typeof error === "string" ? error : error?.message;
  const isForbidden = status === 403;

  const heading =
    title || (isForbidden ? "Bạn không có quyền truy cập dữ liệu này" : "Không thể tải dữ liệu");
  const detail = isForbidden
    ? message && !/^Lỗi hệ thống/.test(message)
      ? message
      : "Tài khoản của bạn chưa được cấp quyền cho chức năng này. Vui lòng liên hệ Quản trị viên nếu cần truy cập."
    : message || "Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại.";

  const Icon = isForbidden ? ShieldOff : AlertCircle;

  return (
    <div
      role="alert"
      className={`${compact ? "py-8" : "py-14"} px-6 flex flex-col items-center justify-center text-center gap-2`}
    >
      <div
        className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-1 ${
          isForbidden ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-rose-50 border-rose-100 text-rose-600"
        }`}
      >
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{heading}</p>
      <p className="text-xs text-slate-500 max-w-md">{detail}</p>
      {onRetry && !isForbidden && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw size={13} aria-hidden="true" />
          Thử lại
        </button>
      )}
    </div>
  );
}
