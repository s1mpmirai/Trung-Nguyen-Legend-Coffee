import React, { useEffect, useId, useRef } from "react";

// Ngăn xếp các hộp thoại đang mở: phím Esc chỉ đóng hộp thoại trên cùng
const dialogStack = [];

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * useDialog – hành vi chuẩn cho hộp thoại: Esc để đóng, đưa focus vào hộp thoại khi mở,
 * giữ Tab trong hộp thoại và trả focus về phần tử cũ khi đóng.
 * - initialFocusRef: phần tử nhận focus đầu tiên (mặc định: phần tử focus được đầu tiên)
 * - canClose: false khi đang gửi yêu cầu (chặn Esc)
 */
export function useDialog({ open, onClose, panelRef, initialFocusRef, canClose = true }) {
  const onCloseRef = useRef(onClose);
  const canCloseRef = useRef(canClose);
  onCloseRef.current = onClose;
  canCloseRef.current = canClose;

  useEffect(() => {
    if (!open) return undefined;
    const token = {};
    dialogStack.push(token);
    const previouslyFocused = document.activeElement;

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef?.current;
      const target =
        initialFocusRef?.current ||
        (panel && panel.querySelector("[data-autofocus]")) ||
        (panel && panel.querySelector(FOCUSABLE)) ||
        panel;
      if (target && typeof target.focus === "function") target.focus();
    }, 0);

    const handleKeyDown = (e) => {
      if (dialogStack[dialogStack.length - 1] !== token) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        if (canCloseRef.current && onCloseRef.current) onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && panelRef?.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null || el === document.activeElement
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      const idx = dialogStack.lastIndexOf(token);
      if (idx >= 0) dialogStack.splice(idx, 1);
      if (previouslyFocused && typeof previouslyFocused.focus === "function" && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

/**
 * Modal – khung hộp thoại dùng chung (role="dialog", aria-modal, Esc để đóng, bấm nền để đóng).
 * Truyền `title` để tự gắn aria-labelledby, hoặc `labelledBy` nếu tiêu đề nằm trong children.
 */
export default function Modal({
  open = true,
  onClose,
  title,
  labelledBy,
  describedBy,
  ariaLabel,
  children,
  panelClassName = "max-w-lg",
  closeOnBackdrop = true,
  canClose = true,
  initialFocusRef,
  zIndex = "z-50",
}) {
  const panelRef = useRef(null);
  const autoId = useId();
  useDialog({ open, onClose, panelRef, initialFocusRef, canClose });

  if (!open) return null;

  const titleId = labelledBy || (title ? `${autoId}-title` : undefined);

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && closeOnBackdrop && canClose && onClose) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        aria-label={!titleId ? ariaLabel : undefined}
        tabIndex={-1}
        className={`relative bg-white rounded-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto focus:outline-none ${panelClassName}`}
      >
        {title && (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
