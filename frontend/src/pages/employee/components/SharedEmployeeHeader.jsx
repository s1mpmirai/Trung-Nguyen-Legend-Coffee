import React from 'react';
import { LogOut } from 'lucide-react';
import logoImg from '../../../assets/logo/Logo Trung Nguyên_black.png';
import { navigateClean } from '../../../utils/navigation';

/**
 * SharedEmployeeHeader – Header thương hiệu TrungNguyenHR chung cho toàn bộ các trang nhân viên.
 *
 * Tính năng:
 *  - Click cụm Logo (Icon + Chữ TrungNguyenHR) -> Quay về trang Chấm công (/attendance)
 *  - Nút Đăng xuất tiện lợi
 * (Hệ thống chưa có module thông báo nên không hiển thị chuông / chấm đỏ giả.)
 */
export default function SharedEmployeeHeader({ onLogout }) {
  const handleLogoClick = () => {
    navigateClean('attendance');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="px-4 py-3 bg-white/95 backdrop-blur border-b border-coffee-100 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(62,39,35,0.06)]">
      {/* ── Cụm Logo: Nhấp vào quay trở lại trang Chấm công ── */}
      <button
        type="button"
        onClick={handleLogoClick}
        title="Quay lại trang Chấm công"
        aria-label="TrungNguyenHR – Quay lại trang Chấm công"
        className="flex items-center space-x-2.5 cursor-pointer group text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-transform active:scale-95"
      >
        <div className="w-10 h-10 rounded-xl bg-white border border-coffee-100 p-1 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-gold-500 transition-all">
          <img src={logoImg} alt="" className="w-full h-full object-contain pointer-events-none" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-coffee-800 leading-none">
          TrungNguyen<span className="text-gold-600">HR</span>
        </span>
      </button>

      {/* ── Đăng xuất ── */}
      <button
        type="button"
        onClick={onLogout}
        title="Đăng xuất"
        className="flex items-center space-x-1.5 min-h-[40px] px-3 rounded-xl bg-coffee-50 hover:bg-rose-50 text-coffee-700 hover:text-rose-600 border border-coffee-100 hover:border-rose-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 text-xs font-semibold"
      >
        <LogOut size={15} />
        <span>Đăng xuất</span>
      </button>
    </header>
  );
}
