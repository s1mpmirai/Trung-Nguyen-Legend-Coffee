import React from "react";
import InfoRow from "./InfoRow";

/**
 * BasicInfoSection – Phần "Thông tin cơ bản"
 *
 * Hiển thị: Họ tên, Mã NV, Phòng ban, Chức danh, Ngày vào làm.
 *
 * @param {Object} props
 * @param {Object} props.employee – Dữ liệu nhân viên
 */
function BasicInfoSection({ employee }) {
  const { fullName, id, department, jobTitle, startDate } = employee;

  // Chức danh rút gọn (bỏ phần "& Thương hiệu" nếu quá dài)
  const shortTitle = jobTitle?.includes("&")
    ? jobTitle.split("&")[0].trim()
    : jobTitle || "";

  return (
    <section className="ep-card">
      {/* ── Tiêu đề section ──────────────────────────────────── */}
      <div className="ep-card__header">
        <div className="ep-card__header-left">
          <svg className="ep-card__icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <h3 className="ep-card__title">Thông tin cơ bản</h3>
        </div>
      </div>

      {/* ── Danh sách thông tin ───────────────────────────────── */}
      <div className="ep-card__body">
        <InfoRow label="Họ và tên">
          <strong>{fullName}</strong>
        </InfoRow>

        <InfoRow label="Mã nhân viên">
          <span className="ep-highlight">{id}</span>
        </InfoRow>

        <InfoRow label="Phòng ban">{department}</InfoRow>

        <InfoRow label="Chức danh">{shortTitle}</InfoRow>

        <InfoRow label="Ngày vào làm">{startDate}</InfoRow>
      </div>
    </section>
  );
}

export default BasicInfoSection;
