import React from "react";

/**
 * AccountSettingsSection – Phần "Tài khoản & Phiên đăng nhập"
 *
 * Hiển thị nút đăng xuất an toàn khỏi thiết bị.
 *
 * @param {Function} onLogout – Callback đăng xuất
 */
function AccountSettingsSection({ onLogout }) {
  return (
    <section className="pt-1 pb-4">
      <button
        className="ep-logout-btn"
        onClick={onLogout}
        type="button"
      >
        <svg className="ep-logout-btn__icon" viewBox="0 0 20 20" fill="none" width="18" height="18">
          <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 10h7m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Đăng xuất khỏi thiết bị này
      </button>
    </section>
  );
}

export default AccountSettingsSection;
