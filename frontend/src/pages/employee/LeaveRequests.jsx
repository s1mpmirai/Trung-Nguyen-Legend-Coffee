import React, { useState, useEffect, useCallback } from 'react';
import {
  Umbrella,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ShieldCheck,
  HeartPulse,
  Baby,
  LogOut,
  ChevronRight,
  UserCheck,
  Calendar,
  X,
  RefreshCw,
  AlertCircle,
  Info,
  Loader2,
  Ban,
} from 'lucide-react';

import {
  getLeaveHistory,
  getLeaveBalance,
  submitLeaveRequest,
  cancelLeaveRequest,
} from '../../services/leaveService';
import SharedEmployeeHeader from './components/SharedEmployeeHeader';
import BottomNavBar from './components/BottomNavBar';
import EmployeeToast from './components/EmployeeToast';
import useToast from './utils/useToast';
import { formatDateVN, formatDays, getApiErrorMessage, todayIsoLocal } from './utils/format';

/**
 * Các loại đơn nhân viên được tạo.
 * countMode: 'working' = đếm ngày T2–T6 (server trừ thêm ngày lễ), 'calendar' = ngày lịch, 'none' = không tính ngày
 */
const LEAVE_TYPES = {
  NGHI_PHEP: {
    label: 'Đơn xin nghỉ phép',
    reasonLabel: 'Lý do xin nghỉ phép',
    placeholder: 'Nhập lý do nghỉ phép cụ thể...',
    countMode: 'working',
    halfDay: true,
  },
  NGHI_OM: {
    label: 'Đơn nghỉ ốm đau',
    reasonLabel: 'Lý do nghỉ ốm',
    placeholder: 'Ghi rõ lý do (khám bệnh, điều trị...)...',
    countMode: 'working',
    halfDay: true,
  },
  NGHI_THAI_SAN: {
    label: 'Đơn nghỉ thai sản',
    reasonLabel: 'Thông tin nghỉ thai sản',
    placeholder: 'Ghi rõ chế độ thai sản (sinh con, khám thai...)...',
    countMode: 'calendar',
    halfDay: false,
  },
  NGHI_VIEC: {
    label: 'Đơn xin thôi việc',
    reasonLabel: 'Lý do thôi việc',
    placeholder: 'Nhập lý do xin thôi việc và kế hoạch bàn giao công việc...',
    countMode: 'none',
    halfDay: false,
  },
};

const OTHER_TYPE_LABELS = {
  NGHI_KHONG_LUONG: 'Đơn nghỉ không lương',
  KHAC: 'Đơn từ khác',
};

const FILTERS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'CHO_DUYET', label: 'Chờ duyệt', dot: 'bg-amber-500' },
  { key: 'DA_DUYET', label: 'Đã duyệt', dot: 'bg-emerald-500' },
  { key: 'TU_CHOI', label: 'Từ chối', dot: 'bg-rose-500' },
  { key: 'DA_HUY', label: 'Đã hủy', dot: 'bg-slate-400' },
];

const getTenLoaiDon = (loai) => LEAVE_TYPES[loai]?.label || OTHER_TYPE_LABELS[loai] || 'Đơn từ nhân sự';

/** Chuỗi YYYY-MM-DD -> Date theo giờ địa phương */
const parseLocalDate = (str) => {
  const [y, m, d] = String(str).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const isWorkingDay = (str) => {
  if (!str) return false;
  const wd = parseLocalDate(str).getDay();
  return wd !== 0 && wd !== 6;
};

/**
 * Ước tính số ngày nghỉ phía trình duyệt (chỉ để tham khảo).
 * Số ngày CHÍNH THỨC do server tính (trừ thêm ngày lễ) và trả về sau khi gửi đơn.
 */
const estimateLeaveDays = (startStr, endStr, countMode) => {
  if (!startStr || !endStr || countMode === 'none') return 0;
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  if (end < start) return 0;
  let days = 0;
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const weekday = d.getDay();
    if (countMode === 'calendar' || (weekday !== 0 && weekday !== 6)) days += 1;
  }
  return days;
};

