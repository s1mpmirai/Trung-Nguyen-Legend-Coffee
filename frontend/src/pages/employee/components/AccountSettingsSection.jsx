import React from "react";
import { KeyRound, ChevronRight, LogOut } from "lucide-react";

/**
 * AccountSettingsSection – Phần "Tài khoản & Bảo mật"
 *
 * - Đổi mật khẩu tài khoản đang đăng nhập
 * - Đăng xuất khỏi thiết bị
 *
 * @param {Function} onChangePassword – Mở hộp thoại đổi mật khẩu
 * @param {Function} onLogout         – Callback đăng xuất
 */
function AccountSettingsSection({ onChangePassword, onLogout }) {
  return (
    <section className="space-y-3 pb-4" aria-labelledby="ep-account-title">
      <div className="ep-card">
        <div className="ep-card__header">
          <div className="ep-card__header-left">
            <KeyRound className="ep-card__icon" aria-hidden="true" />
            <h3 id="ep-account-title" className="ep-card__title">Tài khoản & Bảo mật</h3>
          </div>
        </div>
        <div className="ep-card__body pt-1">
          <button className="ep-password-btn" type="button" onClick={onChangePassword}>
            <span className="ep-password-btn__left">
              <span className="ep-password-btn__text">
                <span className="ep-password-btn__title">Đổi mật khẩu</span>
                <span className="ep-password-btn__sub">Nên đổi mật khẩu định kỳ để bảo vệ tài khoản</span>
              </span>
            </span>
            <ChevronRight size={18} className="ep-password-btn__arrow" aria-hidden="true" />
          </button>
        </div>
      </div>

      <button className="ep-logout-btn" onClick={onLogout} type="button">
        <LogOut size={18} className="ep-logout-btn__icon" aria-hidden="true" />
        Đăng xuất khỏi thiết bị này
      </button>
    </section>
  );
}

export default AccountSettingsSection;
