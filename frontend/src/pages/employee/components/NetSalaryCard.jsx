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
 * Nếu tháng chưa có dữ liệu lương -> hiển thị "Đang cập nhật".
 */
function NetSalaryCard({ payroll, isHidden, onToggleHide, viewMode, yearSummary, month, year }) {
  const isYear = viewMode === "year";
  const hasData = isYear ? Boolean(yearSummary) : Boolean(payroll && payroll.hasData);

  const gross = isYear ? yearSummary?.tong_gross || 0 : payroll?.luong_gross || 0;
  const net = isYear ? yearSummary?.tong_net || 0 : payroll?.luong_net || 0;
  const deduct = isYear ? yearSummary?.tong_khau_tru || 0 : payroll?.tong_khau_tru || 0;
  const status = isYear ? null : (hasData ? payroll?.trang_thai : null);

  const statusInfo = mapPayrollStatus(status);
  const { netPct, deductPct } = calcNetRatio(gross, net);

  const hiddenText = "•••••••";

  return (
    <section className="pr-net-card">
      {/* ── Tiêu đề ──────────────────────────────────────────── */}
      <div className="pr-net-card__header">
        <span className="pr-net-card__label">
          {isYear ? "TỔNG THU NHẬP RÒNG CẢ NĂM" : "LƯƠNG THỰC NHẬN (NET SALARY)"}
        </span>
        <span className={`pr-net-card__badge pr-net-card__badge--${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* ── Số tiền lớn hoặc 'Đang cập nhật' ──────────────────── */}
      {hasData ? (
        <div className="pr-net-card__amount">
          <span className="pr-net-card__number">
            {isHidden ? hiddenText : formatMoney(net)}
          </span>
          <span className="pr-net-card__currency">VNĐ</span>
          {onToggleHide && (
            <button
              className="pr-net-card__eye-btn"
              onClick={onToggleHide}
              type="button"
              title={isHidden ? "Hiện số tiền" : "Ẩn số tiền"}
              aria-label={isHidden ? "Hiện số tiền" : "Ẩn số tiền"}
            >
              {isHidden ? (
                <svg viewBox="0 0 20 20" fill="none" width="17" height="17">
                  <path
                    d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6zM10 7v0a3 3 0 010 6v0a3 3 0 010-6zM3 3l14 14"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" width="17" height="17">
                  <path
                    d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="pr-net-card__amount pr-net-card__amount--pending">
          <span className="pr-net-card__number pr-net-card__number--pending">
            Đang cập nhật
          </span>
        </div>
      )}

      {/* ── Tổng thu nhập & Khấu trừ ─────────────────────────── */}
      <div className="pr-net-card__breakdown">
        <div className="pr-net-card__item">
          <span className="pr-net-card__item-label">Tổng thu nhập:</span>
          <span className="pr-net-card__item-value">
            {hasData
              ? (isHidden ? hiddenText : `${formatMoney(gross)} đ`)
              : "Đang cập nhật"}
          </span>
        </div>
        <div className="pr-net-card__item pr-net-card__item--danger">
          <span className="pr-net-card__item-label">Khấu trừ:</span>
          <span className="pr-net-card__item-value">
            {hasData
              ? (isHidden ? hiddenText : `-${formatMoney(deduct)} đ`)
              : "Đang cập nhật"}
          </span>
        </div>
      </div>

      {/* ── Progress bar hoặc thông báo chờ ───────────────────── */}
      {hasData ? (
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
      ) : (
        <div className="pr-net-card__notice">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14" className="inline-block mr-1 opacity-80">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 4.5V8.5L10.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Dữ liệu bảng lương {isYear ? `năm ${year}` : `tháng ${month}/${year}`} đang được phòng Nhân sự & Kế toán cập nhật
        </div>
      )}
    </section>
  );
}

export default NetSalaryCard;
