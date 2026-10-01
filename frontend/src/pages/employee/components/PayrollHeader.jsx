import React from "react";

/**
 * PayrollHeader – Thanh tiêu đề trang Bảng Lương.
 */
function PayrollHeader({ isLoading }) {
  return (
    <header className="pr-topbar">
      <div className="pr-topbar__left">
        <span className="pr-topbar__logo">WORKPULSE HR</span>
        <h1 className="pr-topbar__title">Bảng Lương</h1>
      </div>
      <div className="pr-topbar__right">
        {isLoading && <span className="pr-spinner" />}
        {/* Icon thông báo */}
        <button className="pr-topbar__icon-btn" type="button" aria-label="Thông báo">
          <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
            <path d="M10 2a5 5 0 00-5 5v3l-1.3 2.6a.5.5 0 00.45.72h11.7a.5.5 0 00.45-.72L15 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M8 15a2 2 0 104 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
        {/* Icon user */}
        <button className="pr-topbar__icon-btn" type="button" aria-label="Tài khoản">
          <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
            <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M3 17c0-2.8 3-5 7-5s7 2.2 7 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}

export default PayrollHeader;
