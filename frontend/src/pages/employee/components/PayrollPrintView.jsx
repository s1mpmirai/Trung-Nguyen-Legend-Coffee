import React from "react";
import { formatMoney, mapPayrollStatus } from "../../../services/payrollService";

/**
 * PayrollPrintView – Bản in chính thức phiếu lương theo tháng và bảng kê cả năm.
 * Chỉ hiển thị khi in (thông qua @media print).
 */
function PayrollPrintView({ printMode, payroll, yearSummary, month, year }) {
  const isYear = printMode === "year";
  const currentDate = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (isYear) {
    const list = yearSummary?.chi_tiet_thang || [];
    return (
      <div className="payroll-print-only">
        <div className="print-doc">
          {/* Header công ty */}
          <div className="print-header">
            <div>
              <h2 className="print-company">TẬP ĐOÀN TRUNG NGUYÊN LEGEND</h2>
              <p className="print-subcompany">PHÒNG QUẢN TRỊ NGUỒN NHÂN LỰC & KẾ TOÁN</p>
            </div>
            <div className="print-meta">
              <p>Mẫu số: 02-L/TNL</p>
              <p>Ngày in: {currentDate}</p>
            </div>
          </div>

          <div className="print-divider" />

          {/* Tiêu đề bảng năm */}
          <div className="print-title-box">
            <h1 className="print-title">BẢNG KÊ TỔNG HỢP THU NHẬP NĂM {year}</h1>
            <p className="print-subtitle">(Dành cho nhân viên tra cứu & quyết toán thuế cá nhân)</p>
          </div>

          {/* Thông tin nhân viên */}
          <div className="print-emp-grid">
            <div><strong>Họ và tên:</strong> {yearSummary?.ho_ten || payroll?.ho_ten || "Nhân viên"}</div>
            <div><strong>Mã nhân viên:</strong> {yearSummary?.ma_nv || payroll?.ma_nv || "---"}</div>
            <div><strong>Năm quyết toán:</strong> {year}</div>
            <div>
              <strong>Kỳ tổng hợp:</strong>{" "}
              {list.length === 12
                ? "Đủ 12 tháng năm " + year
                : list.length > 0
                ? `Lũy kế ${list.length} tháng (Tháng 1 - Tháng ${list[list.length - 1]?.thang}/${year})`
                : "0 / 12 tháng"}
            </div>
          </div>

          {/* Bảng chi tiết 12 tháng */}
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>Tháng</th>
                <th style={{ width: "10%" }}>Số công</th>
                <th style={{ width: "10%" }}>Tăng ca (h)</th>
                <th style={{ width: "18%" }}>Tổng Gross</th>
                <th style={{ width: "18%" }}>Tổng khấu trừ</th>
                <th style={{ width: "20%" }}>Thực nhận (NET)</th>
                <th style={{ width: "16%" }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {list.length > 0 ? (
                list.map((item) => {
                  const st = mapPayrollStatus(item.trang_thai);
                  return (
                    <tr key={item.thang}>
                      <td className="text-center font-bold">Tháng {item.thang}</td>
                      <td className="text-center">{item.so_cong_thuc_te}</td>
                      <td className="text-center">{item.so_gio_tang_ca || 0}</td>
                      <td className="text-right">{formatMoney(item.luong_gross)} đ</td>
                      <td className="text-right text-red-600">-{formatMoney(item.tong_khau_tru)} đ</td>
                      <td className="text-right font-bold">{formatMoney(item.luong_net)} đ</td>
                      <td className="text-center">{st.label}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4">Chưa có dữ liệu bảng lương năm {year}</td>
                </tr>
              )}
            </tbody>
            {list.length > 0 && (
              <tfoot>
                <tr className="print-total-row">
                  <td className="font-bold text-center">TỔNG CỘNG</td>
                  <td className="text-center font-bold">{yearSummary?.tong_cong_thuc_te || 0}</td>
                  <td className="text-center font-bold">{yearSummary?.tong_gio_tang_ca || 0}</td>
                  <td className="text-right font-bold">{formatMoney(yearSummary?.tong_gross || 0)} đ</td>
                  <td className="text-right font-bold text-red-600">-{formatMoney(yearSummary?.tong_khau_tru || 0)} đ</td>
                  <td className="text-right font-bold text-blue-700">{formatMoney(yearSummary?.tong_net || 0)} đ</td>
                  <td className="text-center font-bold">Cả năm</td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Tóm tắt chỉ số tài chính năm */}
          <div className="print-year-summary-box">
            <div className="print-stat-item">
              <span>Tổng thu nhập Gross cả năm:</span>
              <strong>{formatMoney(yearSummary?.tong_gross || 0)} VNĐ</strong>
            </div>
            <div className="print-stat-item">
              <span>Tổng bảo hiểm (BHXH, BHYT, BHTN):</span>
              <strong>{formatMoney((yearSummary?.tong_bhxh || 0) + (yearSummary?.tong_bhyt || 0) + (yearSummary?.tong_bhtn || 0))} VNĐ</strong>
            </div>
            <div className="print-stat-item">
              <span>Tổng thuế TNCN đã trích nộp:</span>
              <strong>{formatMoney(yearSummary?.tong_thue_tncn || 0)} VNĐ</strong>
            </div>
            <div className="print-stat-item print-stat-item--highlight">
              <span>TỔNG THU NHẬP RÒNG THỰC LĨNH (NET):</span>
              <strong className="text-lg text-blue-800">{formatMoney(yearSummary?.tong_net || 0)} VNĐ</strong>
            </div>
          </div>

          {/* Chữ ký */}
          <div className="print-signatures">
            <div className="print-sig-col">
              <p className="print-sig-title">Người lập biểu</p>
              <p className="print-sig-hint">(Ký, họ tên)</p>
            </div>
            <div className="print-sig-col">
              <p className="print-sig-title">Kế toán trưởng</p>
              <p className="print-sig-hint">(Ký, đóng dấu)</p>
            </div>
            <div className="print-sig-col">
              <p className="print-sig-title">Nhân viên xác nhận</p>
              <p className="print-sig-hint">(Ký, họ tên)</p>
              <p className="print-sig-name">{yearSummary?.ho_ten || ""}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chế độ in phiếu lương tháng
  const statusInfo = mapPayrollStatus(payroll?.trang_thai);
  return (
    <div className="payroll-print-only">
      <div className="print-doc">
        {/* Header công ty */}
        <div className="print-header">
          <div>
            <h2 className="print-company">TẬP ĐOÀN TRUNG NGUYÊN LEGEND</h2>
            <p className="print-subcompany">PHÒNG QUẢN TRỊ NGUỒN NHÂN LỰC & KẾ TOÁN</p>
          </div>
          <div className="print-meta">
            <p>Mẫu số: 01-L/TNL</p>
            <p>Mã BL: BL-{payroll?.ma_bl || "---"}</p>
            <p>Ngày in: {currentDate}</p>
          </div>
        </div>

        <div className="print-divider" />

        {/* Tiêu đề phiếu lương */}
        <div className="print-title-box">
          <h1 className="print-title">PHIẾU LƯƠNG NHÂN VIÊN</h1>
          <p className="print-subtitle">Kỳ chi trả: Tháng {month} năm {year}</p>
        </div>

        {/* Thông tin nhân viên */}
        <div className="print-emp-grid">
          <div><strong>Họ và tên:</strong> {payroll?.ho_ten || "Nhân viên"}</div>
          <div><strong>Mã nhân viên:</strong> {payroll?.ma_nv || "---"}</div>
          <div><strong>Kỳ công:</strong> Tháng {month}/{year}</div>
          <div><strong>Trạng thái chi trả:</strong> <span className="font-semibold">{statusInfo.label}</span></div>
        </div>

        {/* Bảng chi tiết lương tháng */}
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: "8%" }}>STT</th>
              <th style={{ width: "45%" }}>Khoản mục thu nhập & khấu trừ</th>
              <th style={{ width: "22%" }}>Cách tính / Hệ số</th>
              <th style={{ width: "25%" }}>Thành tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="print-sec-header">
              <td colSpan={4}><strong>I. CÁC KHOẢN THU NHẬP (THU NHẬP GROSS)</strong></td>
            </tr>
            <tr>
              <td className="text-center">1</td>
              <td>Lương cơ bản (Hệ số: {payroll?.he_so_luong || 1.0})</td>
              <td className="text-center">Theo hợp đồng</td>
              <td className="text-right">{formatMoney(payroll?.luong_co_ban)} đ</td>
            </tr>
            <tr>
              <td className="text-center">2</td>
              <td>Lương theo ngày công thực tế</td>
              <td className="text-center">{payroll?.so_cong_thuc_te} / {payroll?.so_cong_chuan} công</td>
              <td className="text-right">{formatMoney(payroll?.luong_theo_cong)} đ</td>
            </tr>
            <tr>
              <td className="text-center">3</td>
              <td>Tiền lương tăng ca (OT)</td>
              <td className="text-center">{payroll?.so_gio_tang_ca || 0} giờ</td>
              <td className="text-right">{formatMoney(payroll?.tien_tang_ca)} đ</td>
            </tr>
            <tr>
              <td className="text-center">4</td>
              <td>Tổng các khoản phụ cấp</td>
              <td className="text-center">Ăn trưa, xăng xe, ĐT</td>
              <td className="text-right">{formatMoney(payroll?.tong_phu_cap)} đ</td>
            </tr>
            <tr>
              <td className="text-center">5</td>
              <td>Tiền thưởng / Khen thưởng</td>
              <td className="text-center">KPI & Đạt mục tiêu</td>
              <td className="text-right">{formatMoney(payroll?.tien_thuong)} đ</td>
            </tr>
            <tr className="print-subtotal-row">
              <td colSpan={3} className="font-bold">CỘNG CÁC KHOẢN THU NHẬP (A):</td>
              <td className="text-right font-bold">{formatMoney(payroll?.luong_gross)} đ</td>
            </tr>

            <tr className="print-sec-header">
              <td colSpan={4}><strong>II. CÁC KHOẢN KHẤU TRỪ</strong></td>
            </tr>
            <tr>
              <td className="text-center">6</td>
              <td>Bảo hiểm xã hội (BHXH)</td>
              <td className="text-center">8.0% lương đóng BH</td>
              <td className="text-right text-red-600">-{formatMoney(payroll?.bhxh)} đ</td>
            </tr>
            <tr>
              <td className="text-center">7</td>
              <td>Bảo hiểm y tế (BHYT)</td>
              <td className="text-center">1.5% lương đóng BH</td>
              <td className="text-right text-red-600">-{formatMoney(payroll?.bhyt)} đ</td>
            </tr>
            <tr>
              <td className="text-center">8</td>
              <td>Bảo hiểm thất nghiệp (BHTN)</td>
              <td className="text-center">1.0% lương đóng BH</td>
              <td className="text-right text-red-600">-{formatMoney(payroll?.bhtn)} đ</td>
            </tr>
            <tr>
              <td className="text-center">9</td>
              <td>Thuế thu nhập cá nhân (Thuế TNCN)</td>
              <td className="text-center">Theo biểu lũy tiến từng phần</td>
              <td className="text-right text-red-600">-{formatMoney(payroll?.thue_tncn)} đ</td>
            </tr>
            {payroll?.khau_tru_khac > 0 && (
              <tr>
                <td className="text-center">10</td>
                <td>Khấu trừ khác</td>
                <td className="text-center">Các khoản trừ nội bộ</td>
                <td className="text-right text-red-600">-{formatMoney(payroll?.khau_tru_khac)} đ</td>
              </tr>
            )}
            <tr className="print-subtotal-row">
              <td colSpan={3} className="font-bold">TỔNG CÁC KHOẢN KHẤU TRỪ (B):</td>
              <td className="text-right font-bold text-red-600">-{formatMoney(payroll?.tong_khau_tru)} đ</td>
            </tr>

            <tr className="print-grand-total">
              <td colSpan={3} className="text-lg font-black uppercase text-blue-900">
                TỔNG THU NHẬP THỰC LĨNH (NET = A - B):
              </td>
              <td className="text-right text-xl font-black text-blue-900">
                {formatMoney(payroll?.luong_net)} VNĐ
              </td>
            </tr>
          </tbody>
        </table>

        {/* Chữ ký */}
        <div className="print-signatures">
          <div className="print-sig-col">
            <p className="print-sig-title">Người lập phiếu</p>
            <p className="print-sig-hint">(Ký, họ tên)</p>
          </div>
          <div className="print-sig-col">
            <p className="print-sig-title">Kế toán trưởng</p>
            <p className="print-sig-hint">(Ký, đóng dấu)</p>
          </div>
          <div className="print-sig-col">
            <p className="print-sig-title">Người nhận tiền</p>
            <p className="print-sig-hint">(Ký, họ tên)</p>
            <p className="print-sig-name">{payroll?.ho_ten || ""}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayrollPrintView;
