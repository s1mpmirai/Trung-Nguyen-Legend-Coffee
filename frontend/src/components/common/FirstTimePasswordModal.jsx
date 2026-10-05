import React, { useState } from "react";
import {
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import logoImg from "../../assets/logo/Logo Trung Nguyên_black.png";

export default function FirstTimePasswordModal({
  userSession,
  onPasswordChanged,
  onLogout,
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!newPassword.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (newPassword.trim() === "1") {
      setErrorMessage("Mật khẩu mới không được trùng với mật khẩu mặc định (1). Vui lòng chọn mật khẩu bảo mật hơn!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/first-time-change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ma_nv: userSession?.ma_nv,
          mat_khau_moi: newPassword.trim(),
        }),
      });

      if (!response.ok) {
        let errText = "Không thể đổi mật khẩu. Vui lòng thử lại!";
        try {
          const errData = await response.json();
          if (errData && errData.detail) errText = errData.detail;
        } catch (_) {}
        setErrorMessage(errText);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setIsLoading(false);

      if (onPasswordChanged) {
        onPasswordChanged({
          ...userSession,
          must_change_password: false,
          token: data.access_token || userSession?.token,
          role: data.ma_vai_tro || userSession?.role,
        });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage("Lỗi kết nối máy chủ. Vui lòng thử lại sau!");
    }
  };

  return (
    <div
      onClick={onLogout}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col justify-between"
      >
        {/* Nút X đóng popup / đăng xuất */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            title="Đóng / Thoát"
          >
            <X size={18} />
          </button>
        )}

        <div>
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xs mb-3">
              <img
                src={logoImg}
                alt="Trung Nguyên Legend Logo"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 mb-2">
              <ShieldAlert size={13} className="text-amber-600" />
              <span>Bảo mật tài khoản mới</span>
            </div>

            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl text-slate-900 tracking-tight">
              Đổi Mật Khẩu Lần Đầu
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tài khoản <strong className="text-slate-800 font-mono font-bold">{userSession?.ma_nv}</strong> đang dùng mật khẩu khởi tạo mặc định. Vui lòng thiết lập mật khẩu cá nhân để kích hoạt quyền truy cập.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form đổi mật khẩu */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
            {/* Mã NV */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Tài khoản nhân sự
              </label>
              <input
                type="text"
                value={userSession?.ma_nv || ""}
                disabled
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-600 cursor-not-allowed"
              />
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới (khác 1)..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Xác nhận lại mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Đang kích hoạt tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Kích hoạt tài khoản & Vào hệ thống</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut size={14} />
                  <span>Đăng xuất (Để sau)</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
