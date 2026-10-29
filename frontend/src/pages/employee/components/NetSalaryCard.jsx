import React from "react";
import { Eye, EyeOff, Hourglass, AlertCircle, RefreshCw } from "lucide-react";
import {
  formatMoney,
  mapPayrollStatus,
  calcNetRatio,
} from "../../../services/payrollService";

export const HIDDEN_AMOUNT = "•••••••";

/**
 * AmountToggleButton – Nút ẩn/hiện số tiền dùng chung (thẻ lương & bảng kê chi tiết).
 * Quy ước thống nhất: biểu tượng thể hiện HÀNH ĐỘNG khi bấm
 *   - Đang ẩn  -> hiện icon con mắt (Eye)      + "Hiện số tiền"
 *   - Đang hiện -> hiện icon gạch mắt (EyeOff) + "Ẩn số tiền"
 */
export function AmountToggleButton({ isHidden, onToggle, className = "", showText = false }) {
  const label = isHidden ? "Hiện số tiền" : "Ẩn số tiền";
  const Icon = isHidden ? Eye : EyeOff;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={className}
      title={label}
      aria-label={label}
      aria-pressed={!isHidden}
    >
      <Icon size={16} aria-hidden="true" />
      {showText && <span className="pr-eye-text">{isHidden ? "Hiện tiền" : "Ẩn tiền"}</span>}
    </button>
  );
}

/**
 * NetSalaryCard – Card lương thực nhận (NET) của kỳ đang chọn.
 * status:
 *   - "loading": đang tải -> khung xương (skeleton)
 *   - "error":   lỗi tải  -> thông báo lỗi + nút Thử lại
 *   - "empty":   API trả null (bảng lương chưa duyệt / chưa tính) -> "đang chờ phòng Nhân sự duyệt"
 *   - "ready":   có phiếu lương chính thức
 */
function NetSalaryCard({ status, payroll, errorMessage, onRetry, isHidden, onToggleHide, month, year }) {
  if (status === "loading") {
    return (
      <section className="pr-net-card" aria-busy="true" aria-label="Đang tải bảng lương">
        <div className="animate-pulse space-y-4" role="status">
          <div className="flex items-center justify-between">
            <div className="h-3 w-32 rounded bg-white/20" />
            <div className="h-5 w-20 rounded-full bg-white/20" />
          </div>
          <div className="h-9 w-48 rounded-lg bg-white/25" />
          <div className="flex gap-6">
            <div className="h-8 w-24 rounded bg-white/15" />
            <div className="h-8 w-24 rounded bg-white/15" />
          </div>
          <div className="h-2 w-full rounded-full bg-white/15" />
          <span className="sr-only">Đang tải bảng lương tháng {month}/{year}...</span>
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="pr-net-card pr-net-card--muted" role="alert">
        <div className="pr-net-card__header">
          <span className="pr-net-card__label">Lương thực nhận – Tháng {month}/{year}</span>
        </div>
        <div className="pr-net-card__state">
          <AlertCircle size={22} aria-hidden="true" />
          <div>
            <p className="pr-net-card__state-title">Không tải được bảng lương</p>
            <p className="pr-net-card__state-text">{errorMessage || "Vui lòng kiểm tra kết nối và thử lại."}</p>
          </div>
        </div>
        {onRetry && (
          <button type="button" className="pr-net-card__retry" onClick={onRetry}>
            <RefreshCw size={14} aria-hidden="true" />
            Thử lại
          </button>
        )}
      </section>
    );
  }

  if (status !== "ready" || !payroll) {
    return (
      <section className="pr-net-card pr-net-card--muted">
        <div className="pr-net-card__header">
          <span className="pr-net-card__label">Lương thực nhận – Tháng {month}/{year}</span>
          <span className="pr-net-card__badge pr-net-card__badge--warning">Chờ duyệt</span>
        </div>
        <div className="pr-net-card__state">
          <Hourglass size={22} aria-hidden="true" />
          <div>
            <p className="pr-net-card__state-title">Bảng lương tháng này đang chờ phòng Nhân sự duyệt</p>
            <p className="pr-net-card__state-text">
              Phiếu lương tháng {month}/{year} sẽ hiển thị tại đây sau khi được duyệt.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const gross = payroll.luong_gross || 0;
  const net = payroll.luong_net || 0;
  const deduct = payroll.tong_khau_tru || 0;
  const statusInfo = mapPayrollStatus(payroll.trang_thai);
  const { netPct, deductPct } = calcNetRatio(gross, net);

  return (
    <section className="pr-net-card" aria-label={`Lương thực nhận tháng ${month}/${year}`}>
      <div className="pr-net-card__header">
        <span className="pr-net-card__label">Lương thực nhận – Tháng {month}/{year}</span>
        <span className={`pr-net-card__badge pr-net-card__badge--${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="pr-net-card__amount">
        <span className="pr-net-card__number">{isHidden ? HIDDEN_AMOUNT : formatMoney(net)}</span>
        <span className="pr-net-card__currency">VNĐ</span>
        {onToggleHide && (
          <AmountToggleButton isHidden={isHidden} onToggle={onToggleHide} className="pr-net-card__eye-btn" />
        )}
      </div>

      <div className="pr-net-card__breakdown">
        <div className="pr-net-card__item">
          <span className="pr-net-card__item-label">Tổng thu nhập</span>
          <span className="pr-net-card__item-value">{isHidden ? HIDDEN_AMOUNT : `${formatMoney(gross)} đ`}</span>
        </div>
        <div className="pr-net-card__item pr-net-card__item--danger">
          <span className="pr-net-card__item-label">Khấu trừ</span>
          <span className="pr-net-card__item-value">{isHidden ? HIDDEN_AMOUNT : `-${formatMoney(deduct)} đ`}</span>
        </div>
      </div>

      <div className="pr-net-card__progress-wrapper">
        <div className="pr-net-card__progress-bar" aria-hidden="true">
          <div className="pr-net-card__progress-fill" style={{ width: `${netPct}%` }} />
        </div>
        <div className="pr-net-card__progress-labels">
          <span className="pr-net-card__pct pr-net-card__pct--net">Thực nhận {netPct}%</span>
          <span className="pr-net-card__pct pr-net-card__pct--deduct">Thuế & bảo hiểm {deductPct}%</span>
        </div>
      </div>
    </section>
  );
}

export default NetSalaryCard;
