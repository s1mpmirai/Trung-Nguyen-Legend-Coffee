import React from "react";
import { formatMoney } from "../../../services/payrollService";

/**
 * SalarySummaryBar – Thanh tổng hợp Gross + Khấu trừ + link xem chi tiết.
 */
function SalarySummaryBar({ payroll, isHidden, onViewDetail }) {
  const hidden = "•••••••";

  return (
    <section className="pr-summary-bar">
      <div className="pr-summary-bar__row">
        <span className="pr-summary-bar__item">
          Tổng Gross:{" "}
          <strong>{isHidden ? hidden : `${formatMoney(payroll.luong_gross)} đ`}</strong>
        </span>
        <span className="pr-summary-bar__item pr-summary-bar__item--danger">
          Khấu trừ:{" "}
          <strong>{isHidden ? hidden : `-${formatMoney(payroll.tong_khau_tru)} đ`}</strong>
        </span>
      </div>

      <button
        className="pr-detail-link"
        onClick={onViewDetail}
        type="button"
      >
        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
          <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Xem chi tiết bảng kê & khấu trừ
      </button>
    </section>
  );
}

export default SalarySummaryBar;
