import React, { useEffect, useMemo, useState } from "react";
import { X, Printer, CalendarDays, CalendarRange, Loader2 } from "lucide-react";

/**
 * PrintSelectModal – Hộp thoại chọn in phiếu lương tháng đang xem hoặc bảng tổng hợp cả năm.
 * Danh sách năm lấy từ các kỳ lương THỰC TẾ đã duyệt (availableMonths) và được làm mới mỗi lần mở.
 * Chọn năm để in KHÔNG làm thay đổi năm đang xem trên màn hình.
 */
function PrintSelectModal({
  isOpen,
  month,
  year,
  availableMonths = [],
  hasMonthData,
  isPreparing = false,
  onClose,
  onPrintMonth,
  onPrintYear,
}) {
  // Các năm có ít nhất 1 bảng lương đã duyệt / đã chi trả (giảm dần)
  const yearsList = useMemo(() => {
    const set = new Set(
      availableMonths
        .filter((m) => m.trang_thai === "DA_DUYET" || m.trang_thai === "DA_TRA")
        .map((m) => Number(m.nam))
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) => b - a);
  }, [availableMonths]);

  const [selectedPrintYear, setSelectedPrintYear] = useState(year);

  // Mỗi lần mở: mặc định năm đang xem nếu năm đó có dữ liệu, ngược lại năm gần nhất có dữ liệu
  useEffect(() => {
    if (!isOpen) return;
    setSelectedPrintYear(yearsList.includes(year) ? year : (yearsList[0] ?? year));
  }, [isOpen, year, yearsList]);

  // Esc để đóng
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const monthsInSelectedYear = availableMonths.filter(
    (m) => Number(m.nam) === Number(selectedPrintYear) && (m.trang_thai === "DA_DUYET" || m.trang_thai === "DA_TRA")
  ).length;

  return (
    <div className="pr-modal-overlay" onClick={onClose}>
      <div
        className="pr-modal pr-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pr-print-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pr-modal__header">
          <div>
            <h3 id="pr-print-title" className="pr-modal__title">In phiếu lương & thu nhập</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn chứng từ cần in hoặc lưu PDF (khổ A4)
            </p>
          </div>
          <button className="pr-modal__close" onClick={onClose} type="button" aria-label="Đóng">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Tùy chọn 1: In phiếu lương tháng đang xem */}
          <div className="border border-coffee-100 rounded-xl p-3.5 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-coffee-50 text-coffee-700 flex items-center justify-center shrink-0">
                <CalendarDays size={20} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">Phiếu lương tháng {month}/{year}</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Chi tiết thu nhập (Gross), phụ cấp, bảo hiểm, thuế TNCN và lương thực lĩnh (NET) của tháng.
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className={`text-[11px] font-semibold ${hasMonthData ? "text-emerald-700" : "text-amber-800"}`}>
                {hasMonthData ? "Đã có phiếu lương" : "Chưa có phiếu lương đã duyệt"}
              </span>
              <button
                type="button"
                disabled={!hasMonthData || isPreparing}
                onClick={() => {
                  onPrintMonth();
                  onClose();
                }}
                className="min-h-[40px] px-3.5 bg-coffee-600 hover:bg-coffee-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Printer size={14} aria-hidden="true" />
                In phiếu tháng
              </button>
            </div>
          </div>

          {/* Tùy chọn 2: In bảng tổng hợp năm */}
          <div className="border border-coffee-100 rounded-xl p-3.5 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center shrink-0">
                <CalendarRange size={20} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">Bảng tổng hợp thu nhập cả năm</h4>
                  {yearsList.length > 0 && (
                    <label className="flex items-center gap-1.5 bg-coffee-50 border border-coffee-100 rounded-lg px-2 min-h-[36px]">
                      <span className="text-[11px] font-medium text-slate-600">Năm:</span>
                      <select
                        value={selectedPrintYear}
                        onChange={(e) => setSelectedPrintYear(Number(e.target.value))}
                        className="text-xs font-bold text-coffee-800 bg-transparent border-none outline-none cursor-pointer"
                      >
                        {yearsList.map((y) => (
                          <option key={y} value={y}>
                            Năm {y}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bảng kê các tháng có lương, tổng Gross, bảo hiểm, thuế TNCN đã khấu trừ và NET cả năm – dùng để đối chiếu, quyết toán thuế.
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">
                {yearsList.length > 0
                  ? `${monthsInSelectedYear} tháng có phiếu lương trong năm ${selectedPrintYear}`
                  : "Chưa có dữ liệu"}
              </span>
              <button
                type="button"
                disabled={yearsList.length === 0 || isPreparing}
                onClick={() => {
                  onPrintYear(selectedPrintYear);
                  onClose();
                }}
                className="min-h-[40px] px-3.5 bg-gold-700 hover:bg-coffee-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isPreparing ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Printer size={14} aria-hidden="true" />}
                In bảng năm {yearsList.length > 0 ? selectedPrintYear : ""}
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-coffee-50 border-t border-coffee-100 rounded-b-2xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrintSelectModal;
