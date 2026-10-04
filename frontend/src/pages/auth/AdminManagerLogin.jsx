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
  Users,
  Clock,
  TrendingUp,
  Sparkles,
  Building2
} from 'lucide-react';
import logoImg from '../../assets/logo/logo.png';

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
        });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại mạng hoặc server.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
      {/* ───────────────── KHUNG DESKTOP CARD (2 CỘT) ───────────────── */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-sky-950/10 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ══════════ CỘT TRÁI: BRANDING & GIỚI THIỆU TÍNH NĂNG (5 CỘT) ══════════ */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Họa tiết quầng sáng nền */}
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-white/15 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-sky-300/25 rounded-full blur-xl pointer-events-none"></div>

          {/* Phần trên: Logo & Badge Cổng Quản Trị nằm ngang hàng */}
          <div className="relative z-10">
            <div className="flex items-center space-x-3.5 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/25 shadow-lg shrink-0 transition-transform hover:scale-105">
                <img
                  src={logoImg}
                  alt="Trung Nguyên Legend Logo"
                  className="h-11 w-auto object-contain filter drop-shadow-sm"
                />
              </div>

              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wide uppercase border border-white/20 shadow-xs">
                <Sparkles size={13} className="text-yellow-200 animate-pulse shrink-0" />
                <span className="leading-none">Cổng Quản Trị & Điều Hành</span>
              </div>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Trung Nguyên Legend HRM
            </h1>
            <p className="text-xs lg:text-sm text-sky-100 font-normal mt-2 leading-relaxed">
              Nền tảng số hóa quản trị nhân sự, giám sát vận hành và đãi ngộ chuẩn mực cà phê năng lượng.
            </p>
          </div>

          {/* Phần giữa: 3 tính năng quản trị chính */}
          <div className="relative z-10 my-6 space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15">
              <div className="p-2 bg-white/20 rounded-xl shrink-0 mt-0.5 text-white">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Quản Lý Nhân Sự Toàn Diện</h4>
                <p className="text-[11px] text-sky-100 mt-0.5">
                  Hồ sơ nhân viên, hợp đồng, phòng ban và chức vụ.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15">
              <div className="p-2 bg-white/20 rounded-xl shrink-0 mt-0.5 text-white">
                <Clock size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Chấm Công & Phê Duyệt</h4>
                <p className="text-[11px] text-sky-100 mt-0.5">
                  Theo dõi ca làm, duyệt đơn xin nghỉ phép và giám sát hiện diện realtime.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15">
              <div className="p-2 bg-white/20 rounded-xl shrink-0 mt-0.5 text-white">
                <TrendingUp size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Tính Lương & Thống Kê</h4>
                <p className="text-[11px] text-sky-100 mt-0.5">
                  Tự động hóa bảng lương hàng tháng, thưởng phạt và báo cáo năng suất.
                </p>
              </div>
            </div>
          </div>

          {/* Phần chân cột trái: Bảo mật */}
          <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-sky-100">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck size={14} className="text-emerald-300" />
              <span>Phân quyền RBAC đa cấp</span>
            </div>
            <span className="font-mono text-sky-200">v2.4.0 Desktop</span>
          </div>
        </div>

        {/* ══════════ CỘT PHẢI: FORM ĐĂNG NHẬP DESKTOP (7 CỘT) ══════════ */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Header Form */}
            <div className="mb-6">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-full text-xs font-bold uppercase tracking-wider mb-2.5">
                <Building2 size={13} className="text-[#0EA5E9]" />
                <span>Quản Trị Viên & Quản Lý</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Đăng Nhập Cổng Điều Hành
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                Nhập thông tin xác thực để truy cập bảng điều khiển quản trị hệ thống.
              </p>
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
                  <span className="text-xs text-slate-400">
                    Mặc định:{' '}
                    <code className="text-[#0EA5E9] font-mono font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                      1
                    </code>
                  </span>
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
                    <span>Đăng Nhập Quản Trị & Quản Lý</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Chuyển hướng sang Cổng nhân viên (Mobile View) */}
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

          {/* Footer thông tin & Bảo mật */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="inline-flex items-center space-x-1.5 text-emerald-600 font-medium">
              <ShieldCheck size={14} />
              <span>Bảo mật 256-bit SSL • Tự động phân quyền</span>
            </div>
            <div>
              Hỗ trợ kỹ thuật:{' '}
              <a href="tel:19006868" className="text-[#0EA5E9] font-semibold hover:underline">
                1900 6868
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Dòng bản quyền bên dưới card Desktop */}
      <p className="mt-4 text-center text-[11px] text-slate-400">
        Trung Nguyên Legend Coffee © 2026 • Hệ Thống Quản Trị Nhân Sự & Vận Hành Doanh Nghiệp
      </p>
    </div>
  );
}
