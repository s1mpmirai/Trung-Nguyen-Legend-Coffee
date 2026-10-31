import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Loader2, Info } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { getApiErrorMessage } from '../employee/utils/format';
import DemoAccountButtons from '../../components/common/DemoAccountButtons';
// Import logo từ thư mục local trong src/assets/logo/ (logo trắng trên nền nâu)
import logoImg from '../../assets/logo/logo.png';

// Tài khoản demo đăng nhập nhanh (mật khẩu theo dữ liệu mẫu)
const DEMO_ACCOUNTS = [{ id: 'NV10', password: '1', label: 'Nhân viên', icon: User }];

// "Ghi nhớ đăng nhập" chỉ lưu MÃ NHÂN VIÊN trên thiết bị này – không bao giờ lưu mật khẩu
const REMEMBER_KEY = 'tnl_remembered_ma_nv';

const readRememberedId = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) || '';
  } catch {
    return '';
  }
};

export default function Login({ onLoginSuccess }) {
  const [employeeId, setEmployeeId] = useState(readRememberedId);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(readRememberedId()));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const login = async (rawId, rawPassword) => {
    if (isLoading) return;
    setErrorMessage('');
    setInfoMessage('');

    if (!rawId.trim()) {
      setErrorMessage('Vui lòng nhập Mã nhân viên');
      return;
    }

    if (!rawPassword.trim()) {
      setErrorMessage('Vui lòng nhập Mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      const cleanId = rawId.trim().toUpperCase().replace('-', '');

      const data = await apiClient.post('/auth/employee-login', {
        ma_nv: cleanId,
        mat_khau: rawPassword,
      });

      const role = String(data.ma_vai_tro || 'NHAN_VIEN').toUpperCase();

      // Ghi nhớ (hoặc quên) mã nhân viên trên thiết bị này
      try {
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, cleanId);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* Trình duyệt chặn bộ nhớ cục bộ: bỏ qua, không ảnh hưởng đăng nhập */
      }

      // Mọi nhân sự (kể cả Quản lý / Admin) đều được vào Cổng nhân viên để chấm công cá nhân
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_ma_nv', data.ma_nv);
      localStorage.setItem('ma_nv', data.ma_nv);
      localStorage.setItem('auth_portal', 'employee');
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
        }, 'employee');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(
        err?.status
          ? getApiErrorMessage(err, 'Mã nhân viên hoặc mật khẩu không chính xác')
          : 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
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
    <div className="flex-1 flex flex-col justify-between bg-white min-h-[780px]">
      {/* ───────────────── HEADER: Nâu cà phê Trung Nguyên + Sóng Wave ───────────────── */}
      <div className="relative bg-gradient-to-b from-coffee-800 via-coffee-600 to-coffee-500 pt-10 pb-28 px-6 flex flex-col items-center justify-center text-white overflow-hidden shadow-md">

        {/* Họa tiết vòng sáng vàng đồng */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold-400/20 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-16 w-40 h-40 bg-gold-300/15 rounded-full blur-lg pointer-events-none"></div>

        {/* Logo Trung Nguyên */}
        <div className="relative z-10 flex flex-col items-center text-center my-2">
          <img
            src={logoImg}
            alt="Trung Nguyên Legend"
            className="w-44 max-h-28 object-contain filter drop-shadow-md"
          />
        </div>

        {/* Hiệu ứng lượn sóng Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
          <svg
            className="relative block w-full h-20 text-white fill-white"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,25 C200,120 400,0 650,60 C900,120 1060,10 1200,30 L1200,120 L0,120 Z"
            ></path>
          </svg>
        </div>
      </div>

      {/* ───────────────── PHẦN FORM ───────────────── */}
      <div className="relative bg-white px-6 pt-8 pb-6 flex-1 flex flex-col justify-between">

        <div className="space-y-5">
          {/* Tiêu đề & mô tả */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-coffee-900 tracking-tight">
              Chào mừng trở lại!
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Cổng thông tin nhân viên – Chấm công, đơn từ & bảng lương
            </p>
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium text-center animate-shake">
              {errorMessage}
            </div>
          )}

          {/* Hướng dẫn quên mật khẩu */}
          {infoMessage && (
            <div role="status" className="p-3 bg-gold-50 border border-gold-200 text-coffee-800 rounded-xl text-xs font-medium flex items-start gap-2">
              <Info size={15} className="flex-shrink-0 mt-0.5 text-gold-700" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Form đăng nhập */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Input 1: Mã nhân viên */}
            <div className="space-y-1.5">
              <label htmlFor="login-employee-id" className="block text-xs font-semibold text-slate-700">
                Mã nhân viên
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400" aria-hidden="true">
                  <User size={18} />
                </div>
                <input
                  id="login-employee-id"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Ví dụ: NV10"
                  autoComplete="username"
                  autoCapitalize="characters"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-coffee-50/60 border border-coffee-100 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Input 2: Mật khẩu */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setInfoMessage('Vui lòng liên hệ Phòng Nhân sự hoặc Quản trị viên hệ thống để được cấp lại mật khẩu.')
                  }
                  className="text-[11px] font-semibold text-coffee-600 hover:text-coffee-800 hover:underline min-h-[32px] px-1"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400" aria-hidden="true">
                  <Lock size={18} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-coffee-50/60 border border-coffee-100 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent focus:bg-white transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-1.5 w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-coffee-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Checkbox: Ghi nhớ mã nhân viên (không lưu mật khẩu) */}
            <div className="flex items-center pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-600 select-none min-h-[32px]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-coffee-600"
                />
                <span>Ghi nhớ mã nhân viên trên thiết bị này</span>
              </label>
            </div>

            {/* Nút bấm Đăng nhập */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 min-h-[48px] py-3.5 px-4 bg-coffee-600 hover:bg-coffee-800 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-lg shadow-coffee-600/30 transition-all flex items-center justify-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:opacity-80 disabled:cursor-wait"
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

            {/* Đăng nhập nhanh: Nhân viên (NV10) */}
            <div className="pt-2">
              <DemoAccountButtons accounts={DEMO_ACCOUNTS} onSelect={handleDemoLogin} disabled={isLoading} />
            </div>
          </form>
        </div>

        {/* ───────────────── FOOTER ───────────────── */}
        <div className="mt-8 pt-4 border-t border-coffee-100 text-center">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} Trung Nguyên Legend • Hệ thống thông tin nhân sự nội bộ
          </p>
        </div>
      </div>
    </div>
  );
}
