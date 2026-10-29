import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import logoImg from '../../assets/logo/Logo Trung Nguyên_black.png';
import { loginManagePortal } from '../../services/adminService';

// Tài khoản mẫu chỉ hiển thị khi chạy môi trường phát triển (npm run dev)
const DEV_SAMPLE_ACCOUNTS = import.meta.env.DEV
  ? [
      { id: 'NV01', label: 'Admin', title: 'Quản trị viên hệ thống' },
      { id: 'NV02', label: 'QL', title: 'Quản lý' },
      { id: 'NV09', label: 'TN', title: 'Trưởng nhóm' },
    ]
  : [];

/**
 * AdminManagerLogin – Cổng đăng nhập dành cho Quản trị viên, Quản lý, Trưởng nhóm
 * và nhân sự được cấp quyền nghiệp vụ.
 * Sau khi đăng nhập, App điều hướng theo quyền: ADMIN / ACCOUNT_MANAGE → Cổng Quản trị,
 * còn lại → Cổng Quản lý; tài khoản phải đổi mật khẩu tạm được chuyển sang hộp thoại đổi mật khẩu.
 */
export default function AdminManagerLogin({ onLoginSuccess }) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!employeeId.trim()) {
      setErrorMessage('Vui lòng nhập mã tài khoản.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanId = employeeId.trim().toUpperCase().replace('-', '');
      const data = await loginManagePortal(cleanId, password);

      setIsLoading(false);
      onLoginSuccess?.({
        ma_nv: data.ma_nv,
        token: data.access_token,
        role: String(data.ma_vai_tro || '').toUpperCase(),
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        must_change_password: Boolean(data.must_change_password),
      });
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(
        err?.message ||
          'Thông tin đăng nhập không hợp lệ hoặc tài khoản không có quyền vào Cổng Điều hành.'
      );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col justify-center">
      {/* ───────────────── KHUNG CARD ĐĂNG NHẬP TỐI GIẢN ───────────────── */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-200/80 p-6 sm:p-8">
        {/* Header Form */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-slate-50 rounded-2xl mb-3 border border-slate-100 shadow-xs">
            <img
              src={logoImg}
              alt="Trung Nguyên Legend Logo"
              className="h-12 w-auto object-contain"
            />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Đăng nhập Cổng Điều hành
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dành cho Quản trị viên, Quản lý, Trưởng nhóm và nhân sự được cấp quyền nghiệp vụ
          </p>
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div role="alert" className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium flex items-center space-x-2 animate-shake">
            <ShieldAlert size={16} className="shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input: Mã tài khoản */}
          <div className="space-y-1.5">
            <label htmlFor="manage-login-id" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Mã tài khoản
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                <User size={18} />
              </div>
              <input
                id="manage-login-id"
                type="text"
                autoComplete="username"
                autoFocus
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Mã nhân viên của bạn"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:bg-white focus:border-transparent transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Input: Mật khẩu */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="manage-login-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Mật khẩu
              </label>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                <Lock size={18} />
              </div>
              <input
                id="manage-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:bg-white focus:border-transparent transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Tài khoản mẫu: chỉ hiển thị ở môi trường phát triển */}
          {DEV_SAMPLE_ACCOUNTS.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] text-slate-400 font-medium mr-1">Tài khoản mẫu (DEV):</span>
              {DEV_SAMPLE_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setEmployeeId(acc.id)}
                  className="px-2 py-0.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 rounded-lg font-semibold text-[11px] transition-colors shadow-xs cursor-pointer"
                  title={acc.title}
                >
                  {acc.id} ({acc.label})
                </button>
              ))}
            </div>
          )}

          {/* Nút bấm Submit Đăng nhập Desktop */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 px-4 bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin text-white" />
                <span>Đang xác thực thông tin...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Đăng nhập</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Chuyển hướng sang Cổng nhân viên */}
        <div className="mt-5 text-center">
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, '', '/login');
              window.dispatchEvent(new Event('app-route-change'));
            }}
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-[#0EA5E9] transition-colors py-1.5 px-3 rounded-lg hover:bg-sky-50"
          >
            <ArrowLeft size={14} />
            <span>Bạn là nhân viên? Đăng nhập Cổng Nhân viên</span>
          </a>
        </div>
      </div>

      {/* Dòng bản quyền bên dưới card */}
      <p className="mt-4 text-center text-[11px] text-slate-400">
        Trung Nguyên Legend Coffee © 2026 • Hệ thống Quản trị Nhân sự
      </p>
    </div>
  );
}
