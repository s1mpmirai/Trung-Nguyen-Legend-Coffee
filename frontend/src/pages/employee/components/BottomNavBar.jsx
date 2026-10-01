import React from "react";

/**
 * BottomNavBar – Thanh điều hướng dưới cùng
 *
 * Gồm 4 tab: Chấm công, Đơn từ, Bảng lương, Cá nhân.
 *
 * @param {string} activeTab – Tab đang active: "attendance" | "requests" | "payroll" | "personal"
 */

/* ── Cấu hình các tab ────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    key: "attendance",
    label: "Chấm công",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M9 14l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "requests",
    label: "Đơn từ",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 8h8M8 12h6M8 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "payroll",
    label: "Bảng lương",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2 9h2M20 9h2M2 15h2M20 15h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "personal",
    label: "Cá nhân",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

function BottomNavBar({ activeTab }) {
  // Map tab key → hash route
  const tabRoutes = {
    attendance: "#/attendance",
    requests: "#/requests",
    payroll: "#/payroll",
    personal: "#/profile",
  };

  const handleNav = (key) => {
    window.location.hash = tabRoutes[key] || "#/profile";
  };

  return (
    <nav className="ep-bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === activeTab;

        return (
          <button
            key={item.key}
            className={`ep-bottom-nav__item ${isActive ? "ep-bottom-nav__item--active" : ""}`}
            type="button"
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => handleNav(item.key)}
          >
            <span className="ep-bottom-nav__icon">{item.icon}</span>
            <span className="ep-bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}


export default BottomNavBar;
