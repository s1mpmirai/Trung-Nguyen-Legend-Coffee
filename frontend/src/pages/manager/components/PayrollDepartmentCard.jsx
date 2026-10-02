import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function PayrollDepartmentCard({ payrollData }) {
  const data = payrollData || {
    totalCost: "20.8 tỷ",
    status: "Trong ngân sách",
    departments: [
      { name: "Chuỗi Không Gian Cà Phê", employees: 610, totalBudget: "6.8 tỷ", avgSalary: "11.8 tr/tháng" },
      { name: "Nhà máy Buôn Ma Thuột", employees: 360, totalBudget: "5.2 tỷ", avgSalary: "14.5 tr/tháng" },
      { name: "Marketing & Thị trường", employees: 152, totalBudget: "3.4 tỷ", avgSalary: "22.4 tr/tháng" },
      { name: "R&D Hương vị Cà phê", employees: 65, totalBudget: "1.8 tỷ", avgSalary: "28.0 tr/tháng" },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-sm text-slate-900">
              Quỹ lương theo khối
            </h2>
            <p className="text-[11px] text-slate-400">Phân bổ ngân sách nhân sự</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-[11px] font-bold">
            Tổng: {data.totalCost}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
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
        <span>Định mức chi phí: Chuẩn</span>
        <span className="text-emerald-600 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {data.status}
        </span>
      </div>
    </div>
  );
}
