import React, { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, ShieldAlert, HelpCircle, Loader2, AlertCircle } from "lucide-react";
import { useDialog } from "./Modal";

const VARIANTS = {
  danger: {
    icon: AlertTriangle,
    iconWrap: "bg-rose-50 text-rose-600 border-rose-100",
    confirm: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500 text-white",
  },
  warning: {
    icon: ShieldAlert,
    iconWrap: "bg-amber-50 text-amber-600 border-amber-100",
    confirm: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500 text-white",
  },
  primary: {
    icon: HelpCircle,
    iconWrap: "bg-sky-50 text-sky-600 border-sky-100",
    confirm: "bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-500 text-white",
  },
};

/**
 * ConfirmDialog – hộp thoại xác nhận dùng chung cho thao tác nguy hiểm.
 * - role="dialog", aria-modal, Esc để đóng, focus mặc định vào nút AN TOÀN (Hủy)
 * - variant: "danger" (đỏ) | "warning" | "primary"
 * - onConfirm có thể trả về Promise: trong lúc chờ, nút bị khóa để chặn bấm 2 lần;
 *   nếu Promise lỗi, thông báo lỗi hiển thị ngay trong hộp thoại (vd: 403 từ máy chủ).
 * - children: nội dung bổ sung (vd: ô chọn ngày thanh lý)
 * - confirmDisabled: khóa nút xác nhận khi dữ liệu bổ sung chưa hợp lệ
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  children,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy bỏ",
  variant = "danger",
  icon,
  onConfirm,
  onCancel,
  confirmDisabled = false,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setError("");
    }
  }, [open]);

  useDialog({ open, onClose: onCancel, panelRef, initialFocusRef: cancelRef, canClose: !submitting });

  if (!open) return null;

  const style = VARIANTS[variant] || VARIANTS.danger;
  const Icon = icon || style.icon;

  const handleConfirm = async () => {
    if (submitting || confirmDisabled) return;
    setError("");
    setSubmitting(true);
    try {
      await onConfirm?.();
    } catch (err) {
      setError(err?.message || "Thao tác thất bại. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? descId : undefined}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up"
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.iconWrap}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
              {title}
            </h3>
            {message && (
              <div id={descId} className="text-xs text-slate-600 leading-relaxed mt-1.5">
                {message}
              </div>
            )}
          </div>
        </div>

        {children && <div className="mt-4 text-xs">{children}</div>}

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2.5 mt-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || confirmDisabled}
            aria-busy={submitting}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${style.confirm}`}
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            <span>{submitting ? "Đang xử lý..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
