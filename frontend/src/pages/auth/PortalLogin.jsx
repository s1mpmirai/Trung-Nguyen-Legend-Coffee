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
  Calculator,
  Crown,
  ServerCog,
} from 'lucide-react';
import logoImg from '../../assets/logo/Logo Trung Nguyên_black.png';
import { loginAdminPortal, loginManagePortal } from '../../services/adminService';
import DemoAccountButtons from '../../components/common/DemoAccountButtons';
import { navigateClean } from '../../utils/navigation';

/**
 * Cấu hình từng cổng đăng nhập. Hai cổng tách biệt hoàn toàn (yêu cầu đồ án II.2):
 * - admin  (/login-admin):  Quản trị viên hệ thống – tài khoản, phân quyền. API /auth/admin-login.
 * - manage (/login-manage): Quản lý nghiệp vụ nhân sự. API /auth/manager-login (từ chối tài khoản ADMIN).
 * Tài khoản demo theo dữ liệu mẫu (mật khẩu "1").
 */
const PORTAL_CONFIG = {
  admin: {
    title: 'Đăng nhập Cổng Quản trị',
    subtitle: 'Dành cho Quản trị viên hệ thống: quản lý tài khoản và phân quyền người dùng',
    badge: 'CỔNG QUẢN TRỊ HỆ THỐNG',
    badgeClass: 'bg-slate-900 text-white border-slate-900',
    BadgeIcon: ServerCog,
    login: loginAdminPortal,
    idPrefix: 'admin-login',
    fallbackError: 'Thông tin đăng nhập không hợp lệ hoặc tài khoản không có quyền vào Cổng Quản trị.',
    demoAccounts: [{ id: 'NV21', password: '1', label: 'Admin (IT)', icon: ShieldCheck }],
  },
  manage: {
    title: 'Đăng nhập Cổng Quản lý',
    subtitle: 'Dành cho Ban Giám đốc, Phòng Nhân sự, Phòng Kế toán và nhân sự được cấp quyền nghiệp vụ',
    badge: 'CỔNG QUẢN LÝ NHÂN SỰ',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    BadgeIcon: Briefcase,
    login: loginManagePortal,
    idPrefix: 'manage-login',
    fallbackError: 'Thông tin đăng nhập không hợp lệ hoặc tài khoản không có quyền vào Cổng Quản lý.',
    demoAccounts: [
      { id: 'NV01', password: '1', label: 'Giám đốc', icon: Crown },
      { id: 'NV02', password: '1', label: 'Nhân sự', icon: Briefcase },
      { id: 'NV11', password: '1', label: 'Kế toán', icon: Calculator },
    ],
  },
};

/**
 * PortalLogin – trang đăng nhập Cổng Quản trị (portal="admin") hoặc Cổng Quản lý (portal="manage").
 * Tài khoản phải đổi mật khẩu tạm được App chuyển sang hộp thoại đổi mật khẩu.
 */
export default function PortalLogin({ portal = 'manage', onLoginSuccess }) {
  const config = PORTAL_CONFIG[portal] || PORTAL_CONFIG.manage;
  const { BadgeIcon } = config;
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
      const data = await config.login(cleanId, rawPassword);

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
      setErrorMessage(err?.message || config.fallbackError);
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

          <div className="flex justify-center mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider ${config.badgeClass}`}
            >
              <BadgeIcon size={12} aria-hidden="true" />
              {config.badge}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {config.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {config.subtitle}
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
            <label htmlFor={`${config.idPrefix}-id`} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Mã tài khoản
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                <User size={18} />
              </div>
              <input
                id={`${config.idPrefix}-id`}
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
              <label htmlFor={`${config.idPrefix}-password`} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Mật khẩu
              </label>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                <Lock size={18} />
              </div>
              <input
                id={`${config.idPrefix}-password`}
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

        {/* Đăng nhập nhanh bằng tài khoản demo của đúng cổng này */}
        <div className="mt-5">
          <DemoAccountButtons accounts={config.demoAccounts} onSelect={handleDemoLogin} disabled={isLoading} />
        </div>

        {/* Chuyển hướng sang Cổng nhân viên */}
        <div className="mt-5 text-center">
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigateClean('login');
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
