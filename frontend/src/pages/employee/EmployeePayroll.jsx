import React, { useState, useEffect, useCallback } from "react";

/* ── Sub-components ────────────────────────────────────────────── */
import PayrollHeader from "./components/PayrollHeader";
import PeriodSelector from "./components/PeriodSelector";
import MonthNavigator from "./components/MonthNavigator";
import NetSalaryCard from "./components/NetSalaryCard";
import QuickActions from "./components/QuickActions";
import SalarySummaryBar from "./components/SalarySummaryBar";
import PayrollFAQ from "./components/PayrollFAQ";
import PayrollDetailModal from "./components/PayrollDetailModal";
import BottomNavBar from "../employee/components/BottomNavBar";

/* ── Services ──────────────────────────────────────────────────── */
import {
  getPayrollMonth,
  getPayrollMonths,
  getPayrollYearSummary,
  FALLBACK_PAYROLL,
} from "../../services/payrollService";

/* ── Styles ────────────────────────────────────────────────────── */
import "./EmployeePayroll.css";

/**
 * EmployeePayroll – Trang Bảng Lương & Phiếu Thu Nhập (Employee Portal)
 *
 * API tích hợp:
 *   GET /api/v1/payroll/{ma_nv}/month?thang=&nam=  → Lấy lương 1 tháng
 *   GET /api/v1/payroll/{ma_nv}/months              → Danh sách tháng có lương
 *   GET /api/v1/payroll/{ma_nv}/year?nam=           → Tổng hợp lương cả năm
 *
 * Fallback: Nếu API chưa khả dụng → dùng dữ liệu mẫu FALLBACK_PAYROLL
 */
function EmployeePayroll() {
  /* ── State ───────────────────────────────────────────────────── */
  const [payroll, setPayroll] = useState(FALLBACK_PAYROLL);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [yearSummary, setYearSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(false);      // Ẩn số tiền
  const [viewMode, setViewMode] = useState("month");     // "month" | "year"
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { thang: now.getMonth() + 1, nam: now.getFullYear() };
  });
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Mã NV hiện tại (lấy từ localStorage hoặc mặc định)
  const currentMaNv = localStorage.getItem("ma_nv") || "NV02";

  /* ── Load danh sách tháng khi mount ─────────────────────────── */
  useEffect(() => {
    let mounted = true;
    async function loadMonths() {
      const months = await getPayrollMonths(currentMaNv);
      if (mounted && months.length > 0) {
        setAvailableMonths(months);
        // Tự chọn tháng gần nhất có dữ liệu
        setSelectedMonth({ thang: months[0].thang, nam: months[0].nam });
      }
    }
    loadMonths();
    return () => { mounted = false; };
  }, [currentMaNv]);

  /* ── Load bảng lương khi đổi tháng ──────────────────────────── */
  const loadPayroll = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPayrollMonth(
        currentMaNv,
        selectedMonth.thang,
        selectedMonth.nam
      );
      setPayroll(data);
    } catch (err) {
      console.warn("Dùng dữ liệu dự phòng:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentMaNv, selectedMonth.thang, selectedMonth.nam]);

  useEffect(() => {
    if (viewMode === "month") loadPayroll();
  }, [viewMode, loadPayroll]);

  /* ── Load tổng hợp năm khi đổi sang tab "Cả Năm" ──────────── */
  useEffect(() => {
    if (viewMode !== "year") return;
    let mounted = true;
    async function loadYear() {
      setIsLoading(true);
      try {
        const data = await getPayrollYearSummary(currentMaNv, selectedMonth.nam);
        if (mounted) setYearSummary(data);
      } catch (err) {
        console.warn("Dùng tổng hợp năm dự phòng:", err.message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadYear();
    return () => { mounted = false; };
  }, [viewMode, currentMaNv, selectedMonth.nam]);

  /* ── Handlers ────────────────────────────────────────────────── */
  const handlePrevMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.thang === 1) return { thang: 12, nam: prev.nam - 1 };
      return { thang: prev.thang - 1, nam: prev.nam };
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.thang === 12) return { thang: 1, nam: prev.nam + 1 };
      return { thang: prev.thang + 1, nam: prev.nam };
    });
  };

  const handlePrint = () => {
    // TODO: Tích hợp API xuất PDF khi backend hỗ trợ
    window.print();
  };

  const handleExportExcel = () => {
    // TODO: Tích hợp API xuất Excel khi backend hỗ trợ
    alert("Chức năng xuất Excel/PDF đang phát triển.");
  };

  const handleSendEmail = () => {
    // TODO: Tích hợp API gửi email khi backend hỗ trợ
    alert("Chức năng gửi bản sao qua Email đang phát triển.");
  };

  return (
    <div className="pr-page">
      {/* ── Header ─────────────────────────────────────────────── */}
      <PayrollHeader isLoading={isLoading} />

      {/* ── Nội dung cuộn ──────────────────────────────────────── */}
      <main className="pr-content">
        {/* Bảo mật & Ẩn số tiền */}
        <div className="pr-security-bar">
          <span className="pr-security-badge">
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
              <path d="M8 1L2 4v4c0 3.5 2.5 6.3 6 7 3.5-.7 6-3.5 6-7V4L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M5.5 8l2 2L11 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            BẢO MẬT MÃ HOÁ SSL 256-BIT
          </span>
          <button
            className="pr-hide-toggle"
            onClick={() => setIsHidden((v) => !v)}
            type="button"
          >
            <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
              {isHidden ? (
                <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6zM10 7v0a3 3 0 010 6v0a3 3 0 010-6zM3 3l14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              ) : (
                <>
                  <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.4"/>
                  <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.4"/>
                </>
              )}
            </svg>
            {isHidden ? "Hiện số tiền" : "Ẩn số tiền"}
          </button>
        </div>

        {/* Chọn chế độ xem: Theo Tháng / Cả Năm */}
        <PeriodSelector
          viewMode={viewMode}
          onChangeMode={setViewMode}
          year={selectedMonth.nam}
        />

        {/* Điều hướng tháng */}
        {viewMode === "month" && (
          <MonthNavigator
            month={selectedMonth.thang}
            year={selectedMonth.nam}
            status={payroll.trang_thai}
            onPrev={handlePrevMonth}
            onNext={handleNextMonth}
          />
        )}

        {/* Card lương thực nhận */}
        <NetSalaryCard payroll={payroll} isHidden={isHidden} viewMode={viewMode} yearSummary={yearSummary} />

        {/* Hành động nhanh */}
        <QuickActions
          onPrint={handlePrint}
          onExportExcel={handleExportExcel}
          onSendEmail={handleSendEmail}
        />

        {/* Tổng Gross & Khấu trừ + link chi tiết */}
        <SalarySummaryBar
          payroll={payroll}
          isHidden={isHidden}
          onViewDetail={() => setIsDetailOpen(true)}
        />

        {/* Thắc mắc về bảng lương? */}
        <PayrollFAQ />
      </main>

      {/* ── Bottom Nav ─────────────────────────────────────────── */}
      <BottomNavBar activeTab="payroll" />

      {/* ── Modal chi tiết bảng kê ─────────────────────────────── */}
      <PayrollDetailModal
        isOpen={isDetailOpen}
        payroll={payroll}
        isHidden={isHidden}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}

export default EmployeePayroll;
