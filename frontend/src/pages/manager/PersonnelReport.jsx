import React from "react";
import EmployeeManagement from "./EmployeeManagement";

/**
 * PersonnelReport component - Adapter hợp nhất sử dụng EmployeeManagement với tab báo cáo chuyên sâu.
 * Giữ nguyên tính tương thích ngược cho các nơi import PersonnelReport.
 */
export default function PersonnelReport(props) {
  return <EmployeeManagement initialTab="reports" {...props} />;
}
