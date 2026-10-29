import React from "react";
import { Users, CheckCircle2, ClockAlert, CreditCard, ArrowUpRight } from "lucide-react";
import CardErrorNotice from "./CardErrorNotice";

const CardError = ({ message }) => <CardErrorNotice message={message} compact />;

export default function StatMetricCards({ stats, errors = {}, onNavigateTab }) {
  const data = stats || {};
  const fmt = (value) => (value === null || value === undefined ? "—" : value);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. QUÂN SỐ NHÂN SỰ */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold tracking-wider text-slate-700 uppercase">
            QUÂN SỐ NHÂN SỰ
          </span>
          <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </span>
        </div>
        {errors.employees ? (
          <CardError message={errors.employees} />
        ) : (
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight">
                {fmt(data.totalEmployees)}
              </span>
              <span className="text-xs font-medium text-slate-500">nhân viên đang làm</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>{fmt(data.fullTimeCount)} Toàn thời gian</span>
              <span>{fmt(data.partTimeCount)} Bán thời gian</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. ĐIỂM DANH HÔM NAY */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold tracking-wider text-slate-700 uppercase">
            ĐIỂM DANH HÔM NAY
          </span>
          <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>
        {errors.attendanceToday ? (
          <CardError message={errors.attendanceToday} />
        ) : (
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl tracking-tight ${
                Number(data.attendanceRate) > 0 ? "text-emerald-600" : "text-slate-400"
              }`}>
                {data.attendanceRate ?? "0.0"}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {data.activeToday ?? 0} người có mặt
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span className="text-emerald-700 font-medium">{data.onTimeToday ?? 0} đúng giờ</span>
              <span className="text-amber-700 font-medium">{data.lateToday ?? 0} đi trễ</span>
              <span className="text-slate-400">{data.notCheckedIn ?? 0} vắng</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. VIỆC CẦN DUYỆT GẤP */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigateTab && onNavigateTab("leaves")}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && onNavigateTab) {
            e.preventDefault();
            onNavigateTab("leaves");
          }
        }}
        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold tracking-wider text-slate-700 uppercase group-hover:text-amber-700 transition-colors">
            VIỆC CẦN DUYỆT GẤP
          </span>
          <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <ClockAlert className="w-4 h-4" />
          </span>
        </div>
        {errors.leaves && errors.profileRequests ? (
          <CardError message={errors.leaves} />
        ) : (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-amber-600 tracking-tight">
                  {data.totalPendingCount ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">yêu cầu chờ xử lý</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-100">
              <span className="text-sky-700 font-medium">
                {errors.leaves ? "—" : data.pendingLeavesCount ?? 0} Đơn nghỉ phép
              </span>
              {data.pendingProfileCount === null || data.pendingProfileCount === undefined ? (
                <span className="text-slate-400" title={errors.profileRequests || undefined}>
                  — Sửa hồ sơ
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateTab && onNavigateTab("profile-requests");
                  }}
                  className="text-emerald-700 font-medium hover:underline cursor-pointer"
                >
                  {data.pendingProfileCount} Sửa hồ sơ
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. QUỸ LƯƠNG THÁNG */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigateTab && onNavigateTab("payroll")}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && onNavigateTab) {
            e.preventDefault();
            onNavigateTab("payroll");
          }
        }}
        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold tracking-wider text-slate-700 uppercase group-hover:text-sky-700 transition-colors">
            QUỸ LƯƠNG THÁNG
          </span>
          <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
            <CreditCard className="w-4 h-4" />
          </span>
        </div>
        {errors.payroll ? (
          <CardError message={errors.payroll} />
        ) : (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl text-slate-900 tracking-tight truncate max-w-[200px]">
                {data.monthlyPayroll || "—"}
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>{data.payrollPeriod || "—"}</span>
              <span className="font-medium text-slate-600">{data.payrollStatus || ""}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
