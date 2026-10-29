import React from "react";
import logoImg from "../../../assets/logo/Logo Trung Nguyên_black.png";
import {
  formatMoney,
  mapPayrollStatus,
  isProbationPayroll,
  PAYROLL_RULES,
} from "../../../services/payrollService";
import { formatDays } from "../utils/format";

const COMPANY_NAME = "CÔNG TY CỔ PHẦN TẬP ĐOÀN TRUNG NGUYÊN LEGEND";
const COMPANY_UNIT = "Phòng Hành chính – Nhân sự";

/* ── Đọc số tiền bằng chữ (tiếng Việt) ─────────────────────────── */
const CHU_SO = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const DON_VI_NHOM = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];

// Đọc nhóm 3 chữ số; full = true khi không phải nhóm đứng đầu (cần đọc "không trăm", "linh")
function docBaSo(so, full) {
  const tram = Math.floor(so / 100);
  const chuc = Math.floor((so % 100) / 10);
  const dv = so % 10;
  const words = [];
  if (tram > 0 || full) words.push(`${CHU_SO[tram]} trăm`);
  if (chuc === 0) {
    if (dv > 0 && (tram > 0 || full)) words.push("linh");
  } else if (chuc === 1) {
    words.push("mười");
  } else {
    words.push(`${CHU_SO[chuc]} mươi`);
  }
  if (dv > 0) {
    if (dv === 1 && chuc > 1) words.push("mốt");
    else if (dv === 5 && chuc > 0) words.push("lăm");
    else words.push(CHU_SO[dv]);
  }
  return words.join(" ");
}

export function docSoTien(value) {
  let n = Math.round(Math.abs(Number(value) || 0));
  if (n === 0) return "Không đồng";
  const groups = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    parts.push(docBaSo(groups[i], i < groups.length - 1) + (DON_VI_NHOM[i] || ""));
  }
  const text = `${parts.join(" ")} đồng`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const money = (v) => formatMoney(v);

/* ── Các khối dùng chung cho phiếu tháng và bảng năm ───────────── */
// Bảng thông tin nhân viên 4 cột: nhãn – giá trị – nhãn – giá trị
function InfoColGroup() {
  return (
    <colgroup>
      <col style={{ width: "17%" }} />
      <col style={{ width: "33%" }} />
      <col style={{ width: "17%" }} />
      <col style={{ width: "33%" }} />
    </colgroup>
  );
}

function PrintHeader({ docCode, printedAt }) {
  return (
    <header className="pp-header">
      <img src={logoImg} alt="Trung Nguyên Legend" className="pp-logo" />
      <div className="pp-company">
        <p className="pp-company__name">{COMPANY_NAME}</p>
        <p className="pp-company__unit">{COMPANY_UNIT}</p>
      </div>
      <div className="pp-meta">
        {docCode && <p>Số: {docCode}</p>}
        <p>Ngày in: {printedAt}</p>
      </div>
    </header>
  );
}

