import React, { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export default function RecentPersonnelTable({ data }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 8;

  const records = data || [
    {
      id: "NV1281",
      name: "Lê Hoàng Nam",
      initials: "LH",
      role: "Chuyên viên R&D Hương vị Cà phê",
      dept: "Viện Nghiên cứu Cà phê TN",
      effectiveDate: "15/10/2026",
      type: "Mới gia nhập",
      typeColor: "mint",
    },
    {
      id: "NV1280",
      name: "Phan Thị Mỹ Hạnh",
      initials: "PT",
      role: "Quản lý Cửa hàng Legend",
      dept: "Chuỗi Cà phê Legend Đồng Khởi",
      effectiveDate: "12/10/2026",
      type: "Mới gia nhập",
      typeColor: "mint",
    },
    {
      id: "NV0842",
      name: "Nguyễn Minh Quân",
      initials: "NM",
      role: "Trưởng phòng Chuỗi Cung ứng & Logistics",
      dept: "Khối Tiếp vận Toàn cầu",
      effectiveDate: "08/10/2026",
      type: "Điều chuyển",
      typeColor: "brand",
    },
    {
      id: "NV0911",
      name: "Võ Thành Luân",
      initials: "VT",
      role: "Kỹ sư Vận hành Máy rang xay",
      dept: "Nhà máy Chế biến Cà phê Buôn Ma Thuột",
      effectiveDate: "05/10/2026",
      type: "Nghỉ việc",
      typeColor: "rose",
    },
    {
      id: "NV1105",
      name: "Đỗ Thị Kim Oanh",
      initials: "DT",
      role: "Barista Cao cấp",
      dept: "Chi nhánh Legend Cầu Giấy (Hà Nội)",
      effectiveDate: "03/10/2026",
      type: "Nghỉ việc",
      typeColor: "rose",
    },
  ];

  const getBadgeStyle = (typeColor) => {
    switch (typeColor) {
      case "mint":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "brand":
        return "bg-sky-50 text-sky-700 border-sky-200/50";
      case "rose":
        return "bg-rose-50 text-rose-600 border-rose-200/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-sm text-slate-900">
            Biến động nhân sự gần đây
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Tiếp nhận mới, luân chuyển và thôi việc trong tháng</p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-medium">
              <th className="py-3 px-3">Nhân viên</th>
              <th className="py-3 px-3">Chức danh & Phòng ban</th>
              <th className="py-3 px-3">Ngày hiệu lực</th>
              <th className="py-3 px-3 text-right">Phân loại</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[11px] flex items-center justify-center border border-slate-200/60">
                      {row.initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">{row.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{row.id}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-col">
                    <span className="text-slate-700 font-medium">{row.role}</span>
                    <span className="text-[11px] text-slate-400">{row.dept}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-500 font-medium">{row.effectiveDate}</td>
                <td className="py-3 px-3 text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeStyle(
                      row.typeColor
                    )}`}
                  >
                    {row.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
        <span>Hiển thị 5 bản ghi mới nhất</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-700 font-semibold px-1">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
