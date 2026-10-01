import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  MapPin,
  Share2,
  Clock,
  FileText,
  DollarSign,
  User,
  Loader2,
} from 'lucide-react';
import { getAttendanceHistory } from '../../services/attendanceService';

export default function AttendanceHistoryDetail({ userSession, onBack, onTabChange }) {
  // Mặc định tháng 9 / 2026 (hoặc tháng hiện tại có dữ liệu trong DB)
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(9); // Database mẫu đang có dữ liệu tháng 9
  const [currentYear, setCurrentYear] = useState(2026);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      const res = await getAttendanceHistory(
        userSession?.ma_nv || 'NV10',
        currentMonth,
        currentYear
      );
      setHistoryData(res);
      setIsLoading(false);
    }
    loadHistory();
  }, [userSession, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthFormatted = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen pb-24 relative">
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 animate-bounce">
          <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between text-xs font-semibold border border-slate-700 backdrop-blur-md">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* ───────────────── HEADER: Chi tiết chấm công ───────────────── */}
      <header className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <button
          onClick={onBack}
          aria-label="Quay lại"
          className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center">
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            Chi tiết chấm công
          </h1>
          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
            Kỳ làm việc chuẩn
          </p>
        </div>

        <button
          onClick={() => showToast('Đã lưu bảng chấm công chi tiết')}
          aria-label="Chia sẻ / Xuất báo cáo"
          className="p-1.5 -mr-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
        >
          <Share2 size={20} />
        </button>
      </header>

      {/* ───────────────── MAIN CONTENT ───────────────── */}
      <main className="px-4 py-3.5 space-y-3.5">
        {/* 1. THANH CHỌN THÁNG / NĂM */}
        <div className="bg-white rounded-2xl px-4 py-2.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            aria-label="Tháng trước"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center space-x-2 font-bold text-slate-800 text-sm select-none">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0EA5E9] flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <span>Tháng {monthFormatted} / {currentYear}</span>
            <ChevronDown size={16} className="text-slate-400 ml-0.5" />
          </div>

          <button
            onClick={handleNextMonth}
            aria-label="Tháng sau"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* TIÊU ĐỀ DANH SÁCH NHẬT KÝ */}
        <div className="flex items-center justify-between pt-1 px-1">
          <h2 className="text-sm font-bold text-slate-900">
            Nhật ký chi tiết từng ngày
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Tháng {monthFormatted}/{currentYear}
          </span>
        </div>

        {/* 4. DANH SÁCH THẺ CHẤM CÔNG CHI TIẾT */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 size={24} className="animate-spin text-[#0EA5E9]" />
            <p className="text-xs font-medium">Đang tải nhật ký chấm công...</p>
          </div>
        ) : (() => {
          const checkInRecords = (historyData?.records || []).filter(
            (item) => item.gio_vao && item.gio_vao !== '--:--' && item.loai_cong !== 'NGHI_PHEP' && item.trang_thai !== 'Nghỉ phép'
          );

          return checkInRecords.length > 0 ? (
            <div className="space-y-3">
              {checkInRecords.map((item) => (
                <div
                  key={item.ma_cc}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 transition-all hover:shadow-md"
                >
                  {/* Hàng 1: Ngày (24/10/2024) + Badge Thứ (Thứ Năm) + Trạng thái */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black text-slate-900 tracking-tight">
                        {item.ngay_cong_formatted}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-semibold">
                        {item.thu_day_du}
                      </span>
                    </div>

                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        item.trang_thai === 'Đi muộn'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                      }`}>
                        {item.trang_thai || 'Đúng giờ'}
                      </span>
                    </div>
                  </div>

                  {/* Hàng 2: Giờ vào / Giờ ra và Địa điểm chi nhánh */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="flex items-center space-x-7 text-[11px] text-slate-400 font-medium">
                        <span>Giờ vào</span>
                        <span>Giờ ra</span>
                      </div>
                      <div className="flex items-center space-x-3 mt-0.5">
                        <span className="text-base font-black text-slate-900">{item.gio_vao || '--:--'}</span>
                        <span className="text-slate-300 font-normal">→</span>
                        <span className="text-base font-black text-slate-900">{item.gio_ra || '--:--'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Địa điểm chi nhánh
                      </span>
                      <div className="flex items-center justify-end space-x-1 mt-0.5">
                        <MapPin size={11} className="text-rose-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-800">
                          {item.dia_diem_chi_nhanh || item.ten_cn || item.dia_diem_cham || 'Trụ sở chính Trung Nguyên'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-center text-slate-400 space-y-2">
            <Calendar size={36} className="mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-700">Không có dữ liệu</p>
            <p className="text-xs text-slate-400">
              Không có nhật ký chấm công nào trong tháng {monthFormatted}/{currentYear}
            </p>
          </div>
        );
      })()}
      </main>

      {/* ───────────────── BOTTOM NAVIGATION BAR ───────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 py-2 px-4 flex items-center justify-around z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <button
          onClick={onBack}
          className="flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all text-[#0EA5E9]"
        >
          <Clock size={20} className="stroke-[2.5]" />
          <span className="text-[10px] font-semibold leading-none">Chấm công</span>
        </button>

        <button
          onClick={() => (onTabChange ? onTabChange('requests') : showToast('Chuyển sang Đơn từ'))}
          className="flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all text-slate-400 hover:text-slate-600"
        >
          <FileText size={20} className="stroke-2" />
          <span className="text-[10px] font-semibold leading-none">Đơn từ</span>
        </button>

        <button
          onClick={() => showToast('Chức năng "Bảng lương" đang đồng bộ')}
          className="flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all text-slate-400 hover:text-slate-600"
        >
          <DollarSign size={20} className="stroke-2" />
          <span className="text-[10px] font-semibold leading-none">Bảng lương</span>
        </button>

        <button
          onClick={() => showToast(`Tài khoản: ${userSession?.ma_nv || 'NV10'}`)}
          className="flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all text-slate-400 hover:text-slate-600"
        >
          <User size={20} className="stroke-2" />
          <span className="text-[10px] font-semibold leading-none">Cá nhân</span>
        </button>
      </nav>
    </div>
  );
}
