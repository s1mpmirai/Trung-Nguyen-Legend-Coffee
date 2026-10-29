import React from "react";
import { Printer, CalendarRange } from "lucide-react";

/**
 * QuickActions – 2 nút hành động nhanh: In phiếu lương tháng đang xem, In bảng tổng hợp năm.
 */
function QuickActions({ onPrintMonth, onPrintYear, canPrintMonth = true, disabled = false }) {
  const actions = [
    {
      key: "print",
      label: "In phiếu lương tháng",
      icon: <Printer size={22} aria-hidden="true" />,
      onClick: onPrintMonth,
      isDisabled: disabled || !canPrintMonth,
      hint: !canPrintMonth ? "Tháng đang xem chưa có phiếu lương đã duyệt" : undefined,
    },
    {
      key: "print-year",
      label: "In bảng lương năm",
      icon: <CalendarRange size={22} aria-hidden="true" />,
      onClick: onPrintYear,
      isDisabled: disabled,
    },
  ];

  return (
    <section className="pr-quick-actions" aria-labelledby="pr-quick-actions-title">
      <h2 id="pr-quick-actions-title" className="pr-quick-actions__title">Hành động nhanh</h2>
      <div className="pr-quick-actions__grid">
        {actions.map((a) => (
          <button
            key={a.key}
            className="pr-quick-action-btn"
            onClick={a.onClick}
            type="button"
            disabled={a.isDisabled}
            title={a.hint}
          >
            <span className="pr-quick-action-btn__icon">{a.icon}</span>
            <span className="pr-quick-action-btn__label">{a.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActions;
