import React from "react";
import { Inbox, RotateCcw } from "lucide-react";

/**
 * EmptyState – trạng thái "không có dữ liệu".
 * Khi đang áp dụng bộ lọc (hasFilters) hiển thị nút "Đặt lại bộ lọc" (onResetFilters).
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = "Chưa có dữ liệu",
  description,
  hasFilters = false,
  onResetFilters,
  action,
}) {
  return (
    <div className="py-14 px-6 flex flex-col items-center justify-center text-center gap-2">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-1">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-500 max-w-md">{description}</p>}
      {hasFilters && onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition cursor-pointer"
        >
          <RotateCcw size={13} aria-hidden="true" />
          Đặt lại bộ lọc
        </button>
      )}
      {action}
    </div>
  );
}
