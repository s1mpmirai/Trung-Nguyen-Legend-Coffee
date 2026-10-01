import React, { useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";

/**
 * MonthNavigator – Bộ chọn tháng/năm trực tiếp cho nhân viên:
 * - Canh giữa khung, thiết kế tinh tế và gọn gàng
 * - Giới hạn danh sách tháng theo nguyên tắc dữ liệu:
 *   Ví dụ: Nếu trong năm đã có lương chốt đến Tháng 8, danh sách tháng chỉ hiện đến Tháng 9
 *   (Tháng 9 sẽ hiển thị "Đang cập nhật"), còn Tháng 10, 11, 12 được ẩn đi.
 *   Khi nào Tháng 9 được chốt thì Tháng 10 mới tự động xuất hiện.
 */
function MonthNavigator({
  month,
  year,
  onSelectMonth,
  availableMonths = [],
  startYear = 2024,
}) {
  const currentYear = new Date().getFullYear();
  const maxYear = Math.max(currentYear, year || currentYear);
  const minYear = Math.min(startYear, maxYear - 2);

  const years = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  // 1. Tìm tháng đã có bảng lương chốt (DA_DUYET hoặc DA_TRA) trong năm đang chọn
  const confirmedMonthsInYear = availableMonths
    .filter(
      (item) =>
        item.nam === year &&
        (item.trang_thai === "DA_DUYET" || item.trang_thai === "DA_TRA")
    )
    .map((item) => Number(item.thang));

  const maxConfirmedMonth =
    confirmedMonthsInYear.length > 0 ? Math.max(...confirmedMonthsInYear) : 0;

  // 2. Tính tháng tối đa được phép hiển thị trong dropdown:
  // Tháng đã có lương + 1 (để người dùng có thể xem tháng kế tiếp đang cập nhật)
  // Các tháng tương lai xa hơn sẽ được ẩn đi.
  let maxSelectableMonth = 12;
  if (year >= currentYear) {
    // Năm hiện tại / tương lai: chỉ mở tối đa đến tháng chốt gần nhất + 1
    maxSelectableMonth = Math.min(12, Math.max(1, maxConfirmedMonth + 1));
  } else {
    // Năm quá khứ: nếu đã chốt đến tháng nào thì mở đến tháng đó + 1, hoặc đủ 12 tháng nếu đã chốt hết
    maxSelectableMonth =
      maxConfirmedMonth > 0 ? Math.min(12, maxConfirmedMonth + 1) : 12;
  }

  // Tạo danh sách tháng từ Tháng 1 đến maxSelectableMonth
  const months = [];
  for (let m = 1; m <= maxSelectableMonth; m++) {
    months.push(m);
  }

  // Nếu tháng hiện tại đang chọn vượt quá giới hạn tháng của năm đó, tự động lùi về maxSelectableMonth
  useEffect(() => {
    if (month > maxSelectableMonth) {
      onSelectMonth(maxSelectableMonth, year);
    }
  }, [month, maxSelectableMonth, year, onSelectMonth]);

  const handleYearChange = (newYear) => {
    onSelectMonth(month, newYear);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs py-2.5 px-4 flex items-center justify-center w-full">
      {/* ── Bộ chọn Tháng & Năm trực tiếp - Canh giữa khung ──────── */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap">
        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Calendar className="w-4 h-4" />
        </div>

        {/* Dropdown chọn Tháng (chỉ hiển thị đến tháng chốt + 1) */}
        <div className="relative">
          <select
            id="payroll-month-select"
            value={month}
            onChange={(e) => onSelectMonth(Number(e.target.value), year)}
            className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer transition-colors shadow-2xs text-center"
            aria-label="Chọn tháng lương"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Dropdown chọn Năm */}
        <div className="relative">
          <select
            id="payroll-year-select"
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer transition-colors shadow-2xs text-center"
            aria-label="Chọn năm lương"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthNavigator;
