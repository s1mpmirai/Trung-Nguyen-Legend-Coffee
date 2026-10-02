import React from "react";
import { TrendingUp } from "lucide-react";

export default function TenureStatsCard({ tenureData }) {
  const data = tenureData || {
    averageYears: 3.4,
    retentionGrowth: 4.2,
    brackets: [
      { label: "Dưới 1 năm", percentage: 22, count: 281, color: "bg-sky-500" },
      { label: "1 – 3 năm", percentage: 45, count: 576, color: "bg-sky-600" },
      { label: "Trên 3 năm", percentage: 33, count: 423, color: "bg-emerald-500" },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-sm text-slate-900">
              Thâm niên công tác
            </h2>
            <p className="text-[11px] text-slate-400">Độ gắn kết đội ngũ</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
            TB: {data.averageYears} năm
          </span>
        </div>

        <div className="flex flex-col gap-4 my-2">
          {data.brackets.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-medium">{item.label}</span>
                <span className="text-slate-500 font-medium">
                  {item.percentage}% • {item.count} NV
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.color || "bg-sky-500"}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 mt-4">
        <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <TrendingUp className="w-3.5 h-3.5" />
        </span>
        <span>
          Chỉ số gắn bó tăng <strong className="text-slate-800">+{data.retentionGrowth}%</strong> so với cùng kỳ.
        </span>
      </div>
    </div>
  );
}
