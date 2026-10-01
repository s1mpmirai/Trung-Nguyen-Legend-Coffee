import React from "react";
import { mapPayrollStatus } from "../../../services/payrollService";

/**
 * MonthNavigator – Điều hướng qua lại tháng: "< Tháng 10 / 2023  Đã chốt >"
 */
function MonthNavigator({ month, year, status, onPrev, onNext }) {
  const statusInfo = mapPayrollStatus(status);

  return (
    <div className="pr-month-nav">
      <button className="pr-month-nav__btn" onClick={onPrev} type="button" aria-label="Tháng trước">
        <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
          <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="pr-month-nav__center">
        <span className="pr-month-nav__label">
          Tháng {month} / {year}
        </span>
        <span className={`pr-month-nav__status pr-month-nav__status--${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      <button className="pr-month-nav__btn" onClick={onNext} type="button" aria-label="Tháng sau">
        <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
          <path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

export default MonthNavigator;
