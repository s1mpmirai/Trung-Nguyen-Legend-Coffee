import React from "react";
import { Calendar, ChevronDown } from "lucide-react";

/**
 * MonthNavigator – Bộ chọn kỳ lương (tháng/năm) của nhân viên.
 * - Năm hiện tại chỉ cho chọn đến tháng hiện tại (không xem tháng tương lai); năm trước đủ 12 tháng.
 * - Tháng đã có phiếu lương chính thức (đã duyệt / đã chi trả) được đánh dấu ✓.
 * - Không tự đổi tháng khi danh sách tháng chưa tải xong (tránh nhảy về Tháng 1 rồi hiển thị nhầm dữ liệu);
 *   khi đổi năm, tháng được giới hạn ngay trong handler.
 */
function MonthNavigator({
  month,
  year,
  onSelectMonth,
  availableMonths = [],
  startYear,
  disabled = false,
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const maxMonthOf = (y) => (y >= currentYear ? currentMonth : 12);

  // Danh sách năm: từ năm vào làm (hoặc năm sớm nhất có lương) đến năm hiện tại
  const dataYears = availableMonths.map((m) => Number(m.nam)).filter(Boolean);
  const minYear = Math.min(currentYear, year || currentYear, startYear || currentYear, ...dataYears);
  const years = [];
  for (let y = currentYear; y >= minYear; y--) years.push(y);

  const officialMonths = new Set(
    availableMonths
      .filter((m) => Number(m.nam) === Number(year) && (m.trang_thai === "DA_DUYET" || m.trang_thai === "DA_TRA"))
      .map((m) => Number(m.thang))
  );

  const months = [];
  for (let m = 1; m <= maxMonthOf(year); m++) months.push(m);

  const handleYearChange = (newYear) => {
    onSelectMonth(Math.min(month, maxMonthOf(newYear)), newYear);
  };

  const selectClass =
    "appearance-none bg-coffee-50 hover:bg-coffee-100 border border-coffee-200 text-coffee-900 font-bold text-sm rounded-xl pl-3.5 pr-8 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait";

  return (
    <div className="bg-white rounded-2xl border border-coffee-100 shadow-xs py-2.5 px-4 flex items-center justify-center w-full">
      <div className="flex items-center justify-center gap-2.5 flex-wrap">
        <div className="w-8 h-8 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center shrink-0" aria-hidden="true">
          <Calendar className="w-4 h-4" />
        </div>

        <div className="relative">
          <label htmlFor="payroll-month-select" className="sr-only">Chọn tháng lương</label>
          <select
            id="payroll-month-select"
            value={month}
            disabled={disabled}
            onChange={(e) => onSelectMonth(Number(e.target.value), year)}
            className={selectClass}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                Tháng {m}{officialMonths.has(m) ? " ✓" : ""}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-coffee-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="payroll-year-select" className="sr-only">Chọn năm lương</label>
          <select
            id="payroll-year-select"
            value={year}
            disabled={disabled}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className={selectClass}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-coffee-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthNavigator;
