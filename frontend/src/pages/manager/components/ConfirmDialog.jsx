import React, { useEffect, useId, useRef } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";

/**
 * Đóng hộp thoại bằng phím Esc (dùng chung cho các modal của Cổng Quản lý).
 * Không đóng khi đang gửi dữ liệu (disabled = true).
 */
export function useEscapeKey(active, onEscape, disabled = false) {
  const handlerRef = useRef(onEscape);
  handlerRef.current = onEscape;
  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !disabled) {
        e.stopPropagation();
        handlerRef.current?.();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, disabled]);
}

const TONES = {
  danger: {
    iconWrap: "bg-rose-100 text-rose-600",
    button: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-300",
    Icon: AlertTriangle,
  },
  warning: {
    iconWrap: "bg-amber-100 text-amber-600",
    button: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-300",
    Icon: AlertTriangle,
  },
  success: {
    iconWrap: "bg-emerald-100 text-emerald-600",
    button: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-300",
    Icon: CheckCircle2,
  },
  primary: {
    iconWrap: "bg-sky-100 text-sky-600",
    button: "bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-300",
    Icon: Info,
  },
};

/**
 * Hộp thoại xác nhận dùng cho các thao tác quan trọng / không thể hoàn tác.
 * - role="dialog" + aria-modal, đóng bằng Esc hoặc bấm nền (khi không bận)
 * - Chặn bấm lặp khi đang gửi (busy)
 * - Hiển thị lỗi từ máy chủ ngay trong hộp thoại (error)
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy bỏ",
  tone = "primary",
  busy = false,
  error = "",
  confirmDisabled = false,
  icon: IconOverride,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEscapeKey(open, onCancel, busy);

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement;
    const t = setTimeout(() => cancelRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      if (previouslyFocused.current && typeof previouslyFocused.current.focus === "function") {
        previouslyFocused.current.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  const toneStyle = TONES[tone] || TONES.primary;
  const Icon = IconOverride || toneStyle.Icon;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 pt-5 pb-4 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toneStyle.iconWrap}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id={titleId} className="font-bold text-sm text-slate-900">
              {title}
            </h3>
            {description && (
              <div id={descId} className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children && <div className="px-6 pb-4 text-xs">{children}</div>}

        {error && (
          <div
            role="alert"
            className="mx-6 mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${toneStyle.button}`}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{busy ? "Đang xử lý..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
