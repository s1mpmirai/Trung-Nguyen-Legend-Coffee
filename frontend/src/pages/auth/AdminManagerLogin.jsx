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
  Briefcase,
} from 'lucide-react';
import logoImg from '../../assets/logo/Logo Trung Nguyên_black.png';
import { loginManagePortal } from '../../services/adminService';
import DemoAccountButtons from '../../components/common/DemoAccountButtons';

// Tài khoản demo đăng nhập nhanh (mật khẩu theo dữ liệu mẫu)
const DEMO_ACCOUNTS = [
  { id: 'NV01', password: '1', label: 'Admin', icon: ShieldCheck },
  { id: 'NV02', password: '1', label: 'Quản lý', icon: Briefcase },
];

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

  const login = async (rawId, rawPassword) => {
    if (isLoading) return;
    setErrorMessage('');

    if (!rawId.trim()) {
      setErrorMessage('Vui lòng nhập mã tài khoản.');
      return;
    }

    if (!rawPassword.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanId = rawId.trim().toUpperCase().replace('-', '');
      const data = await loginManagePortal(cleanId, rawPassword);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    login(employeeId, password);
  };

  // Đăng nhập nhanh: điền sẵn tài khoản demo rồi đăng nhập luôn
  const handleDemoLogin = (id, demoPassword) => {
    setEmployeeId(id);
    setPassword(demoPassword);
    login(id, demoPassword);
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

        {/* Đăng nhập nhanh: Admin (NV01) và Quản lý (NV02) */}
        <div className="mt-5">
          <DemoAccountButtons accounts={DEMO_ACCOUNTS} onSelect={handleDemoLogin} disabled={isLoading} />
        </div>

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
