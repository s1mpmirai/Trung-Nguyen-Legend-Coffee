import React, { useState } from "react";
import {
  UserPlus,
  Search,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  FileEdit,
  Building2,
  Users,
  ShieldCheck,
  Palmtree,
  Sparkles,
} from "lucide-react";
import AddEmployeeModal from "./components/AddEmployeeModal";

export default function EmployeeManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [successToast, setSuccessToast] = useState("");

  const [employees, setEmployees] = useState([
    {
      id: "NV01",
      name: "Đặng Lê Nguyên Vũ",
      email: "vu.dang@trungnguyen.com.vn",
      dept: "Ban Giám Đốc",
      role: "Tổng Giám Đốc",
      education: "Bác sĩ / MBA",
      tenure: "28 năm",
      salary: "Thoả thuận đặc biệt",
      status: "working",
      statusText: "Đang làm việc",
      statusColor: "emerald",
      initials: "NV",
      isVip: true,
    },
    {
      id: "NV1042",
      name: "Nguyễn Văn An",
      email: "an.nguyen@trungnguyen.com.vn",
      dept: "R&D Chế Biến",
      role: "Trưởng phòng R&D",
      education: "ThS. Hóa Sinh",
      tenure: "8 năm 4 th",
      salary: "36,500,000 đ",
      status: "working",
      statusText: "Đang làm việc",
      statusColor: "emerald",
      initials: "NA",
    },
    {
      id: "NV1108",
      name: "Lê Thị Bích Thảo",
      email: "thao.le@trungnguyen.com.vn",
      dept: "Chuỗi F&B Legend",
      role: "Trưởng nhóm Barista",
      education: "Cử nhân Quản trị KS",
      tenure: "3 năm 2 th",
      salary: "14,200,000 đ",
      status: "working",
      statusText: "Đang làm việc",
      statusColor: "emerald",
      initials: "BT",
    },
    {
      id: "NV1185",
      name: "Trần Văn Cường",
      email: "cuong.tran@trungnguyen.com.vn",
      dept: "Tài chính - Kế toán",
      role: "Kế toán Tổng hợp",
      education: "Cử nhân Kế toán",
      tenure: "5 năm",
      salary: "22,000,000 đ",
      status: "leave",
      statusText: "Nghỉ phép năm",
      statusColor: "sky",
      initials: "TC",
    },
  ]);

  const handleAddEmployee = (newEmp) => {
    const created = {
      id: newEmp.maNv,
      name: newEmp.fullName || "Nhân sự mới",
      email: newEmp.email,
      dept:
        newEmp.department === "fnb"
          ? "Chuỗi F&B Legend"
          : newEmp.department === "rnd"
          ? "R&D Chế Biến"
          : "Khối Văn phòng",
      role: newEmp.role,
      education: "Đại học",
      tenure: "0 tháng (Mới)",
      salary: `${newEmp.salary} đ`,
      status: "probation",
      statusText: "Thử việc mới",
      statusColor: "amber",
      initials: (newEmp.fullName || "NV")
        .split(" ")
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase(),
    };
    setEmployees([created, ...employees]);
    setSuccessToast(`Đã thêm thành công nhân sự ${created.name} (${created.id})!`);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployees(employees.map((emp) => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      emp.name.toLowerCase().includes(q) ||
      emp.id.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q);
    const matchDept = !deptFilter || emp.dept.includes(deptFilter);
    const matchStatus = !statusFilter || emp.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1520px] mx-auto py-2">
      {/* 4 Micro-KPI Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Tổng nhân sự hiện diện</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
                1,280
              </span>
              <span className="text-xs text-emerald-600 font-semibold">+14 tháng này</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Đang làm việc tại cơ sở</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
                1,248
              </span>
              <span className="text-xs text-slate-400">/ 1,280</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Đang nghỉ phép / Công tác</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-sky-700 font-['Plus_Jakarta_Sans',sans-serif]">
                24
              </span>
              <span className="text-xs text-sky-600 font-semibold">1.8%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Palmtree className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Thử việc mới (Q4/2026)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-600 font-['Plus_Jakarta_Sans',sans-serif]">
                38
              </span>
              <span className="text-xs text-amber-600 font-semibold">Đạt 96%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-700 text-xs font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
            <span>Hệ thống Nhân sự Tập Đoàn • Trung Nguyên Legend</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
            Quản lý hồ sơ nhân sự
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nhập từ Excel</span>
          </button>
          <button
            type="button"
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất danh sách</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Thêm nhân sự mới</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter & Search Toolbar Card */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Mã NV, Họ tên, Email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="">Tất cả Phòng ban</option>
            <option value="Ban Giám Đốc">Ban Giám Đốc</option>
            <option value="R&D">Nghiên cứu & Phát triển (R&D)</option>
            <option value="F&B">Vận hành Chuỗi F&B Legend</option>
            <option value="Tài chính">Tài chính - Kế toán</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="">Trạng thái: Tất cả</option>
            <option value="working">● Đang làm việc</option>
            <option value="leave">● Nghỉ phép</option>
            <option value="probation">● Thử việc</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setDeptFilter("");
              setStatusFilter("");
            }}
            title="Đặt lại bộ lọc"
            className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Master Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-700 text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedEmployees.length === employees.length && employees.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 min-w-[220px]">Mã NV & Họ tên</th>
                <th className="py-3 px-4 min-w-[140px]">Phòng ban</th>
                <th className="py-3 px-4 min-w-[160px]">Chức vụ</th>
                <th className="py-3 px-4 min-w-[120px]">Trình độ</th>
                <th className="py-3 px-4 min-w-[110px]">Thâm niên</th>
                <th className="py-3 px-4 min-w-[130px]">Lương BHXH</th>
                <th className="py-3 px-4 min-w-[130px]">Trạng thái</th>
                <th className="py-3 px-4 w-20 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(emp.id)}
                      onChange={() => handleToggleSelect(emp.id)}
                      className="w-4 h-4 rounded border-slate-300 text-sky-600 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 font-semibold text-[11px] text-slate-700 flex items-center justify-center shrink-0">
                        {emp.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-800 truncate">{emp.name}</span>
                          {emp.isVip && <Sparkles className="w-3 h-3 text-sky-600" />}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {emp.id} • {emp.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{emp.dept}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{emp.role}</td>
                  <td className="py-3 px-4 text-slate-500">{emp.education}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{emp.tenure}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{emp.salary}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                        emp.statusColor === "emerald"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : emp.statusColor === "sky"
                          ? "bg-sky-50 text-sky-700 border border-sky-200/60"
                          : "bg-amber-50 text-amber-700 border border-amber-200/60"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          emp.statusColor === "emerald"
                            ? "bg-emerald-500"
                            : emp.statusColor === "sky"
                            ? "bg-sky-500"
                            : "bg-amber-500"
                        }`}
                      ></span>
                      {emp.statusText}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-sky-600 inline-flex items-center justify-center transition-colors cursor-pointer"
                      title="Chỉnh sửa hồ sơ"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Hiển thị {filteredEmployees.length} trên tổng số 1,280 nhân sự</span>
          <div className="flex items-center gap-1">
            <span className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold border border-sky-200/60">
              Trang 1 / 128
            </span>
          </div>
        </div>
      </div>

      {/* Popup Thêm nhân sự mới */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddEmployee}
      />
    </div>
  );
}
