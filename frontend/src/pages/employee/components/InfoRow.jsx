import React from "react";

/**
 * InfoRow – Một dòng thông tin dạng "label: value" dùng chung
 * cho các section Thông tin cơ bản, Liên hệ công việc…
 *
 * @param {string}          label     – Nhãn bên trái
 * @param {React.ReactNode} children  – Nội dung bên phải
 * @param {string}          [className] – Class CSS bổ sung
 */
function InfoRow({ label, children, className = "" }) {
  return (
    <div className={`ep-info-row ${className}`.trim()}>
      <span className="ep-info-row__label">{label}</span>
      <span className="ep-info-row__value">{children}</span>
    </div>
  );
}

export default InfoRow;
