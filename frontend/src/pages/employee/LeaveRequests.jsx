import React, { useState, useEffect } from 'react';
import {
  Bell,
  Umbrella,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  ShieldCheck,
  HeartPulse,
  LogOut,
  ChevronRight,
  UserCheck,
  Calendar,
  X,
} from 'lucide-react';

import logoImg from '../../assets/logo/Logo Trung Nguyên_black.png';
import { getLeaveHistory } from '../../services/leaveService';

export default function LeaveRequests({ userSession, onLogout }) {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state tạo đơn
  const [formLoaiDon, setFormLoaiDon] = useState('NGHI_PHEP');
  const [formNgayBatDau, setFormNgayBatDau] = useState('');
  const [formNgayKetThuc, setFormNgayKetThuc] = useState('');
  const [formSoNgay, setFormSoNgay] = useState('1');
  const [formLyDo, setFormLyDo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getLeaveHistory(userSession?.ma_nv || 'NV10');
      setLeaves(data);
      setIsLoading(false);
    }
    loadData();
  }, [userSession]);

  // Format ngày dd/mm/yyyy
  const formatDateVN = (dateStr) => {
    if (!dateStr) return 'Không có dữ liệu';
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Tính toán quỹ phép năm thực tế từ bảng don_tu
  const tongPhep = 12.0;
  const daDung = leaves
    .filter((l) => l.loai_don === 'NGHI_PHEP' && l.trang_thai === 'DA_DUYET')
    .reduce((sum, item) => sum + (parseFloat(item.so_ngay) || 0), 0);
  const conLai = Math.max(0, tongPhep - daDung);
  const percentDung = Math.min(100, Math.round((daDung / tongPhep) * 100));

  // Lọc theo filter
  const filteredLeaves = leaves.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.trang_thai === activeFilter;
  });

  // Tên loại đơn
  const getTenLoaiDon = (loai) => {
    switch (loai) {
      case 'NGHI_PHEP':
        return 'Đơn xin nghỉ phép năm';
      case 'NGHI_OM':
        return 'Đơn nghỉ ốm đau';
      case 'NGHI_THAI_SAN':
        return 'Đơn nghỉ thai sản';
      case 'NGHI_KHONG_LUONG':
        return 'Đơn nghỉ không lương';
      case 'NGHI_VIEC':
        return 'Đơn xin thôi việc';
      default:
        return 'Đơn từ nhân sự';
    }
  };

  // Icon loại đơn
  const renderLoaiDonIcon = (loai) => {
    switch (loai) {
      case 'NGHI_PHEP':
        return (
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0EA5E9] flex items-center justify-center flex-shrink-0 border border-sky-100/60">
            <Umbrella size={20} className="stroke-[2.2]" />
          </div>
        );
      case 'NGHI_OM':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100/60">
            <HeartPulse size={20} className="stroke-[2.2]" />
          </div>
        );
      case 'NGHI_THAI_SAN':
      case 'NGHI_KHONG_LUONG':
      case 'NGHI_VIEC':
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100/60">
            <Clock size={20} className="stroke-[2.2]" />
          </div>
        );
    }
  };

  // Badge trạng thái
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CHO_DUYET':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Chờ duyệt
          </span>
        );
      case 'DA_DUYET':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 size={12} className="mr-1 text-emerald-600 stroke-[2.5]" />
            Đã duyệt
          </span>
        );
      case 'TU_CHOI':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <XCircle size={12} className="mr-1 text-rose-600 stroke-[2.5]" />
            Từ chối
          </span>
        );
      case 'DA_HUY':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
            {status || 'Không có dữ liệu'}
          </span>
        );
    }
  };

  // Xử lý tạo đơn
  const handleCreateLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!formNgayBatDau || !formNgayKetThuc || !formLyDo.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin đơn');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/leaves/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_nv: userSession?.ma_nv || 'NV10',
          loai_don: formLoaiDon,
          ngay_bat_dau: formNgayBatDau,
          ngay_ket_thuc: formNgayKetThuc,
          so_ngay: parseFloat(formSoNgay) || 1,
          ly_do: formLyDo.trim(),
        }),
      });

      if (res.ok) {
        showToast('✓ Tạo đơn thành công! Đang chờ duyệt.');
        setShowCreateModal(false);
        // Tải lại dữ liệu từ MariaDB
        const fresh = await getLeaveHistory(userSession?.ma_nv || 'NV10');
        setLeaves(fresh);
      } else {
        showToast('Tạo đơn thất bại, vui lòng thử lại');
      }
    } catch (err) {
      showToast('Đã ghi nhận yêu cầu gửi đơn');
      setShowCreateModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen pb-24 relative">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 animate-bounce">
          <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between text-xs font-semibold border border-slate-700 backdrop-blur-md">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ───────────────── HEADER NATIVE WEB APP ───────────────── */}
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
            onClick={() => showToast('Bạn chưa có thông báo đơn từ mới')}
            className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Thông báo"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>

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

      {/* ───────────────── MAIN CONTENT ───────────────── */}
      <main className="px-4 py-3.5 space-y-4">
        {/* BANNER TIÊU ĐỀ & NÚT TẠO ĐƠN */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold tracking-wider text-[#0EA5E9] uppercase block">
              NHÂN SỰ & PHÚC LỢI
            </span>
            <h2 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
              Đơn từ & Nghỉ phép
            </h2>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.98] text-white px-3.5 py-2 rounded-full font-bold text-xs shadow-md shadow-sky-500/25 transition-all"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Tạo đơn</span>
          </button>
        </div>

        {/* THẺ QUỸ PHÉP NĂM */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <Umbrella size={18} className="text-[#0EA5E9]" />
              <span>Quỹ phép năm {currentYear}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Hạn dùng: 31/12/{currentYear}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {conLai.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-medium">ngày còn lại</span>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Đã dùng: <strong className="text-slate-800">{daDung.toFixed(1)}</strong> / {tongPhep.toFixed(1)} ngày
            </span>
          </div>

          {/* Thanh tiến trình */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0EA5E9] h-full rounded-full transition-all duration-500"
              style={{ width: `${percentDung}%` }}
            ></div>
          </div>
        </section>

        {/* CÁC NÚT BỘ LỌC TRẠNG THÁI */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'ALL'
                ? 'bg-[#0EA5E9] text-white shadow-sm shadow-sky-500/30'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Tất cả
          </button>

          <button
            onClick={() => setActiveFilter('CHO_DUYET')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'CHO_DUYET'
                ? 'bg-[#0EA5E9] text-white shadow-sm shadow-sky-500/30'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <span>Chờ duyệt</span>
            <span className={`w-2 h-2 rounded-full ${activeFilter === 'CHO_DUYET' ? 'bg-amber-300' : 'bg-amber-500'}`}></span>
          </button>

          <button
            onClick={() => setActiveFilter('DA_DUYET')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'DA_DUYET'
                ? 'bg-[#0EA5E9] text-white shadow-sm shadow-sky-500/30'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <span>Đã duyệt</span>
            <span className={`w-2 h-2 rounded-full ${activeFilter === 'DA_DUYET' ? 'bg-emerald-300' : 'bg-emerald-500'}`}></span>
          </button>

          <button
            onClick={() => setActiveFilter('TU_CHOI')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'TU_CHOI'
                ? 'bg-[#0EA5E9] text-white shadow-sm shadow-sky-500/30'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <span>Từ chối</span>
            <span className={`w-2 h-2 rounded-full ${activeFilter === 'TU_CHOI' ? 'bg-rose-300' : 'bg-rose-500'}`}></span>
          </button>
        </div>

        {/* TIÊU ĐỀ LỊCH SỬ GỬI ĐƠN */}
        <div className="flex items-center justify-between px-1 pt-1">
          <h3 className="text-sm font-bold text-slate-900">Lịch sử gửi đơn</h3>
          <span className="text-[11px] text-slate-400 font-medium">Gần đây</span>
        </div>

        {/* DANH SÁCH THẺ ĐƠN TỪ (DỮ LIỆU THẬT 100% TỪ MARIADB) */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-medium">Đang tải danh sách đơn từ...</p>
          </div>
        ) : filteredLeaves.length > 0 ? (
          <div className="space-y-3">
            {filteredLeaves.map((item) => (
              <div
                key={item.ma_don}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 transition-all hover:shadow-md"
              >
                {/* Hàng 1: Icon + Tên đơn + Mã đơn + Trạng thái */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {renderLoaiDonIcon(item.loai_don)}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {getTenLoaiDon(item.loai_don)}
                      </h4>
                      <span className="text-xs text-slate-400 font-medium block mt-0.5">
                        Mã đơn: #{item.ma_don}
                      </span>
                    </div>
                  </div>

                  <div>{renderStatusBadge(item.trang_thai)}</div>
                </div>

                {/* Hàng 2: Khung xám chứa thời gian và lý do thực tế */}
                <div className="bg-slate-50/80 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 border border-slate-100/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium flex items-center space-x-1">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Thời gian</span>
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatDateVN(item.ngay_bat_dau)}
                      {item.ngay_bat_dau !== item.ngay_ket_thuc && ` - ${formatDateVN(item.ngay_ket_thuc)}`}
                      {' '}({item.so_ngay || 1} ngày)
                    </span>
                  </div>

                  <div className="flex items-start justify-between pt-0.5">
                    <span className="text-slate-400 font-medium flex items-center space-x-1">
                      <FileText size={13} className="text-slate-400 mt-0.5" />
                      <span>Lý do</span>
                    </span>
                    <span className="font-semibold text-slate-700 text-right max-w-[65%] truncate">
                      {item.ly_do || 'Không có dữ liệu'}
                    </span>
                  </div>
                </div>

                {/* Hàng 3: Người duyệt & Nút Chi tiết */}
                <div className="flex items-center justify-between pt-0.5 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    {item.trang_thai === 'DA_DUYET' ? (
                      <ShieldCheck size={14} className="text-emerald-500" />
                    ) : (
                      <UserCheck size={14} className="text-slate-400" />
                    )}
                    <span>
                      {item.trang_thai === 'DA_DUYET' ? 'Đã duyệt: ' : 'Người duyệt: '}
                      <strong className="text-slate-700">
                        {item.ten_nguoi_duyet || (item.trang_thai === 'CHO_DUYET' ? 'Chưa có người duyệt' : 'Không có dữ liệu')}
                      </strong>
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedLeave(item)}
                    className="text-xs font-bold text-[#0EA5E9] hover:underline flex items-center space-x-0.5"
                  >
                    <span>Chi tiết</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TRƯỜNG HỢP KHÔNG CÓ DỮ LIỆU THẬT TRONG DATABASE */
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-center text-slate-400 space-y-2">
            <FileText size={36} className="mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-700">Không có dữ liệu</p>
            <p className="text-xs text-slate-400">
              Không có đơn từ nào trong danh mục này trên hệ thống
            </p>
          </div>
        )}
      </main>

      {/* ───────────────── MODAL XEM CHI TIẾT ĐƠN ───────────────── */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Chi tiết đơn #{selectedLeave.ma_don}</h3>
              <button
                onClick={() => setSelectedLeave(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Loại đơn:</span>
                <span className="font-bold text-slate-800">{getTenLoaiDon(selectedLeave.loai_don)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Trạng thái:</span>
                <div>{renderStatusBadge(selectedLeave.trang_thai)}</div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Từ ngày:</span>
                <span className="font-bold text-slate-800">{formatDateVN(selectedLeave.ngay_bat_dau)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Đến ngày:</span>
                <span className="font-bold text-slate-800">{formatDateVN(selectedLeave.ngay_ket_thuc)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Số ngày nghỉ:</span>
                <span className="font-bold text-slate-800">{selectedLeave.so_ngay || 1} ngày</span>
              </div>
              <div className="py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium block mb-1">Lý do nghỉ:</span>
                <p className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg">
                  {selectedLeave.ly_do || 'Không có dữ liệu'}
                </p>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Người duyệt:</span>
                <span className="font-bold text-slate-800">{selectedLeave.ten_nguoi_duyet || 'Không có dữ liệu'}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-400 font-medium block mb-1">Ý kiến người duyệt:</span>
                <p className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg">
                  {selectedLeave.y_kien_duyet || 'Không có dữ liệu'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedLeave(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL TẠO ĐƠN MỚI ───────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Tạo đơn nghỉ phép mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLeaveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Loại đơn</label>
                <select
                  value={formLoaiDon}
                  onChange={(e) => setFormLoaiDon(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="NGHI_PHEP">Đơn xin nghỉ phép năm</option>
                  <option value="NGHI_OM">Đơn nghỉ ốm đau</option>
                  <option value="NGHI_KHONG_LUONG">Đơn nghỉ không lương</option>
                  <option value="NGHI_VIEC">Đơn xin thôi việc</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={formNgayBatDau}
                    onChange={(e) => setFormNgayBatDau(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={formNgayKetThuc}
                    onChange={(e) => setFormNgayKetThuc(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số ngày</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formSoNgay}
                  onChange={(e) => setFormSoNgay(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do nghỉ</label>
                <textarea
                  rows="3"
                  value={formLyDo}
                  onChange={(e) => setFormLyDo(e.target.value)}
                  placeholder="Nhập lý do cụ thể..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                  required
                ></textarea>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold rounded-xl shadow-md shadow-sky-500/25"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
