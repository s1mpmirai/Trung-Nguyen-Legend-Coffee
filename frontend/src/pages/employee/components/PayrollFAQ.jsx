import React from "react";

/**
 * PayrollFAQ – Khối "Thắc mắc về bảng lương?" + thông tin email liên hệ.
 */
function PayrollFAQ() {
  return (
    <section className="pr-faq">
      <h4 className="pr-faq__title">Thắc mắc về bảng lương?</h4>
      <p className="pr-faq__text">
        Mọi câu hỏi về bảng lương, khấu trừ, thuế TNCN hoặc bảo hiểm –
        vui lòng liên hệ phòng C&B để được hỗ trợ nhanh nhất.
      </p>
      <div className="pr-faq__email-wrapper">
        <span className="pr-faq__email-label">
          <svg viewBox="0 0 20 20" fill="none" width="15" height="15" className="inline-block mr-1.5 opacity-75">
            <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 6l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Email:{" "}
          <a
            href="mailto:quanlikhuvuc@trungnguyen.vn"
            className="pr-faq__email-link"
          >
            quanlykhuvuc@trungnguyen.vn
          </a>
        </span>
      </div>
    </section>
  );
}

export default PayrollFAQ;
