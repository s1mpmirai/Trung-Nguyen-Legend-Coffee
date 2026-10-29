import React, { useId, useRef, useState } from "react";
import { ShieldAlert, Eye, EyeOff, Loader2, ArrowRight, LogOut, CheckCircle2, Circle } from "lucide-react";
import logoImg from "../../assets/logo/Logo Trung Nguyên_black.png";
import { firstTimeChangePassword } from "../../services/adminService";
import { useDialog } from "./Modal";

const MIN_LENGTH = 6;

/**
 * FirstTimePasswordModal – bắt buộc đổi mật khẩu tạm ở lần đăng nhập đầu
 * (tài khoản do Admin cấp mới hoặc vừa được Admin đặt lại mật khẩu).
 * - Chặn toàn bộ ứng dụng cho đến khi đổi xong (không có nút đóng, Esc không đóng)
 * - Gửi Bearer token nhận được từ bước đăng nhập, body { mat_khau_moi }
 * - Thành công: trả token mới cho App qua onPasswordChanged để vào đúng cổng
 */
export default function FirstTimePasswordModal({ userSession, onPasswordChanged, onLogout }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const panelRef = useRef(null);
  const firstInputRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  // Hộp thoại chặn: Esc không đóng được
  useDialog({ open: true, onClose: () => {}, panelRef, initialFocusRef: firstInputRef, canClose: false });

  const trimmed = newPassword.trim();
  const rules = [
    { ok: trimmed.length >= MIN_LENGTH, label: `Tối thiểu ${MIN_LENGTH} ký tự` },
    { ok: trimmed.length > 0 && trimmed !== "1", label: "Không dùng mật khẩu mặc định" },
    { ok: trimmed.length > 0 && trimmed === confirmPassword.trim(), label: "Khớp với ô xác nhận" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!trimmed) {
      setErrorMessage("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (trimmed.length < MIN_LENGTH) {
      setErrorMessage(`Mật khẩu mới phải có ít nhất ${MIN_LENGTH} ký tự.`);
      return;
    }
    if (trimmed === "1") {
      setErrorMessage("Không được dùng mật khẩu mặc định. Vui lòng chọn mật khẩu bảo mật hơn!");
      return;
    }
    if (trimmed !== confirmPassword.trim()) {
      setErrorMessage("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!");
      return;
    }

    setIsLoading(true);
    try {
      const data = await firstTimeChangePassword(trimmed, userSession?.token);
      onPasswordChanged?.({
        ...userSession,
        must_change_password: false,
        token: data?.access_token || userSession?.token,
        role: data?.ma_vai_tro || userSession?.role,
      });
    } catch (err) {
      setErrorMessage(err?.message || "Không thể đổi mật khẩu. Vui lòng thử lại!");
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-br from-slate-100 via-sky-50/60 to-slate-200 p-4 overflow-y-auto animate-fade-in">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col"
      >
        {/* Header & Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xs mb-3">
            <img src={logoImg} alt="Trung Nguyên Legend" className="w-full h-full object-contain pointer-events-none" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 mb-2">
            <ShieldAlert size={13} className="text-amber-600" aria-hidden="true" />
            <span>Bảo mật tài khoản</span>
          </div>

          <h2 id={titleId} className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl text-slate-900 tracking-tight">
            Đổi mật khẩu lần đầu
          </h2>
          <p id={descId} className="text-xs text-slate-500 mt-1 leading-relaxed">
            Tài khoản <strong className="text-slate-800 font-mono font-bold">{userSession?.ma_nv}</strong> đang dùng
            mật khẩu tạm do Quản trị viên cấp. Vui lòng đặt mật khẩu cá nhân trước khi tiếp tục sử dụng hệ thống.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-shake"
          >
            <ShieldAlert size={16} className="shrink-0 text-rose-600" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="ftp-new" className="block text-xs font-semibold text-slate-700">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="ftp-new"
                ref={firstInputRef}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={`Tối thiểu ${MIN_LENGTH} ký tự`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ftp-confirm" className="block text-xs font-semibold text-slate-700">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="ftp-confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <ul className="space-y-1 text-[11px]" aria-label="Yêu cầu mật khẩu">
            {rules.map((rule) => (
              <li key={rule.label} className={`flex items-center gap-1.5 ${rule.ok ? "text-emerald-700" : "text-slate-400"}`}>
                {rule.ok ? <CheckCircle2 size={12} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}
                <span>{rule.label}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" aria-hidden="true" />
                  <span>Đang cập nhật mật khẩu...</span>
                </>
              ) : (
                <>
                  <span>Đổi mật khẩu & tiếp tục</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </>
              )}
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <LogOut size={14} aria-hidden="true" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
