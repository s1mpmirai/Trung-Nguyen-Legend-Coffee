import React from "react";
import InfoRow from "./InfoRow";

/**
 * BasicInfoSection – Phần "Thông tin cơ bản"
 *
 * Hiển thị: Họ tên, Mã NV, Ngày sinh, Giới tính, Phòng ban, Chức danh, Quản lý trực tiếp.
 *
 * @param {Object} props
 * @param {Object} props.employee – Dữ liệu nhân viên (đã map ở employeeService)
 */
function BasicInfoSection({ employee }) {
  const { fullName, id, birthDate, gender, department, jobTitle, managerName, managerId } = employee;

  return (
    <section className="ep-card">
      <div className="ep-card__header">
        <div className="ep-card__header-left">
          <svg className="ep-card__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <h3 className="ep-card__title">Thông tin cơ bản</h3>
        </div>
      </div>

      <div className="ep-card__body">
        <InfoRow label="Họ và tên">
          <strong>{fullName}</strong>
        </InfoRow>

        <InfoRow label="Mã nhân viên">
          <span className="ep-highlight">{id}</span>
        </InfoRow>

        <InfoRow label="Ngày sinh">{birthDate}</InfoRow>

        <InfoRow label="Giới tính">{gender}</InfoRow>

        <InfoRow label="Phòng ban">{department}</InfoRow>

        <InfoRow label="Chức danh">{jobTitle}</InfoRow>

        <InfoRow label="Quản lý trực tiếp">
          {managerName ? (
            <span>
              <strong>{managerName}</strong>
              {managerId && <span className="text-slate-500 text-xs"> ({managerId})</span>}
            </span>
          ) : (
            "Chưa cập nhật"
          )}
        </InfoRow>
      </div>
    </section>
  );
}

export default BasicInfoSection;
