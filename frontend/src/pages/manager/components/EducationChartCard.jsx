import React from "react";

const CIRCUMFERENCE = 2 * Math.PI * 38; // r = 38

export default function EducationChartCard({ educationData }) {
  const items = educationData || [];
  const totalEmployees = items.reduce((sum, item) => sum + item.count, 0);
  const topItem = items.reduce((best, item) => (!best || item.count > best.count ? item : best), null);

  // Mỗi nhóm trình độ là một cung tròn nối tiếp nhau trên donut
  let offset = 0;
  const arcs = items.map((item) => {
    const length = totalEmployees > 0 ? (item.count / totalEmployees) * CIRCUMFERENCE : 0;
    const arc = { ...item, length, offset };
    offset += length;
    return arc;
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-sm text-slate-900">
              Trình độ học vấn
            </h2>
            <p className="text-[11px] text-slate-400">Bằng cấp cao nhất của nhân sự đang làm việc</p>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {totalEmployees.toLocaleString("vi-VN")} NV
          </span>
        </div>

        {items.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">Chưa có dữ liệu trình độ</p>
        ) : (
          <>
            <div className="relative w-40 h-40 mx-auto my-3 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="transparent" r="38" stroke="#f1f5f9" strokeWidth="9" />
                {arcs.map((arc) => (
                  <circle
                    key={arc.label}
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="38"
                    stroke={arc.color}
                    strokeDasharray={`${arc.length.toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`}
                    strokeDashoffset={(-arc.offset).toFixed(1)}
                    strokeWidth="9"
                    className="transition-all duration-700"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 leading-tight">
                  {topItem ? `${Math.round(topItem.percentage)}%` : "—"}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">{topItem?.label}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4 text-xs">
              {items.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 hover:bg-slate-50 transition-colors">
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
          </>
        )}
      </div>
    </div>
  );
}
