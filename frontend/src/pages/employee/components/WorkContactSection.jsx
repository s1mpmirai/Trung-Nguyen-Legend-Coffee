import React from "react";
import InfoRow from "./InfoRow";

/**
 * WorkContactSection – Phần "Liên hệ công việc"
 *
 * Hiển thị: SĐT, Email công ty, loại hợp đồng và trạng thái hợp đồng.
 *
 * @param {Object} props
 * @param {Object} props.employee – Dữ liệu nhân viên
 */
function WorkContactSection({ employee, onEdit }) {
  const { phone, email, contractType, contractStatus } = employee;

  return (
    <section className="ep-card">
      {/* ── Tiêu đề section ──────────────────────────────────── */}
      <div className="ep-card__header">
        <div className="ep-card__header-left">
          <svg className="ep-card__icon" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 9l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="ep-card__title">Liên hệ công việc</h3>
        </div>
        {onEdit && (
          <button
            className="ep-card__edit-btn"
            onClick={onEdit}
            title="Chỉnh sửa liên hệ"
            aria-label="Chỉnh sửa liên hệ"
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
        <InfoRow label="Số điện thoại">
          <span className="ep-phone-value">
            <strong>{phone}</strong>
            {/* Icon gọi điện */}
            <svg className="ep-phone-icon" viewBox="0 0 20 20" fill="none" width="16" height="16">
              <path
                d="M3.654 2.328a1.5 1.5 0 011.87-.245l2.272 1.364a1.5 1.5 0 01.632 1.848l-.63 1.578a.5.5 0 00.084.51l2.734 2.734a.5.5 0 00.51.084l1.578-.63a1.5 1.5 0 011.848.632l1.364 2.273a1.5 1.5 0 01-.245 1.869l-1.12 1.12a2.5 2.5 0 01-2.6.622C9.212 13.571 6.43 10.789 3.894 8.05a2.5 2.5 0 01.622-2.6l1.138-1.122z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </InfoRow>

        <InfoRow label="Email công ty">
          <a className="ep-email-link" href={`mailto:${email}`}>
            {email}
          </a>
        </InfoRow>

        <InfoRow label="Hợp đồng lao động">
          <div className="ep-contract-info">
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <span className="font-semibold text-slate-800 text-xs">
                {contractType || "Hợp đồng lao động"}
              </span>
              {employee.workingType === "PART_TIME" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Part-time
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-[#0EA5E9] border border-sky-200">
                  Full-time
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className="ep-contract-badge">{contractStatus || "Hiệu lực"}</span>
            </div>
          </div>
        </InfoRow>
      </div>
    </section>
  );
}

export default WorkContactSection;
