import React from "react";

/**
 * PayrollFAQ – Khối "Thắc mắc về bảng lương?" + nút liên hệ C&B.
 */
function PayrollFAQ() {
  return (
    <section className="pr-faq">
      <h4 className="pr-faq__title">Thắc mắc về bảng lương?</h4>
      <p className="pr-faq__text">
        Mọi câu hỏi về bảng lương, khấu trừ, thuế TNCN hoặc bảo hiểm –
        vui lòng liên hệ phòng C&B để được hỗ trợ nhanh nhất.
      </p>
      <button className="pr-faq__btn" type="button">
        <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
          <path d="M4 4h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 3v-3a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
        Liên hệ hỗ trợ C&B
      </button>
    </section>
  );
}

export default PayrollFAQ;
