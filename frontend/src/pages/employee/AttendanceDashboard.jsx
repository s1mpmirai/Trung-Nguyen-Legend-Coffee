import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LogIn,
  LogOut,
  Calendar,
  AlertCircle,
  Umbrella,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  CheckCircle2,
  Clock,
  Hourglass,
  Building2,
  Coffee,
  Timer,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';

import AttendanceHistoryDetail from './AttendanceHistoryDetail';
import SharedEmployeeHeader from './components/SharedEmployeeHeader';
import BottomNavBar from './components/BottomNavBar';
import EmployeeToast from './components/EmployeeToast';
import useToast from './utils/useToast';
import { formatDays, isValidTime } from './utils/format';
import {
  getAttendanceDashboardData,
  checkInAttendance,
  checkOutAttendance,
} from '../../services/attendanceService';

// Trạng thái chấm công hôm nay do backend tính (ca_lam_viec.trang_thai_hom_nay)
const TODAY_STATUS = {
  CHUA_VAO_CA: {
    label: 'Chưa vào ca',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    hint: 'Bấm “Vào ca” khi bắt đầu làm việc. Giờ chấm công được ghi nhận theo đồng hồ máy chủ.',
  },
  DANG_TRONG_CA: {
    label: 'Đang trong ca',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500 animate-pulse',
    hint: 'Nhớ bấm “Ra ca” khi kết thúc ca làm việc để hệ thống tính đủ công.',
  },
  DA_RA_CA: {
    label: 'Đã ra ca',
    badge: 'bg-coffee-50 text-coffee-700 border-coffee-200',
    dot: 'bg-coffee-500',
    hint: 'Bạn đã hoàn thành chấm công hôm nay. Hẹn gặp lại vào ca làm việc tiếp theo!',
  },
};

// Màu nhãn trạng thái từng lượt chấm công
const recordBadgeClass = (loaiCong) => {
  if (loaiCong === 'DI_TRE' || loaiCong === 'VE_SOM') return 'bg-amber-50 text-amber-700 border-amber-200/80';
  if (loaiCong === 'NUA_CONG') return 'bg-orange-50 text-orange-700 border-orange-200/80';
  return 'bg-emerald-50 text-emerald-700 border-emerald-100/80';
};

