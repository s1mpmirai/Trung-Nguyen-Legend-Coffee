import React from "react";
import { ArrowRight } from "lucide-react";
import { formatMoney } from "../../../services/payrollService";
import { HIDDEN_AMOUNT } from "./NetSalaryCard";

/**
 * SalarySummaryBar – Thanh tổng hợp Gross + Khấu trừ + nút xem bảng kê chi tiết.
 * Chỉ hiển thị khi kỳ lương đã có phiếu lương chính thức.
 */
function SalarySummaryBar({ payroll, isHidden, onViewDetail }) {
  return (
    <section className="pr-summary-bar">
      <div className="pr-summary-bar__row">
        <span className="pr-summary-bar__item">
          Tổng Gross:{" "}
          <strong>{isHidden ? HIDDEN_AMOUNT : `${formatMoney(payroll?.luong_gross)} đ`}</strong>
        </span>
        <span className="pr-summary-bar__item pr-summary-bar__item--danger">
          Khấu trừ:{" "}
          <strong>{isHidden ? HIDDEN_AMOUNT : `-${formatMoney(payroll?.tong_khau_tru)} đ`}</strong>
        </span>
      </div>

      <button className="pr-detail-link" onClick={onViewDetail} type="button">
        <ArrowRight size={14} aria-hidden="true" />
        Xem bảng kê chi tiết & cách tính lương
      </button>
    </section>
  );
}

export default SalarySummaryBar;
