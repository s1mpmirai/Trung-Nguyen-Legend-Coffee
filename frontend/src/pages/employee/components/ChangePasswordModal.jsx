import React, { useState } from "react";

/**
 * ChangePasswordModal – Hộp thoại đổi mật khẩu tài khoản
 */
function ChangePasswordModal({ isOpen, employeeId, onClose, onSuccess }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSuccess({
        ma_nv: employeeId,
        mat_khau_cu: oldPassword,
        mat_khau_moi: newPassword,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ep-modal__header">
          <h3 className="ep-modal__title">Đổi mật khẩu tài khoản</h3>
          <button className="ep-modal__close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="ep-modal__alert ep-modal__alert--danger">{error}</div>}

        <form onSubmit={handleSubmit} className="ep-modal__form">
          <div className="ep-form-group">
            <label className="ep-form-label">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              className="ep-form-input"
              required
            />
          </div>

          <div className="ep-form-group">
            <label className="ep-form-label">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="ep-form-input"
              required
            />
          </div>

          <div className="ep-form-group">
            <label className="ep-form-label">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="ep-form-input"
              required
            />
          </div>

          <div className="ep-modal__actions">
            <button
              type="button"
              className="ep-btn ep-btn--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="ep-btn ep-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
