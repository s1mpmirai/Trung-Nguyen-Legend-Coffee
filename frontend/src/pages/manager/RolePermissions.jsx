import React, { useState } from "react";
import {
  Shield,
  TrendingUp,
  CheckCircle2,
  Lock,
  PlusCircle,
  Save,
  Check,
  Minus,
  Sparkles,
  Users,
  Search,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  ShieldAlert,
  UserPlus
} from "lucide-react";

export default function RolePermissions() {
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  // Danh sách nhân sự gán vai trò (Từ Stitch Screen a9037f27)
  const [members, setMembers] = useState([
    {
      id: "TN-2041",
      name: "Trần Nhật Nam",
      initials: "TN",
      currentJob: "Barista Chuẩn",
      statusTag: "Đề xuất thăng chức",
      tagType: "promote",
      role: "leader",
    },
    {
      id: "TN-1893",
      name: "Lê Hoàng Lan",
      initials: "LH",
      currentJob: "Thu ngân ca sáng",
      statusTag: "Đang công tác",
      tagType: "active",
      role: "staff",
    },
    {
      id: "TN-1402",
      name: "Võ Tuấn Kiệt",
      initials: "VT",
      currentJob: "Quản lý kho rang xay",
      statusTag: "Leader hiện tại",
      tagType: "leader",
      role: "leader",
    },
    {
      id: "TN-3029",
      name: "Hà Mỹ Linh",
      initials: "HM",
      currentJob: "Nhân viên thử việc",
      statusTag: "Thử việc",
      tagType: "probation",
      role: "staff",
    },
  ]);

  const matrix = [
    {
      module: "Chấm công & Ca làm",
      action: "Xem ca / Check-in cá nhân",
      staff: true,
      lead: true,
      manager: true,
      admin: true,
    },
    {
      module: "Chấm công & Ca làm",
      action: "Bảng công & Lịch trực nhóm",
      staff: false,
      lead: true,
      manager: true,
      admin: true,
      isNewForLead: true,
    },
    {
      module: "Duyệt đơn từ",
      action: "Gửi đơn cá nhân",
      staff: true,
      lead: true,
      manager: true,
      admin: true,
    },
    {
      module: "Duyệt đơn từ",
      action: "Duyệt đơn nghỉ phép nhóm (< 3 ngày)",
      staff: false,
      lead: true,
      manager: true,
      admin: true,
      isNewForLead: true,
    },
    {
      module: "Duyệt đơn từ",
      action: "Duyệt đơn thôi việc & phép dài hạn",
      staff: false,
      lead: false,
      manager: true,
      admin: true,
    },
    {
      module: "Quản lý nhân sự",
      action: "Xem danh sách nhân sự",
      staff: false,
      lead: true,
      manager: true,
      admin: true,
    },
    {
      module: "Quản lý nhân sự",
      action: "Thêm / Sửa hồ sơ nhân sự",
      staff: false,
      lead: false,
      manager: true,
      admin: true,
    },
    {
      module: "Bảng tính lương",
      action: "Xem phiếu lương cá nhân",
      staff: true,
      lead: true,
      manager: true,
      admin: true,
    },
    {
      module: "Bảng tính lương",
      action: "Khóa bảng lương & Duyệt chi",
      staff: false,
      lead: false,
      manager: true,
      admin: true,
    },
    {
      module: "Báo cáo & Thống kê",
      action: "Xuất Excel / PDF tổng hợp",
      staff: false,
      lead: true,
      manager: true,
      admin: true,
    },
    {
      module: "Cài đặt hệ thống",
      action: "Cấu hình GPS & Tham số API",
      staff: false,
      lead: false,
      manager: false,
      admin: true,
    },
  ];

  const handleSave = () => {
    setToast("Đã lưu ma trận phân quyền RBAC thành công!");
    setTimeout(() => setToast(""), 3500);
  };

  const handleRoleChange = (memberId, newRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    const member = members.find((m) => m.id === memberId);
    const roleName =
      newRole === "staff"
        ? "Nhân viên tiêu chuẩn"
        : newRole === "leader"
        ? "Trưởng nhóm / Leader"
        : "Trưởng phòng / Quản lý";

    setToast(
      `Đã cập nhật vai trò cho ${member?.name} thành "${roleName}"! Quyền hạn có hiệu lực ngay trong phiên đăng nhập tới.`
    );
    setTimeout(() => setToast(""), 4000);
  };

  const filteredMatrix = matrix.filter((row) => {
    if (filterType === "approval") return row.action.toLowerCase().includes("duyệt");
    return true;
  });

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.currentJob.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1520px] mx-auto py-2 animate-in fade-in duration-300">
      {/* ──────────────── HEADER ──────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-700 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
            <span>Bảo mật & Quản trị tổ chức • RBAC-v4.2</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
            Phân quyền & Vai trò nhân sự
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập phạm vi quyền hạn theo vị trí công tác và thăng tiến cấp bậc tức thời
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Lưu thay đổi phân quyền</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* ──────────────── ROLE UPGRADE PREVIEW CARD (Mô hình hóa thăng tiến quyền hạn) ──────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                Mô hình hóa thăng tiến quyền hạn (Role Upgrade Preview)
              </h2>
              <p className="text-xs text-slate-400">
                Trực quan hóa sự biến đổi thẩm quyền khi một nhân sự chuyển cấp bậc từ nhân viên tiêu chuẩn sang trưởng nhóm
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Kích hoạt tự động theo quyết định bổ nhiệm
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-5 items-stretch">
          {/* Cột Trái: Nhân viên tiêu chuẩn */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-slate-900">
                    Nhân viên tiêu chuẩn
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-200/60 font-bold">
                  Role: Staff
                </span>
              </div>
              <p className="text-xs text-slate-500 pb-3">
                Phạm vi dữ liệu tự thân (Self-Service Data Scope). Không có quyền giám sát.
              </p>
              <ul className="flex flex-col gap-2.5 text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    <strong className="text-slate-900">Chấm công GPS:</strong> Thực hiện check-in / check-out ca cá nhân trên ứng dụng.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    <strong className="text-slate-900">Gửi đơn từ:</strong> Đăng ký nghỉ phép cá nhân, xin đi muộn/về sớm, giải trình công.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    <strong className="text-slate-900">Phiếu lương:</strong> Xem bảng kê thu nhập và chi tiết phúc lợi của chính mình.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-slate-400 text-[11px] font-semibold">
              <span>Giới hạn: 3 nhóm tác vụ</span>
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Cột Giữa: Chỉ báo nâng bậc */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-3 gap-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider mt-1">Nâng bậc</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              +4 Quyền Mới
            </span>
          </div>

          {/* Cột Phải: Trưởng nhóm / Leader */}
          <div className="lg:col-span-5 rounded-2xl bg-sky-50/50 border border-sky-200/80 p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-slate-900">
                    Trưởng nhóm / Leader
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-800 uppercase px-2 py-0.5 rounded bg-emerald-100 font-bold">
                  Role: Team_Lead
                </span>
              </div>
              <p className="text-xs text-slate-500 pb-3">
                Kế thừa 100% quyền Nhân viên + Mở rộng thẩm quyền quản trị theo phân nhóm phòng ban.
              </p>
              <ul className="flex flex-col gap-2.5 text-xs">
                <li className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                  <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    <strong className="text-emerald-700">Phê duyệt đơn phép:</strong> Trực tiếp duyệt đơn nghỉ dưới 3 ngày của thành viên nhóm.
                  </span>
                </li>
                <li className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                  <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    <strong className="text-emerald-700">Giám sát ca & Chấm công:</strong> Xem thời gian thực lịch trực, cảnh báo vắng mặt của nhóm.
                  </span>
                </li>
                <li className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                  <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    <strong className="text-emerald-700">Đánh giá KPI ca:</strong> Chấm điểm tác phong, năng suất phục vụ/đóng gói ca làm.
                  </span>
                </li>
                <li className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                  <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    <strong className="text-emerald-700">Bàn giao & Nhật ký ca:</strong> Thêm biên bản sự cố, phân bổ lại vị trí làm việc.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-sky-200/60 flex items-center justify-between text-sky-700 text-[11px] font-bold">
              <span>Phạm vi: Cấp Đội / Ca sản xuất</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── LAYOUT GRID: MA TRẬN PHÂN QUYỀN (8 COLS) + PHÂN VAI TRÒ NHÂN VIÊN (4 COLS) ──────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* 8 Cols: Permissions Matrix Table */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col p-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-slate-900">
                  Ma trận đối chiếu phân quyền (Matrix RBAC)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chi tiết thẩm quyền thao tác trên 6 phân hệ lõi của tập đoàn Trung Nguyên
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    filterType === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  Tất cả chức năng
                </button>
                <button
                  onClick={() => setFilterType("approval")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    filterType === "approval" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  Chỉ quyền duyệt
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Phân hệ chức năng</th>
                    <th className="py-3 px-4 text-center">Hành vi thao tác</th>
                    <th className="py-3 px-3 text-center">Nhân viên</th>
                    <th className="py-3 px-3 text-center bg-emerald-50/50 text-emerald-800">
                      Trưởng nhóm
                    </th>
                    <th className="py-3 px-3 text-center">Quản lý</th>
                    <th className="py-3 px-3 text-center">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">{row.module}</td>
                      <td className="py-3 px-4 text-center text-slate-600 font-medium">{row.action}</td>
                      <td className="py-3 px-3 text-center">
                        {row.staff ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center mx-auto">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-3 text-center bg-emerald-50/30">
                        {row.lead ? (
                          <span
                            className={`w-5 h-5 rounded-full inline-flex items-center justify-center mx-auto ${
                              row.isNewForLead
                                ? "bg-emerald-600 text-white shadow-xs font-bold"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                            title={row.isNewForLead ? "Quyền mới mở khi nâng bậc" : ""}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.manager ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center mx-auto">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.admin ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center mx-auto">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  Quyền mở rộng khi thăng cấp
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  Được cấp mặc định
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">-</span>
                  Không có quyền
                </span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">Chính sách ISO 27001</span>
            </div>
          </div>
        </div>

        {/* 4 Cols: Assigned Members Fast Action Panel (Phân vai trò nhân sự) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-600" />
                <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-slate-900">
                  Gán vai trò nhân sự
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-mono text-[11px] font-bold">
                {members.length} Thành viên
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Đổi vai trò lập tức bằng dropdown để áp dụng ngay bộ quyền Leader mới cho nhân sự tương ứng.
            </p>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mã nhân viên..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none transition-all"
              />
            </div>

            {/* Member List */}
            <div className="flex flex-col gap-2.5">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {m.initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs">{m.name}</h3>
                        <p className="font-mono text-[10px] text-slate-400">
                          {m.id} • {m.currentJob}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                        m.tagType === "promote"
                          ? "bg-sky-100 text-sky-800"
                          : m.tagType === "leader"
                          ? "bg-emerald-100 text-emerald-800"
                          : m.tagType === "probation"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {m.statusTag}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Vai trò gán:</span>
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-white text-slate-800 font-semibold text-xs border border-slate-200 shadow-2xs focus:border-sky-500 focus:outline-none cursor-pointer"
                    >
                      <option value="staff">Nhân viên tiêu chuẩn</option>
                      <option value="leader">Trưởng nhóm / Leader</option>
                      <option value="manager">Trưởng phòng / Quản lý</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Summary Mini-card */}
          <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-sky-600 flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block leading-tight">
                  Đồng bộ tự động
                </span>
                <span className="text-[11px] text-slate-500">
                  Áp dụng cho 140+ chi nhánh cafe
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
