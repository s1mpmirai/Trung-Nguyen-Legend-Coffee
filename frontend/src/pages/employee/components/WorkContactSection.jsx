import React from "react";
import InfoRow from "./InfoRow";

const NOT_UPDATED = "Chưa cập nhật";

/**
 * WorkContactSection – Phần "Liên hệ & Hợp đồng" và "Ngân hàng & Thuế"
 *
 * Hiển thị: SĐT, Email, Địa chỉ, hợp đồng lao động (mã, loại, trạng thái),
 * tài khoản nhận lương, mã số thuế, số sổ BHXH, số người phụ thuộc.
 * Chỉ hiển thị dữ liệu thật trong hồ sơ; trường trống hiển thị "Chưa cập nhật".
 *
 * @param {Object} props
 * @param {Object} props.employee – Dữ liệu nhân viên
 */
function WorkContactSection({ employee }) {
  const {
    phone,
    phoneRaw,
    email,
    emailRaw,
    address,
    contractCode,
    contractType,
    contractStatus,
    workingType,
    bankAccount,
    bankName,
    taxCode,
    socialInsuranceNo,
    dependents,
  } = employee;

  return (
    <>
      <section className="ep-card">
        <div className="ep-card__header">
          <div className="ep-card__header-left">
            <svg className="ep-card__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3 9l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="ep-card__title">Liên hệ & Hợp đồng</h3>
          </div>
        </div>

        <div className="ep-card__body">
          <InfoRow label="Số điện thoại">
            {phoneRaw ? (
              <a className="ep-email-link" href={`tel:${phoneRaw}`}>
                <strong>{phone}</strong>
              </a>
            ) : (
              NOT_UPDATED
            )}
          </InfoRow>

          <InfoRow label="Email">
            {emailRaw ? (
              <a className="ep-email-link" href={`mailto:${emailRaw}`}>
                {email}
              </a>
            ) : (
              NOT_UPDATED
            )}
          </InfoRow>

          <InfoRow label="Địa chỉ">{address || NOT_UPDATED}</InfoRow>

          <InfoRow label="Hợp đồng lao động">
            <div className="ep-contract-info">
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="font-semibold text-slate-800 text-xs">{contractType}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                    workingType === "PART_TIME"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-coffee-50 text-coffee-700 border-coffee-200"
                  }`}
                >
                  {workingType === "PART_TIME" ? "Bán thời gian" : "Toàn thời gian"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>Số HĐ: {contractCode}</span>
                <span className="ep-contract-badge">{contractStatus}</span>
              </div>
            </div>
          </InfoRow>
        </div>
      </section>

      <section className="ep-card">
        <div className="ep-card__header">
          <div className="ep-card__header-left">
            <svg className="ep-card__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M2.5 10h19M6.5 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <h3 className="ep-card__title">Ngân hàng & Thuế</h3>
          </div>
        </div>

        <div className="ep-card__body">
          <InfoRow label="Tài khoản nhận lương">
            {bankAccount ? (
              <span>
                <strong>{bankAccount}</strong>
                {bankName && <span className="block text-xs text-slate-500">{bankName}</span>}
              </span>
            ) : (
              NOT_UPDATED
            )}
          </InfoRow>
          <InfoRow label="Mã số thuế">{taxCode || NOT_UPDATED}</InfoRow>
          <InfoRow label="Số sổ BHXH">{socialInsuranceNo || NOT_UPDATED}</InfoRow>
          <InfoRow label="Người phụ thuộc">
            {dependents != null ? `${dependents} người` : NOT_UPDATED}
          </InfoRow>
        </div>
      </section>
    </>
  );
}

export default WorkContactSection;
