import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { getAttendanceHistory } from '../../services/attendanceService';
import BottomNavBar from './components/BottomNavBar';
import { formatDays, getApiErrorMessage, isAbortError, isValidTime } from './utils/format';

// Nhãn trạng thái duyệt công (bảng lương chỉ tính các ngày công ĐÃ DUYỆT)
const APPROVAL_BADGE = {
  CHO_DUYET: { label: 'Chờ duyệt công', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  DA_DUYET: { label: 'Đã duyệt công', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' },
  TU_CHOI: { label: 'Không được duyệt', cls: 'bg-rose-50 text-rose-700 border-rose-200/70' },
};

const statusBadgeClass = (loaiCong) => {
  if (loaiCong === 'DI_TRE' || loaiCong === 'VE_SOM') return 'bg-amber-50 text-amber-700 border-amber-200/70';
  if (loaiCong === 'NUA_CONG') return 'bg-orange-50 text-orange-700 border-orange-200/70';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
};

export default function AttendanceHistoryDetail({ userSession, onBack }) {
  // Mặc định tháng/năm hiện tại
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const [currentMonth, setCurrentMonth] = useState(thisMonth);
  const [currentYear, setCurrentYear] = useState(thisYear);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const maNv = userSession?.ma_nv || localStorage.getItem('user_ma_nv');

  // Tải nhật ký theo tháng; bỏ qua phản hồi cũ khi người dùng đổi tháng liên tục
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError('');
    getAttendanceHistory(maNv, currentMonth, currentYear, { throwOnError: true, signal: controller.signal })
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setHistoryData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        if (isAbortError(err) || requestId !== requestIdRef.current) return;
        setHistoryData(null);
        setLoadError(getApiErrorMessage(err, 'Không tải được nhật ký chấm công.'));
        setIsLoading(false);
      });
    return () => controller.abort();
  }, [maNv, currentMonth, currentYear, reloadKey]);

  const isCurrentPeriod = currentYear === thisYear && currentMonth === thisMonth;

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (isCurrentPeriod) return; // Không xem tháng tương lai
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthFormatted = String(currentMonth).padStart(2, '0');
  const summary = historyData?.summary || {};
  const checkInRecords = (historyData?.records || []).filter(
    (item) => isValidTime(item.gio_vao) && item.loai_cong !== 'NGHI_PHEP'
  );

  return (
    <div className="flex-1 flex flex-col bg-cream min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] relative">
      {/* ───────────────── HEADER: Chi tiết chấm công ───────────────── */}
      <header className="px-4 py-3 bg-white border-b border-coffee-100 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(62,39,35,0.05)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại trang Chấm công"
          className="w-10 h-10 -ml-2 flex items-center justify-center text-coffee-800 hover:bg-coffee-50 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center">
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            Chi tiết chấm công
          </h1>
          <p className="text-[11px] text-slate-500 font-normal mt-0.5">
            Nhật ký vào / ra theo tháng
          </p>
        </div>

        {/* Khoảng trống cân đối với nút Quay lại để tiêu đề nằm giữa */}
        <span className="w-10 h-10 -mr-2" aria-hidden="true"></span>
      </header>

      {/* ───────────────── MAIN CONTENT ───────────────── */}
      <main className="px-4 py-3.5 space-y-3.5">
        {/* 1. THANH CHỌN THÁNG / NĂM */}
        <div className="bg-white rounded-2xl px-2 py-1.5 border border-coffee-100 shadow-[0_2px_8px_rgba(62,39,35,0.03)] flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Tháng trước"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:text-coffee-800 hover:bg-coffee-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center space-x-2 font-bold text-coffee-900 text-sm select-none" aria-live="polite">
            <div className="w-7 h-7 rounded-lg bg-coffee-50 text-coffee-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <span>Tháng {monthFormatted} / {currentYear}</span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={isCurrentPeriod}
            aria-label="Tháng sau"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:text-coffee-800 hover:bg-coffee-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 2. TÓM TẮT THÁNG */}
        {!isLoading && !loadError && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl border border-coffee-100 px-3 py-2">
              <span className="text-[11px] text-slate-500 font-medium">Ngày công</span>
              <p className="text-base font-extrabold text-coffee-800">{formatDays(summary.so_ngay_cong ?? 0)}</p>
            </div>
            <div className="bg-white rounded-xl border border-coffee-100 px-3 py-2">
              <span className="text-[11px] text-slate-500 font-medium">Đi muộn</span>
              <p className="text-base font-extrabold text-amber-700">{summary.so_lan_di_muon ?? 0} lần</p>
            </div>
            <div className="bg-white rounded-xl border border-coffee-100 px-3 py-2">
              <span className="text-[11px] text-slate-500 font-medium">Nghỉ phép</span>
              <p className="text-base font-extrabold text-emerald-700">{formatDays(summary.so_ngay_phep ?? 0)} ngày</p>
            </div>
          </div>
        )}

        {/* TIÊU ĐỀ DANH SÁCH NHẬT KÝ */}
        <div className="flex items-center justify-between pt-1 px-1">
          <h2 className="text-sm font-bold text-slate-900">
            Nhật ký chi tiết từng ngày
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Tháng {monthFormatted}/{currentYear}
          </span>
        </div>

        {/* 3. DANH SÁCH THẺ CHẤM CÔNG CHI TIẾT */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-500" role="status">
            <Loader2 size={24} className="animate-spin text-coffee-600" />
            <p className="text-xs font-medium">Đang tải nhật ký chấm công...</p>
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-2xl p-6 border border-rose-100 text-center space-y-2" role="alert">
            <AlertCircle size={30} className="mx-auto text-rose-400" />
            <p className="text-sm font-semibold text-slate-700">{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl bg-coffee-600 hover:bg-coffee-800 text-white text-xs font-bold"
            >
              <RefreshCw size={14} />
              Thử lại
            </button>
          </div>
        ) : checkInRecords.length > 0 ? (
          <ul className="space-y-3">
            {checkInRecords.map((item) => {
              const approval = APPROVAL_BADGE[item.trang_thai_duyet];
              const isPenalized = item.is_penalized ?? /trừ 1 tiếng/i.test(item.ghi_chu || '');
              return (
                <li
                  key={item.ma_cc}
                  className="bg-white rounded-2xl p-4 border border-coffee-100 shadow-[0_2px_8px_rgba(62,39,35,0.03)] space-y-3"
                >
                  {/* Hàng 1: Ngày + Thứ + Trạng thái */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-extrabold text-slate-900 tracking-tight">
                        {item.ngay_cong_formatted}
                      </span>
                      <span className="px-2 py-0.5 bg-coffee-50 text-coffee-700 rounded-md text-[11px] font-semibold">
                        {item.thu_day_du}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadgeClass(item.loai_cong)}`}>
                      {item.trang_thai || 'Đúng giờ'}
                    </span>
                  </div>

                  {/* Hàng 2: Giờ vào / Giờ ra + Chi nhánh */}
                  <div className="flex items-end justify-between gap-3 pt-1">
                    <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-3">
                      <span className="text-[11px] text-slate-500 font-medium">Giờ vào</span>
                      <span aria-hidden="true"></span>
                      <span className="text-[11px] text-slate-500 font-medium">Giờ ra</span>
                      <span className="text-base font-extrabold text-slate-900">{item.gio_vao || '--:--'}</span>
                      <span className="text-slate-300 font-normal" aria-hidden="true">→</span>
                      <span className="text-base font-extrabold text-slate-900">{isValidTime(item.gio_ra) ? item.gio_ra : '--:--'}</span>
                    </div>

                    <div className="text-right min-w-0">
                      <span className="text-[11px] text-slate-500 font-medium block">Ca • Chi nhánh</span>
                      <div className="flex items-center justify-end space-x-1 mt-0.5">
                        <Building2 size={11} className="text-coffee-500 flex-shrink-0" aria-hidden="true" />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {item.ca_lam_viec || 'Hành chính'} • {item.dia_diem_chi_nhanh || 'Chưa có dữ liệu'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hàng 3: Ghi chú, duyệt công, trừ lương */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-500 font-medium truncate">{item.ghi_chu || 'Không có ghi chú'}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isPenalized && (
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 font-bold rounded text-[10px] border border-rose-200/60">
                          -1h lương
                        </span>
                      )}
                      {approval && (
                        <span className={`px-1.5 py-0.5 font-bold rounded text-[10px] border ${approval.cls}`}>
                          {approval.label}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-coffee-100 text-center space-y-2">
            <Calendar size={36} className="mx-auto text-coffee-200 stroke-1" />
            <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu</p>
            <p className="text-xs text-slate-500">
              Không có nhật ký chấm công nào trong tháng {monthFormatted}/{currentYear}
            </p>
          </div>
        )}
      </main>

      {/* ───────────────── BOTTOM NAVIGATION BAR ───────────────── */}
      <BottomNavBar activeTab="attendance" />
    </div>
  );
}
