import React from "react";
import { formatMoney } from "../../../services/payrollService";

/**
 * PayrollDetailModal – Modal hiển thị chi tiết bảng kê & khấu trừ.
 *
 * Bao gồm:
 *  ▸ Thu nhập: Lương theo công, tăng ca, phụ cấp, thưởng
 *  ▸ Khấu trừ: BHXH, BHYT, BHTN, thuế TNCN, khấu trừ khác
 *  ▸ Thông tin công: Số công chuẩn, thực tế, giờ tăng ca
 */
function PayrollDetailModal({ isOpen, payroll, isHidden, onClose }) {
  if (!isOpen) return null;

  const hidden = "•••••••";
  const fmt = (v) => (isHidden ? hidden : `${formatMoney(v)} đ`);
  const fmtNeg = (v) => (isHidden ? hidden : `-${formatMoney(v)} đ`);

  // Danh sách thu nhập
  const incomeItems = [
    { label: "Lương cơ bản", value: payroll.luong_co_ban },
    { label: "Hệ số lương", value: payroll.he_so_luong, isRaw: true },
    { label: "Lương theo công", value: payroll.luong_theo_cong },
    { label: "Tiền tăng ca", value: payroll.tien_tang_ca },
    { label: "Tổng phụ cấp", value: payroll.tong_phu_cap },
    { label: "Tiền thưởng", value: payroll.tien_thuong },
    { label: "Tổng thu nhập (Gross)", value: payroll.luong_gross, isTotal: true },
  ];

  // Danh sách khấu trừ
  const deductItems = [
    { label: "BHXH (8%)", value: payroll.bhxh },
    { label: "BHYT (1.5%)", value: payroll.bhyt },
    { label: "BHTN (1%)", value: payroll.bhtn },
    { label: "Thuế TNCN", value: payroll.thue_tncn },
    { label: "Khấu trừ khác", value: payroll.khau_tru_khac },
    { label: "Tổng khấu trừ", value: payroll.tong_khau_tru, isTotal: true },
  ];

  return (
    <div className="pr-modal-overlay" onClick={onClose}>
      <div className="pr-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pr-modal__header">
          <h3 className="pr-modal__title">
            Chi tiết bảng kê – T{payroll.thang}/{payroll.nam}
          </h3>
          <button className="pr-modal__close" onClick={onClose} type="button">
            <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="pr-modal__body">
          {/* Thông tin công */}
          <div className="pr-modal__section">
            <h4 className="pr-modal__section-title">Thông tin ngày công</h4>
            <div className="pr-modal__row">
              <span>Số công chuẩn</span>
              <strong>{payroll.so_cong_chuan} ngày</strong>
            </div>
            <div className="pr-modal__row">
              <span>Số công thực tế</span>
              <strong>{payroll.so_cong_thuc_te} ngày</strong>
            </div>
            <div className="pr-modal__row">
              <span>Giờ tăng ca</span>
              <strong>{payroll.so_gio_tang_ca} giờ</strong>
            </div>
          </div>

          {/* Thu nhập */}
          <div className="pr-modal__section pr-modal__section--income">
            <h4 className="pr-modal__section-title">Thu nhập</h4>
            {incomeItems.map((item) => (
              <div
                key={item.label}
                className={`pr-modal__row ${item.isTotal ? "pr-modal__row--total" : ""}`}
              >
                <span>{item.label}</span>
                <strong className={item.isTotal ? "pr-modal__total-value" : ""}>
                  {item.isRaw ? item.value : fmt(item.value)}
                </strong>
              </div>
            ))}
          </div>

          {/* Khấu trừ */}
          <div className="pr-modal__section pr-modal__section--deduct">
            <h4 className="pr-modal__section-title">Khấu trừ</h4>
            {deductItems.map((item) => (
              <div
                key={item.label}
                className={`pr-modal__row ${item.isTotal ? "pr-modal__row--total" : ""}`}
              >
                <span>{item.label}</span>
                <strong className={`${item.isTotal ? "pr-modal__total-value pr-modal__total-value--danger" : "pr-modal__deduct-value"}`}>
                  {fmtNeg(item.value)}
                </strong>
              </div>
            ))}
          </div>

          {/* Lương NET */}
          <div className="pr-modal__section pr-modal__section--net">
            <div className="pr-modal__row pr-modal__row--net">
              <span>LƯƠNG THỰC NHẬN (NET)</span>
              <strong className="pr-modal__net-amount">{fmt(payroll.luong_net)}</strong>
            </div>
          </div>

          {/* Ghi chú */}
          {payroll.ghi_chu && (
            <div className="pr-modal__note">
              <strong>Ghi chú:</strong> {payroll.ghi_chu}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PayrollDetailModal;
