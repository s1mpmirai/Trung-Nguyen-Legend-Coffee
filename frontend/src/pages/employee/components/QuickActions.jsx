import React from "react";

/**
 * QuickActions – 3 nút hành động nhanh: In phiếu tháng, In bảng năm, Gửi email.
 * TODO: Backend chưa hỗ trợ API xuất PDF/Excel/Email → hiện tại chỉ hiển thị UI.
 */
function QuickActions({ onPrint, onExportExcel, onSendEmail }) {
  const actions = [
    {
      key: "print",
      label: "In phiếu tháng (PDF)",
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
      key: "excel",
      label: "In bảng năm (Excel/PDF)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
          <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
      onClick: onExportExcel,
    },
    {
      key: "email",
      label: "Gửi bản sao Email",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onClick: onSendEmail,
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
