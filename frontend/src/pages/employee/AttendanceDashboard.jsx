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
} from 'lucide-react';

import logoImg from '../../assets/logo/Logo Trung Nguyên_black.png';
import AttendanceHistoryDetail from './AttendanceHistoryDetail';
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

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const dashboardData = await getAttendanceDashboardData(userSession?.ma_nv || 'NV-8824');
      setData(dashboardData);
      setIsLoading(false);
    }
    loadData();
  }, [userSession]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Thao tác VÀO CA (IN)
  const handleCheckIn = async () => {
    if (!data) return;
    const res = await checkInAttendance(data.employee.ma_nv, data.location);
    const now = new Date();
    const timeStr = res.gio_vao || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newRecord = {
      ma_cc: Date.now(),
      thu: 'Hôm nay',
      ngay: now.getDate().toString(),
      gio_vao: timeStr,
      gio_ra: '--:--',
      ca_lam_viec: 'Ca hành chính',
      dia_diem_cham: 'Landmark 81 (GPS)',
      hinh_thuc: 'GPS',
      trang_thai: 'Đúng giờ',
    };

    setData((prev) => ({
      ...prev,
      recentRecords: [newRecord, ...prev.recentRecords.slice(0, 2)],
    }));

    showToast(`✓ Đã chấm VÀO CA thành công (${timeStr})`);
  };

  // Thao tác RA CA (OUT)
  const handleCheckOut = async () => {
    if (!data) return;
    const res = await checkOutAttendance(data.employee.ma_nv, data.location);
    const now = new Date();
    const timeStr = res.gio_ra || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setData((prev) => {
      const updated = [...prev.recentRecords];
      if (updated.length > 0) {
        updated[0] = { ...updated[0], gio_ra: timeStr };
      }
      return { ...prev, recentRecords: updated };
    });

    showToast(`✓ Đã chấm RA CA thành công (${timeStr})`);
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
      <header className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-sm">
            <img src={logoImg} alt="Trung Nguyen Legend" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[10px] font-black tracking-wider text-[#0EA5E9] uppercase leading-none">
              TrungNguyenHR
            </div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Chấm Công
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Bell icon có chấm đỏ */}
          <button
            onClick={() => showToast('Bạn có 1 thông báo mới từ Phòng Nhân sự')}
            className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Thông báo"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>

          {/* Nút Đăng xuất tiện lợi (Không dùng Avatar) */}
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors focus:outline-none text-xs font-semibold"
          >
            <LogOut size={15} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* ───────────────── BODY CONTENT ───────────────── */}
      <main className="px-4 py-3.5 space-y-4">
        
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
              className="py-3.5 px-3 bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/25 transition-all flex items-center justify-center space-x-1.5 focus:outline-none"
            >
              <LogIn size={16} />
              <span>VÀO CA (IN)</span>
            </button>

            <button
              onClick={handleCheckOut}
              className="py-3.5 px-3 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center space-x-1.5 focus:outline-none"
            >
              <LogOut size={16} className="text-slate-500" />
              <span>RA CA (OUT)</span>
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
              <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] divide-y divide-slate-100">
                {validRecords.map((item) => (
                  <div
                    key={item.ma_cc}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/60 rounded-xl transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-11 h-11 bg-slate-100/80 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-slate-700">
                        <span className="text-[10px] font-bold uppercase leading-none text-slate-500">{item.thu || '—'}</span>
                      <span className="text-sm font-black leading-tight mt-0.5">{item.ngay || '—'}</span>
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

                  <div className="flex-shrink-0 pl-2">
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-100/80">
                      {item.trang_thai || 'Đúng giờ'}
                    </span>
                  </div>
                </div>
              ))}
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

      {/* ───────────────── BOTTOM NAVIGATION BAR NATIVE WEB APP ───────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 py-2 px-4 flex items-center justify-around z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'attendance' ? 'text-[#0EA5E9]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock size={20} className={activeTab === 'attendance' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-semibold leading-none">Chấm công</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('requests');
            showToast('Chức năng "Đơn từ" (Nghỉ phép, công tác) đang đồng bộ');
          }}
          className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'requests' ? 'text-[#0EA5E9]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText size={20} className={activeTab === 'requests' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-semibold leading-none">Đơn từ</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('payroll');
            showToast('Chức năng "Bảng lương" đang đồng bộ từ Database');
          }}
          className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'payroll' ? 'text-[#0EA5E9]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <DollarSign size={20} className={activeTab === 'payroll' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-semibold leading-none">Bảng lương</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('profile');
            setShowProfileMenu(!showProfileMenu);
          }}
          className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'profile' ? 'text-[#0EA5E9]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={20} className={activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] font-semibold leading-none">Cá nhân</span>
        </button>
      </nav>
    </div>
  );
}
