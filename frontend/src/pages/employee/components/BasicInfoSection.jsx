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
function BasicInfoSection({ employee, onEdit }) {
  const { fullName, id, birthDate, gender, department, jobTitle, startDate } = employee;

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
        {onEdit && (
          <button
            className="ep-card__edit-btn"
            onClick={onEdit}
            title="Chỉnh sửa thông tin cá nhân"
            aria-label="Chỉnh sửa thông tin cá nhân"
            type="button"
          >
            <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
              <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.5 2.5a2.121 2.121 0 013 3L10 14l-4 1 1-4 8.5-8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Danh sách thông tin ───────────────────────────────── */}
      <div className="ep-card__body">
        <InfoRow label="Họ và tên">
          <strong>{fullName}</strong>
        </InfoRow>

        <InfoRow label="Mã nhân viên">
          <span className="ep-highlight">{id}</span>
        </InfoRow>

        <InfoRow label="Ngày sinh">
          <span>{birthDate || "Chưa cập nhật"}</span>
        </InfoRow>

        <InfoRow label="Giới tính">
          <span>{gender || "Chưa cập nhật"}</span>
        </InfoRow>

        <InfoRow label="Email cá nhân">
          <span className="text-slate-700 font-medium">
            {employee.personalEmail || "Chưa cập nhật"}
          </span>
        </InfoRow>

        <InfoRow label="Phòng ban">{department}</InfoRow>

        <InfoRow label="Chức danh">{shortTitle}</InfoRow>

        <InfoRow label="Ngày vào làm">{startDate}</InfoRow>
      </div>
    </section>
  );
}

export default BasicInfoSection;
