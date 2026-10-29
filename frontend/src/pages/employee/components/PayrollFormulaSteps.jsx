import React from "react";
import {
  formatMoney,
  PAYROLL_RULES as R,
  breakdownProgressiveTax,
  isProbationPayroll,
} from "../../../services/payrollService";
import { formatDays } from "../utils/format";

const pct = (rate) => `${(rate * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;

/**
 * PayrollFormulaSteps – Diễn giải từng bước cách tính lương bằng SỐ LIỆU THẬT của nhân viên.
 * Công thức đồng bộ với backend (payroll_service.compute_payroll_line):
 *   Lương thực hưởng = Lương HĐ × tỷ lệ hưởng (thử việc 85%)
 *   Lương theo công  = Lương thực hưởng ÷ công chuẩn × công thực tế (công chuẩn = T2–T6 trừ ngày lễ)
 *   Phụ cấp          = Phụ cấp chức vụ × min(1; công thực tế ÷ công chuẩn)
 *   Gross            = Lương theo công + Phụ cấp + Thưởng
 *   BH người lao động: BHXH 8% + BHYT 1,5% (trần 46,8tr) + BHTN 1% (trần 106,2tr) trên (Lương HĐ + Phụ cấp);
 *                      không đóng khi thử việc hoặc nghỉ không lương ≥ 14 ngày
 *   Thuế TNCN        = lũy tiến 5 bậc trên (Gross − BH − giảm trừ gia cảnh); thử việc: 10% × Gross (Gross ≥ 2tr)
 *   Net              = Gross − BH − Thuế − Khấu trừ khác
 *
 * @param {Object}   payroll – bảng lương tháng (API /payroll/{ma_nv}/month)
 * @param {Function} fmt     – hàm định dạng tiền (tôn trọng chế độ ẩn số tiền)
 */
function PayrollFormulaSteps({ payroll, fmt }) {
  const probation = isProbationPayroll(payroll);
  const tyLeHuong = probation ? R.TY_LE_HUONG_THU_VIEC : 1;
  const luongHD = Number(payroll.luong_co_ban) || 0;
  const luongThucHuong = luongHD * tyLeHuong;
  const congChuan = Number(payroll.so_cong_chuan) || 0;
  const congThucTe = Number(payroll.so_cong_thuc_te) || 0;
  const tyLeCong = congChuan > 0 ? Math.min(1, congThucTe / congChuan) : 0;
  const bhxh = Number(payroll.bhxh) || 0;
  const bhyt = Number(payroll.bhyt) || 0;
  const bhtn = Number(payroll.bhtn) || 0;
  const tongBH = bhxh + bhyt + bhtn;
  const gross = Number(payroll.luong_gross) || 0;
  const giamTru = Number(payroll.giam_tru_gia_canh) || 0;
  const thuNhapTinhThue = Number(payroll.thu_nhap_tinh_thue) || 0;
  const khauTruKhac = Number(payroll.khau_tru_khac) || 0;
  // Số người phụ thuộc: ưu tiên dữ liệu API, nếu thiếu thì suy ra từ mức giảm trừ đã áp dụng
  const soNguoiPT =
    payroll.so_nguoi_pt != null
      ? Number(payroll.so_nguoi_pt)
      : Math.max(0, Math.round((giamTru - R.GIAM_TRU_BAN_THAN) / R.GIAM_TRU_NGUOI_PHU_THUOC));
  const taxRows = breakdownProgressiveTax(thuNhapTinhThue);

  const steps = [
    {
      title: "Lương thực hưởng",
      formula: `Lương hợp đồng ${fmt(luongHD)} × ${pct(tyLeHuong)}${probation ? " (hợp đồng thử việc)" : ""}`,
      result: fmt(luongThucHuong),
    },
    {
      title: "Lương theo ngày công",
      formula: `${fmt(luongThucHuong)} ÷ ${formatDays(congChuan)} công chuẩn × ${formatDays(congThucTe)} công thực tế`,
      note: "Công chuẩn = số ngày T2 – T6 trong tháng trừ ngày lễ; chỉ tính các ngày công đã được duyệt.",
      result: fmt(payroll.luong_theo_cong),
    },
    {
      title: "Phụ cấp chức vụ",
      formula: `Phụ cấp chức vụ × min(1; ${formatDays(congThucTe)} ÷ ${formatDays(congChuan)}) = Phụ cấp × ${pct(tyLeCong)}`,
      result: fmt(payroll.tong_phu_cap),
    },
    {
      title: "Tổng thu nhập (Gross)",
      formula: `${fmt(payroll.luong_theo_cong)} + ${fmt(payroll.tong_phu_cap)} + ${fmt(payroll.tien_thuong)} (thưởng)`,
      result: fmt(gross),
      emphasis: true,
    },
    {
      title: "Bảo hiểm bắt buộc (phần người lao động)",
      formula:
        tongBH === 0
          ? probation
            ? "Hợp đồng thử việc: không đóng BHXH, BHYT, BHTN."
            : `Nghỉ không lương từ ${R.NGUONG_NGAY_KHONG_DONG_BH} ngày trở lên trong tháng: không đóng bảo hiểm.`
          : null,
      lines:
        tongBH === 0
          ? null
          : [
              [`BHXH ${pct(R.TY_LE_BHXH)} × min(Lương HĐ + Phụ cấp; ${formatMoney(R.TRAN_BHXH_BHYT)})`, fmt(bhxh)],
              [`BHYT ${pct(R.TY_LE_BHYT)} × min(Lương HĐ + Phụ cấp; ${formatMoney(R.TRAN_BHXH_BHYT)})`, fmt(bhyt)],
              [`BHTN ${pct(R.TY_LE_BHTN)} × min(Lương HĐ + Phụ cấp; ${formatMoney(R.TRAN_BHTN)})`, fmt(bhtn)],
            ],
      result: fmt(tongBH),
    },
    probation
      ? {
          title: "Giảm trừ gia cảnh",
          formula: "Không áp dụng giảm trừ gia cảnh đối với hợp đồng thử việc (khấu trừ thuế tại nguồn).",
          result: fmt(0),
        }
      : {
          title: "Giảm trừ gia cảnh",
          formula: `${formatMoney(R.GIAM_TRU_BAN_THAN)} (bản thân) + ${formatMoney(R.GIAM_TRU_NGUOI_PHU_THUOC)} × ${soNguoiPT} người phụ thuộc`,
          result: fmt(giamTru),
        },
    probation
      ? {
          title: "Thuế TNCN (khấu trừ 10%)",
          formula:
            gross >= R.NGUONG_KHAU_TRU_THU_VIEC
              ? `${pct(R.THUE_SUAT_THU_VIEC)} × Gross ${fmt(gross)}`
              : `Gross dưới ${formatMoney(R.NGUONG_KHAU_TRU_THU_VIEC)} đ nên không khấu trừ thuế.`,
          result: fmt(payroll.thue_tncn),
        }
      : {
          title: "Thuế TNCN (lũy tiến từng phần)",
          formula: `Thu nhập tính thuế = max(0; ${fmt(gross)} − ${fmt(tongBH)} − ${fmt(giamTru)}) = ${fmt(thuNhapTinhThue)}`,
          lines:
            taxRows.length > 0
              ? taxRows.map((r) => [`Bậc ${r.bac}: ${fmt(r.phanThuNhap)} × ${pct(r.thueSuat)}`, fmt(r.thue)])
              : [["Thu nhập tính thuế bằng 0 nên không phát sinh thuế", fmt(0)]],
          result: fmt(payroll.thue_tncn),
        },
    ...(khauTruKhac > 0
      ? [{ title: "Khấu trừ khác", formula: "Các khoản trừ nội bộ khác trong kỳ", result: fmt(khauTruKhac) }]
      : []),
    {
      title: "Lương thực nhận (NET)",
      formula: `${fmt(gross)} − ${fmt(tongBH)} (BH) − ${fmt(payroll.thue_tncn)} (thuế)${khauTruKhac > 0 ? ` − ${fmt(khauTruKhac)} (khác)` : ""}`,
      result: fmt(payroll.luong_net),
      emphasis: true,
    },
  ];

  return (
    <div className="pr-formula">
      <ol className="pr-formula__list">
        {steps.map((step, idx) => (
          <li key={step.title} className={`pr-formula__step ${step.emphasis ? "pr-formula__step--emphasis" : ""}`}>
            <div className="pr-formula__head">
              <span className="pr-formula__index" aria-hidden="true">{idx + 1}</span>
              <span className="pr-formula__title">{step.title}</span>
              <strong className="pr-formula__result">{step.result}</strong>
            </div>
            {step.formula && <p className="pr-formula__expr">{step.formula}</p>}
            {step.lines && (
              <ul className="pr-formula__lines">
                {step.lines.map(([label, value]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            )}
            {step.note && <p className="pr-formula__note">{step.note}</p>}
          </li>
        ))}
      </ol>

      {/* Biểu thuế lũy tiến 5 bậc (tham khảo) */}
      <details className="pr-formula__tax-table">
        <summary>Biểu thuế TNCN lũy tiến 5 bậc (theo tháng)</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Bậc</th>
              <th scope="col">Thu nhập tính thuế</th>
              <th scope="col">Thuế suất</th>
            </tr>
          </thead>
          <tbody>
            {R.BIEU_THUE.map(([mucTran, thueSuat], idx) => {
              const mucDuoi = idx === 0 ? 0 : R.BIEU_THUE[idx - 1][0];
              const range =
                idx === 0
                  ? `Đến ${formatMoney(mucTran)}`
                  : mucTran === Infinity
                    ? `Trên ${formatMoney(mucDuoi)}`
                    : `${formatMoney(mucDuoi)} – ${formatMoney(mucTran)}`;
              return (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{range}</td>
                  <td>{pct(thueSuat)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export default PayrollFormulaSteps;
