import React from "react";
import avatarDefault from "../../../assets/avatar-default.jpg";

/**
 * ProfileHeader – Phần đầu hồ sơ nhân viên
 *
 * Hiển thị: avatar, badge trạng thái, tên, chức danh, phòng ban,
 * ngày vào làm, thâm niên và nút "Chỉnh sửa hồ sơ".
 *
 * @param {Object}   props
 * @param {Object}   props.employee       – Dữ liệu nhân viên
 * @param {Function} props.onEditProfile  – Callback khi nhấn nút chỉnh sửa
 */
function ProfileHeader({ employee, onEditProfile }) {
  const {
    fullName,
    avatarUrl,
    jobTitle,
    departmentFull,
    id,
    startDate,
    seniority,
    status,
  } = employee;

  return (
    <section className="ep-profile-header">
      {/* ── Avatar ────────────────────────────────────────────── */}
      <div className="ep-avatar-wrapper">
        <img
          className="ep-avatar"
          src={avatarUrl || avatarDefault}
          alt={`Ảnh đại diện của ${fullName}`}
        />
      </div>

      {/* ── Badge trạng thái (VD: "Nhân viên chính thức") ───── */}
      <span className="ep-status-badge">
        <span className="ep-status-badge__dot" />
        {status}
      </span>

      {/* ── Tên & chức danh ───────────────────────────────────── */}
      <h2 className="ep-profile-name">{fullName}</h2>
      <p className="ep-profile-title">{jobTitle}</p>
      <p className="ep-profile-dept">
        {departmentFull} • Mã NV: <strong>{id}</strong>
      </p>

      {/* ── Ngày vào làm & thâm niên ─────────────────────────── */}
      <div className="ep-meta-tags">
        <span className="ep-meta-tag">
          <svg className="ep-meta-tag__icon" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 8h14" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Ngày vào làm: {startDate}
        </span>
        <span className="ep-meta-tag">
          <svg className="ep-meta-tag__icon" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 6v4.5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Thâm niên: {seniority}
        </span>
      </div>
    </section>
  );
}

export default ProfileHeader;
