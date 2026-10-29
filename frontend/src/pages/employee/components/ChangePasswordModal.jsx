import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getApiErrorMessage } from "../utils/format";

/**
 * PasswordField – ô nhập mật khẩu có nút ẩn/hiện
 */
function PasswordField({ id, label, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="ep-form-group">
      <label htmlFor={id} className="ep-form-label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="ep-form-input"
          style={{ paddingRight: 44 }}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-coffee-700"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

/**
 * ChangePasswordModal – Hộp thoại đổi mật khẩu tài khoản đang đăng nhập
 * POST /accounts/change-password { mat_khau_cu, mat_khau_moi } (mật khẩu mới tối thiểu 6 ký tự)
 */
function ChangePasswordModal({ isOpen, onClose, onSubmit }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Xóa dữ liệu cũ mỗi lần mở hộp thoại
  useEffect(() => {
    if (!isOpen) return;
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (!oldPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword === oldPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ mat_khau_cu: oldPassword, mat_khau_moi: newPassword });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ep-modal-overlay" onClick={handleClose}>
      <div
        className="ep-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ep-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ep-modal__header">
          <h3 id="ep-password-title" className="ep-modal__title">Đổi mật khẩu</h3>
          <button className="ep-modal__close-btn" type="button" onClick={handleClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {error && (
          <div className="ep-modal__alert ep-modal__alert--danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="ep-modal__form" noValidate>
          <PasswordField
            id="ep-old-password"
            label="Mật khẩu hiện tại"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
            autoComplete="current-password"
          />
          <PasswordField
            id="ep-new-password"
            label="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
          />
          <PasswordField
            id="ep-confirm-password"
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
          />

          <div className="ep-modal__actions">
            <button type="button" className="ep-btn ep-btn--secondary" onClick={handleClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button type="submit" className="ep-btn ep-btn--primary flex items-center gap-1.5" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
