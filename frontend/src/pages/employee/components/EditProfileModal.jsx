import React, { useState } from "react";

/**
 * EditProfileModal – Hộp thoại cập nhật thông tin liên hệ nhân viên
 */
function EditProfileModal({ isOpen, employee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    phone: employee.phone || "",
    email: employee.email || "",
    address: employee.address || "",
    bankAccount: employee.bankAccount || "",
    bankName: employee.bankName || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        sdt: formData.phone,
        email: formData.email,
        dia_chi: formData.address,
        so_tai_khoan: formData.bankAccount,
        ngan_hang: formData.bankName,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Không thể cập nhật thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ep-modal__header">
          <h3 className="ep-modal__title">Chỉnh sửa liên hệ</h3>
          <button className="ep-modal__close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="ep-modal__alert ep-modal__alert--danger">{error}</div>}

        <form onSubmit={handleSubmit} className="ep-modal__form">
          <div className="ep-form-group">
            <label className="ep-form-label">Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0982 739 418"
              className="ep-form-input"
              required
            />
          </div>

          <div className="ep-form-group">
            <label className="ep-form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@trungnguyen.vn"
              className="ep-form-input"
              required
            />
          </div>

          <div className="ep-form-group">
            <label className="ep-form-label">Địa chỉ</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Quận/Huyện, Tỉnh/TP"
              className="ep-form-input"
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
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
