import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
// Import logo từ thư mục local trong src/assets/logo/
import logoImg from '../../assets/logo/logo.png';

export default function Login({ onLoginSuccess }) {
  const [employeeId, setEmployeeId] = useState('NV10');
  const [password, setPassword] = useState('password');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!employeeId.trim()) {
      setErrorMessage('Vui lòng nhập Mã nhân viên');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập Mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      const cleanId = employeeId.trim().toUpperCase().replace('-', '');

      let response = await fetch('/api/v1/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_nv: cleanId,
          mat_khau: password === '••••••••••••' ? 'password' : password,
        }),
      });

      if (!response.ok) {
        let errorMsg = 'Mã nhân viên hoặc mật khẩu không chính xác';
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
      const role = String(data.ma_vai_tro || 'NHAN_VIEN').toUpperCase();

      // Chặn tài khoản Quản lý / Admin đăng nhập tại cổng nhân viên
      if (['ADMIN', 'QUAN_LY', 'TRUONG_NHOM'].includes(role)) {
        setErrorMessage('Tài khoản Quản lý / Quản trị viên không được phép đăng nhập tại đây. Vui lòng sử dụng Cổng Điều Hành (/login-manage).');
        setIsLoading(false);
        return;
      }

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
          must_change_password: Boolean(data.must_change_password),
        });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-white min-h-[780px]">
      {/* ───────────────── HEADER: Xanh Sky-500 + Sóng Wave ───────────────── */}
      <div className="relative bg-gradient-to-b from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] pt-10 pb-28 px-6 flex flex-col items-center justify-center text-white overflow-hidden shadow-md">
        
        {/* Họa tiết vòng sáng background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-16 w-40 h-40 bg-sky-300/20 rounded-full blur-lg pointer-events-none"></div>

        {/* Logo Trung Nguyên */}
        <div className="relative z-10 flex flex-col items-center text-center my-2">
          <img
            src={logoImg}
            alt="Trung Nguyen Legend Logo"
            className="w-44 max-h-28 object-contain filter drop-shadow-md transition-transform hover:scale-105"
          />
        </div>

        {/* Hiệu ứng lượn sóng Wave SVG sâu và cong rõ rệt */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
          <svg
            className="relative block w-full h-20 text-white fill-white"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,25 C200,120 400,0 650,60 C900,120 1060,10 1200,30 L1200,120 L0,120 Z"
            ></path>
          </svg>
        </div>
      </div>

      {/* ───────────────── PHẦN FORM: Liền mạch trực tiếp với sóng ───────────────── */}
      <div className="relative bg-white px-6 pt-2 pb-6 flex-1 flex flex-col justify-between">

        <div className="space-y-5">
          {/* Tiêu đề & mô tả */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Chào mừng trở lại!
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Hệ thống thông tin & chấm công nhân sự
            </p>
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium text-center animate-shake">
              {errorMessage}
            </div>
          )}

          {/* Form đăng nhập */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input 1: Mã nhân viên */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Mã nhân viên
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Ví dụ: NV10, NV11, NV12..."
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Input 2: Mật khẩu */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Vui lòng liên hệ Phòng Nhân sự (Hotline: 1900 6868) để cấp lại mật khẩu.');
                  }}
                  className="text-[11px] font-medium text-[#0EA5E9] hover:underline"
                >
                  Quên mật khẩu?
                </a>
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
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent focus:bg-white transition-all shadow-sm"
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

            {/* Checkbox: Ghi nhớ đăng nhập */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0EA5E9] focus:ring-[#0EA5E9] border-slate-300 accent-[#0EA5E9] transition-colors"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <span className="text-[11px] text-slate-400 font-normal">
                Phiên bản v2.4.0
              </span>
            </div>

            {/* Nút bấm Đăng nhập */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-4 bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-500/35 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>

            {/* Chuyển hướng sang Cổng Quản lý / Admin */}
            <div className="mt-3 text-center">
              <a
                href="/login-manage"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState(null, '', '/login-manage');
                  window.dispatchEvent(new Event('app-route-change'));
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-[#0EA5E9] transition-colors py-1.5 px-3 rounded-lg hover:bg-sky-50"
              >
                <span>Bạn là Quản lý / Admin? Đăng nhập Cổng Điều Hành →</span>
              </a>
            </div>
          </form>
        </div>

        {/* ───────────────── FOOTER BẢO MẬT & HỖ TRỢ ───────────────── */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col items-center space-y-2 text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="text-[11px] font-medium text-emerald-700">
              Bảo mật mã hóa 256-bit SSL
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Hỗ trợ nội bộ:{' '}
            <a
              href="tel:19006868"
              className="text-[#0EA5E9] font-semibold hover:underline"
            >
              1900 6868
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
