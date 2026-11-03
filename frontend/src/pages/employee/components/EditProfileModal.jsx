import React, { useState, useEffect } from "react";
import { Lock, AlertCircle, Send, Loader2 } from "lucide-react";
import { PROFILE_FIELD_LABELS, currentProfileValues } from "./profileFields";
import { getApiErrorMessage } from "../utils/format";
import { COMPANY_EMAIL_DOMAIN } from "../../../utils/orgRules";

// Kiểm tra các trường thay đổi (khớp backend/app/core/profile_rules.py; máy chủ kiểm tra lại khi gửi và khi duyệt)
const MIN_WORKING_AGE = 15;
const ageOn = (birth, today) =>
  today.getFullYear() - birth.getFullYear() -
  (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate()) ? 1 : 0);

const VALIDATORS = {
  sdt: (v) =>
    /^(?:\+84|0)\d{9,10}$/.test(v.replace(/[\s.()-]/g, "")) ? "" : "Số điện thoại không hợp lệ (10–11 chữ số, bắt đầu bằng 0 hoặc +84).",
  email: (v) =>
    new RegExp(`^[a-z0-9]+(?:[._-][a-z0-9]+)*@${COMPANY_EMAIL_DOMAIN.replace(/\./g, "\\.")}$`).test(v.toLowerCase())
      ? ""
      : `Email doanh nghiệp phải có dạng ten@${COMPANY_EMAIL_DOMAIN} (chữ không dấu, số và dấu chấm, gạch dưới hoặc gạch ngang).`,
  ngay_sinh: (v) => {
    const birth = new Date(`${v}T00:00:00`);
    const today = new Date();
    if (Number.isNaN(birth.getTime()) || birth > today || ageOn(birth, today) > 100) return "Ngày sinh không hợp lệ.";
    return ageOn(birth, today) < MIN_WORKING_AGE ? `Nhân sự phải đủ ${MIN_WORKING_AGE} tuổi trở lên.` : "";
  },
  so_tai_khoan: (v) => (/^[0-9]{6,20}$/.test(v.replace(/\s/g, "")) ? "" : "Số tài khoản chỉ gồm 6–20 chữ số."),
  ma_so_thue: (v) =>
    /^(?:[0-9]{10}(?:-?[0-9]{3})?|[0-9]{12})$/.test(v.replace(/\s/g, "")) ? "" : "Mã số thuế gồm 10, 12 hoặc 13 chữ số.",
  so_bhxh: (v) => (/^(?:[0-9]{10}|[0-9]{12})$/.test(v.replace(/\s/g, "")) ? "" : "Số sổ BHXH gồm 10 hoặc 12 chữ số."),
};

/**
 * EditProfileModal – Gửi YÊU CẦU chỉnh sửa thông tin cá nhân để Quản lý phê duyệt
 * - Thông tin tổ chức (Họ tên, Mã NV, Phòng ban, Chức danh, Ngày vào làm) bị khóa
 * - Chỉ gửi các trường thực sự thay đổi + lý do (bắt buộc)
 * - Gửi lại khi đang có yêu cầu chờ duyệt sẽ thay thế yêu cầu cũ
 */
