import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function PayrollDepartmentCard({ payrollData }) {
  const data = payrollData || { totalCost: "—", averageSalary: "—", salaryRange: "—", brackets: [], departments: [] };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-sm text-slate-900">
              Mức lương theo phòng ban
            </h2>
            <p className="text-[11px] text-slate-400">Lương hợp đồng hiện hành / tháng</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-[11px] font-bold">
            Tổng: {data.totalCost}
          </span>
        </div>

        {/* Phân bố nhân sự theo khung lương */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {data.brackets.map((b) => (
            <div key={b.nhom} className="rounded-lg bg-slate-50 px-1.5 py-1 text-center">
              <div className="text-xs font-bold text-slate-800">{b.so_luong}</div>
              <div className="text-[10px] text-slate-400 leading-tight">{b.nhom}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          {data.departments.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-400">Chưa có dữ liệu lương</p>
          )}
          {data.departments.map((dept, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 transition-colors flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-800">{dept.name}</span>
                <span className="text-[11px] text-slate-400">
                  {dept.employees} NV • {dept.totalBudget}
                </span>
              </div>
              <span className="text-xs font-bold text-sky-600 bg-white px-2 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                {dept.avgSalary}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
        <span>Lương TB: <strong className="text-slate-700">{data.averageSalary}</strong></span>
        <span className="text-slate-600 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {data.salaryRange}
        </span>
      </div>
    </div>
  );
}
