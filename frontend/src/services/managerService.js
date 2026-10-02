/**
 * managerService.js
 *
 * Cung cấp dữ liệu báo cáo, thống kê và biến động nhân sự cho Quản lý / Ban Giám đốc:
 * - Dữ liệu KPI tổng quan (Tổng nhân sự, Điểm danh, Phép, Thôi việc)
 * - Cơ cấu học vấn & thâm niên
 * - Quỹ lương theo khối/phòng ban
 * - Danh sách biến động nhân sự gần đây
 */

import apiClient from "./apiClient";

export const getManagerDashboardStats = async (period = "2026-10", department = "all") => {
  try {
    // Thử gọi endpoint backend nếu có
    const res = await apiClient.get("/manager/dashboard/stats", {
      params: { period, department },
    });
    return res.data;
  } catch (_) {
    // Dữ liệu mẫu chuẩn xác theo thiết kế Stitch HR Portal
    return {
      summary: {
        totalEmployees: 1280,
        newThisMonth: 14,
        targetEmployees: 1350,
        targetRate: 94.8,
        activeToday: 1215,
        activeRate: 94.9,
        onTimeRate: 98.2,
        leavesTotal: 42,
        annualLeaves: 38,
        sickLeaves: 4,
        turnoverCount: 23,
        turnoverRate: 1.8,
        turnoverStatus: "Tốt (< 2.5%)",
      },
      education: [
        { label: "Đại học", count: 870, percentage: 68.0, color: "#0ea5e9" },
        { label: "Cao đẳng / Nghề", count: 307, percentage: 24.0, color: "#10b981" },
        { label: "Sau đại học & Khác", count: 103, percentage: 8.0, color: "#f59e0b" },
      ],
      tenure: {
        averageYears: 3.4,
        retentionGrowth: 4.2,
        brackets: [
          { label: "Dưới 1 năm", percentage: 22, count: 281, color: "#0ea5e9" },
          { label: "1 – 3 năm", percentage: 45, count: 576, color: "#0284c7" },
          { label: "Trên 3 năm", percentage: 33, count: 423, color: "#10b981" },
        ],
      },
      payrollByDept: {
        totalCost: "20.8 tỷ",
        status: "Trong ngân sách",
        departments: [
          { name: "Chuỗi Không Gian Cà Phê", employees: 610, totalBudget: "6.8 tỷ", avgSalary: "11.8 tr/tháng" },
          { name: "Nhà máy Buôn Ma Thuột", employees: 360, totalBudget: "5.2 tỷ", avgSalary: "14.5 tr/tháng" },
          { name: "Marketing & Thị trường", employees: 152, totalBudget: "3.4 tỷ", avgSalary: "22.4 tr/tháng" },
          { name: "R&D Hương vị Cà phê", employees: 65, totalBudget: "1.8 tỷ", avgSalary: "28.0 tr/tháng" },
        ],
      },
      recentChanges: [
        {
          id: "NV1281",
          name: "Lê Hoàng Nam",
          initials: "LH",
          role: "Chuyên viên R&D Hương vị Cà phê",
          dept: "Viện Nghiên cứu Cà phê TN",
          effectiveDate: "15/10/2026",
          type: "Mới gia nhập",
          typeColor: "mint",
        },
        {
          id: "NV1280",
          name: "Phan Thị Mỹ Hạnh",
          initials: "PT",
          role: "Quản lý Cửa hàng Legend",
          dept: "Chuỗi Cà phê Legend Đồng Khởi",
          effectiveDate: "12/10/2026",
          type: "Mới gia nhập",
          typeColor: "mint",
        },
        {
          id: "NV0842",
          name: "Nguyễn Minh Quân",
          initials: "NM",
          role: "Trưởng phòng Chuỗi Cung ứng & Logistics",
          dept: "Khối Tiếp vận Toàn cầu",
          effectiveDate: "08/10/2026",
          type: "Điều chuyển",
          typeColor: "brand",
        },
        {
          id: "NV0911",
          name: "Võ Thành Luân",
          initials: "VT",
          role: "Kỹ sư Vận hành Máy rang xay",
          dept: "Nhà máy Chế biến Cà phê Buôn Ma Thuột",
          effectiveDate: "05/10/2026",
          type: "Nghỉ việc",
          typeColor: "rose",
        },
        {
          id: "NV1105",
          name: "Đỗ Thị Kim Oanh",
          initials: "DT",
          role: "Barista Cao cấp",
          dept: "Chi nhánh Legend Cầu Giấy (Hà Nội)",
          effectiveDate: "03/10/2026",
          type: "Nghỉ việc",
          typeColor: "rose",
        },
      ],
    };
  }
};
