import React, { useState, useEffect } from 'react';
import {
  Bell,
  MapPin,
  LogIn,
  LogOut,
  Calendar,
  AlertCircle,
  Timer,
  Umbrella,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  User,
  X,
  Briefcase,
} from 'lucide-react';

import logoImg from '../../assets/logo/Logo Trung Nguyên_black.png';
import AttendanceHistoryDetail from './AttendanceHistoryDetail';
import LeaveRequests from './LeaveRequests';
import SharedEmployeeHeader from './components/SharedEmployeeHeader';
import BottomNavBar from './components/BottomNavBar';
import {
  getAttendanceDashboardData,
  checkInAttendance,
  checkOutAttendance,
} from '../../services/attendanceService';

export default function AttendanceDashboard({ userSession, onLogout }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [toastMessage, setToastMessage] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);

  // States cho Popup Modal Xác nhận Ra ca
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutTimeDisplay, setCheckOutTimeDisplay] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const activeEmpId = userSession?.ma_nv || localStorage.getItem('user_ma_nv') || localStorage.getItem('ma_nv') || 'NV10';
      const dashboardData = await getAttendanceDashboardData(activeEmpId);
      setData(dashboardData);
      setIsLoading(false);
    }
    loadData();
  }, [userSession]);

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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Kiểm tra trạng thái chấm công của ngày hôm nay
  const todayRecord = (data?.recentRecords || []).find((r) => r.is_today);
  const hasCheckedInToday = Boolean(todayRecord && todayRecord.gio_vao && todayRecord.gio_vao !== '--:--');
  const hasCheckedOutToday = Boolean(todayRecord && todayRecord.gio_ra && todayRecord.gio_ra !== '--:--');

  // Thao tác VÀO CA (IN) - Mỗi ngày chỉ check-in 1 lần
  const handleCheckIn = async () => {
    if (!data) return;

    if (hasCheckedInToday) {
      showToast(
        `Hôm nay bạn đã vào ca lúc ${todayRecord.gio_vao}. Mỗi ngày chỉ check-in 1 lần, những lần sau không tính!`
      );
      return;
    }

    const res = await checkInAttendance(data.employee.ma_nv, data.location);
    if (!res.success) {
      showToast(res.message || 'Chấm công không thành công');
      const freshData = await getAttendanceDashboardData(data.employee.ma_nv);
      setData(freshData);
      return;
    }

    // Tải lại dữ liệu chuẩn từ database để đồng bộ hoàn toàn với backend
    const freshData = await getAttendanceDashboardData(data.employee.ma_nv);
    setData(freshData);
    showToast(res.message || `✓ Đã chấm VÀO CA thành công (${res.gio_vao})`);
  };

  // Thao tác bấm nút RA CA (OUT) -> Mở popup xác nhận (chỉ 1 lần mỗi ca)
  const handleCheckOut = () => {
    if (!data) return;

    if (!hasCheckedInToday) {
      showToast('Bạn chưa chấm công vào ca hôm nay!');
      return;
    }

    if (hasCheckedOutToday) {
      showToast(
        `Hôm nay bạn đã hoàn thành ra ca lúc ${todayRecord?.gio_ra}. Mỗi ca chỉ được check-out 1 lần!`
      );
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setCheckOutTimeDisplay(timeStr);
    setShowCheckOutModal(true);
  };

  // Thao tác xác nhận RA CA trong Popup Modal
  const handleConfirmCheckOut = async () => {
    if (!data) return;

    setIsCheckingOut(true);
    try {
      const res = await checkOutAttendance(data.employee.ma_nv, data.location);
      if (!res.success) {
        showToast(res.message || 'Chấm công ra ca không thành công');
        setIsCheckingOut(false);
        setShowCheckOutModal(false);
        const freshData = await getAttendanceDashboardData(data.employee.ma_nv);
        setData(freshData);
        return;
      }

      // Tải lại dữ liệu chuẩn từ database
      const freshData = await getAttendanceDashboardData(data.employee.ma_nv);
      setData(freshData);
      setShowCheckOutModal(false);
      showToast(res.message || `✓ Đã xác nhận RA CA thành công (${res.gio_ra})`);
    } catch (err) {
      showToast('Có lỗi xảy ra khi chấm công ra ca');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Đang tải dữ liệu từ máy chủ...</p>
        </div>
      </div>
    );
  }

  if (showHistoryDetail) {
    return (
      <AttendanceHistoryDetail
        userSession={userSession}
        onBack={() => setShowHistoryDetail(false)}
        onTabChange={(tab) => {
          setShowHistoryDetail(false);
          setActiveTab(tab);
        }}
      />
    );
  }



  const { employee, location, monthlyStats, recentRecords } = data;

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

      {/* ───────────────── HEADER NATIVE WEB APP ───────────────── */}
      <SharedEmployeeHeader
        onLogout={onLogout}
        onNotificationClick={() => showToast('Bạn có 1 thông báo mới từ Phòng Nhân sự')}
      />

      {/* ───────────────── BODY CONTENT ───────────────── */}
      <main className="px-4 py-3.5 space-y-4">
        
        {/* TIÊU ĐỀ TRANG CHẤM CÔNG (ĐƯỢC ĐƯA XUỐNG DƯỚI ĐỂ ĐỒNG BỘ VỚI TRANG ĐƠN TỪ) */}
        <div>
          <span className="text-[11px] font-extrabold tracking-wider text-[#0EA5E9] uppercase block">
            THEO DÕI VÀO / RA
          </span>
          <h2 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
            Chấm công
          </h2>
        </div>

        {/* 1. THẺ THÔNG TIN NHÂN VIÊN (BỎ HOÀN TOÀN AVATAR) */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <span className="text-[10px] font-extrabold text-[#0EA5E9] tracking-wider uppercase px-2 py-0.5 bg-sky-50 rounded-md border border-sky-100/60">
                {employee?.phong_ban || 'Không có dữ liệu'}
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {employee?.chuc_vu || 'Không có dữ liệu'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1.5 truncate">
              {employee?.ho_ten || 'Không có dữ liệu'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã NV: <span className="font-semibold text-slate-700">{employee?.ma_nv || 'Không có dữ liệu'}</span>
            </p>
          </div>

          <div className="flex-shrink-0">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>{employee?.trang_thai === 'DANG_LAM' ? 'Đang làm việc' : (employee?.trang_thai || 'Chính thức')}</span>
            </span>
          </div>
        </section>

        {/* 2. THẺ VỊ TRÍ & 2 NÚT THAO TÁC (LOCATION & CHECK-IN CARD) */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3.5">
          <div className="bg-[#F0F9FF] border border-sky-100 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#0EA5E9] flex-shrink-0">
              <MapPin size={20} className="fill-[#0EA5E9]/20" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">
                {location.ten_dia_diem}
              </p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                <span className="text-[11px] font-medium text-emerald-600 truncate">
                  Trong bán kính chấm công hợp lệ ({location.khoang_cach_hien_tai}m)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCheckIn}
              className={`py-3.5 px-3 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 focus:outline-none ${
                hasCheckedInToday
                  ? 'bg-slate-100 text-slate-500 border border-slate-200 shadow-none hover:bg-slate-200/70'
                  : 'bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.98] text-white shadow-sky-500/25'
              }`}
            >
              <LogIn size={16} />
              <span>{hasCheckedInToday ? `ĐÃ VÀO (${todayRecord?.gio_vao})` : 'VÀO CA (IN)'}</span>
            </button>

            <button
              onClick={handleCheckOut}
              className={`py-3.5 px-3 font-bold text-xs rounded-xl border transition-all flex items-center justify-center space-x-1.5 focus:outline-none ${
                !hasCheckedInToday
                  ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                  : hasCheckedOutToday
                  ? 'bg-slate-100 text-slate-500 border border-slate-200 shadow-none hover:bg-slate-200/70'
                  : 'bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 border-slate-300 shadow-sm'
              }`}
            >
              <LogOut size={16} className={hasCheckedOutToday ? 'text-slate-400' : 'text-slate-500'} />
              <span>{hasCheckedOutToday ? `ĐÃ RA (${todayRecord?.gio_ra})` : 'RA CA (OUT)'}</span>
            </button>
          </div>
        </section>

        {/* 3. LƯỚI THỐNG KÊ THÁNG (MONTHLY STATISTICS GRID) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900">
              Thống kê tháng {monthlyStats.thang}/{monthlyStats.nam}
            </h3>
            <span className="text-[11px] text-slate-400">
              Cập nhật {monthlyStats.cap_nhat_luc}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Ngày công */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500">Ngày công</span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0EA5E9] flex items-center justify-center">
                  <Calendar size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline">
                  <span className="text-xl font-black text-slate-900">{monthlyStats?.so_ngay_cong_thuc_te ?? 0}</span>
                  <span className="text-xs text-slate-400 font-normal ml-1">/ {monthlyStats?.so_ngay_cong_chuan || 22} ngày</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-[#0EA5E9] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((monthlyStats?.so_ngay_cong_thuc_te || 0) / (monthlyStats?.so_ngay_cong_chuan || 22)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Card 2: Đi muộn */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500">Đi muộn</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <AlertCircle size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline">
                  <span className="text-xl font-black text-amber-600">{monthlyStats?.so_lan_di_muon ?? 0}</span>
                  <span className="text-xs text-slate-500 font-medium ml-1">lần</span>
                </div>
                <p className="text-[11px] text-amber-700 font-medium mt-1 truncate">
                  {monthlyStats?.so_lan_di_muon > 0 ? (monthlyStats?.chi_tiet_muon || 'Có đi muộn') : 'Không có dữ liệu'}
                </p>
              </div>
            </div>

            {/* Card 3: Tăng ca (OT) */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500">Tăng ca (OT)</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Timer size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline">
                  <span className="text-xl font-black text-indigo-600">{monthlyStats?.so_gio_ot ?? 0}</span>
                  <span className="text-xs text-slate-500 font-medium ml-1">giờ</span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal mt-1">
                  {monthlyStats?.so_gio_ot > 0 ? `Hệ số lương ${monthlyStats.he_so_ot}` : 'Không có dữ liệu'}
                </p>
              </div>
            </div>

            {/* Card 4: Phép năm còn */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500">Phép năm còn</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Umbrella size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline">
                  <span className="text-xl font-black text-slate-900">{monthlyStats?.phep_nam_con_lai ?? 12}</span>
                  <span className="text-xs text-slate-400 font-normal ml-1">/ {monthlyStats?.tong_phep_nam || 12} ngày</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  {monthlyStats?.han_dung_phep ? `Hạn dùng ${monthlyStats.han_dung_phep}` : 'Không có dữ liệu'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. LỊCH SỬ CHẤM CÔNG GẦN ĐÂY (RECENT HISTORY) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900">Lịch sử chấm công gần đây</h3>
            <button
              onClick={() => setShowHistoryDetail(true)}
              className="text-xs font-semibold text-[#0EA5E9] hover:text-[#0284C7] flex items-center"
            >
              <span>Chi tiết</span>
              <ChevronRight size={14} className="ml-0.5" />
            </button>
          </div>

          {(() => {
            const validRecords = (recentRecords || []).filter(
              (item) => item.gio_vao && item.gio_vao !== '--:--' && item.loai_cong !== 'NGHI_PHEP' && item.trang_thai !== 'Nghỉ phép'
            );
            return validRecords.length > 0 ? (
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-2">
                {validRecords.map((item, idx) => {
                  const isToday = item.is_today || item.thu === 'Hôm nay';
                  const weekdayLabel = isToday
                    ? `Hôm nay (${item.thu_day_du || item.thu || 'Thứ Sáu'})`
                    : (item.thu_day_du || item.thu || 'Thứ');
                  const dayDisplay = item.ngay ? String(item.ngay).padStart(2, '0') : '01';
                  const monthDisplay = item.thang_label || (item.thang ? `Th.${parseInt(item.thang, 10)}` : 'Th.10');

                  // Kiểm tra xem record hiện tại có cùng ngày với record trước đó không
                  const prevItem = idx > 0 ? validRecords[idx - 1] : null;
                  const itemDateKey = item.ngay_day_du || `${item.ngay}-${item.thang || ''}-${item.thu || ''}`;
                  const prevDateKey = prevItem ? (prevItem.ngay_day_du || `${prevItem.ngay}-${prevItem.thang || ''}-${prevItem.thu || ''}`) : null;
                  const isFirstOfDate = idx === 0 || itemDateKey !== prevDateKey;

                  return (
                    <div key={item.ma_cc || idx} className="space-y-1">
                      {/* Chỉ hiển thị đường border Thứ khi bắt đầu một ngày/thứ mới */}
                      {isFirstOfDate && (
                        <div className={`relative flex items-center ${idx === 0 ? 'pt-1' : 'pt-2.5'} pb-0.5`}>
                          <div className="flex-grow border-t border-slate-200"></div>
                          <span className={`flex-shrink mx-2 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border flex items-center gap-1.5 shadow-2xs ${
                            isToday
                              ? 'bg-sky-50 text-[#0EA5E9] border-sky-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-pulse"></span>}
                            {weekdayLabel}
                          </span>
                          <div className="flex-grow border-t border-slate-200"></div>
                        </div>
                      )}

                      {/* Chi tiết lượt chấm công (nếu cùng ngày thì nằm liền kề bên dưới) */}
                      <div className={`py-2 px-2 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition-colors ${
                        !isFirstOfDate ? 'border-t border-dashed border-slate-200/70 pt-2.5' : ''
                      }`}>
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Ô xem chỉ hiển thị ngày và tháng */}
                          <div className="w-11 h-11 bg-slate-100/90 border border-slate-200/80 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-slate-800 shadow-2xs">
                            <span className="text-sm font-black leading-tight text-slate-800">{dayDisplay}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase leading-none mt-0.5">{monthDisplay}</span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                              <span className="flex items-center text-emerald-600">
                                <ArrowDown size={14} className="stroke-[2.5]" />
                                <span className="ml-0.5">{item.gio_vao || '--:--'}</span>
                              </span>
                              <span className="text-slate-300 font-normal">—</span>
                              <span className="flex items-center text-[#0EA5E9]">
                                <ArrowUp size={14} className="stroke-[2.5]" />
                                <span className="ml-0.5">{item.gio_ra || '--:--'}</span>
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">
                              {item.ca_lam_viec || 'Hành chính'} • {item.dia_diem_chi_nhanh || item.dia_diem_cham || 'Trụ sở chính Trung Nguyên'}
                            </p>
                          </div>
                        </div>

                        <div className="flex-shrink-0 pl-2 text-right">
                          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                            item.trang_thai === 'Đi muộn' || item.loai_cong === 'DI_TRE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100/80'
                          }`}>
                            {item.trang_thai || 'Đúng giờ'}
                          </span>
                          {(item.is_penalized || item.so_gio_lam === 7.0 || (item.ghi_chu && item.ghi_chu.includes('trừ 1 tiếng'))) && (
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
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center text-slate-400">
              <Calendar size={32} className="mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-medium text-slate-500">Không có dữ liệu</p>
            </div>
          );
        })()}
        </section>
      </main>

      {/* ───────────────── POPUP MODAL XÁC NHẬN RA CA ───────────────── */}
      {showCheckOutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl border border-slate-100 space-y-4 relative animate-in zoom-in-95 duration-150">
            {/* Header modal */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận Ra ca</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xác nhận kết thúc ca làm việc hôm nay?
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isCheckingOut && setShowCheckOutModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Thông tin ca và thời gian */}
            <div className="space-y-3">
              {/* Ca làm việc */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Ca làm việc</span>
                <span className="font-semibold text-slate-900">
                  {todayRecord?.ca_lam_viec || 'Hành chính (08:00 - 17:00)'}
                </span>
              </div>

              {/* Giờ Vào - Giờ Ra */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">
                    Giờ vào ca
                  </span>
                  <p className="text-lg font-bold text-slate-900">
                    {todayRecord?.gio_vao || '--:--'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">
                    Giờ ra ca
                  </span>
                  <p className="text-lg font-bold text-slate-900">
                    {checkOutTimeDisplay || '--:--'}
                  </p>
                </div>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowCheckOutModal(false)}
                disabled={isCheckingOut}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckOut}
                disabled={isCheckingOut}
                className="py-2.5 px-3 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.98] text-white font-semibold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all disabled:opacity-70"
              >
                {isCheckingOut ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Xác nhận Ra ca</span>
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
