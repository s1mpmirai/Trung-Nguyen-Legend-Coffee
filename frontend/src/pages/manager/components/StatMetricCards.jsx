import React from "react";
import { Users, CheckCircle2, Umbrella, UserMinus, TrendingUp } from "lucide-react";

export default function StatMetricCards({ stats }) {
  const data = stats || {
    totalEmployees: 1280,
    newThisMonth: 14,
    targetEmployees: 1350,
    targetRate: 94.8,
    activeToday: 1215,
    activeRate: 94.9,
    onTimeRate: 98.2,
    leavesTotal: 42,
    annualLeaves: 38,
    sickLeaves: 4,
    turnoverCount: 23,
    turnoverRate: 1.8,
    turnoverStatus: "Tốt",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Tổng nhân sự */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">Tổng nhân sự</span>
          <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight">
              {data.totalEmployees?.toLocaleString("vi-VN") || "1,280"}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +{data.newThisMonth || 14} tháng này
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Chỉ tiêu: {data.targetEmployees || 1350} NV</span>
            <span className="font-medium text-slate-600">Đạt {data.targetRate || 94.8}%</span>
          </div>
        </div>
      </div>

      {/* Card 2: Đi làm hôm nay */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">Tỷ lệ đi làm hôm nay</span>
          <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-emerald-600 tracking-tight">
              {data.activeRate || 94.9}%
            </span>
            <span className="text-xs text-slate-500 font-medium">{data.activeToday?.toLocaleString("vi-VN") || "1,215"} người</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Điểm danh đúng giờ</span>
            <span className="font-medium text-emerald-600">{data.onTimeRate || 98.2}%</span>
          </div>
        </div>
      </div>

      {/* Card 3: Nghỉ phép / Vắng mặt */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">Nghỉ phép & Vắng mặt</span>
          <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Umbrella className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight">
              {data.leavesTotal || 42}
            </span>
            <span className="text-xs text-slate-500 font-medium">trường hợp</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-medium">{data.annualLeaves || 38} Phép năm</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">{data.sickLeaves || 4} Nghỉ ốm</span>
          </div>
        </div>
      </div>

      {/* Card 4: Tỷ lệ thôi việc */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">Tỷ lệ thôi việc tháng</span>
          <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserMinus className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight">
              {data.turnoverRate || 1.8}%
            </span>
            <span className="text-xs text-slate-500 font-medium">{data.turnoverCount || 23} nhân sự</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Ngưỡng an toàn (&lt; 2.5%)</span>
            <span className="font-medium text-emerald-600">{data.turnoverStatus || "Tốt"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
