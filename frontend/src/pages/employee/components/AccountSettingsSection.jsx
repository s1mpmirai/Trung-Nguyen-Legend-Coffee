import React from "react";

/**
 * AccountSettingsSection – Phần "Cài đặt tài khoản & Bảo mật"
 *
 * Hiển thị: Nút đổi mật khẩu, thông tin lần đổi gần nhất,
 * và nút đăng xuất.
 *
 * @param {string}   lastPasswordChange – Text mô tả lần đổi mật khẩu
 * @param {Function} onChangePassword   – Callback đổi mật khẩu
 * @param {Function} onLogout           – Callback đăng xuất
 */
function AccountSettingsSection({ lastPasswordChange, onChangePassword, onLogout }) {
  return (
    <section className="ep-card">
      {/* ── Tiêu đề ──────────────────────────────────────────── */}
      <div className="ep-card__header">
        <div className="ep-card__header-left">
          <svg className="ep-card__icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <h3 className="ep-card__title">Cài đặt tài khoản & Bảo mật</h3>
        </div>
      </div>

      {/* ── Đổi mật khẩu ─────────────────────────────────────── */}
      <div className="ep-card__body">
        <button
          className="ep-password-btn"
          onClick={onChangePassword}
          type="button"
        >
          <div className="ep-password-btn__left">
            <svg className="ep-password-btn__icon" viewBox="0 0 24 24" fill="none" width="22" height="22">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1.5" fill="currentColor" />
            </svg>
            <div className="ep-password-btn__text">
              <span className="ep-password-btn__title">Đổi mật khẩu tài khoản</span>
              <span className="ep-password-btn__sub">
                Lần đổi gần nhất: {lastPasswordChange}
              </span>
            </div>
          </div>

          {/* Mũi tên phải */}
          <svg viewBox="0 0 20 20" fill="none" width="18" height="18" className="ep-password-btn__arrow">
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ── Nút đăng xuất ─────────────────────────────────────── */}
      <div className="ep-card__footer">
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
      </div>
    </section>
  );
}

export default AccountSettingsSection;