function PrintSignatures({ receiverName, dateText }) {
  return (
    <section className="pp-signatures">
      <p className="pp-signatures__date">{dateText}</p>
      <div className="pp-signatures__grid">
        <div className="pp-sign">
          <p className="pp-sign__title">Người lập biểu</p>
          <p className="pp-sign__hint">(Ký, ghi rõ họ tên)</p>
        </div>
        <div className="pp-sign">
          <p className="pp-sign__title">Kế toán trưởng</p>
          <p className="pp-sign__hint">(Ký, ghi rõ họ tên)</p>
        </div>
        <div className="pp-sign">
          <p className="pp-sign__title">Người nhận</p>
          <p className="pp-sign__hint">(Ký, ghi rõ họ tên)</p>
          <p className="pp-sign__name">{receiverName || ""}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * PayrollPrintView – Bản in A4 chính thức: phiếu lương tháng hoặc bảng tổng hợp thu nhập năm.
 * Được render (qua portal) thành con trực tiếp của <body>; chỉ hiện khi in (@media print),
 * khi đó toàn bộ giao diện ứng dụng (#root) bị ẩn bằng display:none.
 *
 * @param {"month"|"year"} mode
 * @param {Object} payroll     – bảng lương tháng (chế độ "month")
 * @param {Object} yearSummary – tổng hợp năm (chế độ "year")
 * @param {number} year        – năm của bảng tổng hợp
 * @param {Object} employee    – hồ sơ nhân viên (dự phòng phòng ban / chức vụ / người phụ thuộc)
 */
function PayrollPrintView({ mode, payroll, yearSummary, year, employee }) {
  const now = new Date();
  const printedAt = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const dateText = `Ngày ${String(now.getDate()).padStart(2, "0")} tháng ${String(now.getMonth() + 1).padStart(2, "0")} năm ${now.getFullYear()}`;

  /* ═══════════════ BẢNG TỔNG HỢP THU NHẬP NĂM ═══════════════ */
  if (mode === "year") {
    const list = [...(yearSummary?.chi_tiet_thang || [])].sort((a, b) => Number(a.thang) - Number(b.thang));
    const latest = list[list.length - 1] || {};
    const sum = (key) => list.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
    const bhOf = (item) => (Number(item.bhxh) || 0) + (Number(item.bhyt) || 0) + (Number(item.bhtn) || 0);
    const totals = {
      cong: sum("so_cong_thuc_te"),
      gross: sum("luong_gross"),
      bh: list.reduce((acc, item) => acc + bhOf(item), 0),
      thue: sum("thue_tncn"),
      khauTru: sum("tong_khau_tru"),
      net: sum("luong_net"),
    };
    const hoTen = yearSummary?.ho_ten || latest.ho_ten || employee?.fullName || "";
    const maNv = yearSummary?.ma_nv || latest.ma_nv || employee?.id || "";
    const soNguoiPT = latest.so_nguoi_pt ?? employee?.dependents;

    return (
      <div className="payroll-print-only">
        <article className="pp-doc">
          <PrintHeader docCode={`THTN-${year}-${maNv}`} printedAt={printedAt} />

          <div className="pp-title-box">
            <h1 className="pp-title">BẢNG TỔNG HỢP THU NHẬP NĂM {year}</h1>
            <p className="pp-subtitle">(Dùng để đối chiếu thu nhập và quyết toán thuế thu nhập cá nhân)</p>
          </div>

          <table className="pp-info">
            <InfoColGroup />
            <tbody>
              <tr>
                <th scope="row">Mã nhân viên</th>
                <td>{maNv || "—"}</td>
                <th scope="row">Họ và tên</th>
                <td className="pp-strong">{hoTen || "—"}</td>
              </tr>
              <tr>
                <th scope="row">Phòng ban</th>
                <td>{latest.ten_pb || employee?.department || "—"}</td>
                <th scope="row">Chức vụ</th>
                <td>{latest.ten_cv || employee?.jobTitle || "—"}</td>
              </tr>
              <tr>
                <th scope="row">Người phụ thuộc</th>
                <td>{soNguoiPT ?? "—"}</td>
                <th scope="row">Kỳ tổng hợp</th>
                <td>
                  {list.length > 0
                    ? `Tháng ${list.map((m) => m.thang).join(", ")} năm ${year} (${list.length} tháng có lương)`
                    : "Chưa có dữ liệu"}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="pp-table pp-table--year">
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "13%" }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Tháng</th>
                <th scope="col">Ngày công</th>
                <th scope="col">Tổng thu nhập (Gross)</th>
                <th scope="col">Bảo hiểm bắt buộc</th>
                <th scope="col">Thuế TNCN</th>
                <th scope="col">Tổng khấu trừ</th>
                <th scope="col">Thực lĩnh (NET)</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {list.length > 0 ? (
                list.map((item) => (
                  <tr key={`${item.nam}-${item.thang}`}>
                    <td className="pp-center pp-strong">{String(item.thang).padStart(2, "0")}/{item.nam || year}</td>
                    <td className="pp-center">{formatDays(item.so_cong_thuc_te)}</td>
                    <td className="pp-num">{money(item.luong_gross)}</td>
                    <td className="pp-num">{money(bhOf(item))}</td>
                    <td className="pp-num">{money(item.thue_tncn)}</td>
                    <td className="pp-num">{money(item.tong_khau_tru)}</td>
                    <td className="pp-num pp-strong">{money(item.luong_net)}</td>
                    <td className="pp-center">{mapPayrollStatus(item.trang_thai).label}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="pp-center">Chưa có dữ liệu bảng lương năm {year}</td>
                </tr>
              )}
            </tbody>
            {list.length > 0 && (
              <tfoot>
                <tr className="pp-total-row">
                  <td className="pp-center">Tổng cộng</td>
                  <td className="pp-center">{formatDays(totals.cong)}</td>
                  <td className="pp-num">{money(totals.gross)}</td>
                  <td className="pp-num">{money(totals.bh)}</td>
                  <td className="pp-num">{money(totals.thue)}</td>
                  <td className="pp-num">{money(totals.khauTru)}</td>
                  <td className="pp-num">{money(totals.net)}</td>
                  <td className="pp-center">{list.length} tháng</td>
                </tr>
              </tfoot>
            )}
          </table>
          <p className="pp-unit-note">Đơn vị tính: đồng (VNĐ)</p>

          <section className="pp-summary">
            <div className="pp-summary__row">
              <span>Tổng thu nhập (Gross) cả năm</span>
              <strong>{money(totals.gross)} đ</strong>
            </div>
            <div className="pp-summary__row">
              <span>Tổng bảo hiểm bắt buộc người lao động đã đóng</span>
              <strong>{money(totals.bh)} đ</strong>
            </div>
            <div className="pp-summary__row">
              <span>Tổng thuế TNCN đã khấu trừ</span>
              <strong>{money(totals.thue)} đ</strong>
            </div>
            <div className="pp-summary__row pp-summary__row--total">
              <span>TỔNG THU NHẬP THỰC LĨNH (NET)</span>
              <strong>{money(totals.net)} đ</strong>
            </div>
            <p className="pp-words">
              Bằng chữ: <em>{docSoTien(totals.net)}</em>
            </p>
          </section>

          <PrintSignatures receiverName={hoTen} dateText={dateText} />
        </article>
      </div>
    );
  }

  /* ═══════════════ PHIẾU LƯƠNG THÁNG ═══════════════ */
  if (!payroll) {
    return (
      <div className="payroll-print-only">
        <article className="pp-doc">
          <PrintHeader printedAt={printedAt} />
          <p className="pp-empty">Chưa có phiếu lương đã duyệt cho kỳ đang chọn.</p>
        </article>
      </div>
    );
  }

  const probation = isProbationPayroll(payroll);
  const tyLeHuong = probation ? PAYROLL_RULES.TY_LE_HUONG_THU_VIEC : 1;
  const congChuan = Number(payroll.so_cong_chuan) || 0;
  const congThucTe = Number(payroll.so_cong_thuc_te) || 0;
  const tyLeCong = congChuan > 0 ? Math.min(1, congThucTe / congChuan) : 0;
  const tongBH = (Number(payroll.bhxh) || 0) + (Number(payroll.bhyt) || 0) + (Number(payroll.bhtn) || 0);
  const soNguoiPT = payroll.so_nguoi_pt ?? employee?.dependents;
  const bhNote = probation ? "Không áp dụng (HĐ thử việc)" : tongBH === 0 ? "Không phát sinh trong kỳ" : null;
  const statusInfo = mapPayrollStatus(payroll.trang_thai);
  let stt = 0;

  return (
    <div className="payroll-print-only">
      <article className="pp-doc">
        <PrintHeader docCode={payroll.ma_bl != null ? `BL-${payroll.ma_bl}` : null} printedAt={printedAt} />

        <div className="pp-title-box">
          <h1 className="pp-title">PHIẾU LƯƠNG</h1>
          <p className="pp-subtitle">Kỳ lương: Tháng {payroll.thang} năm {payroll.nam}</p>
        </div>

        <table className="pp-info">
          <InfoColGroup />
          <tbody>
            <tr>
              <th scope="row">Mã nhân viên</th>
              <td>{payroll.ma_nv || "—"}</td>
              <th scope="row">Họ và tên</th>
              <td className="pp-strong">{payroll.ho_ten || employee?.fullName || "—"}</td>
            </tr>
            <tr>
              <th scope="row">Phòng ban</th>
              <td>{payroll.ten_pb || employee?.department || "—"}</td>
              <th scope="row">Chức vụ</th>
              <td>{payroll.ten_cv || employee?.jobTitle || "—"}</td>
            </tr>
            <tr>
              <th scope="row">Lương hợp đồng</th>
              <td>
                {money(payroll.luong_co_ban)} đ{probation ? " (thử việc – hưởng 85%)" : ""}
              </td>
              <th scope="row">Người phụ thuộc</th>
              <td>{soNguoiPT ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Ngày công</th>
              <td>
                {formatDays(congThucTe)} / {formatDays(congChuan)} công chuẩn
              </td>
              <th scope="row">Trạng thái</th>
              <td>{statusInfo.label}</td>
            </tr>
          </tbody>
        </table>

        <table className="pp-table">
          <colgroup>
            <col style={{ width: "7%" }} />
            <col style={{ width: "33%" }} />
            <col style={{ width: "38%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">STT</th>
              <th scope="col">Khoản mục</th>
              <th scope="col">Diễn giải</th>
              <th scope="col">Số tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="pp-section-row">
              <td colSpan={4}>I. CÁC KHOẢN THU NHẬP</td>
            </tr>
            <tr>
              <td className="pp-center">{++stt}</td>
              <td>Lương theo ngày công</td>
              <td>
                {money(Number(payroll.luong_co_ban) * tyLeHuong)} ÷ {formatDays(congChuan)} × {formatDays(congThucTe)} công
              </td>
              <td className="pp-num">{money(payroll.luong_theo_cong)}</td>
            </tr>
            <tr>
              <td className="pp-center">{++stt}</td>
              <td>Phụ cấp chức vụ</td>
              <td>Hưởng {Math.round(tyLeCong * 100)}% theo tỷ lệ công</td>
              <td className="pp-num">{money(payroll.tong_phu_cap)}</td>
            </tr>
            <tr>
              <td className="pp-center">{++stt}</td>
              <td>Tiền thưởng</td>
              <td></td>
              <td className="pp-num">{money(payroll.tien_thuong)}</td>
            </tr>
            <tr className="pp-subtotal-row">
              <td colSpan={3}>Tổng thu nhập (Gross) – (A)</td>
              <td className="pp-num">{money(payroll.luong_gross)}</td>
            </tr>

            <tr className="pp-section-row">
              <td colSpan={4}>II. CÁC KHOẢN KHẤU TRỪ</td>
            </tr>
            <tr>
              <td className="pp-center">{++stt}</td>
              <td>Bảo hiểm xã hội (BHXH)</td>
              <td>{bhNote || "8% × lương đóng bảo hiểm"}</td>
              <td className="pp-num">{money(payroll.bhxh)}</td>
            </tr>
            <tr>
              <td className="pp-center">{++stt}</td>
              <td>Bảo hiểm y tế (BHYT)</td>
              <td>{bhNote || "1,5% × lương đóng bảo hiểm"}</td>
              <td className="pp-num">{money(payroll.bhyt)}</td>
            </tr>
            <tr>
              <td className="pp-center">{++stt}</td>
              <td>Bảo hiểm thất nghiệp (BHTN)</td>
              <td>{bhNote || "1% × lương đóng bảo hiểm"}</td>
              <td className="pp-num">{money(payroll.bhtn)}</td>
            </tr>
            <tr>
              <td className="pp-center">{++stt}</td>
              <td>Thuế thu nhập cá nhân (TNCN)</td>
              <td>
                {probation
                  ? "Khấu trừ 10% × Gross (HĐ thử việc)"
                  : `Lũy tiến trên thu nhập tính thuế ${money(payroll.thu_nhap_tinh_thue)} (sau giảm trừ gia cảnh ${money(payroll.giam_tru_gia_canh)})`}
              </td>
              <td className="pp-num">{money(payroll.thue_tncn)}</td>
            </tr>
            {Number(payroll.khau_tru_khac) > 0 && (
              <tr>
                <td className="pp-center">{++stt}</td>
                <td>Khấu trừ khác</td>
                <td></td>
                <td className="pp-num">{money(payroll.khau_tru_khac)}</td>
              </tr>
            )}
            <tr className="pp-subtotal-row">
              <td colSpan={3}>Tổng các khoản khấu trừ – (B)</td>
              <td className="pp-num">{money(payroll.tong_khau_tru)}</td>
            </tr>

            <tr className="pp-grand-row">
              <td colSpan={3}>THỰC LĨNH (NET) = (A) − (B)</td>
              <td className="pp-num">{money(payroll.luong_net)}</td>
            </tr>
          </tbody>
        </table>

        <p className="pp-words">
          Số tiền bằng chữ: <em>{docSoTien(payroll.luong_net)}</em>
        </p>
        {payroll.ghi_chu && <p className="pp-note">Ghi chú: {payroll.ghi_chu}</p>}

        <PrintSignatures receiverName={payroll.ho_ten || employee?.fullName} dateText={dateText} />
      </article>
    </div>
  );
}

export default PayrollPrintView;
