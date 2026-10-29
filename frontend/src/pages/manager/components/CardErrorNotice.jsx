import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Thông báo lỗi trong một thẻ Dashboard khi API của riêng thẻ đó không tải được
 * (vd: 403 không đủ quyền), để các thẻ khác vẫn hiển thị bình thường.
 */
export default function CardErrorNotice({ message, compact = false }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-1.5 text-rose-700 bg-rose-50 border border-rose-100 rounded-lg ${
        compact ? "text-[11px] px-2 py-1.5" : "text-xs px-3 py-3 my-4"
      }`}
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
      <span>{message}</span>
    </div>
  );
}