function EditProfileModal({ isOpen, employee, pendingRequest, onClose, onSubmit }) {
  const [form, setForm] = useState({});
  const [lyDo, setLyDo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Mỗi lần mở: lấy giá trị hiện tại, ghi đè bằng nội dung yêu cầu đang chờ (nếu có)
  useEffect(() => {
    if (!employee || !isOpen) return;
    setForm({ ...currentProfileValues(employee), ...(pendingRequest?.thong_tin_moi || {}) });
    setLyDo(pendingRequest?.ly_do || "");
    setError(null);
  }, [employee, pendingRequest, isOpen]);

  if (!isOpen) return null;

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    const current = currentProfileValues(employee);
    const thongTinMoi = {};
    for (const key of Object.keys(PROFILE_FIELD_LABELS)) {
      const newVal = String(form[key] ?? "").trim();
      const oldVal = String(current[key] ?? "").trim();
      if (newVal === oldVal) continue;
      if (!newVal) {
        setError(`Không thể để trống “${PROFILE_FIELD_LABELS[key]}” khi hồ sơ đã có thông tin này.`);
        return;
      }
      const fieldError = VALIDATORS[key]?.(newVal);
      if (fieldError) {
        setError(fieldError);
        return;
      }
      thongTinMoi[key] = newVal;
    }

    if (Object.keys(thongTinMoi).length === 0) {
      setError("Bạn chưa thay đổi thông tin nào so với hồ sơ hiện tại.");
      return;
    }
    if (lyDo.trim().length < 5) {
      setError("Vui lòng nhập lý do chỉnh sửa (tối thiểu 5 ký tự).");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ thong_tin_moi: thongTinMoi, ly_do: lyDo.trim() });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Gửi yêu cầu chỉnh sửa thất bại. Vui lòng thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const lockedInput =
    "w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-not-allowed text-xs truncate";

  const renderInput = (key, props = {}) => (
    <div className="ep-form-group" key={key}>
      <label htmlFor={`ep-${key}`} className="ep-form-label">
        {PROFILE_FIELD_LABELS[key]}
      </label>
      <input
        id={`ep-${key}`}
        value={form[key] ?? ""}
        onChange={setField(key)}
        className="ep-form-input text-xs"
        {...props}
      />
    </div>
  );

  return (
    <div className="ep-modal-overlay" onClick={handleClose}>
      <div
        className="ep-modal ep-modal--profile"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ep-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ep-modal__header">
          <div>
            <h3 id="ep-edit-title" className="ep-modal__title">Yêu cầu chỉnh sửa thông tin</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thông tin chỉ được cập nhật sau khi Quản lý phê duyệt
            </p>
          </div>
          <button className="ep-modal__close-btn" type="button" onClick={handleClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 mb-3 flex items-start space-x-2.5 text-xs text-coffee-900">
          <AlertCircle size={16} className="text-gold-700 flex-shrink-0 mt-0.5" />
          <div>
            {pendingRequest ? (
              <>Bạn đang có <strong>yêu cầu #{pendingRequest.ma_yc}</strong> chờ duyệt. Gửi lại sẽ <strong>thay thế</strong> yêu cầu đó.</>
            ) : (
              <>Thông tin tổ chức được khóa cố định. Các thay đổi cá nhân sẽ được gửi tới <strong>Quản lý trực tiếp</strong> để phê duyệt trước khi cập nhật vào hồ sơ.</>
            )}
          </div>
        </div>

        {error && (
          <div className="ep-modal__alert ep-modal__alert--danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="ep-modal__form space-y-3.5 max-h-[60vh] overflow-y-auto pr-1" noValidate>
          {/* ── THÔNG TIN TỔ CHỨC (KHÔNG CHO PHÉP SỬA) ───────────── */}
          <fieldset className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
            <legend className="sr-only">Thông tin tổ chức (khóa cố định)</legend>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5" aria-hidden="true">
              <Lock size={12} className="text-slate-400" />
              <span>Thông tin tổ chức (khóa cố định)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5 font-medium">Họ và tên</span>
                <input type="text" value={employee?.fullName || ""} disabled aria-label="Họ và tên" className={`${lockedInput} font-semibold`} />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5 font-medium">Mã nhân viên</span>
                <input type="text" value={employee?.id || ""} disabled aria-label="Mã nhân viên" className={`${lockedInput} font-bold text-coffee-700`} />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5 font-medium">Phòng ban</span>
                <input type="text" value={employee?.department || ""} disabled aria-label="Phòng ban" className={lockedInput} />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5 font-medium">Chức danh</span>
                <input type="text" value={employee?.jobTitle || ""} disabled aria-label="Chức danh" className={lockedInput} />
              </div>
            </div>
          </fieldset>

          {/* ── THÔNG TIN CÁ NHÂN ĐƯỢC PHÉP YÊU CẦU CHỈNH SỬA ───── */}
          <fieldset className="space-y-0.5 pt-1">
            <legend className="text-[11px] font-bold text-coffee-800 uppercase tracking-wider mb-2">
              Thông tin cá nhân
            </legend>

            <div className="grid grid-cols-2 gap-x-2">
              {renderInput("ngay_sinh", { type: "date" })}
              <div className="ep-form-group">
                <label htmlFor="ep-gioi_tinh" className="ep-form-label">{PROFILE_FIELD_LABELS.gioi_tinh}</label>
                <select id="ep-gioi_tinh" value={form.gioi_tinh || ""} onChange={setField("gioi_tinh")} className="ep-form-input text-xs">
                  <option value="" disabled>Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nu">Nữ</option>
                  <option value="Khac">Khác</option>
                </select>
              </div>
            </div>
            {renderInput("sdt", { type: "tel", inputMode: "tel", placeholder: "VD: 0912345678", autoComplete: "tel" })}
            {renderInput("email", { type: "email", placeholder: `VD: ten@${COMPANY_EMAIL_DOMAIN}`, autoComplete: "email" })}
            {renderInput("dia_chi", { type: "text", placeholder: "Số nhà, đường, phường/xã, tỉnh/thành phố", autoComplete: "street-address" })}
          </fieldset>

          <fieldset className="space-y-0.5">
            <legend className="text-[11px] font-bold text-coffee-800 uppercase tracking-wider mb-2">
              Ngân hàng & Thuế
            </legend>
            <div className="grid grid-cols-2 gap-x-2">
              {renderInput("so_tai_khoan", { type: "text", inputMode: "numeric" })}
              {renderInput("ngan_hang", { type: "text", placeholder: "VD: Vietcombank" })}
              {renderInput("ma_so_thue", { type: "text", inputMode: "numeric" })}
              {renderInput("so_bhxh", { type: "text", inputMode: "numeric" })}
            </div>
          </fieldset>

          <div className="ep-form-group">
            <label htmlFor="ep-ly-do" className="ep-form-label">
              Lý do chỉnh sửa <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="ep-ly-do"
              rows={3}
              maxLength={500}
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              placeholder="VD: Đổi số điện thoại mới, cập nhật tài khoản nhận lương..."
              className="ep-form-input text-xs"
              required
            />
          </div>

          <div className="ep-modal__actions pt-2 border-t border-slate-100">
            <button type="button" className="ep-btn ep-btn--secondary text-xs" onClick={handleClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button
              type="submit"
              className="ep-btn ep-btn--primary text-xs flex items-center justify-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{isSubmitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu phê duyệt"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
