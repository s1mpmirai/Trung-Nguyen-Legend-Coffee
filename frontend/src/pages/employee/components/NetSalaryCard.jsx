import React from "react";
import {
  formatMoney,
  mapPayrollStatus,
  calcNetRatio,
} from "../../../services/payrollService";

/**
 * NetSalaryCard – Card hiển thị lương thực nhận (NET),
 * tổng thu nhập, khấu trừ, thanh progress bar.
 *
 * Hỗ trợ 2 chế độ: viewMode="month" (chi tiết tháng) và "year" (tổng hợp năm).
 */
function NetSalaryCard({ payroll, isHidden, viewMode, yearSummary }) {
  // Chọn data theo chế độ xem
  const isYear = viewMode === "year";
  const gross = isYear ? yearSummary?.tong_gross || 0 : payroll.luong_gross;
  const net = isYear ? yearSummary?.tong_net || 0 : payroll.luong_net;
  const deduct = isYear ? yearSummary?.tong_khau_tru || 0 : payroll.tong_khau_tru;
  const status = isYear ? null : payroll.trang_thai;

  const statusInfo = status ? mapPayrollStatus(status) : null;
  const { netPct, deductPct } = calcNetRatio(gross, net);

  const hiddenText = "•••••••";

  return (
    <section className="pr-net-card">
      {/* ── Tiêu đề ──────────────────────────────────────────── */}
      <div className="pr-net-card__header">
        <span className="pr-net-card__label">
          {isYear ? "TỔNG THU NHẬP RÒNG CẢ NĂM" : "LƯƠNG THỰC NHẬN (NET SALARY)"}
        </span>
        {statusInfo && (
          <span className={`pr-net-card__badge pr-net-card__badge--${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* ── Số tiền lớn ──────────────────────────────────────── */}
      <div className="pr-net-card__amount">
        <span className="pr-net-card__number">
          {isHidden ? hiddenText : formatMoney(net)}
        </span>
        <span className="pr-net-card__currency">VNĐ</span>
      </div>

      {/* ── Tổng thu nhập & Khấu trừ ─────────────────────────── */}
      <div className="pr-net-card__breakdown">
        <div className="pr-net-card__item">
          <span className="pr-net-card__item-label">Tổng thu nhập:</span>
          <span className="pr-net-card__item-value">
            {isHidden ? hiddenText : `${formatMoney(gross)} đ`}
          </span>
        </div>
        <div className="pr-net-card__item pr-net-card__item--danger">
          <span className="pr-net-card__item-label">Khấu trừ:</span>
          <span className="pr-net-card__item-value">
            {isHidden ? hiddenText : `-${formatMoney(deduct)} đ`}
          </span>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────────── */}
      <div className="pr-net-card__progress-wrapper">
        <div className="pr-net-card__progress-bar">
          <div
            className="pr-net-card__progress-fill"
            style={{ width: `${netPct}%` }}
          />
        </div>
        <div className="pr-net-card__progress-labels">
          <span className="pr-net-card__pct pr-net-card__pct--net">
            Thực nhận đạt {netPct}%
          </span>
          <span className="pr-net-card__pct pr-net-card__pct--deduct">
            Thuế & Bảo hiểm {deductPct}%
          </span>
        </div>
      </div>
    </section>
  );
}

export default NetSalaryCard;
