import React, { useState, useEffect } from "react";
import { Lock, AlertCircle, Send, CheckCircle2 } from "lucide-react";

/**
 * EditProfileModal – Hộp thoại chỉnh sửa thông tin cá nhân của nhân viên
 * - Các thông tin cố định: Họ và tên, Mã NV, Phòng ban, Chức danh, Ngày vào làm (Disabled / Readonly)
 * - Các thông tin được phép sửa: Ngày tháng năm sinh, Giới tính, Số điện thoại, Email cá nhân
 * - Khi lưu: Gửi yêu cầu thay đổi về Quản lý trực tiếp phê duyệt
 */
function EditProfileModal({ isOpen, employee, onClose, onSave }) {
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("Nam");
  const [phone, setPhone] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (employee && isOpen) {
      setBirthDate(employee.birthDateRaw || "");
      setGender(employee.genderRaw || "Nam");
      setPhone(employee.phone === "Chưa cập nhật" ? "" : (employee.phone || ""));
      setPersonalEmail(
        employee.personalEmail === "Chưa cập nhật"
          ? ""
          : (employee.personalEmail || "")
      );
      setError(null);
    }
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Kiểm tra định dạng SĐT
    const cleanPhone = phone.trim();
    if (cleanPhone && !/^[0-9+() -]{9,15}$/.test(cleanPhone)) {
      setError("Số điện thoại không hợp lệ (từ 9 đến 15 chữ số).");
      return;
    }

    // Kiểm tra email cá nhân
    const cleanEmail = personalEmail.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Địa chỉ email cá nhân không hợp lệ.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        ngay_sinh: birthDate || null,
        gioi_tinh: gender,
        sdt: cleanPhone || null,
        personalEmail: cleanEmail || null,
        email: employee.email, // giữ nguyên email công ty
      });
      onClose();
    } catch (err) {
      setError(err.message || "Gửi yêu cầu chỉnh sửa thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal ep-modal--profile" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ────────────────────────────────────────── */}
        <div className="ep-modal__header">
          <div>
            <h3 className="ep-modal__title">Yêu cầu chỉnh sửa thông tin</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thông tin sau khi lưu sẽ được gửi đến Quản lý xét duyệt
            </p>
          </div>
          <button className="ep-modal__close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Thông báo quy trình phê duyệt */}
        <div className="bg-sky-50 border border-sky-200/80 rounded-xl p-3 mb-4 flex items-start space-x-2.5 text-xs text-sky-900">
          <AlertCircle size={16} className="text-sky-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Lưu ý:</strong> Các thông tin hành chính công ty (Họ tên, Phòng ban, Chức danh...) được khóa cố định. Các thông tin cá nhân sau khi sửa sẽ được chuyển về <strong>Quản lý trực tiếp</strong> để phê duyệt trước khi cập nhật chính thức vào hồ sơ.
          </div>
        </div>

        {error && <div className="ep-modal__alert ep-modal__alert--danger">{error}</div>}

        <form onSubmit={handleSubmit} className="ep-modal__form space-y-3.5 max-h-[68vh] overflow-y-auto pr-1">
          {/* ── CÁC TRƯỜNG CỐ ĐỊNH (KHÔNG CHO PHÉP SỬA) ───────────── */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={12} className="text-slate-400" />
              <span>Thông tin tổ chức (Khóa cố định)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">Họ và tên</label>
                <input
                  type="text"
                  value={employee?.fullName || ""}
                  disabled
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold cursor-not-allowed text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">Mã nhân viên</label>
                <input
                  type="text"
                  value={employee?.id || ""}
                  disabled
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[#0EA5E9] font-bold cursor-not-allowed text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">Phòng ban</label>
                <input
                  type="text"
                  value={employee?.department || employee?.departmentFull || ""}
                  disabled
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-not-allowed text-xs truncate"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">Chức danh</label>
                <input
                  type="text"
                  value={employee?.jobTitle || ""}
                  disabled
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-not-allowed text-xs truncate"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">Ngày vào làm</label>
                <input
                  type="text"
                  value={employee?.startDate || ""}
                  disabled
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-not-allowed text-xs"
                />
              </div>
            </div>
          </div>

          {/* ── CÁC TRƯỜNG ĐƯỢC PHÉP CHỈNH SỬA ─────────────────── */}
          <div className="space-y-3 pt-1">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Thông tin cá nhân (Được phép chỉnh sửa)
            </div>

            {/* Ngày tháng năm sinh */}
            <div className="ep-form-group">
              <label className="ep-form-label">
                Ngày tháng năm sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="ep-form-input text-xs"
                required
              />
            </div>

            {/* Giới tính */}
            <div className="ep-form-group">
              <label className="ep-form-label">
                Giới tính <span className="text-red-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="ep-form-input text-xs"
                required
              >
                <option value="Nam">Nam</option>
                <option value="Nu">Nữ</option>
                <option value="Khac">Khác</option>
              </select>
            </div>

            {/* Email cá nhân */}
            <div className="ep-form-group">
              <label className="ep-form-label">
                Email cá nhân
              </label>
              <input
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="VD: minhtam.nguyen@gmail.com"
                className="ep-form-input text-xs"
              />
            </div>

            {/* Số điện thoại */}
            <div className="ep-form-group">
              <label className="ep-form-label">
                Số điện thoại liên lạc
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0912345678"
                className="ep-form-input text-xs"
              />
            </div>
          </div>

          {/* ── Actions ────────────────────────────────────────── */}
          <div className="ep-modal__actions pt-2 border-t border-slate-100">
            <button
              type="button"
              className="ep-btn ep-btn--secondary text-xs"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="ep-btn ep-btn--primary text-xs flex items-center justify-center gap-1.5 bg-[#0EA5E9] hover:bg-sky-600 text-white"
              disabled={isSubmitting}
            >
              <Send size={14} />
              <span>{isSubmitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu phê duyệt"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;

