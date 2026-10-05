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
  Building2
} from 'lucide-react';
import logoImg from '../../assets/logo/Logo Trung Nguyên_black.png';

/**
 * AdminManagerLogin – Cổng Đăng Nhập Dành Riêng Cho Quản Trị Viên (Admin) & Quản Lý
 * Giao diện Desktop-first chuẩn doanh nghiệp:
 * - Đồng bộ tông màu Xanh Sky sáng và sang trọng của thương hiệu
 * - Bố cục Split-Screen 2 cột rộng rãi dành riêng cho màn hình máy tính
 * - Tự động nhận diện vai trò (Admin, Quản lý, Trưởng nhóm)
 */
export default function AdminManagerLogin({ onLoginSuccess }) {
  const [employeeId, setEmployeeId] = useState('NV02');
  const [password, setPassword] = useState('1');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!employeeId.trim()) {
      setErrorMessage('Vui lòng nhập Mã tài khoản Quản lý / Admin');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập Mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      const cleanId = employeeId.trim().toUpperCase().replace('-', '');

      // Endpoint login-manage thống nhất cho Admin, Quản lý và Trưởng nhóm
      let response = await fetch('/api/v1/auth/login-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_nv: cleanId,
          mat_khau: password,
        }),
      });

      // Fallback endpoint cũ nếu cần
      if (response.status === 404) {
        response = await fetch('/api/v1/auth/login-manager', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ma_nv: cleanId,
            mat_khau: password,
          }),
        });
      }

      if (!response.ok) {
        let errorMsg = 'Thông tin đăng nhập không hợp lệ hoặc tài khoản không có quyền Quản lý/Admin';
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorMsg = errData.detail;
          }
        } catch (_) {}
        setErrorMessage(errorMsg);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const role = data.ma_vai_tro || 'QUAN_LY';

      localStorage.setItem('user_role', role);
      localStorage.setItem('user_ma_nv', data.ma_nv);
      localStorage.setItem('ma_nv', data.ma_nv);
      localStorage.setItem('auth_portal', 'manage');
      if (data.permissions) {
        localStorage.setItem('user_permissions', JSON.stringify(data.permissions));
      }
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('access_token', data.access_token);
      }

      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess({
          ma_nv: data.ma_nv,
          token: data.access_token,
          role: role,
          permissions: data.permissions || [],
          must_change_password: Boolean(data.must_change_password),
        }, 'manage');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại mạng hoặc server.');
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
            Đăng Nhập Cổng Điều Hành
          </h2>
  
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium flex items-center space-x-2 animate-shake">
            <ShieldAlert size={16} className="shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input: Mã tài khoản */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Mã tài khoản Quản lý / Admin
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Ví dụ: NV01, NV02, NV09..."
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:bg-white focus:border-transparent transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Input: Mật khẩu */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Mật khẩu bảo mật
              </label>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:bg-white focus:border-transparent transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Ghi nhớ & Đăng nhập mẫu nhanh */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#0EA5E9] focus:ring-[#0EA5E9] border-slate-300 accent-[#0EA5E9] transition-colors"
              />
              <span className="font-medium text-[11px] sm:text-xs">Duy trì phiên làm việc</span>
            </label>

            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-slate-400 font-medium">Mẫu:</span>
              <button
                type="button"
                onClick={() => { setEmployeeId('NV01'); setPassword('1'); }}
                className="px-2 py-0.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 rounded-lg font-semibold text-[11px] transition-colors shadow-xs"
                title="Quản trị viên hệ thống (Admin)"
              >
                NV01 (Admin)
              </button>
              <button
                type="button"
                onClick={() => { setEmployeeId('NV02'); setPassword('1'); }}
                className="px-2 py-0.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 rounded-lg font-semibold text-[11px] transition-colors shadow-xs"
                title="Quản lý phòng ban / nhân sự"
              >
                NV02 (QL)
              </button>
              <button
                type="button"
                onClick={() => { setEmployeeId('NV09'); setPassword('1'); }}
                className="px-2 py-0.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 rounded-lg font-semibold text-[11px] transition-colors shadow-xs"
                title="Trưởng nhóm ca làm việc"
              >
                NV09 (TN)
              </button>
            </div>
          </div>

          {/* Nút bấm Submit Đăng nhập Desktop */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 px-4 bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin text-white" />
                <span>Đang xác thực thông tin...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Đăng Nhập</span>
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
            <span>Bạn là Nhân viên cơ sở? Đăng nhập Cổng Nhân Viên</span>
          </a>
        </div>
      </div>

      {/* Dòng bản quyền bên dưới card */}
      <p className="mt-4 text-center text-[11px] text-slate-400">
        Trung Nguyên Legend Coffee © 2026 • Hệ Thống Quản Trị Nhân Sự & Vận Hành Doanh Nghiệp
      </p>
    </div>
  );
}
