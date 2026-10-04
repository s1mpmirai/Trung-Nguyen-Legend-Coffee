import React, { useState } from "react";
import {
  Save,
  Check,
  Minus,
  Search,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  UserPlus,
  X,
  Trash2,
  Sparkles,
} from "lucide-react";

export default function RolePermissions() {
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  // Modal Thêm nhân sự
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    id: "",
    name: "",
    currentJob: "",
    statusTag: "Đang công tác",
    tagType: "active",
    role: "staff",
  });
  const [addError, setAddError] = useState("");

  const getInitials = (fullName) => {
    if (!fullName) return "NV";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const presetCandidates = [
    { id: "TN-1558", name: "Đặng Thùy Dương", currentJob: "Thu ngân & Bán hàng", statusTag: "Đang công tác", tagType: "active", role: "staff" },
    { id: "TN-2204", name: "Phạm Quốc Bảo", currentJob: "Kỹ thuật máy rang xay", statusTag: "Đề xuất thăng chức", tagType: "promote", role: "leader" },
    { id: "TN-3112", name: "Ngô Mai Trang", currentJob: "Chăm sóc khách hàng", statusTag: "Thử việc", tagType: "probation", role: "staff" },
    { id: "TN-1088", name: "Hoàng Văn Tuấn", currentJob: "Giám sát cửa hàng", statusTag: "Đang công tác", tagType: "active", role: "leader" },
  ];

  const handlePickCandidate = (candidate) => {
    setNewMember({
      id: candidate.id,
      name: candidate.name,
      currentJob: candidate.currentJob,
      statusTag: candidate.statusTag,
      tagType: candidate.tagType,
      role: candidate.role,
    });
    setAddError("");
  };

  const handleAddMember = (e) => {
    e?.preventDefault();
    if (!newMember.name.trim()) {
      setAddError("Vui lòng nhập họ và tên nhân sự");
      return;
    }
    const finalId = newMember.id.trim() || `TN-${Math.floor(1000 + Math.random() * 9000)}`;
    if (members.some((m) => m.id.toLowerCase() === finalId.toLowerCase())) {
      setAddError(`Mã nhân viên ${finalId} đã tồn tại trong danh sách!`);
      return;
    }

    const added = {
      ...newMember,
      id: finalId,
      name: newMember.name.trim(),
      initials: getInitials(newMember.name),
      currentJob: newMember.currentJob.trim() || "Nhân viên vận hành",
    };

    setMembers((prev) => [added, ...prev]);
    setIsAddModalOpen(false);
    setNewMember({
      id: "",
      name: "",
      currentJob: "",
      statusTag: "Đang công tác",
      tagType: "active",
      role: "staff",
    });
    setAddError("");
    setToast(`Đã thêm nhân sự ${added.name} (${added.id}) vào danh sách phân quyền!`);
    setTimeout(() => setToast(""), 3500);
  };

  const handleRemoveMember = (id, name) => {
    if (window.confirm(`Bạn có chắc muốn bỏ nhân sự ${name} khỏi danh sách phân quyền?`)) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setToast(`Đã xóa ${name} khỏi danh sách phân quyền!`);
      setTimeout(() => setToast(""), 3000);
    }
  };

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
      module: "Nộp đơn",
      action: "Gửi đơn cá nhân",
      staff: true,
      lead: true,
      manager: true,
      admin: true,
    },
    {
      module: "Duyệt đơn",
      action: "Duyệt đơn nghỉ phép nhóm (< 3 ngày)",
      staff: false,
      lead: true,
      manager: true,
      admin: true,
      isNewForLead: true,
    },
    {
      module: "Quản lý đơn thôi việc, dài hạn",
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
    }
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
            PHÂN QUYỀN & VAI TRÒ NHÂN SỰ
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

      {/* ──────────────── 1. MA TRẬN ĐỐI CHIẾU PHÂN QUYỀN (MATRIX RBAC) ──────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col p-6 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
              Ma trận đối chiếu phân quyền
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chi tiết thẩm quyền thao tác trên 6 phân hệ lõi của tập đoàn Trung Nguyên Legend
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterType === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Tất cả chức năng
            </button>
            <button
              onClick={() => setFilterType("approval")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterType === "approval" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"
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
                        className={`w-5 h-5 rounded-full inline-flex items-center justify-center mx-auto ${row.isNewForLead
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
          <span className="font-mono text-slate-400 text-[11px]">Chính sách bảo mật ISO 27001</span>
        </div>
      </div>

      {/* ──────────────── 2. GÁN VAI TRÒ NHÂN SỰ (KHUNG NẰM DÀI Ở GIỮA TRANG) ──────────────── */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                Gán vai trò nhân sự
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-mono text-xs font-bold border border-sky-200/60">
                {members.length} Thành viên
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Đổi vai trò lập tức bằng dropdown để áp dụng ngay bộ quyền phân cấp tương ứng cho từng nhân sự.
            </p>
          </div>

          {/* Search Input, Thêm nhân sự Button & Quick Info */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mã nhân viên..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setAddError("");
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm nhân sự</span>
            </button>

            <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-[11px]">Đồng bộ tức thời trên 140+ chi nhánh</span>
            </div>
          </div>
        </div>

        {/* Member Grid - Multi-column responsive layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-sky-300 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-3 group relative"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {m.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">{m.name}</h3>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {m.id} • {m.currentJob}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${m.tagType === "promote"
                      ? "bg-sky-100 text-sky-800 border border-sky-200"
                      : m.tagType === "leader"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : m.tagType === "probation"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-slate-200 text-slate-700"
                      }`}
                  >
                    {m.statusTag}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id, m.name)}
                    title="Xóa khỏi danh sách phân quyền"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-500 font-medium">Vai trò gán:</span>
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white text-slate-800 font-semibold text-xs border border-slate-200 shadow-2xs focus:border-sky-500 focus:outline-none cursor-pointer"
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

      {/* ──────────────── MODAL THÊM NHÂN SỰ VÀO PHÂN QUYỀN ──────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                    Thêm nhân sự vào phân quyền
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gán vai trò và kích hoạt quyền thao tác cho nhân sự mới
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggestions from System */}
            <div className="bg-slate-50/70 p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  Gợi ý nhanh nhân sự từ hệ thống:
                </span>
                <span className="text-[10px] text-slate-400">Bấm để điền nhanh</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {presetCandidates.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handlePickCandidate(c)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-700 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">({c.id})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleAddMember} className="p-5 flex flex-col gap-4">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã nhân viên <span className="text-slate-400 font-normal">(để trống tự tạo)</span>
                  </label>
                  <input
                    type="text"
                    value={newMember.id}
                    onChange={(e) => setNewMember({ ...newMember, id: e.target.value })}
                    placeholder="VD: TN-2045"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chức danh / Vị trí công tác
                </label>
                <input
                  type="text"
                  value={newMember.currentJob}
                  onChange={(e) => setNewMember({ ...newMember, currentJob: e.target.value })}
                  placeholder="VD: Barista Chuẩn, Thu ngân ca chiều..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái công tác
                  </label>
                  <select
                    value={newMember.statusTag}
                    onChange={(e) => {
                      const tag = e.target.value;
                      let type = "active";
                      if (tag.includes("thăng")) type = "promote";
                      else if (tag.includes("Leader")) type = "leader";
                      else if (tag.includes("việc")) type = "probation";
                      setNewMember({ ...newMember, statusTag: tag, tagType: type });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:bg-white focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Đang công tác">Đang công tác</option>
                    <option value="Đề xuất thăng chức">Đề xuất thăng chức</option>
                    <option value="Thử việc">Thử việc</option>
                    <option value="Leader hiện tại">Leader hiện tại</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vai trò khởi tạo <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:bg-white focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="staff">Nhân viên tiêu chuẩn</option>
                    <option value="leader">Trưởng nhóm / Leader</option>
                    <option value="manager">Trưởng phòng / Quản lý</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
                >
                  Xác nhận thêm nhân sự
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
