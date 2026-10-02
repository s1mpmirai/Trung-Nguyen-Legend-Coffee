import React, { useState } from "react";
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
} from "lucide-react";

export default function LeaveApprovals() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toast, setToast] = useState("");

  const [requests, setRequests] = useState([
    {
      id: "TN-089",
      empId: "NV0911",
      name: "Vũ Thành Luân",
      initials: "TL",
      dept: "Kỹ sư Máy rang xay Buôn Ma Thuột",
      type: "Xin thôi việc",
      typeCategory: "resignation",
      priority: "Ưu tiên cao",
      period: "Ngày nghỉ: 30/10/2026",
      subPeriod: "Báo trước 30 ngày (Đúng luật)",
      reason: "Lý do gia đình chuyển nơi cư trú về Lâm Đồng cùng gia đình.",
      handover: "Đã nộp biên bản bàn giao máy rang Probat cho kỹ sư kế nhiệm",
      leaveBalance: "5/12 ngày",
      status: "pending",
      statusText: "Chờ duyệt",
    },
    {
      id: "TN-092",
      empId: "NV1281",
      name: "Lê Hoàng Nam",
      initials: "HN",
      dept: "Chuyên viên R&D Rang xay",
      type: "Phép năm (AL)",
      typeCategory: "annual",
      period: "18/10 - 20/10/2026",
      subPeriod: "03 ngày liên tục",
      reason: "Nghỉ phép thường niên tái tạo sức lao động.",
      handover: "Mẫu thử cà phê Blend E-Special đã chuyển cho Phan Bảo Long",
      leaveBalance: "8/12 ngày",
      status: "pending",
      statusText: "Chờ duyệt",
    },
    {
      id: "TN-095",
      empId: "NV1280",
      name: "Phan Thị Mỹ Hạnh",
      initials: "MH",
      dept: "Cửa hàng trưởng Legend Đồng Khởi",
      type: "Nghỉ ốm (BHXH)",
      typeCategory: "sick",
      period: "15/10 - 16/10/2026",
      subPeriod: "02 ngày (Có giấy viện C115)",
      reason: "Điều trị viêm amidan cấp có chứng nhận y tế theo chỉ định bác sĩ.",
      handover: "Đã đính kèm giấy xuất viện Bệnh viện Nhân dân 115",
      leaveBalance: "10/12 ngày",
      status: "pending",
      statusText: "Chờ duyệt",
    },
    {
      id: "TN-098",
      empId: "NV1105",
      name: "Đỗ Thị Kim Oanh",
      initials: "KO",
      dept: "Barista Master - Không gian Trịnh Văn Bô",
      type: "Nghỉ cưới (Hưởng lương)",
      typeCategory: "special",
      period: "24/10 - 26/10/2026",
      subPeriod: "03 ngày hưởng 100% lương",
      reason: "Nghỉ tổ chức hôn lễ tại quê nhà Hải Phòng theo chế độ luật định.",
      handover: "Đã đổi ca cho Barista Nguyễn Ngọc Anh",
      leaveBalance: "11/12 ngày",
      status: "pending",
      statusText: "Chờ duyệt",
    },
    {
      id: "TN-081",
      empId: "NV0992",
      name: "Trần Quốc Dũng",
      initials: "QD",
      dept: "Chuyên viên Thiết kế Bao bì & POSM",
      type: "Làm việc từ xa (WFH)",
      typeCategory: "wfh",
      period: "12/10/2026",
      subPeriod: "01 ngày tập trung đồ họa",
      reason: "Render file 3D chiến dịch Tết Trung Nguyên 2027.",
      handover: "Cam kết online Teams 100%",
      leaveBalance: "9/12 ngày",
      status: "approved",
      statusText: "Đã duyệt",
    },
    {
      id: "TN-074",
      empId: "NV0774",
      name: "Nguyễn Văn Quang",
      initials: "VQ",
      dept: "Giám sát Vận chuyển Logistics",
      type: "Phép năm (AL)",
      typeCategory: "annual",
      period: "05/10/2026",
      subPeriod: "01 ngày",
      reason: "Giải quyết việc cá nhân gấp.",
      handover: "Chưa bàn giao ca vận tải số 4",
      leaveBalance: "2/12 ngày",
      status: "rejected",
      statusText: "Đã từ chối",
    },
  ]);

  const handleApprove = (id) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved", statusText: "Đã duyệt" } : r))
    );
    setToast(`Đã phê duyệt thành công đơn #${id}!`);
    setTimeout(() => setToast(""), 3500);
  };

  const handleReject = (id) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected", statusText: "Đã từ chối" } : r))
    );
    setToast(`Đã từ chối đơn #${id}!`);
    setTimeout(() => setToast(""), 3500);
  };

  const filtered = requests.filter((r) => {
    const matchTab = activeFilter === "all" || r.status === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.dept.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="flex flex-col gap-6 max-w-[1520px] mx-auto py-2">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-700 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
            <span>Hệ thống xét duyệt • Phân hệ Quản trị Nhân sự</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
            Duyệt đơn từ nhân viên
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem xét và phê duyệt các yêu cầu nghỉ phép, xin thôi việc, công tác và làm việc linh hoạt
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>Tháng 10, 2026</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Tất cả chi nhánh & nhà máy</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Cần xử lý ngay */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Cần xử lý ngay
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900">
                  0{pendingCount}
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
              1 đơn thôi việc cần duyệt gấp
            </span>
            <span className="text-slate-400 font-medium">3 phép thường</span>
          </div>
        </div>

        {/* Card 2: Đã phê duyệt tháng này */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Đã phê duyệt tháng này
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900">
                  48
                </span>
                <span className="text-xs text-slate-500 font-semibold">hồ sơ</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <span>+12.4% so với chu kỳ tháng trước</span>
          </div>
        </div>

        {/* Card 3: SLA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                Tỷ lệ duyệt đúng hạn (SLA)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900">
                  98.2%
                </span>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  Đạt chuẩn
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Thời gian xử lý trung bình</span>
            <span className="font-mono font-bold text-slate-700">~4.2 giờ</span>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Tất cả đơn ({requests.length})
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === "pending"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === "approved"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Đã duyệt ({approvedCount})
            </button>
            <button
              onClick={() => setActiveFilter("rejected")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === "rejected"
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
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4">Loại đơn</th>
                <th className="py-3 px-4">Thời gian đề xuất</th>
                <th className="py-3 px-4 min-w-[200px]">Lý do & Bàn giao</th>
                <th className="py-3 px-4 text-center">Phép năm</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-sky-600">
                    #{req.id}
                    {req.priority && (
                      <span className="block text-[10px] text-rose-500 font-semibold font-sans">
                        {req.priority}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 font-semibold text-[11px] text-slate-700 flex items-center justify-center shrink-0">
                        {req.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-800 truncate">{req.name}</span>
                        <span className="text-[11px] text-slate-400 truncate">{req.dept}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        req.typeCategory === "resignation"
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
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{req.period}</span>
                      <span className="text-[11px] text-slate-400">{req.subPeriod}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-slate-700 line-clamp-1">{req.reason}</p>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Paperclip className="w-3 h-3 text-sky-500" />
                      {req.handover}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-medium text-slate-600">
                    {req.leaveBalance}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        req.status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : req.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-rose-50 text-rose-700 border border-rose-200/60"
                      }`}
                    >
                      {req.statusText}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(req)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                        title="Xem chi tiết đơn"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {req.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReject(req.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            Từ chối
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            Duyệt
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer / Modal Xem chi tiết đơn */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sky-600 text-sm">
                  #{selectedRequest.id}
                </span>
                <span className="text-xs font-bold text-slate-800">{selectedRequest.type}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-400">Người làm đơn:</span>
                <span className="font-semibold text-slate-800">
                  {selectedRequest.name} ({selectedRequest.empId})
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-400">Phòng ban:</span>
                <span className="font-semibold text-slate-800">{selectedRequest.dept}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-400">Thời gian:</span>
                <span className="font-semibold text-slate-800">{selectedRequest.period}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 flex flex-col gap-1">
                <span className="text-slate-400 font-semibold">Lý do chi tiết:</span>
                <p className="text-slate-700 leading-relaxed">{selectedRequest.reason}</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 flex flex-col gap-1">
                <span className="text-sky-700 font-semibold">Bàn giao & chứng từ:</span>
                <p className="text-slate-700">{selectedRequest.handover}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              {selectedRequest.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleReject(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    Phê duyệt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
