import React from "react";
import { Info } from "lucide-react";

export default function EducationChartCard({ educationData }) {
  const items = educationData || [
    { label: "Đại học", count: 870, percentage: 68.0, color: "#0ea5e9" },
    { label: "Cao đẳng / Nghề", count: 307, percentage: 24.0, color: "#10b981" },
    { label: "Sau đại học & Khác", count: 103, percentage: 8.0, color: "#f59e0b" },
  ];

  const totalEmployees = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-sm text-slate-900">
              Trình độ học vấn
            </h2>
            <p className="text-[11px] text-slate-400">Cơ cấu bằng cấp cán bộ</p>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {totalEmployees.toLocaleString("vi-VN")} NV
          </span>
        </div>

        {/* Slim Modern Donut Chart (SVG) */}
        <div className="relative w-40 h-40 mx-auto my-3 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="transparent" r="38" stroke="#f1f5f9" strokeWidth="9" />
            {/* Đại học (68%) */}
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="38"
              stroke="#0ea5e9"
              strokeDasharray="162.4 238.8"
              strokeDashoffset="0"
              strokeLinecap="round"
              strokeWidth="9"
              className="transition-all duration-700"
            />
            {/* Cao đẳng (24%) */}
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="38"
              stroke="#10b981"
              strokeDasharray="57.3 238.8"
              strokeDashoffset="-162.4"
              strokeLinecap="round"
              strokeWidth="9"
              className="transition-all duration-700"
            />
            {/* Sau ĐH (8%) */}
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="38"
              stroke="#f59e0b"
              strokeDasharray="19.1 238.8"
              strokeDashoffset="-219.7"
              strokeLinecap="round"
              strokeWidth="9"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 leading-tight">
              68%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Đại học</span>
          </div>
        </div>

        {/* Clean Breakdown Rows */}
        <div className="flex flex-col gap-2 mt-4 text-xs">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 font-medium">{item.label}</span>
              </div>
              <span className="text-slate-600 font-semibold">
                {item.count} NV ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
