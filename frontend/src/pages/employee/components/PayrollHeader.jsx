import React from "react";
import SharedEmployeeHeader from "./SharedEmployeeHeader";

/**
 * PayrollHeader – Tiêu đề trang Bảng Lương (sử dụng SharedEmployeeHeader chung)
 */
function PayrollHeader(props) {
  return <SharedEmployeeHeader {...props} />;
}

export default PayrollHeader;
