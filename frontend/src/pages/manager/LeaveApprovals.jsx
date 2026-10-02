import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  X,
  AlertTriangle,
  Calendar,
  Building2,
  Sparkles,
  Paperclip,
  RotateCcw,
  Loader2,
  FileText,
  User,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { getAllLeavesForManager, reviewLeave } from "../../services/leaveService";

export default function LeaveApprovals() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Popup Modal xác nhận từ chối và nhập lý do
  const [rejectModalData, setRejectModalData] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  // Dữ liệu đơn từ nạp trực tiếp từ API (Không dùng dữ liệu gán cứng)
  const [requests, setRequests] = useState([]);

  // Helper ánh xạ dữ liệu từ backend sang format bảng
  const mapBackendLeave = (item) => {
    let type = "Đơn xin nghỉ phép";
    let typeCategory = "annual";
    if (item.loai_don === "NGHI_VIEC") {
      type = "Đơn xin thôi việc";
      typeCategory = "resignation";
    } else if (item.loai_don === "NGHI_OM" || item.loai_don === "NGHI_THAI_SAN") {
      type = "Đơn nghỉ ốm đau, thai sản";
      typeCategory = "sick";
    } else if (item.loai_don === "NGHI_KHONG_LUONG" || item.loai_don === "KHAC") {
      type = "Đơn xin nghỉ phép";
      typeCategory = "annual";
    }

    const initials = item.ho_ten
      ? item.ho_ten
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
      : item.ma_nv?.substring(0, 2) || "NV";

    let status = "pending";
    let statusText = "Chờ duyệt";
    if (item.trang_thai === "DA_DUYET") {
      status = "approved";
      statusText = "Đã duyệt";
    } else if (item.trang_thai === "TU_CHOI") {
      status = "rejected";
      statusText = "Đã từ chối";
    } else if (item.trang_thai === "DA_HUY") {
      status = "cancelled";
      statusText = "Đã hủy";
    }

    // Helper định dạng ngày hiển thị tiếng Việt (DD/MM/YYYY)
    const formatDisplayDate = (val) => {
      if (!val) return "—";
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        return d.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } catch {
        return String(val);
      }
    };

    // Helper định dạng ngày và giờ phút chi tiết (HH:mm - DD/MM/YYYY)
    const formatDisplayDateTime = (val) => {
      if (!val) return "—";
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        const dateStr = d.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const timeStr = d.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${timeStr} - ${dateStr}`;
      } catch {
        return String(val);
      }
    };

    const startDate = formatDisplayDate(item.ngay_bat_dau);
    const endDate = formatDisplayDate(item.ngay_ket_thuc);
    const createdAt = formatDisplayDate(item.ngay_tao);
    const createdDateTime = formatDisplayDateTime(item.ngay_tao);
    const isResignation = item.loai_don === "NGHI_VIEC";
    const totalDays = isResignation ? "Thôi việc" : `${item.so_ngay || 1} ngày`;

    const period =
      startDate === endDate
        ? `${startDate}`
        : `${startDate} - ${endDate}`;

    return {
      id: item.ma_don,
      empId: item.ma_nv,
      name: item.ho_ten || item.ma_nv,
      rawLoaiDon: item.loai_don,
      rawDays: parseFloat(item.so_ngay) || 1,
      initials: initials,
      dept: item.ten_pb || "Phòng ban nội bộ",
      type: type,
      typeCategory: typeCategory,
      priority: item.loai_don === "NGHI_VIEC" || item.so_ngay >= 3 ? "Ưu tiên cao" : null,
      createdAt: createdAt,
      createdDateTime: createdDateTime,
      startDate: startDate,
      endDate: endDate,
      totalDays: totalDays,
      period: period,
      subPeriod: totalDays,
      reason: item.ly_do || "Không có ghi chú lý do",
      handover: item.ban_giao || "",
      leaveBalance: "8/12 ngày",
      status: status,
      statusText: statusText,
      approvalNote: status === "approved" ? (item.y_kien_duyet || "Đồng ý phê duyệt đơn") : "",
      rejectionReason: status === "rejected" ? (item.y_kien_duyet || "Không có lý do cụ thể") : "",
      reviewer: item.ten_nguoi_duyet || item.nguoi_duyet,
      reviewDate: item.ngay_duyet,
    };
  };

  // Nối API lấy danh sách đơn từ
  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const data = await getAllLeavesForManager();
      if (Array.isArray(data)) {
        const mappedData = data.map(mapBackendLeave);
        setRequests(mappedData);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.warn("Lỗi khi tải đơn từ từ API:", err);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Tính số ngày phép năm còn lại của nhân viên
  const calculateEmployeeLeaveBalance = (empId) => {
    const tongPhep = 12.0;
    const daDung = requests
      .filter(
        (r) =>
          r.empId === empId &&
          (r.rawLoaiDon === "NGHI_PHEP" || r.typeCategory === "annual" || r.type === "Đơn xin nghỉ phép") &&
          r.status === "approved"
      )
      .reduce((sum, item) => sum + (parseFloat(item.rawDays) || 1), 0);
    const conLai = Math.max(0, tongPhep - daDung);
    return { tongPhep, daDung, conLai };
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // 1. Phê duyệt đơn từ (Icon Tick)
  const handleApprove = async (req) => {
    const id = req.id;
    const currentReviewer =
      localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv") || "NV01";

    setIsSubmitting(true);
    try {
      // Gọi API duyệt đơn nếu là đơn thực từ backend
      await reviewLeave(id, {
        trang_thai: "DA_DUYET",
        nguoi_duyet: currentReviewer,
        y_kien_duyet: "Đồng ý phê duyệt đơn",
      }).catch((err) => {
        console.warn("API reviewLeave fallback:", err.message);
      });

      // Cập nhật state cục bộ
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
              ...r,
              status: "approved",
              statusText: "Đã duyệt",
              approvalNote: "Đồng ý phê duyệt đơn",
              rejectionReason: "",
            }
            : r
        )
      );

      if (selectedRequest?.id === id) {
        setSelectedRequest((prev) =>
          prev
            ? {
              ...prev,
              status: "approved",
              statusText: "Đã duyệt",
              approvalNote: "Đồng ý phê duyệt đơn",
              rejectionReason: "",
            }
            : null
        );
      }

      setToast(`Đã phê duyệt thành công đơn #${id} của ${req.name}!`);
      setTimeout(() => setToast(""), 3500);
    } catch (err) {
      setToast(`Lỗi khi phê duyệt: ${err.message}`);
      setTimeout(() => setToast(""), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở Popup xác nhận từ chối (Icon X)
  const openRejectModal = (req) => {
    setSelectedRequest(null); // Tự động đóng popup chi tiết đơn để không bị đè
    setRejectModalData(req);
    setRejectionReason("");
    setRejectError("");
  };

  // 2. Xác nhận từ chối và nêu lý do (Popup Modal)
  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      setRejectError("Vui lòng nhập lý do từ chối đơn từ trước khi xác nhận.");
      return;
    }

    if (!rejectModalData) return;

    const id = rejectModalData.id;
    const currentReviewer =
      localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv") || "NV01";

    setIsSubmitting(true);
    try {
      // Gọi API từ chối đơn kèm lý do
      await reviewLeave(id, {
        trang_thai: "TU_CHOI",
        nguoi_duyet: currentReviewer,
        y_kien_duyet: rejectionReason.trim(),
      }).catch((err) => {
        console.warn("API reviewLeave fallback:", err.message);
      });

      // Cập nhật state cục bộ
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
              ...r,
              status: "rejected",
              statusText: "Đã từ chối",
              rejectionReason: rejectionReason.trim(),
              approvalNote: "",
            }
            : r
        )
      );

      if (selectedRequest?.id === id) {
        setSelectedRequest((prev) =>
          prev
            ? {
              ...prev,
              status: "rejected",
              statusText: "Đã từ chối",
              rejectionReason: rejectionReason.trim(),
              approvalNote: "",
            }
            : null
        );
      }

      setToast(
        `Đã từ chối đơn #${id} của ${rejectModalData.name} kèm lý do phản hồi!`
      );
      setTimeout(() => setToast(""), 3500);
      setRejectModalData(null);
      setRejectionReason("");
    } catch (err) {
      setRejectError(`Lỗi khi gửi từ chối: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const filtered = requests.filter((r) => {
    const matchTab = activeFilter === "all" || r.status === activeFilter;
    const q = (searchQuery || "").toLowerCase().trim();
    const matchSearch =
      !q ||
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.id && r.id.toLowerCase().includes(q)) ||
      (r.dept && r.dept.toLowerCase().includes(q));
    return matchTab && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequests = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="flex flex-col gap-6 max-w-[1520px] mx-auto py-2 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
            DUYỆT ĐƠN NGHỈ PHÉP / THÔI VIỆC
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem xét và phê duyệt các yêu cầu nghỉ phép, xin thôi việc, công tác và làm việc linh hoạt
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchLeaves}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Đồng bộ dữ liệu từ máy chủ"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
            <span>{isLoading ? "Đang đồng bộ..." : "Làm mới đơn từ"}</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>Tháng 10, 2026</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Cần xử lý ngay */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Cần xử lý ngay
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900">
                  {String(pendingCount).padStart(2, "0")}
                </span>
                <span className="text-xs text-slate-500 font-semibold">yêu cầu</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              {requests.some((r) => r.typeCategory === "resignation" && r.status === "pending")
                ? "Có đơn thôi việc cần duyệt gấp"
                : "Không có đơn thôi việc tồn đọng"}
            </span>
          </div>
        </div>

        {/* Card 2: Đã phê duyệt */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Đã phê duyệt
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900">
                  {String(approvedCount).padStart(2, "0")}
                </span>
                <span className="text-xs text-slate-500 font-semibold">hồ sơ</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notice */}
      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Table Top Controls & Tabs */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeFilter === "all"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Tất cả đơn ({requests.length})
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeFilter === "pending"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Chờ duyệt
              <span className="ml-1.5 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
            </button>
            <button
              onClick={() => setActiveFilter("approved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeFilter === "approved"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Đã duyệt ({approvedCount})
            </button>
            <button
              onClick={() => setActiveFilter("rejected")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeFilter === "rejected"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Đã từ chối ({rejectedCount})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên nhân viên, mã đơn..."
              className="w-64 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-4 whitespace-nowrap">Thời gian gửi đơn</th>
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4">Loại đơn</th>
                <th className="py-3 px-4 whitespace-nowrap">Ngày bắt đầu</th>
                <th className="py-3 px-4 whitespace-nowrap">Ngày kết thúc</th>
                <th className="py-3 px-4 min-w-[200px]">Lý do & Bàn giao</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Số ngày nghỉ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Không tìm thấy đơn từ nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Cột 1: Thời gian gửi đơn (Nằm cột đầu tiên) */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {req.createdAt || "—"}
                    </td>
                    {/* Cột 2: Mã đơn */}
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 whitespace-nowrap">
                      #{req.id}
                      {req.priority && (
                        <span className="block text-[10px] text-rose-500 font-semibold font-sans">
                          {req.priority}
                        </span>
                      )}
                    </td>
                    {/* Cột 3: Nhân viên (Bỏ hình avatar, chỉ để lại tên & phòng ban) */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-800 truncate">{req.name}</span>
                        <span className="text-[11px] text-slate-400 truncate">{req.dept}</span>
                      </div>
                    </td>
                    {/* Cột 4: Loại đơn */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${req.typeCategory === "resignation"
                          ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                          : req.typeCategory === "annual"
                            ? "bg-sky-50 text-sky-700 border border-sky-200/60"
                            : req.typeCategory === "sick"
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          }`}
                      >
                        {req.type}
                      </span>
                    </td>
                    {/* Cột 5: Thời gian bắt đầu */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-800 font-semibold">
                      {req.startDate || req.period}
                    </td>
                    {/* Cột 6: Thời gian kết thúc */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-800 font-semibold">
                      {req.typeCategory === "resignation" ? "—" : (req.endDate || req.period)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-700 line-clamp-1">{req.reason}</p>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Paperclip className="w-3 h-3 text-sky-500" />
                        {req.handover}
                      </span>
                    </td>
                    {/* Cột 8: Số ngày nghỉ - hiển thị chữ đen đơn giản, không khung */}
                    <td className="py-3 px-4 text-center whitespace-nowrap text-slate-800 font-medium">
                      {req.totalDays}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${req.status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : req.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                      >
                        {req.statusText}
                      </span>
                    </td>

                    {/* THAO TÁC: DÙNG ICON TICK VÀ X THEO YÊU CẦU */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Icon Xem chi tiết */}
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors flex items-center justify-center cursor-pointer"
                          title="Xem chi tiết đơn"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Các nút thao tác chuyển hết thành Icon Tick và Icon X */}
                        {req.status === "pending" && (
                          <>
                            {/* Icon X: Từ chối (Mở popup xác nhận & nhập lý do) */}
                            <button
                              type="button"
                              onClick={() => openRejectModal(req)}
                              disabled={isSubmitting}
                              className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                              title="Từ chối đơn (Mở xác nhận & nêu lý do)"
                            >
                              <X className="w-4 h-4 stroke-[2.5]" />
                            </button>

                            {/* Icon Tick: Phê duyệt trực tiếp */}
                            <button
                              type="button"
                              onClick={() => handleApprove(req)}
                              disabled={isSubmitting}
                              className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                              title="Phê duyệt đơn"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </>
                        )}

                        {/* Nếu đã duyệt hoặc từ chối, hiển thị icon trạng thái xác nhận */}
                        {req.status === "approved" && (
                          <span
                            className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"
                            title="Đơn đã được phê duyệt"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </span>
                        )}
                        {req.status === "rejected" && (
                          <span
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"
                            title={`Đơn đã bị từ chối${req.rejectionReason ? `: ${req.rejectionReason}` : ""}`}
                          >
                            <X className="w-4 h-4 stroke-[2.5]" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer phân trang (Tối đa 5 đơn / trang) */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            {filtered.length > 0 ? (
              <>
                Hiển thị <span className="font-semibold text-slate-800">{startIndex + 1}</span> -{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                trong tổng số <span className="font-semibold text-slate-800">{filtered.length}</span> đơn
              </>
            ) : (
              "Không có đơn từ nào"
            )}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${validCurrentPage === pageNum
                    ? "bg-sky-600 text-white shadow-2xs font-bold"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────── POPUP XÁC NHẬN TỪ CHỐI & NÊU LÝ DO ──────────────── */}
      {rejectModalData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            {/* Header Popup */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-sm">
                    Xác nhận từ chối đơn từ
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Mã đơn: #{rejectModalData.id} • {rejectModalData.type}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalData(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin vắn tắt đơn bị từ chối */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nhân sự nộp đơn:</span>
                <span className="font-bold text-slate-800">
                  {rejectModalData.name} ({rejectModalData.empId})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Phòng ban:</span>
                <span className="text-slate-700 font-medium">{rejectModalData.dept}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  {rejectModalData.typeCategory === "resignation" ? "Thời gian thôi việc:" : "Thời gian nghỉ:"}
                </span>
                <span className="text-slate-700 font-medium">
                  {rejectModalData.typeCategory === "resignation"
                    ? `Từ ${rejectModalData.startDate}`
                    : `${rejectModalData.period} (${rejectModalData.subPeriod})`}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-200/60 text-slate-600 italic">
                "{rejectModalData.reason}"
              </div>
            </div>

            {/* Form nhập lý do từ chối */}
            <div className="flex flex-col gap-2 text-xs">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>Lý do từ chối (Bắt buộc)*:</span>
                <span className="text-[10px] text-slate-400 font-normal">Gửi phản hồi cho nhân viên</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                placeholder="Nhập lý do từ chối cụ thể (ví dụ: Trùng ca trực dự án trọng điểm, chưa có nhân sự thay ca, v.v.)..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all leading-relaxed"
                autoFocus
              />

              {rejectError && (
                <span className="text-rose-600 text-[11px] font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {rejectError}
                </span>
              )}

              {/* Gợi ý lý do nhanh */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
                {[
                  "Trùng lịch trực dự án",
                  "Chưa có người nhận bàn giao",
                  "Vượt định mức ngày phép",
                  "Cần bổ sung giấy viện",
                ].map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRejectionReason(tag);
                      if (rejectError) setRejectError("");
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions Popup: Sử dụng Icon X và Icon Tick */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRejectModalData(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>Xác nhận từ chối</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── DRAWER / MODAL XEM CHI TIẾT ĐƠN ──────────────── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            {/* Header Popup: Hiển thị Mã đơn, Loại đơn và Thời gian gửi chi tiết (kèm giờ phút) trên đầu, không bỏ vào khung */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-600 text-sm">
                    #{selectedRequest.id}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{selectedRequest.type}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Thời gian gửi đơn:{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedRequest.createdDateTime || selectedRequest.createdAt || "—"}
                    </span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-400">Người làm đơn:</span>
                <span className="font-semibold text-slate-800">{selectedRequest.name}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-400">Mã nhân viên:</span>
                <span className="font-semibold font-mono text-slate-800">{selectedRequest.empId}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-400">Phòng ban:</span>
                <span className="font-semibold text-slate-800">{selectedRequest.dept}</span>
              </div>
              {selectedRequest.typeCategory === "resignation" || selectedRequest.type === "Đơn xin thôi việc" ? (
                <>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-400">Ngày bắt đầu thôi việc:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRequest.startDate || selectedRequest.period}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                    <span className="text-rose-600 font-semibold">Hình thức đơn từ:</span>
                    <span className="font-bold text-rose-700">Chấm dứt hợp đồng lao động</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-400">Ngày bắt đầu nghỉ:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRequest.startDate || selectedRequest.period}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-400">Ngày kết thúc nghỉ:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRequest.endDate || selectedRequest.period}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-400">Tổng số ngày nghỉ:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRequest.totalDays || selectedRequest.subPeriod || "1 ngày"}
                    </span>
                  </div>
                  {/* Hiển thị rõ số phép năm còn lại đối với đơn xin nghỉ phép */}
                  {(selectedRequest.typeCategory === "annual" || selectedRequest.rawLoaiDon === "NGHI_PHEP" || selectedRequest.type === "Đơn xin nghỉ phép") && (
                    <div className="flex justify-between p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80">
                      <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        Số phép năm còn lại:
                      </span>
                      <span className="font-bold text-amber-900">
                        {calculateEmployeeLeaveBalance(selectedRequest.empId).conLai} / 12 ngày
                        <span className="text-[11px] text-amber-600 font-normal ml-1.5">
                          (Đã nghỉ: {calculateEmployeeLeaveBalance(selectedRequest.empId).daDung} ngày)
                        </span>
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="p-3 rounded-xl bg-slate-50 flex flex-col gap-1">
                <span className="text-slate-400 font-semibold">Lý do chi tiết:</span>
                <p className="text-slate-700 leading-relaxed">{selectedRequest.reason}</p>
              </div>
              {selectedRequest.handover ? (
                <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 flex flex-col gap-1">
                  <span className="text-sky-700 font-semibold">Bàn giao & chứng từ:</span>
                  <p className="text-slate-700">{selectedRequest.handover}</p>
                </div>
              ) : null}

              {selectedRequest.status === "approved" && selectedRequest.approvalNote ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex flex-col gap-1 text-emerald-800">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Ý kiến phê duyệt:
                  </span>
                  <p className="italic text-emerald-700">{selectedRequest.approvalNote}</p>
                  {selectedRequest.reviewer && (
                    <span className="text-[11px] text-emerald-600 font-normal mt-0.5">
                      Người duyệt: {selectedRequest.reviewer}
                    </span>
                  )}
                </div>
              ) : null}

              {selectedRequest.status === "rejected" && selectedRequest.rejectionReason ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 flex flex-col gap-1 text-rose-800">
                  <span className="font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Lý do đã từ chối:
                  </span>
                  <p className="italic text-rose-700">{selectedRequest.rejectionReason}</p>
                  {selectedRequest.reviewer && (
                    <span className="text-[11px] text-rose-600 font-normal mt-0.5">
                      Người từ chối: {selectedRequest.reviewer}
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            {/* Actions trong Drawer: Sử dụng Icon X và Tick */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
              >
                Đóng
              </button>

              {selectedRequest.status === "pending" && (
                <div className="flex items-center gap-2">
                  {/* Nút Từ chối với Icon X */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequest(null);
                      openRejectModal(selectedRequest);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl cursor-pointer transition-all shadow-2xs active:scale-95"
                    title="Từ chối đơn"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                    <span>Từ chối</span>
                  </button>

                  {/* Nút Phê duyệt với Icon Tick */}
                  <button
                    type="button"
                    onClick={() => {
                      handleApprove(selectedRequest);
                      setSelectedRequest(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                    title="Phê duyệt đơn"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Phê duyệt</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
