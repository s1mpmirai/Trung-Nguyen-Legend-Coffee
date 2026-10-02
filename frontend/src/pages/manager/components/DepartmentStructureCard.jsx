import React from "react";
import { Building2 } from "lucide-react";

export default function DepartmentStructureCard({ departments }) {
  const depts = departments || [
    { id: "PB01", name: "Ban Giám Đốc", count: 1, color: "#0284c7" },
    { id: "PB02", name: "Phòng Hành chính - Nhân sự", count: 3, color: "#0ea5e9" },
    { id: "PB03", name: "Phòng Kế toán - Tài chính", count: 2, color: "#38bdf8" },
    { id: "PB04", name: "Phòng R&D & Kiểm soát CL", count: 2, color: "#10b981" },
    { id: "PB05", name: "Phòng Kinh doanh & Tiếp thị", count: 3, color: "#f59e0b" },
    { id: "PB06", name: "Phòng Chuỗi Cung ứng & Kho vận", count: 3, color: "#6366f1" },
    { id: "PB07", name: "Xưởng Rang Xay Buôn Ma Thuột", count: 3, color: "#8b5cf6" },
    { id: "PB08", name: "Xưởng Đóng Gói Bình Dương", count: 2, color: "#ec4899" },
  ];

  const total = depts.reduce((sum, d) => sum + d.count, 0) || 19;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-slate-900 tracking-wider uppercase">
              CƠ CẤU NHÂN SỰ THEO PHÒNG BAN
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Phân bổ lực lượng lao động toàn tập đoàn</p>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
            {total} nhân sự
          </span>
        </div>

        {/* Danh sách phòng ban */}
        <div className="flex flex-col gap-3 my-2">
          {depts.map((d) => {
            const pct = Math.round((d.count / total) * 100);
            return (
              <div key={d.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-800 font-medium truncate max-w-[200px]" title={d.name}>
                    {d.name}
                  </span>
                  <span className="text-slate-500 font-semibold shrink-0">
                    {d.count} NV ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: d.color || "#0ea5e9",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
        <span>Toàn bộ chi nhánh & xưởng sản xuất</span>
        <span className="font-semibold text-slate-700">8 phòng ban & xưởng</span>
      </div>
    </div>
  );
}