export default function AttendanceDashboard({ userSession, onLogout }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // 'in' | 'out' | null – chặn bấm liên tục khi đang gửi yêu cầu chấm công
  const [submitting, setSubmitting] = useState(null);
  const submittingRef = useRef(false);

  // States cho Popup Modal Xác nhận Ra ca
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [checkOutTimeDisplay, setCheckOutTimeDisplay] = useState('');

  const activeEmpId = userSession?.ma_nv || localStorage.getItem('user_ma_nv');

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    const dashboardData = await getAttendanceDashboardData(activeEmpId);
    // Khi tải lại ngầm thất bại thì giữ dữ liệu cũ thay vì xóa trắng màn hình
    if (dashboardData || !silent) setData(dashboardData);
    if (!silent) setIsLoading(false);
  }, [activeEmpId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cập nhật giờ ra ca theo thời gian thực khi Modal xác nhận đang mở
  useEffect(() => {
    if (!showCheckOutModal) return;
    const updateTime = () => {
      const now = new Date();
      setCheckOutTimeDisplay(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [showCheckOutModal]);

  // ── Trạng thái hôm nay: ưu tiên dữ liệu ca làm việc từ backend ──
  const shift = data?.ca_lam_viec || null;
  const todayRecord = (data?.recentRecords || []).find((r) => r.is_today);
  const gioVaoHomNay = isValidTime(shift?.gio_vao_hom_nay) ? shift.gio_vao_hom_nay : (isValidTime(todayRecord?.gio_vao) ? todayRecord.gio_vao : null);
  const gioRaHomNay = isValidTime(shift?.gio_ra_hom_nay) ? shift.gio_ra_hom_nay : (isValidTime(todayRecord?.gio_ra) ? todayRecord.gio_ra : null);
  const todayStatusKey =
    shift?.trang_thai_hom_nay || (gioRaHomNay ? 'DA_RA_CA' : gioVaoHomNay ? 'DANG_TRONG_CA' : 'CHUA_VAO_CA');
  const todayStatus = TODAY_STATUS[todayStatusKey] || TODAY_STATUS.CHUA_VAO_CA;

  const hasCheckedInToday = todayStatusKey === 'DANG_TRONG_CA' || todayStatusKey === 'DA_RA_CA';
  const hasCheckedOutToday = todayStatusKey === 'DA_RA_CA';
  const canCheckIn = !hasCheckedInToday && !submitting;
  const canCheckOut = hasCheckedInToday && !hasCheckedOutToday && !submitting;

  // Thao tác VÀO CA - Mỗi ngày chỉ check-in 1 lần
  const handleCheckIn = async () => {
    if (!data || !canCheckIn || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting('in');
    try {
      const res = await checkInAttendance();
      if (!res?.success) {
        showToast(res?.message || 'Chấm công vào ca không thành công', 'error');
      } else {
        showToast(res.message || `Đã chấm công vào ca lúc ${res.gio_vao}`, 'success');
      }
      // Luôn tải lại dữ liệu chuẩn từ máy chủ để đồng bộ trạng thái
      await loadData({ silent: true });
    } finally {
      submittingRef.current = false;
      setSubmitting(null);
    }
  };

  // Bấm nút RA CA -> mở popup xác nhận (chỉ khi đã vào ca và chưa ra ca)
  const handleCheckOut = () => {
    if (!data || !canCheckOut) return;
    setShowCheckOutModal(true);
  };

  // Xác nhận RA CA trong Popup Modal
  const handleConfirmCheckOut = async () => {
    if (!data || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting('out');
    try {
      const res = await checkOutAttendance();
      if (!res?.success) {
        showToast(res?.message || 'Chấm công ra ca không thành công', 'error');
      } else {
        showToast(res.message || `Đã chấm công ra ca lúc ${res.gio_ra}`, 'success');
      }
      setShowCheckOutModal(false);
      await loadData({ silent: true });
    } finally {
      submittingRef.current = false;
      setSubmitting(null);
    }
  };

  const closeCheckOutModal = () => {
    if (submitting !== 'out') setShowCheckOutModal(false);
  };

  if (showHistoryDetail) {
    return (
      <AttendanceHistoryDetail
        userSession={userSession}
        onBack={() => setShowHistoryDetail(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-cream min-h-screen">
        <div className="flex flex-col items-center space-y-3" role="status">
          <div className="w-10 h-10 border-4 border-coffee-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Đang tải dữ liệu chấm công...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col bg-cream min-h-screen">
        <SharedEmployeeHeader onLogout={onLogout} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3">
          <AlertCircle size={36} className="text-rose-400" />
          <p className="text-sm font-semibold text-slate-700">Không tải được dữ liệu chấm công.</p>
          <p className="text-xs text-slate-500">Vui lòng kiểm tra kết nối mạng rồi thử lại, hoặc đăng nhập lại.</p>
          <button
            type="button"
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-coffee-600 hover:bg-coffee-800 text-white text-xs font-bold"
          >
            <RefreshCw size={14} />
            Thử lại
          </button>
        </div>
        <BottomNavBar activeTab="attendance" />
      </div>
    );
  }

  const { employee, monthlyStats = {}, recentRecords } = data;
  const congChuan = Number(monthlyStats.so_ngay_cong_chuan) || 0;
  const congThucTe = Number(monthlyStats.so_ngay_cong_thuc_te) || 0;
  const tongPhep = Number(monthlyStats.tong_phep_nam) || 0;

  return (
    <div className="flex-1 flex flex-col bg-cream min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] relative">
      <EmployeeToast message={toast?.message} type={toast?.type} onClose={hideToast} />

      {/* ───────────────── HEADER NATIVE WEB APP ───────────────── */}
      <SharedEmployeeHeader onLogout={onLogout} />

      {/* ───────────────── BODY CONTENT ───────────────── */}
      <main className="px-4 py-3.5 space-y-4">

        {/* TIÊU ĐỀ TRANG CHẤM CÔNG */}
        <div>
          <span className="text-[11px] font-extrabold tracking-wider text-gold-700 uppercase block">
            Theo dõi vào / ra
          </span>
          <h1 className="text-xl font-extrabold text-coffee-900 leading-tight mt-0.5">
            Chấm công
          </h1>
        </div>

        {/* 1. THẺ THÔNG TIN NHÂN VIÊN */}
        <section className="bg-white rounded-2xl p-4 border border-coffee-100 shadow-[0_2px_10px_rgba(62,39,35,0.04)] flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <span className="text-[10px] font-extrabold text-coffee-700 tracking-wider uppercase px-2 py-0.5 bg-coffee-50 rounded-md border border-coffee-100">
                {employee?.phong_ban || 'Chưa có dữ liệu'}
              </span>
              <span className="text-xs text-slate-300" aria-hidden="true">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {employee?.chuc_vu || 'Chưa có dữ liệu'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1.5 truncate">
              {employee?.ho_ten || 'Chưa có dữ liệu'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã NV: <span className="font-semibold text-slate-700">{employee?.ma_nv || 'Chưa có dữ liệu'}</span>
            </p>
          </div>

          <div className="flex-shrink-0">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>{employee?.trang_thai === 'DANG_LAM' ? 'Đang làm việc' : (employee?.trang_thai || 'Chưa có dữ liệu')}</span>
            </span>
          </div>
        </section>

        {/* 2. THẺ CA LÀM VIỆC HÔM NAY & 2 NÚT CHẤM CÔNG */}
        <section
          aria-labelledby="shift-card-title"
          className="bg-white rounded-2xl p-4 border border-coffee-100 shadow-[0_2px_10px_rgba(62,39,35,0.04)] space-y-3.5"
        >
          {/* Ca làm việc + trạng thái hôm nay */}
          <div className="bg-coffee-50 border border-coffee-100 rounded-xl p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-coffee-600 flex-shrink-0">
                  <Clock size={20} />
                </div>
                <div className="min-w-0">
                  <p id="shift-card-title" className="text-[11px] font-semibold text-coffee-500 uppercase tracking-wide">
                    Ca làm việc hôm nay
                  </p>
                  <p className="text-sm font-bold text-coffee-900 truncate">
                    {shift?.ten_ca || 'Chưa có dữ liệu ca'}
                  </p>
                  {shift && (
                    <p className="text-xs font-semibold text-coffee-700 mt-0.5">
                      {shift.gio_bat_dau} – {shift.gio_ket_thuc}
                    </p>
                  )}
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${todayStatus.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${todayStatus.dot}`} aria-hidden="true"></span>
                {todayStatus.label}
              </span>
            </div>

            {shift && (
              <ul className="grid grid-cols-3 gap-2 text-[11px]">
                <li className="bg-white rounded-lg px-2 py-1.5 border border-coffee-100">
                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <Timer size={11} aria-hidden="true" /> Cho phép trễ
                  </span>
                  <span className="block font-bold text-coffee-800 mt-0.5">{shift.phut_cho_phep_tre ?? 15} phút</span>
                </li>
                <li className="bg-white rounded-lg px-2 py-1.5 border border-coffee-100">
                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <Coffee size={11} aria-hidden="true" /> Nghỉ trưa
                  </span>
                  <span className="block font-bold text-coffee-800 mt-0.5">
                    {Number(shift.nghi_trua_phut) > 0 ? `${shift.nghi_trua_phut} phút` : 'Không có'}
                  </span>
                </li>
                <li className="bg-white rounded-lg px-2 py-1.5 border border-coffee-100 min-w-0">
                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <Building2 size={11} aria-hidden="true" /> Chi nhánh
                  </span>
                  <span className="block font-bold text-coffee-800 mt-0.5 truncate" title={shift.chi_nhanh}>
                    {shift.chi_nhanh || 'Chưa có dữ liệu'}
                  </span>
                </li>
              </ul>
            )}

            {/* Giờ vào / ra hôm nay */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg px-3 py-2 border border-coffee-100">
                <span className="text-[11px] text-slate-500 font-medium">Giờ vào hôm nay</span>
                <p className={`text-base font-extrabold ${gioVaoHomNay ? 'text-emerald-700' : 'text-slate-300'}`}>
                  {gioVaoHomNay || '--:--'}
                </p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-coffee-100">
                <span className="text-[11px] text-slate-500 font-medium">Giờ ra hôm nay</span>
                <p className={`text-base font-extrabold ${gioRaHomNay ? 'text-coffee-700' : 'text-slate-300'}`}>
                  {gioRaHomNay || '--:--'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              aria-busy={submitting === 'in'}
              className="min-h-[48px] py-3 px-3 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 bg-coffee-600 hover:bg-coffee-800 active:scale-[0.98] text-white shadow-md shadow-coffee-600/25 disabled:bg-slate-100 disabled:text-slate-500 disabled:border disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {submitting === 'in' ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              <span>
                {submitting === 'in' ? 'Đang chấm công...' : hasCheckedInToday ? `Đã vào ca (${gioVaoHomNay || '--:--'})` : 'Vào ca'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCheckOut}
              disabled={!canCheckOut}
              title={!hasCheckedInToday ? 'Bạn cần vào ca trước khi ra ca' : undefined}
              className="min-h-[48px] py-3 px-3 font-bold text-xs rounded-xl border transition-all flex items-center justify-center space-x-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 bg-white hover:bg-coffee-50 active:scale-[0.98] text-coffee-800 border-coffee-300 shadow-sm disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {submitting === 'out' ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              <span>{hasCheckedOutToday ? `Đã ra ca (${gioRaHomNay || '--:--'})` : 'Ra ca'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">{todayStatus.hint}</p>
        </section>

        {/* 3. LƯỚI THỐNG KÊ THÁNG HIỆN TẠI */}
        <section className="space-y-2.5" aria-labelledby="monthly-stats-title">
          <div className="flex items-center justify-between px-1">
            <h3 id="monthly-stats-title" className="text-sm font-bold text-slate-900">
              Thống kê tháng {monthlyStats.thang}/{monthlyStats.nam}
            </h3>
            <span className="text-[11px] text-slate-500">Tháng hiện tại</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Ngày công */}
            <div className="bg-white rounded-2xl p-3.5 border border-coffee-100 shadow-[0_2px_8px_rgba(62,39,35,0.03)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500">Ngày công</span>
                <div className="w-7 h-7 rounded-lg bg-coffee-50 text-coffee-600 flex items-center justify-center">
                  <Calendar size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline">
                  <span className="text-xl font-extrabold text-slate-900">{formatDays(congThucTe)}</span>
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    / {congChuan > 0 ? formatDays(congChuan) : '—'} ngày
                  </span>
                </div>
                <div className="w-full bg-coffee-50 h-1.5 rounded-full overflow-hidden mt-2" aria-hidden="true">
                  <div
                    className="bg-gold-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${congChuan > 0 ? Math.min(100, (congThucTe / congChuan) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Card 2: Đi muộn */}
            <div className="bg-white rounded-2xl p-3.5 border border-coffee-100 shadow-[0_2px_8px_rgba(62,39,35,0.03)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500">Đi muộn</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline">
                  <span className="text-xl font-extrabold text-amber-700">{monthlyStats.so_lan_di_muon ?? 0}</span>
                  <span className="text-xs text-slate-500 font-medium ml-1">lần</span>
                </div>
                <p className="text-[11px] text-amber-800 font-medium mt-1 truncate">
                  {monthlyStats.chi_tiet_muon || 'Chưa có dữ liệu'}
                </p>
              </div>
            </div>

            {/* Card 3: Đơn phép đang chờ duyệt */}
            <div className="bg-white rounded-2xl p-3.5 border border-coffee-100 shadow-[0_2px_8px_rgba(62,39,35,0.03)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500">Phép chờ duyệt</span>
                <div className="w-7 h-7 rounded-lg bg-gold-50 text-gold-700 flex items-center justify-center">
                  <Hourglass size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline">
                  <span className="text-xl font-extrabold text-gold-700">{formatDays(monthlyStats.phep_dang_cho_duyet ?? 0)}</span>
                  <span className="text-xs text-slate-500 font-medium ml-1">ngày</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-1 truncate">
                  {Number(monthlyStats.phep_dang_cho_duyet) > 0 ? 'Đang chờ Quản lý duyệt' : 'Không có đơn chờ duyệt'}
                </p>
              </div>
            </div>

            {/* Card 4: Phép năm còn lại */}
            <div className="bg-white rounded-2xl p-3.5 border border-coffee-100 shadow-[0_2px_8px_rgba(62,39,35,0.03)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500">Phép năm còn</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Umbrella size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline">
                  <span className="text-xl font-extrabold text-slate-900">
                    {monthlyStats.phep_nam_con_lai != null ? formatDays(monthlyStats.phep_nam_con_lai) : '—'}
                  </span>
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    / {tongPhep > 0 ? formatDays(tongPhep) : '—'} ngày
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  {monthlyStats.han_dung_phep ? `Hạn dùng ${monthlyStats.han_dung_phep}` : 'Chưa có dữ liệu'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. LỊCH SỬ CHẤM CÔNG GẦN ĐÂY */}
        <section className="space-y-2.5" aria-labelledby="recent-history-title">
          <div className="flex items-center justify-between px-1">
            <h3 id="recent-history-title" className="text-sm font-bold text-slate-900">Lịch sử chấm công gần đây</h3>
            <button
              type="button"
              onClick={() => setShowHistoryDetail(true)}
              className="min-h-[36px] px-2 -mr-2 rounded-lg text-xs font-semibold text-coffee-600 hover:text-coffee-800 hover:bg-coffee-50 flex items-center"
            >
              <span>Chi tiết</span>
              <ChevronRight size={14} className="ml-0.5" />
            </button>
          </div>

          {(() => {
            const validRecords = (recentRecords || []).filter(
              (item) => isValidTime(item.gio_vao) && item.loai_cong !== 'NGHI_PHEP'
            );
            return validRecords.length > 0 ? (
              <div className="bg-white rounded-2xl p-3 border border-coffee-100 shadow-[0_2px_10px_rgba(62,39,35,0.03)] space-y-2">
                {validRecords.map((item, idx) => {
                  const isToday = Boolean(item.is_today);
                  const weekdayLabel = isToday
                    ? `Hôm nay (${item.thu_day_du || item.thu || ''})`
                    : (item.thu_day_du || item.thu || '');
                  const dayDisplay = item.ngay ? String(item.ngay).padStart(2, '0') : '--';
                  const monthDisplay = item.thang_label || (item.thang ? `Th.${parseInt(item.thang, 10)}` : '');

                  // Gom các lượt chấm công cùng ngày dưới một nhãn Thứ
                  const prevItem = idx > 0 ? validRecords[idx - 1] : null;
                  const isFirstOfDate = !prevItem || prevItem.ngay_day_du !== item.ngay_day_du;

                  return (
                    <div key={item.ma_cc || idx} className="space-y-1">
                      {isFirstOfDate && (
                        <div className={`relative flex items-center ${idx === 0 ? 'pt-1' : 'pt-2.5'} pb-0.5`}>
                          <div className="flex-grow border-t border-coffee-100"></div>
                          <span className={`flex-shrink mx-2 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border flex items-center gap-1.5 ${
                            isToday
                              ? 'bg-gold-50 text-gold-700 border-gold-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {isToday && <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" aria-hidden="true"></span>}
                            {weekdayLabel}
                          </span>
                          <div className="flex-grow border-t border-coffee-100"></div>
                        </div>
                      )}

                      <div className={`py-2 px-2 flex items-center justify-between hover:bg-coffee-50/60 rounded-xl transition-colors ${
                        !isFirstOfDate ? 'border-t border-dashed border-slate-200/70 pt-2.5' : ''
                      }`}>
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-11 h-11 bg-coffee-50 border border-coffee-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-coffee-800">
                            <span className="text-sm font-extrabold leading-tight">{dayDisplay}</span>
                            <span className="text-[9px] font-bold text-coffee-500 uppercase leading-none mt-0.5">{monthDisplay}</span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                              <span className="flex items-center text-emerald-700" title="Giờ vào">
                                <ArrowDown size={14} className="stroke-[2.5]" aria-hidden="true" />
                                <span className="ml-0.5">{item.gio_vao || '--:--'}</span>
                              </span>
                              <span className="text-slate-300 font-normal" aria-hidden="true">—</span>
                              <span className="flex items-center text-coffee-600" title="Giờ ra">
                                <ArrowUp size={14} className="stroke-[2.5]" aria-hidden="true" />
                                <span className="ml-0.5">{item.gio_ra || '--:--'}</span>
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">
                              {item.ca_lam_viec || 'Hành chính'} • {item.dia_diem_chi_nhanh || 'Chưa có dữ liệu'}
                            </p>
                          </div>
                        </div>

                        <div className="flex-shrink-0 pl-2 text-right">
                          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${recordBadgeClass(item.loai_cong)}`}>
                            {item.trang_thai || 'Đúng giờ'}
                          </span>
                          {item.is_penalized && (
                            <span className="block mt-0.5 text-[10px] font-bold text-rose-600">
                              -1h lương
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-coffee-100 text-center">
                <Calendar size={32} className="mx-auto text-coffee-200 mb-2 stroke-1" />
                <p className="text-xs font-medium text-slate-500">Chưa có dữ liệu</p>
              </div>
            );
          })()}
        </section>
      </main>

      {/* ───────────────── POPUP MODAL XÁC NHẬN RA CA ───────────────── */}
      {showCheckOutModal && (
        <div
          onClick={closeCheckOutModal}
          className="fixed inset-0 bg-coffee-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl border border-coffee-100 space-y-4 relative animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id="checkout-modal-title" className="text-base font-bold text-slate-900">Xác nhận ra ca</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xác nhận kết thúc ca làm việc hôm nay?
                </p>
              </div>
              <button
                type="button"
                onClick={closeCheckOutModal}
                aria-label="Đóng"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Ca làm việc</span>
                <span className="font-semibold text-slate-900">
                  {shift ? `${shift.ten_ca} (${shift.gio_bat_dau} – ${shift.gio_ket_thuc})` : (todayRecord?.ca_lam_viec || 'Chưa có dữ liệu')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-coffee-50 rounded-xl p-3 border border-coffee-100">
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Giờ vào ca</span>
                  <p className="text-lg font-bold text-slate-900">{gioVaoHomNay || '--:--'}</p>
                </div>
                <div className="bg-coffee-50 rounded-xl p-3 border border-coffee-100">
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Giờ ra ca</span>
                  <p className="text-lg font-bold text-slate-900">{checkOutTimeDisplay || '--:--'}</p>
                </div>
              </div>

              {shift && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Ra ca trước {shift.gio_ket_thuc} quá {shift.phut_cho_phep_ve_som ?? 15} phút sẽ được ghi nhận là về sớm.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={closeCheckOutModal}
                disabled={submitting === 'out'}
                className="min-h-[44px] px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckOut}
                disabled={submitting === 'out'}
                className="min-h-[44px] px-3 rounded-xl bg-coffee-600 hover:bg-coffee-800 active:scale-[0.98] text-white font-semibold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting === 'out' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Xác nhận ra ca</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── BOTTOM NAVIGATION BAR ───────────────── */}
      <BottomNavBar activeTab="attendance" />
    </div>
  );
}
