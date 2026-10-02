import React, { useState } from "react";

/**
 * PrintSelectModal – Hộp thoại popup lựa chọn in phiếu lương theo tháng hoặc theo năm.
 * Hỗ trợ chọn năm cụ thể từ danh sách các năm đã làm việc của nhân viên.
 */
function PrintSelectModal({
  isOpen,
  month,
  year,
  startYear = 2010,
  hasMonthData,
  onClose,
  onPrintMonth,
  onPrintYear,
}) {
  const currentYear = new Date().getFullYear();
  const [selectedPrintYear, setSelectedPrintYear] = useState(year || currentYear);

  if (!isOpen) return null;

  // Tạo danh sách các năm đã làm việc (từ startYear đến năm hiện tại) theo thứ tự giảm dần
  const effectiveStartYear = Math.min(Number(startYear) || 2024, currentYear);
  const yearsList = [];
  for (let y = currentYear; y >= effectiveStartYear; y--) {
    yearsList.push(y);
  }

  return (
    <div className="pr-modal-overlay" onClick={onClose}>
      <div
        className="pr-modal"
        style={{ maxWidth: "480px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pr-modal__header">
          <div>
            <h3 className="pr-modal__title">In phiếu lương & Thu nhập</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn loại chứng từ bảng lương bạn muốn in hoặc xuất PDF
            </p>
          </div>
          <button className="pr-modal__close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* Danh sách 2 tùy chọn in */}
        <div className="p-4 space-y-3.5">
          {/* Tùy chọn 1: In theo tháng */}
          <div
            className="border border-slate-200 hover:border-sky-500 rounded-xl p-3.5 bg-white hover:bg-sky-50/30 transition-all shadow-sm group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-700">
                  Phiếu lương Tháng {month}/{year}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Chi tiết bảng kê thu nhập Gross, phụ cấp, tăng ca, bảo hiểm và lương thực lĩnh (Net) của tháng.
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold ${
                  hasMonthData ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {hasMonthData ? "✓ Đã có dữ liệu lương" : "⏳ Đang cập nhật"}
              </span>
              <button
                type="button"
                onClick={() => {
                  onPrintMonth();
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <rect x="6" y="2" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="4" y="8" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 14h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                In phiếu tháng
              </button>
            </div>
          </div>

          {/* Tùy chọn 2: In theo năm (Có dropdown chọn năm đã làm việc) */}
          <div
            className="border border-slate-200 hover:border-indigo-500 rounded-xl p-3.5 bg-white hover:bg-indigo-50/30 transition-all shadow-sm group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">
                    Bảng tổng hợp thu nhập cả năm
                  </h4>
                  {/* Dropdown chọn năm */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                    <span className="text-[11px] font-medium text-slate-500">Năm:</span>
                    <select
                      value={selectedPrintYear}
                      onChange={(e) => setSelectedPrintYear(Number(e.target.value))}
                      className="text-xs font-bold text-indigo-700 bg-transparent border-none outline-none cursor-pointer"
                    >
                      {yearsList.map((y) => (
                        <option key={y} value={y}>
                          Năm {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bảng kê 12 tháng công tác, tổng Gross, các khoản bảo hiểm, quyết toán thuế TNCN và Net cả năm {selectedPrintYear}.
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                Lịch sử từ năm {effectiveStartYear} đến {currentYear}
              </span>
              <button
                type="button"
                onClick={() => {
                  onPrintYear(selectedPrintYear);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <rect x="6" y="2" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="4" y="8" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 14h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                In bảng năm {selectedPrintYear}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 rounded-b-2xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrintSelectModal;
