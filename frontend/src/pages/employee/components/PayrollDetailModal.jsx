import React, { useState, useEffect } from "react";
import { formatMoney } from "../../../services/payrollService";

/**
 * PayrollDetailModal – Modal hiển thị chi tiết bảng kê & khấu trừ.
 *
 * Tích hợp icon con mắt để bật/tắt hiển thị số tiền trực tiếp trong bảng kê.
 */
function PayrollDetailModal({
  isOpen,
  payroll,
  isHidden: initialHidden = true,
  onToggleHidden,
  onClose,
}) {
  const [isAmountHidden, setIsAmountHidden] = useState(initialHidden);

  useEffect(() => {
    setIsAmountHidden(initialHidden);
  }, [initialHidden, isOpen]);

  if (!isOpen || !payroll) return null;

  const hidden = "•••••••";
  const fmt = (v) => (isAmountHidden ? hidden : `${formatMoney(v)} đ`);
  const fmtNeg = (v) => (isAmountHidden ? hidden : `-${formatMoney(v)} đ`);

  const toggleHidden = () => {
    const next = !isAmountHidden;
    setIsAmountHidden(next);
    if (onToggleHidden) onToggleHidden(next);
  };

  // Danh sách thu nhập
  const incomeItems = [
    { label: "Lương hợp đồng", value: payroll.luong_co_ban },
    { label: "Hệ số bậc lương", value: payroll.he_so_luong, isRaw: true },
    { label: "Lương theo công", value: payroll.luong_theo_cong },
    { label: `Tiền tăng ca (${payroll.so_gio_tang_ca || 0} giờ x 150%)`, value: payroll.tien_tang_ca },
    { label: "Phụ cấp chức vụ", value: payroll.tong_phu_cap },
    { label: "Tiền thưởng", value: payroll.tien_thuong },
    { label: "Tổng thu nhập (Gross)", value: payroll.luong_gross, isTotal: true },
  ];

  // Các bước tính lương để nhân viên tự đối chiếu
  const formulaSteps = [
    `Lương theo công = Lương hợp đồng / ${payroll.so_cong_chuan} công chuẩn x ${payroll.so_cong_thuc_te} công thực tế = ${fmt(payroll.luong_theo_cong)}`,
    `Tiền tăng ca = Lương hợp đồng / ${payroll.so_cong_chuan} / 8 giờ x ${payroll.so_gio_tang_ca || 0} giờ x 150% = ${fmt(payroll.tien_tang_ca)}`,
    `Gross = Lương theo công + Tăng ca + Phụ cấp + Thưởng = ${fmt(payroll.luong_gross)}`,
    "Bảo hiểm bắt buộc = 10.5% x (Lương hợp đồng + Phụ cấp chức vụ): BHXH 8%, BHYT 1.5%, BHTN 1%",
    `Giảm trừ gia cảnh = 15.500.000 (bản thân) + 6.200.000 x số người phụ thuộc = ${fmt(payroll.giam_tru_gia_canh)}`,
    `Thu nhập tính thuế = Gross - Bảo hiểm - Giảm trừ gia cảnh = ${fmt(payroll.thu_nhap_tinh_thue)}`,
    `Thuế TNCN tính theo biểu lũy tiến 5% – 35% = ${fmt(payroll.thue_tncn)}`,
    `Lương NET = Gross - Bảo hiểm - Thuế TNCN - Khấu trừ khác = ${fmt(payroll.luong_net)}`,
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
        {/* Header với icon con mắt bật/tắt số tiền */}
        <div className="pr-modal__header">
          <h3 className="pr-modal__title">
            Chi tiết bảng kê – T{payroll.thang}/{payroll.nam}
          </h3>

          <div className="pr-modal__header-actions">
            {/* Nút con mắt bật/tắt hiển thị số tiền */}
            <button
              className="pr-modal__eye-btn"
              type="button"
              onClick={toggleHidden}
              title={isAmountHidden ? "Nhấn để hiện số tiền" : "Nhấn để ẩn số tiền"}
              aria-label={isAmountHidden ? "Hiện số tiền" : "Ẩn số tiền"}
            >
              {isAmountHidden ? (
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                  <path
                    d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                  <path
                    d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6zM10 7v0a3 3 0 010 6v0a3 3 0 010-6zM3 3l14 14"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <span className="pr-modal__eye-text">
                {isAmountHidden ? "Hiện tiền" : "Ẩn tiền"}
              </span>
            </button>

            {/* Nút đóng modal */}
            <button
              className="pr-modal__close"
              onClick={onClose}
              type="button"
              aria-label="Đóng"
            >
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
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
                <strong
                  className={`${
                    item.isTotal
                      ? "pr-modal__total-value pr-modal__total-value--danger"
                      : "pr-modal__deduct-value"
                  }`}
                >
                  {fmtNeg(item.value)}
                </strong>
              </div>
            ))}
          </div>

          {/* Cách tính lương */}
          <div className="pr-modal__section">
            <h4 className="pr-modal__section-title">Cách tính lương</h4>
            <ol style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "12px", lineHeight: 1.6, color: "#475569" }}>
              {formulaSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
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
