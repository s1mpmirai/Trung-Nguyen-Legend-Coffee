import React from "react";

/**
 * QuickActions – 2 nút hành động nhanh: In phiếu lương tháng, In bảng lương năm.
 */
function QuickActions({ onPrint, onPrintYear }) {
  const actions = [
    {
      key: "print",
      label: "In phiếu lương tháng",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
          <rect x="6" y="2" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.6"/>
          <rect x="4" y="8" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M8 14h8M8 17h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
      onClick: onPrint,
    },
    {
      key: "print-year",
      label: "In bảng lương năm",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
      onClick: onPrintYear,
    },
  ];

  return (
    <section className="pr-quick-actions">
      <h4 className="pr-quick-actions__title">HÀNH ĐỘNG NHANH</h4>
      <div className="pr-quick-actions__grid">
        {actions.map((a) => (
          <button
            key={a.key}
            className="pr-quick-action-btn"
            onClick={a.onClick}
            type="button"
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
