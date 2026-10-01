import React from "react";

/**
 * PeriodSelector – Tab chuyển đổi "Theo Tháng" / "Cả Năm YYYY".
 */
function PeriodSelector({ viewMode, onChangeMode, year }) {
  return (
    <div className="pr-period-selector">
      <button
        className={`pr-period-tab ${viewMode === "month" ? "pr-period-tab--active" : ""}`}
        onClick={() => onChangeMode("month")}
        type="button"
      >
        Theo Tháng
      </button>
      <button
        className={`pr-period-tab ${viewMode === "year" ? "pr-period-tab--active" : ""}`}
        onClick={() => onChangeMode("year")}
        type="button"
      >
        Cả Năm {year}
      </button>
    </div>
  );
}

export default PeriodSelector;
