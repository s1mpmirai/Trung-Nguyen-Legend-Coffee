import React from "react";
import { FileText, AlertCircle, Calendar } from "lucide-react";

export default function ExpiringContractsCard({ contracts, onNavigateTab }) {
  const list = contracts || [
    {
      contractId: "HD-019",
      employeeId: "NV19",
      name: "Phạm Minh Trí",
      role: "Nhân viên Kinh doanh",
      dept: "Phòng Kinh doanh & Tiếp thị",
      type: "HĐ Thử việc",
      typeBadge: "bg-amber-50 text-amber-700 border-amber-200",
      endDate: "30/11/2026",
      remainingDays: 28,
      action: "Đánh giá thử việc",
    },
    {
      contractId: "HD-010",
      employeeId: "NV10",
      name: "Lê Thị Thu",
      role: "Chuyên viên Nhân sự",
      dept: "Phòng Hành chính - Nhân sự",
      type: "HĐ Xác định 1 năm",
      typeBadge: "bg-sky-50 text-sky-700 border-sky-200",
      endDate: "31/01/2027",
      remainingDays: 90,
      action: "Chuẩn bị tái ký",
    },
    {
      contractId: "HD-014",
      employeeId: "NV14",
      name: "Đinh Thị Mai",
      role: "Nhân viên Điều phối Kho",
      dept: "Phòng Chuỗi Cung ứng & Kho vận",
      type: "HĐ Xác định 1 năm",
      typeBadge: "bg-sky-50 text-sky-700 border-sky-200",
      endDate: "28/02/2027",
      remainingDays: 118,
      action: "Theo dõi gia hạn",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-slate-900 tracking-wider uppercase">
              HỢP ĐỒNG SẮP HẾT HẠN
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Theo dõi thời hạn và tái ký hợp đồng</p>
          </div>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            {list.length} HĐ cần chú ý
          </span>
        </div>

        <div className="flex flex-col gap-3 my-2">
          {list.map((c) => (
            <div
              key={c.contractId}
              className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/60 transition-colors flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-800">
                    {c.name} <span className="font-mono text-slate-400 font-normal">({c.employeeId})</span>
                  </span>
                  <span className="text-[11px] text-slate-500">{c.role}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${c.typeBadge}`}>
                  {c.type}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/40">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Hết hạn: <strong className="text-slate-700 font-medium">{c.endDate}</strong>
                </span>
                <span className="font-semibold text-amber-600">
                  {c.remainingDays ? `Còn ${c.remainingDays} ngày` : c.action}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
        <span>Hạn thông báo trước 30 ngày</span>
        <button
          onClick={() => onNavigateTab && onNavigateTab("employees")}
          className="text-sky-600 font-semibold hover:underline cursor-pointer"
        >
          Xem hồ sơ nhân sự
        </button>
      </div>
    </div>
  );
}
