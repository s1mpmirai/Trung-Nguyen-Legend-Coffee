import React from "react";
import { ArrowRight, CheckCircle, ClockAlert, FileText, UserCheck } from "lucide-react";

export default function PendingApprovalsTable({ approvals, onNavigateTab }) {
  const items = approvals || [
    {
      id: "DT-002",
      type: "LEAVE",
      typeLabel: "Nghỉ ốm",
      badgeColor: "amber",
      employeeId: "NV12",
      employeeName: "Vũ Thị Ngọc",
      content: "1.0 ngày (12/10/2026)",
      reason: "Khám bệnh tại bệnh viện An Sinh",
      status: "CHO_DUYET",
      statusLabel: "Chờ duyệt",
      date: "11/10/2026",
    },
    {
      id: "DT-003",
      type: "LEAVE",
      typeLabel: "Nghỉ phép năm",
      badgeColor: "sky",
      employeeId: "NV14",
      employeeName: "Đinh Thị Mai",
      content: "2.0 ngày (15/10 - 16/10/2026)",
      reason: "Giải quyết việc cá nhân gia đình",
      status: "CHO_DUYET",
      statusLabel: "Chờ duyệt",
      date: "10/10/2026",
    },
    {
      id: "YC-01",
      type: "PROFILE",
      typeLabel: "Cập nhật hồ sơ",
      badgeColor: "emerald",
      employeeId: "NV10",
      employeeName: "Lê Thị Thu",
      content: "Cập nhật CCCD & Địa chỉ thường trú",
      reason: "Đổi căn cước công dân gắn chip mới",
      status: "CHO_DUYET",
      statusLabel: "Chờ duyệt",
      date: "09/10/2026",
    },
    {
      id: "YC-02",
      type: "PROFILE",
      typeLabel: "Cập nhật tài khoản",
      badgeColor: "emerald",
      employeeId: "NV16",
      employeeName: "Ngô Thị Cẩm",
      content: "Đổi STK nhận lương Vietcombank",
      reason: "Chuyển đổi số tài khoản chính thức",
      status: "CHO_DUYET",
      statusLabel: "Chờ duyệt",
      date: "08/10/2026",
    },
  ];

  const getBadgeStyle = (badgeColor) => {
    switch (badgeColor) {
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "sky":
        return "bg-sky-50 text-sky-700 border-sky-200/80";
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-slate-900 tracking-wider uppercase">
            DANH SÁCH ĐƠN TỪ & YÊU CẦU CẦN DUYỆT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Các đơn nghỉ phép và đề nghị cập nhật hồ sơ từ nhân viên đang chờ Quản lý phê duyệt
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab("leaves")}
          className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>XEM TẤT CẢ ĐƠN TỪ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[11px]">
              <th className="py-3 px-3">Mã & Loại yêu cầu</th>
              <th className="py-3 px-3">Nhân viên gửi</th>
              <th className="py-3 px-3">Nội dung chi tiết</th>
              <th className="py-3 px-3">Lý do</th>
              <th className="py-3 px-3">Ngày gửi</th>
              <th className="py-3 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getBadgeStyle(
                        row.badgeColor
                      )}`}
                    >
                      {row.typeLabel}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 font-medium">#{row.id}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{row.employeeName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{row.employeeId}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-slate-700 font-medium">{row.content}</td>
                <td className="py-3.5 px-3 text-slate-500 max-w-[220px] truncate" title={row.reason}>
                  {row.reason}
                </td>
                <td className="py-3.5 px-3 text-slate-500">{row.date}</td>
                <td className="py-3.5 px-3 text-center">
                  <button
                    onClick={() => {
                      if (onNavigateTab) {
                        onNavigateTab(row.type === "LEAVE" ? "leaves" : "employees");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Xử lý đơn
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
        <span>Dữ liệu thực tế từ bảng don_tu và yeu_cau_cap_nhat_ho_so</span>
        <span className="font-medium text-slate-600">Đang có {items.length} việc cần giải quyết</span>
      </div>
    </div>
  );
}
