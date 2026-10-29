import React, { useEffect } from "react";
import { X } from "lucide-react";
import { formatMoney, isProbationPayroll } from "../../../services/payrollService";
import { formatDays } from "../utils/format";
import { AmountToggleButton, HIDDEN_AMOUNT } from "./NetSalaryCard";
import PayrollFormulaSteps from "./PayrollFormulaSteps";

/**
 * PayrollDetailModal – Modal bảng kê thu nhập, khấu trừ và cách tính lương.
 * Trạng thái ẩn/hiện số tiền do trang cha quản lý (đồng bộ với thẻ lương NET).
 */
function PayrollDetailModal({ isOpen, payroll, isHidden, onToggleHidden, onClose }) {
  // Đóng bằng phím Esc
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !payroll) return null;

  const fmt = (v) => (isHidden ? HIDDEN_AMOUNT : `${formatMoney(v)} đ`);
  const fmtNeg = (v) => (isHidden ? HIDDEN_AMOUNT : `-${formatMoney(v)} đ`);
  const probation = isProbationPayroll(payroll);

  // Danh sách thu nhập
  const incomeItems = [
    { label: `Lương hợp đồng${probation ? " (hưởng 85% khi thử việc)" : ""}`, value: payroll.luong_co_ban, isRef: true },
    { label: "Lương theo công", value: payroll.luong_theo_cong },
    { label: "Phụ cấp chức vụ", value: payroll.tong_phu_cap },
    { label: "Tiền thưởng", value: payroll.tien_thuong },
    { label: "Tổng thu nhập (Gross)", value: payroll.luong_gross, isTotal: true },
  ];

  // Danh sách khấu trừ
  const deductItems = [
    { label: "BHXH (8%)", value: payroll.bhxh },
    { label: "BHYT (1,5%)", value: payroll.bhyt },
    { label: "BHTN (1%)", value: payroll.bhtn },
    { label: probation ? "Thuế TNCN (khấu trừ 10%)" : "Thuế TNCN", value: payroll.thue_tncn },
    ...(Number(payroll.khau_tru_khac) > 0 ? [{ label: "Khấu trừ khác", value: payroll.khau_tru_khac }] : []),
    { label: "Tổng khấu trừ", value: payroll.tong_khau_tru, isTotal: true },
  ];

  return (
    <div className="pr-modal-overlay" onClick={onClose}>
      <div
        className="pr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pr-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pr-modal__header">
          <h3 id="pr-detail-title" className="pr-modal__title">
            Bảng kê lương tháng {payroll.thang}/{payroll.nam}
          </h3>

          <div className="pr-modal__header-actions">
            <AmountToggleButton
              isHidden={isHidden}
              onToggle={onToggleHidden}
              className="pr-modal__eye-btn"
              showText
            />
            <button className="pr-modal__close" onClick={onClose} type="button" aria-label="Đóng">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="pr-modal__body">
          {/* Thông tin công & nhân sự */}
          <div className="pr-modal__section">
            <h4 className="pr-modal__section-title">Thông tin kỳ lương</h4>
            <div className="pr-modal__row">
              <span>Công thực tế / công chuẩn</span>
              <strong>{formatDays(payroll.so_cong_thuc_te)} / {formatDays(payroll.so_cong_chuan)} ngày</strong>
            </div>
            <div className="pr-modal__row">
              <span>Số người phụ thuộc</span>
              <strong>{payroll.so_nguoi_pt ?? "Chưa có dữ liệu"}</strong>
            </div>
            {probation && (
              <div className="pr-modal__row">
                <span>Loại hợp đồng</span>
                <strong>Thử việc</strong>
              </div>
            )}
          </div>

          <div className="pr-modal__section">
            <h4 className="pr-modal__section-title">Thu nhập</h4>
            {incomeItems.map((item) => (
              <div
                key={item.label}
                className={`pr-modal__row ${item.isTotal ? "pr-modal__row--total" : ""} ${item.isRef ? "pr-modal__row--ref" : ""}`}
              >
                <span>{item.label}</span>
                <strong className={item.isTotal ? "pr-modal__total-value" : ""}>{fmt(item.value)}</strong>
              </div>
            ))}
          </div>

          <div className="pr-modal__section">
            <h4 className="pr-modal__section-title">Khấu trừ</h4>
            {deductItems.map((item) => (
              <div
                key={item.label}
                className={`pr-modal__row ${item.isTotal ? "pr-modal__row--total" : ""}`}
              >
                <span>{item.label}</span>
                <strong
                  className={
                    item.isTotal ? "pr-modal__total-value pr-modal__total-value--danger" : "pr-modal__deduct-value"
                  }
                >
                  {fmtNeg(item.value)}
                </strong>
              </div>
            ))}
          </div>

          <div className="pr-modal__section">
            <h4 className="pr-modal__section-title">Cách tính lương của bạn</h4>
            {isHidden && (
              <p className="pr-modal__hint">Bấm “Hiện tiền” để xem số liệu chi tiết từng bước.</p>
            )}
            <PayrollFormulaSteps payroll={payroll} fmt={fmt} />
          </div>

          <div className="pr-modal__section pr-modal__section--net">
            <div className="pr-modal__row pr-modal__row--net">
              <span>Lương thực nhận (NET)</span>
              <strong className="pr-modal__net-amount">{fmt(payroll.luong_net)}</strong>
            </div>
          </div>

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
