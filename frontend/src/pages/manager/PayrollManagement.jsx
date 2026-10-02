import React, { useState } from "react";
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  Lock,
  Download,
  RefreshCw,
  Send,
  Search,
  Filter,
  FileText,
  Mail,
  Printer,
  X,
  Building2,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Eye,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";

export default function PayrollManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Modal xem chi tiết phiếu lương (Payslip Drawer/Modal)
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Danh sách bảng lương mẫu
  const [payrollData, setPayrollData] = useState([
    {
      id: "TN-0492",
      name: "Trần Hữu Nam",
      initials: "TH",
      role: "QL Cửa hàng F&B",
      dept: "hq",
      deptLabel: "Chuỗi F&B Legend",
      standardDays: 22,
      actualDays: 22,
      baseSalary: 18000000,
      allowance: 2400000,
      otPay: 1250000,
      deductions: 2340000,
      kpiBonus: 3500000,
      netSalary: 22810000,
      status: "ready",
      statusLabel: "Sẵn sàng",
      bankAccount: "Techcombank • **** 8829",
    },
    {
      id: "TN-1028",
      name: "Lê Thị Ánh Tuyết",
      initials: "LA",
      role: "Kỹ thuật chế biến",
      dept: "factory",
      deptLabel: "Nhà máy chế biến",
      standardDays: 24,
      actualDays: 24,
      baseSalary: 13500000,
      allowance: 1800000,
      otPay: 2100000,
      deductions: 1620000,
      kpiBonus: 2200000,
      netSalary: 17980000,
      status: "ready",
      statusLabel: "Sẵn sàng",
      bankAccount: "Vietcombank • **** 1402",
    },
    {
      id: "TN-0182",
      name: "Võ Văn Kiệt",
      initials: "VK",
      role: "Giám sát Barista",
      dept: "fb",
      deptLabel: "Chuỗi F&B Legend",
      standardDays: 22,
      actualDays: 21.5,
      baseSalary: 11000000,
      allowance: 1500000,
      otPay: 980000,
      deductions: 1320000,
      kpiBonus: 1800000,
      netSalary: 13960000,
      status: "ready",
      statusLabel: "Sẵn sàng",
      bankAccount: "MB Bank • **** 9918",
    },
    {
      id: "TN-0034",
      name: "Nguyễn Thị Phương Uyên",
      initials: "PU",
      role: "Trưởng phòng Nhân sự",
      dept: "hq",
      deptLabel: "Khối Văn phòng Trụ sở",
      standardDays: 22,
      actualDays: 22,
      baseSalary: 32000000,
      allowance: 4500000,
      otPay: 0,
      deductions: 4850000,
      kpiBonus: 7000000,
      netSalary: 38650000,
      status: "ready",
      statusLabel: "Sẵn sàng",
      bankAccount: "Techcombank • **** 6631",
    },
    {
      id: "TN-2849",
      name: "Bùi Đình Hoàng",
      initials: "BH",
      role: "Lái xe Tiếp vận",
      dept: "logistics",
      deptLabel: "Khối Tiếp vận & Kho vận",
      standardDays: 24,
      actualDays: 23,
      baseSalary: 10500000,
      allowance: 2000000,
      otPay: 1850000,
      deductions: 1260000,
      kpiBonus: 1500000,
      netSalary: 14590000,
      status: "pending",
      statusLabel: "Chờ kiểm tra",
      bankAccount: "VPBank • **** 4492",
    },
    {
      id: "TN-3108",
      name: "Phạm Hồng Ngọc",
      initials: "HN",
      role: "Chuyên viên Kiểm soát CL",
      dept: "factory",
      deptLabel: "Nhà máy chế biến",
      standardDays: 22,
      actualDays: 22,
      baseSalary: 14000000,
      allowance: 1800000,
      otPay: 850000,
      deductions: 1680000,
      kpiBonus: 2500000,
      netSalary: 17470000,
      status: "paid",
      statusLabel: "Đã chi trả",
      bankAccount: "Vietcombank • **** 7731",
    }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
      showToast("Đã tính toán lại toàn bộ bảng lương tự động dựa trên chấm công và KPI mới nhất!");
    }, 1200);
  };

  const handleLockPayroll = () => {
    if (isLocked) {
      setIsLocked(false);
      showToast("Đã mở khóa bảng lương để điều chỉnh thêm.");
    } else {
      setIsLocked(true);
      showToast("Đã khóa bảng lương thành công! Dữ liệu đã được chuyển sang phân hệ Kế toán sẵn sàng giải ngân.");
    }
  };

  const handleSendEmail = (name) => {
    showToast(`Đã gửi email phiếu lương điện tử bảo mật đến hòm thư của ${name}!`);
  };

  const filteredData = payrollData.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deptLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = selectedDept === "all" || item.dept === selectedDept;
    const matchStatus = selectedStatus === "all" || item.status === selectedStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* ──────────────── HEADER BAR ──────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-semibold">
            <span>Tài chính nhân sự</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-sky-600">Kỳ lương 10/2026</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight mt-1">
            Bảng tính lương nhân sự
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Kỳ tính lương: Tháng 10/2026 • Dữ liệu tính tự động từ ngày công, ca làm và hiệu suất KPI
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating || isLocked}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 transition-all shadow-xs text-xs font-semibold active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isRecalculating ? "animate-spin" : ""}`} />
            <span>{isRecalculating ? "Đang tính..." : "Tính lại lương"}</span>
          </button>

          <button
            onClick={() => showToast("Đã chuẩn bị tệp xuất phiếu lương hàng loạt dạng PDF / Excel!")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all text-xs font-semibold active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Xuất phiếu lương hàng loạt</span>
          </button>

          <button
            onClick={handleLockPayroll}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-all active:scale-95 ${
              isLocked
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 shadow-sky-600/20"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLocked ? "Mở khóa bảng lương" : "Khóa bảng lương & Duyệt chi"}</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ──────────────── 3 BENTO SUMMARY METRICS ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Tổng quỹ lương thực chi
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900 tracking-tight">
                  20,850,000,000
                </span>
                <span className="text-xs font-bold text-sky-600">VNĐ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
              <TrendingUp className="w-3 h-3" />
              +2.1%
            </span>
            <span className="text-[11px] text-slate-400">so với kỳ Tháng 09/2026</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Thu nhập bình quân
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900 tracking-tight">
                  16,289,060
                </span>
                <span className="text-xs text-slate-500">đ/người</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span> Khối SX: 14.2M
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> F&B: 13.8M
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> VP: 24.5M
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Tiến độ đối soát công
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-emerald-600 tracking-tight">
                  1,280
                </span>
                <span className="text-xs text-slate-400">/ 1,280 nhân sự</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Hoàn tất
              </span>
              <span className="text-slate-400">0 trường hợp tranh chấp</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
              <div className="bg-emerald-500 h-full rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── FILTER & TOOLBAR ──────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc mã NV..."
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Department */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tất cả khối phòng ban</option>
            <option value="fb">Chuỗi F&B Legend</option>
            <option value="factory">Nhà máy chế biến</option>
            <option value="logistics">Khối Tiếp vận & Kho vận</option>
            <option value="hq">Khối Văn phòng Trụ sở</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Mọi trạng thái chi</option>
            <option value="ready">Sẵn sàng chi</option>
            <option value="pending">Chờ kiểm tra</option>
            <option value="paid">Đã chi trả</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Hiển thị {filteredData.length} / {payrollData.length} bản ghi</span>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDept("all");
              setSelectedStatus("all");
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => showToast("Đã tải tệp bảng lương chi tiết!")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 transition-colors"
            title="Tải Excel bảng lương"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ──────────────── PAYROLL TABLE ──────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Mã & Nhân sự</th>
                <th className="py-3 px-3 text-center">Công chuẩn / TT</th>
                <th className="py-3 px-4 text-right">Lương HĐ (VNĐ)</th>
                <th className="py-3 px-3 text-right">Phụ cấp</th>
                <th className="py-3 px-3 text-right">Tiền OT</th>
                <th className="py-3 px-3 text-right">Khấu trừ & Thuế</th>
                <th className="py-3 px-3 text-right">Thưởng KPI</th>
                <th className="py-3 px-4 text-right bg-sky-50/60 text-sky-900 font-bold">THỰC NHẬN (NET)</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredData.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {row.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{row.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-1 py-0.2 rounded font-semibold">
                            {row.id}
                          </span>
                          <span className="text-[11px] text-slate-400">• {row.role}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center font-mono">
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                      <span className="font-bold text-emerald-600">{row.actualDays}</span> / {row.standardDays}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                    {row.baseSalary.toLocaleString("vi-VN")}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {row.allowance.toLocaleString("vi-VN")}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {row.otPay > 0 ? row.otPay.toLocaleString("vi-VN") : "-"}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-rose-600">
                    -{row.deductions.toLocaleString("vi-VN")}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-emerald-600 font-medium">
                    +{row.kpiBonus.toLocaleString("vi-VN")}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-sky-700 bg-sky-50/50 text-[13px]">
                    {row.netSalary.toLocaleString("vi-VN")} đ
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        row.status === "ready"
                          ? "bg-emerald-50 text-emerald-700"
                          : row.status === "paid"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          row.status === "ready"
                            ? "bg-emerald-500"
                            : row.status === "paid"
                            ? "bg-sky-500"
                            : "bg-amber-500"
                        }`}
                      ></span>
                      {row.statusLabel}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedPayslip(row)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Xem chi tiết phiếu lương cá nhân"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendEmail(row.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Gửi email phiếu lương"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────────────── MODAL CHI TIẾT PHIẾU LƯƠNG ──────────────── */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-base">
                    Phiếu lương điện tử (Payslip)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Kỳ lương: Tháng 10/2026 • Tập đoàn Trung Nguyên Legend
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Employee Info Header */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Họ và tên nhân sự:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedPayslip.name}</span>
                <span className="text-slate-500 block text-[11px]">
                  Mã: {selectedPayslip.id} • {selectedPayslip.role}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Bộ phận / Chi nhánh:</span>
                <span className="font-semibold text-slate-800">{selectedPayslip.deptLabel}</span>
                <span className="text-slate-500 block text-[11px]">
                  Tài khoản: {selectedPayslip.bankAccount}
                </span>
              </div>
            </div>

            {/* Detailed Salary Items */}
            <div className="mt-4 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Lương cơ bản theo hợp đồng:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedPayslip.baseSalary.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Ngày công chuẩn / Thực tế:</span>
                <span className="font-mono text-slate-800">
                  {selectedPayslip.actualDays} / {selectedPayslip.standardDays} ngày
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Phụ cấp ăn trưa, điện thoại, xăng xe:</span>
                <span className="font-mono text-emerald-600">
                  +{selectedPayslip.allowance.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Làm thêm giờ (OT ca cao điểm):</span>
                <span className="font-mono text-emerald-600">
                  +{selectedPayslip.otPay.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Thưởng hiệu suất kinh doanh (KPI):</span>
                <span className="font-mono text-emerald-600 font-semibold">
                  +{selectedPayslip.kpiBonus.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Trích BHXH, BHYT, BHTN (10.5%) & Thuế TNCN:</span>
                <span className="font-mono text-rose-600">
                  -{selectedPayslip.deductions.toLocaleString("vi-VN")} đ
                </span>
              </div>

              {/* Net total */}
              <div className="flex items-center justify-between p-3.5 mt-2 rounded-xl bg-sky-50 border border-sky-100">
                <div>
                  <span className="text-xs font-bold text-sky-900 block">THỰC LĨNH CHUYỂN KHOẢN (NET)</span>
                  <span className="text-[11px] text-sky-600">Đã đối soát 100% hợp lệ</span>
                </div>
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-sky-700 font-mono">
                  {selectedPayslip.netSalary.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  showToast("Đang chuẩn bị bản in phiếu lương...");
                  window.print();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handleSendEmail(selectedPayslip.name);
                    setSelectedPayslip(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
                >
                  <Mail className="w-4 h-4" />
                  <span>Gửi email phiếu lương</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
