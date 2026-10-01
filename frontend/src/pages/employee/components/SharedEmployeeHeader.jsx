import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import logoImg from '../../../assets/logo/Logo Trung Nguyên_black.png';

export default function SharedEmployeeHeader({ onLogout, onNotificationClick }) {
  const handleNotify = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      alert('Bạn có 1 thông báo mới từ Phòng Nhân sự');
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('user_ma_nv');
      localStorage.removeItem('ma_nv');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      window.location.hash = '';
      window.location.reload();
    }
  };

  return (
    <header className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="flex items-center space-x-2.5">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-sm">
          <img src={logoImg} alt="Trung Nguyen Legend" className="w-full h-full object-contain" />
        </div>
        <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
          TrungNguyen<span className="text-[#0EA5E9]">HR</span>
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleNotify}
          className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
          aria-label="Thông báo"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          title="Đăng xuất"
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors focus:outline-none text-xs font-semibold"
        >
          <LogOut size={15} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