export default function LeaveRequests({ userSession, onLogout }) {
  const maNv = userSession?.ma_nv || localStorage.getItem('user_ma_nv');
  const currentYear = new Date().getFullYear();
  const todayStr = todayIsoLocal();

  // Danh sách đơn
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leavesError, setLeavesError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Quỹ phép năm (số liệu do server tính)
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState('');

  // Hủy đơn (bước xác nhận)
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Form tạo đơn
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoaiDon, setFormLoaiDon] = useState('NGHI_PHEP');
  const [formNgayBatDau, setFormNgayBatDau] = useState('');
  const [formNgayKetThuc, setFormNgayKetThuc] = useState('');
  const [formHalfDay, setFormHalfDay] = useState(false);
  const [formLyDo, setFormLyDo] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast, showToast, hideToast } = useToast(4500);

  const loadLeaves = useCallback(async () => {
    setIsLoading(true);
    setLeavesError('');
    try {
      setLeaves(await getLeaveHistory(maNv, { throwOnError: true }));
    } catch (err) {
      setLeavesError(getApiErrorMessage(err, 'Không tải được danh sách đơn từ.'));
    } finally {
      setIsLoading(false);
    }
  }, [maNv]);

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalanceError('');
    try {
      setBalance(await getLeaveBalance(maNv, currentYear));
    } catch (err) {
      setBalance(null);
      setBalanceError(getApiErrorMessage(err, 'Không tải được quỹ phép năm.'));
    } finally {
      setBalanceLoading(false);
    }
  }, [maNv, currentYear]);

  useEffect(() => {
    loadLeaves();
    loadBalance();
  }, [loadLeaves, loadBalance]);

  // ── Dữ liệu suy ra cho form ──
  const typeConfig = LEAVE_TYPES[formLoaiDon];
  const effectiveEndDate = formLoaiDon === 'NGHI_VIEC' ? formNgayBatDau : formNgayKetThuc;
  const estimatedDays = estimateLeaveDays(formNgayBatDau, effectiveEndDate, typeConfig.countMode);
  // Nửa ngày: chỉ khi nghỉ đúng 1 ngày làm việc (bắt đầu = kết thúc, T2–T6)
  const halfDayEligible =
    typeConfig.halfDay && formNgayBatDau && formNgayBatDau === formNgayKetThuc && isWorkingDay(formNgayBatDau);
  const halfDayApplied = formHalfDay && halfDayEligible;
  const displayEstimate = halfDayApplied ? 0.5 : estimatedDays;

  // Tự động điều chỉnh ngày kết thúc nếu chưa chọn hoặc nhỏ hơn ngày bắt đầu
  const handleStartDateChange = (val) => {
    setFormNgayBatDau(val);
    if (!formNgayKetThuc || formNgayKetThuc < val) {
      setFormNgayKetThuc(val);
    }
  };

  const handleOpenCreateModal = () => {
    setFormLoaiDon('NGHI_PHEP');
    setFormNgayBatDau(todayStr);
    setFormNgayKetThuc(todayStr);
    setFormHalfDay(false);
    setFormLyDo('');
    setFormError('');
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (!isSubmitting) setShowCreateModal(false);
  };

  // Lọc theo filter
  const countByStatus = (status) => leaves.filter((l) => l.trang_thai === status).length;
  const filteredLeaves = leaves.filter((item) => activeFilter === 'ALL' || item.trang_thai === activeFilter);

  // Icon loại đơn
  const renderLoaiDonIcon = (loai) => {
    const base = 'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border';
    switch (loai) {
      case 'NGHI_PHEP':
        return (
          <div className={`${base} bg-coffee-50 text-coffee-600 border-coffee-100`}>
            <Umbrella size={20} className="stroke-[2.2]" />
          </div>
        );
      case 'NGHI_OM':
        return (
          <div className={`${base} bg-emerald-50 text-emerald-600 border-emerald-100/60`}>
            <HeartPulse size={20} className="stroke-[2.2]" />
          </div>
        );
      case 'NGHI_THAI_SAN':
        return (
          <div className={`${base} bg-pink-50 text-pink-600 border-pink-100/60`}>
            <Baby size={20} className="stroke-[2.2]" />
          </div>
        );
      case 'NGHI_VIEC':
        return (
          <div className={`${base} bg-rose-50 text-rose-600 border-rose-100/60`}>
            <LogOut size={20} className="stroke-[2.2]" />
          </div>
        );
      default:
        return (
          <div className={`${base} bg-gold-50 text-gold-700 border-gold-100`}>
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" aria-hidden="true"></span>
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
            {status || 'Chưa có dữ liệu'}
          </span>
        );
    }
  };

  const renderLeavePeriod = (item) => {
    if (item.loai_don === 'NGHI_VIEC') return `Nghỉ việc từ: ${formatDateVN(item.ngay_bat_dau)}`;
    const range =
      item.ngay_bat_dau !== item.ngay_ket_thuc
        ? `${formatDateVN(item.ngay_bat_dau)} - ${formatDateVN(item.ngay_ket_thuc)}`
        : formatDateVN(item.ngay_bat_dau);
    return `${range} (${formatDays(item.so_ngay)} ngày)`;
  };

  // ── Gửi đơn: server tự tính số ngày; chỉ gửi so_ngay = 0.5 khi xin nghỉ nửa ngày ──
  const handleCreateLeaveSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');

    if (!formNgayBatDau) {
      setFormError('Vui lòng chọn ngày bắt đầu.');
      return;
    }
    if (formNgayBatDau < todayStr) {
      setFormError('Ngày bắt đầu không được chọn ngày trong quá khứ.');
      return;
    }
    if (formLoaiDon !== 'NGHI_VIEC') {
      if (!formNgayKetThuc) {
        setFormError('Vui lòng chọn ngày kết thúc nghỉ.');
        return;
      }
      if (formNgayKetThuc < formNgayBatDau) {
        setFormError('Ngày kết thúc nghỉ phải bằng hoặc sau ngày bắt đầu nghỉ.');
        return;
      }
      if (typeConfig.countMode === 'working' && estimatedDays <= 0) {
        setFormError('Khoảng thời gian đã chọn không có ngày làm việc nào (T2 – T6).');
        return;
      }
      if (formLoaiDon === 'NGHI_PHEP' && formNgayBatDau.slice(0, 4) !== formNgayKetThuc.slice(0, 4)) {
        setFormError('Đơn nghỉ phép năm không được kéo dài sang năm sau. Vui lòng tách thành 2 đơn theo từng năm.');
        return;
      }
    }
    if (formLyDo.trim().length < 3) {
      setFormError('Vui lòng nhập lý do (tối thiểu 3 ký tự).');
      return;
    }

    const payload = {
      ma_nv: maNv,
      loai_don: formLoaiDon,
      ngay_bat_dau: formNgayBatDau,
      ngay_ket_thuc: effectiveEndDate,
      ly_do: formLyDo.trim(),
    };
    if (halfDayApplied) payload.so_ngay = 0.5;

    setIsSubmitting(true);
    try {
      const created = await submitLeaveRequest(payload);
      const soNgay = created?.so_ngay != null && formLoaiDon !== 'NGHI_VIEC' ? ` (${formatDays(created.so_ngay)} ngày)` : '';
      showToast(
        created?.trang_thai === 'DA_DUYET'
          ? `Đơn #${created.ma_don}${soNgay} đã được hệ thống tự động duyệt.`
          : `Đã gửi đơn${created?.ma_don ? ` #${created.ma_don}` : ''}${soNgay}. Đơn đang chờ duyệt.`,
        'success'
      );
      setShowCreateModal(false);
      loadLeaves();
      loadBalance();
    } catch (err) {
      // Hiển thị đúng lý do từ backend (trùng ngày, hết phép năm, tháng đã chốt công...)
      setFormError(getApiErrorMessage(err, 'Gửi đơn thất bại. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Hủy đơn đang chờ duyệt ──
  const handleConfirmCancel = async () => {
    if (!cancelTarget || isCancelling) return;
    setIsCancelling(true);
    try {
      await cancelLeaveRequest(cancelTarget.ma_don);
      showToast(`Đã hủy đơn #${cancelTarget.ma_don}.`, 'success');
      setCancelTarget(null);
      setSelectedLeave(null);
      loadLeaves();
      loadBalance();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Hủy đơn thất bại. Vui lòng thử lại.'), 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Phần trăm thanh quỹ phép: đã dùng + đang chờ duyệt
  const tongPhep = Number(balance?.tong_phep_nam) || 0;
  const pctUsed = tongPhep > 0 ? Math.min(100, ((Number(balance?.da_su_dung) || 0) / tongPhep) * 100) : 0;
  const pctPending = tongPhep > 0 ? Math.min(100 - pctUsed, ((Number(balance?.dang_cho_duyet) || 0) / tongPhep) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col bg-cream min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] relative">
      <EmployeeToast message={toast?.message} type={toast?.type} onClose={hideToast} />

      {/* ───────────────── HEADER NATIVE WEB APP ───────────────── */}
      <SharedEmployeeHeader onLogout={onLogout} />

      {/* ───────────────── MAIN CONTENT ───────────────── */}
      <main className="px-4 py-3.5 space-y-4">
        {/* BANNER TIÊU ĐỀ & NÚT TẠO ĐƠN */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold tracking-wider text-gold-700 uppercase block">
              Nhân sự & Phúc lợi
            </span>
            <h1 className="text-xl font-extrabold text-coffee-900 leading-tight mt-0.5">
              Đơn từ & Nghỉ phép
            </h1>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 min-h-[44px] bg-coffee-600 hover:bg-coffee-800 active:scale-[0.98] text-white px-4 rounded-full font-bold text-xs shadow-md shadow-coffee-600/25 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Tạo đơn</span>
          </button>
        </div>

        {/* THẺ QUỸ PHÉP NĂM (số liệu từ GET /leaves/balance) */}
        <section
          aria-labelledby="leave-balance-title"
          aria-busy={balanceLoading}
          className="bg-white rounded-2xl p-4 border border-coffee-100 shadow-[0_2px_10px_rgba(14,165,233,0.06)] space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 id="leave-balance-title" className="flex items-center space-x-2 text-coffee-900 font-bold text-sm">
              <Umbrella size={18} className="text-coffee-600" />
              <span>Quỹ phép năm {balance?.nam || currentYear}</span>
            </h2>
            {balance?.han_dung_phep && (
              <span className="text-xs text-slate-500 font-medium">Hạn dùng: {balance.han_dung_phep}</span>
            )}
          </div>

          {balanceLoading ? (
            <div className="space-y-2.5 animate-pulse" role="status" aria-label="Đang tải quỹ phép năm">
              <div className="h-8 w-28 bg-coffee-50 rounded-lg"></div>
              <div className="h-2 w-full bg-coffee-50 rounded-full"></div>
              <div className="h-3 w-48 bg-coffee-50 rounded"></div>
            </div>
          ) : balanceError ? (
            <div className="flex items-start justify-between gap-3 bg-rose-50/60 border border-rose-100 rounded-xl p-3" role="alert">
              <div className="flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{balanceError}</span>
              </div>
              <button
                type="button"
                onClick={loadBalance}
                className="flex-shrink-0 inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50"
              >
                <RefreshCw size={12} />
                Thử lại
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between pt-1">
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-extrabold text-coffee-900 tracking-tight">
                    {formatDays(balance?.con_lai)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">ngày còn lại</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Tổng: <strong className="text-slate-800">{formatDays(balance?.tong_phep_nam)}</strong> ngày
                </span>
              </div>

              {/* Thanh tiến trình: đã dùng (nâu) + đang chờ duyệt (vàng đồng) */}
              <div className="w-full bg-coffee-50 h-2 rounded-full overflow-hidden flex" aria-hidden="true">
                <div className="bg-coffee-600 h-full transition-all duration-500" style={{ width: `${pctUsed}%` }}></div>
                <div className="bg-gold-400 h-full transition-all duration-500" style={{ width: `${pctPending}%` }}></div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-coffee-600" aria-hidden="true"></span>
                  Đã dùng: <strong className="text-slate-800">{formatDays(balance?.da_su_dung)}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gold-400" aria-hidden="true"></span>
                  Chờ duyệt: <strong className="text-slate-800">{formatDays(balance?.dang_cho_duyet)}</strong>
                </span>
              </div>
            </>
          )}
        </section>

        {/* CÁC NÚT BỘ LỌC TRẠNG THÁI */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Lọc theo trạng thái đơn">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            const count = f.key === 'ALL' ? leaves.length : countByStatus(f.key);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key)}
                aria-pressed={isActive}
                className={`flex items-center space-x-1.5 min-h-[40px] px-3.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-coffee-600 text-white shadow-sm shadow-coffee-600/30'
                    : 'bg-white text-slate-600 border border-coffee-100 hover:bg-coffee-50'
                }`}
              >
                {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} aria-hidden="true"></span>}
                <span>{f.label}</span>
                {!isLoading && <span className={isActive ? 'text-coffee-100' : 'text-slate-400'}>({count})</span>}
              </button>
            );
          })}
        </div>

        {/* TIÊU ĐỀ LỊCH SỬ GỬI ĐƠN */}
        <div className="flex items-center justify-between px-1 pt-1">
          <h3 className="text-sm font-bold text-slate-900">Lịch sử gửi đơn</h3>
          <span className="text-[11px] text-slate-500 font-medium">Mới nhất trước</span>
        </div>

        {/* DANH SÁCH THẺ ĐƠN TỪ */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 border border-coffee-100 text-center space-y-2" role="status">
            <Loader2 size={28} className="animate-spin text-coffee-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách đơn từ...</p>
          </div>
        ) : leavesError ? (
          <div className="bg-white rounded-2xl p-6 border border-rose-100 text-center space-y-2" role="alert">
            <AlertCircle size={30} className="mx-auto text-rose-400" />
            <p className="text-sm font-semibold text-slate-700">{leavesError}</p>
            <button
              type="button"
              onClick={loadLeaves}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl bg-coffee-600 hover:bg-coffee-800 text-white text-xs font-bold"
            >
              <RefreshCw size={14} />
              Thử lại
            </button>
          </div>
        ) : filteredLeaves.length > 0 ? (
          <ul className="space-y-3">
            {filteredLeaves.map((item) => (
              <li
                key={item.ma_don}
                className="bg-white rounded-2xl p-4 border border-coffee-100 shadow-[0_2px_8px_rgba(14,165,233,0.05)] space-y-3"
              >
                {/* Hàng 1: Icon + Tên đơn + Mã đơn + Trạng thái */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    {renderLoaiDonIcon(item.loai_don)}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {getTenLoaiDon(item.loai_don)}
                      </h4>
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        Mã đơn: #{item.ma_don}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">{renderStatusBadge(item.trang_thai)}</div>
                </div>

                {/* Hàng 2: Thời gian và lý do */}
                <div className="bg-coffee-50/60 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 border border-coffee-100/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-medium flex items-center space-x-1 flex-shrink-0">
                      <Calendar size={13} />
                      <span>Thời gian</span>
                    </span>
                    <span className="font-bold text-slate-800 text-right">{renderLeavePeriod(item)}</span>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <span className="text-slate-500 font-medium flex items-center space-x-1 flex-shrink-0">
                      <FileText size={13} className="mt-0.5" />
                      <span>Lý do</span>
                    </span>
                    <span className="font-semibold text-slate-700 text-right max-w-[65%] truncate">
                      {item.ly_do || 'Chưa có dữ liệu'}
                    </span>
                  </div>
                </div>

                {/* Hàng 3: Người duyệt & hành động */}
                <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500 min-w-0">
                    {item.trang_thai === 'DA_DUYET' ? (
                      <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <UserCheck size={14} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {item.trang_thai === 'DA_DUYET' ? 'Đã duyệt: ' : 'Người duyệt: '}
                      <strong className="text-slate-700">
                        {item.ten_nguoi_duyet ||
                          (item.trang_thai === 'CHO_DUYET'
                            ? 'Chưa có người duyệt'
                            : item.trang_thai === 'DA_DUYET'
                              ? 'Hệ thống (tự động duyệt)'
                              : 'Chưa có dữ liệu')}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.trang_thai === 'CHO_DUYET' && (
                      <button
                        type="button"
                        onClick={() => setCancelTarget(item)}
                        className="min-h-[36px] px-2.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                      >
                        <Ban size={13} />
                        Hủy đơn
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedLeave(item)}
                      className="min-h-[36px] px-2.5 rounded-lg text-xs font-bold text-coffee-600 hover:bg-coffee-50 flex items-center space-x-0.5"
                    >
                      <span>Chi tiết</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-coffee-100 text-center space-y-2">
            <FileText size={36} className="mx-auto text-coffee-200 stroke-1" />
            <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu</p>
            <p className="text-xs text-slate-500">
              {activeFilter === 'ALL' ? 'Bạn chưa gửi đơn từ nào.' : 'Không có đơn từ nào ở trạng thái này.'}
            </p>
          </div>
        )}
      </main>

      {/* ───────────────── MODAL XEM CHI TIẾT ĐƠN ───────────────── */}
      {selectedLeave && (
        <div
          onClick={() => setSelectedLeave(null)}
          className="fixed inset-0 bg-coffee-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-detail-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-coffee-100 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="leave-detail-title" className="text-base font-extrabold text-slate-900">
                Chi tiết đơn #{selectedLeave.ma_don}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                aria-label="Đóng"
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <dl className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between gap-3 py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Loại đơn:</dt>
                <dd className="font-bold text-slate-800 text-right">{getTenLoaiDon(selectedLeave.loai_don)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Trạng thái:</dt>
                <dd>{renderStatusBadge(selectedLeave.trang_thai)}</dd>
              </div>
              {selectedLeave.loai_don === 'NGHI_VIEC' ? (
                <div className="flex justify-between gap-3 py-1 border-b border-slate-50">
                  <dt className="text-slate-500 font-medium">Ngày thôi việc:</dt>
                  <dd className="font-bold text-slate-800">{formatDateVN(selectedLeave.ngay_bat_dau)}</dd>
                </div>
              ) : (
                <>
                  <div className="flex justify-between gap-3 py-1 border-b border-slate-50">
                    <dt className="text-slate-500 font-medium">Ngày bắt đầu nghỉ:</dt>
                    <dd className="font-bold text-slate-800">{formatDateVN(selectedLeave.ngay_bat_dau)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1 border-b border-slate-50">
                    <dt className="text-slate-500 font-medium">Ngày kết thúc nghỉ:</dt>
                    <dd className="font-bold text-slate-800">{formatDateVN(selectedLeave.ngay_ket_thuc)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1 border-b border-slate-50">
                    <dt className="text-slate-500 font-medium">Tổng số ngày nghỉ:</dt>
                    <dd className="font-bold text-slate-800">{formatDays(selectedLeave.so_ngay)} ngày</dd>
                  </div>
                </>
              )}
              <div className="py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium mb-1">Lý do:</dt>
                <dd className="font-semibold text-slate-800 bg-coffee-50/60 p-2.5 rounded-lg break-words">
                  {selectedLeave.ly_do || 'Chưa có dữ liệu'}
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Người duyệt:</dt>
                <dd className="font-bold text-slate-800 text-right">
                  {selectedLeave.ten_nguoi_duyet ||
                    (selectedLeave.trang_thai === 'DA_DUYET' ? 'Hệ thống (tự động duyệt)' : 'Chưa có dữ liệu')}
                </dd>
              </div>
              <div className="py-1">
                <dt className="text-slate-500 font-medium mb-1">Ý kiến người duyệt:</dt>
                <dd className="font-semibold text-slate-800 bg-coffee-50/60 p-2.5 rounded-lg break-words">
                  {selectedLeave.y_kien_duyet || 'Chưa có dữ liệu'}
                </dd>
              </div>
            </dl>

            <div className="flex items-center gap-2">
              {selectedLeave.trang_thai === 'CHO_DUYET' && (
                <button
                  type="button"
                  onClick={() => setCancelTarget(selectedLeave)}
                  className="flex-1 min-h-[44px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all"
                >
                  Hủy đơn
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="flex-1 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── HỘP THOẠI XÁC NHẬN HỦY ĐƠN ───────────────── */}
      {cancelTarget && (
        <div
          onClick={() => !isCancelling && setCancelTarget(null)}
          className="fixed inset-0 bg-coffee-900/50 backdrop-blur-sm z-[55] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-leave-title"
            aria-describedby="cancel-leave-desc"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-xs p-5 space-y-4 shadow-2xl border border-coffee-100 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Ban size={18} />
              </div>
              <div>
                <h3 id="cancel-leave-title" className="text-sm font-extrabold text-slate-900">
                  Hủy đơn #{cancelTarget.ma_don}?
                </h3>
                <p id="cancel-leave-desc" className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {getTenLoaiDon(cancelTarget.loai_don)} – {renderLeavePeriod(cancelTarget)}. Đơn đã hủy không thể khôi phục.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={isCancelling}
                className="min-h-[44px] rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-70"
              >
                {isCancelling && <Loader2 size={14} className="animate-spin" />}
                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL TẠO ĐƠN MỚI ───────────────── */}
      {showCreateModal && (
        <div
          onClick={closeCreateModal}
          className="fixed inset-0 bg-coffee-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-leave-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-coffee-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="create-leave-title" className="text-base font-extrabold text-slate-900">Tạo đơn mới</h3>
              <button
                type="button"
                onClick={closeCreateModal}
                aria-label="Đóng"
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLeaveSubmit} className="space-y-3 text-xs" noValidate>
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium animate-shake" role="alert">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label htmlFor="leave-type" className="font-bold text-slate-700 block mb-1">Loại đơn</label>
                <select
                  id="leave-type"
                  value={formLoaiDon}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormLoaiDon(val);
                    setFormHalfDay(false);
                    if (val === 'NGHI_VIEC' && formNgayBatDau) setFormNgayKetThuc(formNgayBatDau);
                  }}
                  className="w-full min-h-[44px] px-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white focus:outline-none focus:border-coffee-500 focus:ring-2 focus:ring-gold-200"
                >
                  {Object.entries(LEAVE_TYPES).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>

              {formLoaiDon === 'NGHI_VIEC' ? (
                <div>
                  <label htmlFor="leave-resign-date" className="font-bold text-slate-700 block mb-1">Ngày thôi việc dự kiến</label>
                  <input
                    id="leave-resign-date"
                    type="date"
                    min={todayStr}
                    value={formNgayBatDau}
                    onChange={(e) => {
                      setFormNgayBatDau(e.target.value);
                      setFormNgayKetThuc(e.target.value);
                    }}
                    className="w-full min-h-[44px] px-2 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-coffee-500 focus:ring-2 focus:ring-gold-200"
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="leave-start" className="font-bold text-slate-700 block mb-1">Ngày bắt đầu nghỉ</label>
                    <input
                      id="leave-start"
                      type="date"
                      min={todayStr}
                      value={formNgayBatDau}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full min-h-[44px] px-2 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-coffee-500 focus:ring-2 focus:ring-gold-200"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="leave-end" className="font-bold text-slate-700 block mb-1">Ngày kết thúc nghỉ</label>
                    <input
                      id="leave-end"
                      type="date"
                      min={formNgayBatDau || todayStr}
                      value={formNgayKetThuc}
                      onChange={(e) => setFormNgayKetThuc(e.target.value)}
                      className="w-full min-h-[44px] px-2 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-coffee-500 focus:ring-2 focus:ring-gold-200"
                      required
                    />
                  </div>
                </div>
              )}

              {formLoaiDon === 'NGHI_VIEC' ? (
                <div className="w-full p-2.5 bg-rose-50/70 border border-rose-100 rounded-xl text-xs space-y-0.5">
                  <span className="font-bold text-rose-700 block">Chấm dứt hợp đồng lao động</span>
                  <span className="text-[11px] text-rose-700/90">
                    Khi đơn được duyệt, hệ thống lên lịch thôi việc có hiệu lực từ ngày đã chọn.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Nửa ngày: chỉ khi nghỉ đúng 1 ngày làm việc */}
                  {typeConfig.halfDay && (
                    <label
                      className={`flex items-center gap-2.5 min-h-[44px] px-3 rounded-xl border ${
                        halfDayEligible ? 'border-coffee-200 bg-white cursor-pointer' : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={halfDayApplied}
                        disabled={!halfDayEligible}
                        onChange={(e) => setFormHalfDay(e.target.checked)}
                        className="w-4 h-4 accent-coffee-600"
                      />
                      <span className="font-semibold">
                        Nghỉ nửa ngày (0,5 ngày)
                        {!halfDayEligible && (
                          <span className="block text-[11px] font-normal">
                            Chỉ áp dụng khi nghỉ đúng 1 ngày làm việc (T2 – T6)
                          </span>
                        )}
                      </span>
                    </label>
                  )}

                  <div className="w-full p-2.5 bg-coffee-50/60 border border-coffee-100 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Số ngày nghỉ (ước tính)</span>
                      <span className={displayEstimate > 0 ? 'font-extrabold text-coffee-800 text-sm' : 'text-slate-400'}>
                        {displayEstimate > 0 ? `${formatDays(displayEstimate)} ngày` : 'Chọn ngày hợp lệ'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 flex items-start gap-1">
                      <Info size={12} className="flex-shrink-0 mt-px" />
                      {typeConfig.countMode === 'calendar'
                        ? 'Nghỉ thai sản tính theo ngày lịch. Số ngày chính thức do hệ thống tính khi gửi đơn.'
                        : 'Chỉ tính T2 – T6; hệ thống sẽ trừ thêm ngày lễ và tính số ngày chính thức khi gửi đơn.'}
                    </p>
                  </div>

                  {formLoaiDon === 'NGHI_PHEP' && balance && (
                    <p className={`text-[11px] ${displayEstimate > Number(balance.con_lai) ? 'text-amber-800 font-semibold' : 'text-slate-500'}`}>
                      Trừ vào quỹ phép năm (còn lại: <strong>{formatDays(balance.con_lai)} ngày</strong>)
                      {displayEstimate > Number(balance.con_lai) && ' – có thể không đủ phép cho đơn này.'}
                    </p>
                  )}
                  {formLoaiDon === 'NGHI_OM' && (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Chế độ ốm đau do BHXH chi trả, không trừ phép năm.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="leave-reason" className="font-bold text-slate-700 block mb-1">
                  {typeConfig.reasonLabel} <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="leave-reason"
                  rows="3"
                  value={formLyDo}
                  maxLength={500}
                  onChange={(e) => setFormLyDo(e.target.value)}
                  placeholder={typeConfig.placeholder}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-coffee-500 focus:ring-2 focus:ring-gold-200"
                  required
                ></textarea>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px] bg-coffee-600 hover:bg-coffee-800 text-white font-bold rounded-xl shadow-md shadow-coffee-600/25 flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {isSubmitting ? 'Đang gửi...' : 'Gửi đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── BOTTOM NAVIGATION BAR ───────────────── */}
      <BottomNavBar activeTab="requests" />
    </div>
  );
}
