import React, { useState, useEffect, useCallback } from "react";

/* ── Sub-components ────────────────────────────────────────────── */
import SharedEmployeeHeader from "./components/SharedEmployeeHeader";
import PeriodSelector from "./components/PeriodSelector";
import MonthNavigator from "./components/MonthNavigator";
import NetSalaryCard from "./components/NetSalaryCard";
import QuickActions from "./components/QuickActions";
import SalarySummaryBar from "./components/SalarySummaryBar";
import PayrollFAQ from "./components/PayrollFAQ";
import PayrollDetailModal from "./components/PayrollDetailModal";
import BottomNavBar from "./components/BottomNavBar";

/* ── Services ──────────────────────────────────────────────────── */
import {
  getPayrollMonth,
  getPayrollMonths,
  getPayrollYearSummary,
} from "../../services/payrollService";

/* ── Styles ────────────────────────────────────────────────────── */
import "./EmployeePayroll.css";

/**
 * EmployeePayroll – Trang Bảng Lương & Phiếu Thu Nhập (Employee Portal)
 *
 * Logic hiển thị:
 *   - Nếu tháng đã có bảng lương trong DB -> Hiển thị số tiền, chi tiết và trạng thái.
 *   - Nếu tháng chưa có bảng lương -> Hiển thị "Đang cập nhật".
 */
function EmployeePayroll({ userSession, onLogout }) {
  /* ── State ───────────────────────────────────────────────────── */
  const [payroll, setPayroll] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [yearSummary, setYearSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(true);      // Mặc định ẩn số tiền để bảo mật
  const [viewMode, setViewMode] = useState("month");     // "month" | "year"
  const [selectedMonth, setSelectedMonth] = useState({ thang: 8, nam: 2026 });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Mã NV hiện tại
  const currentMaNv =
    userSession?.ma_nv ||
    localStorage.getItem("user_ma_nv") ||
    localStorage.getItem("ma_nv") ||
    "NV02";

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  /* ── 1. Load danh sách các tháng có bảng lương khi mount ────────── */
  useEffect(() => {
    let mounted = true;
    async function loadMonths() {
      const months = await getPayrollMonths(currentMaNv);
      if (mounted && months && months.length > 0) {
        setAvailableMonths(months);
        // Tự động chuyển tới kỳ lương gần nhất có dữ liệu
        setSelectedMonth({ thang: months[0].thang, nam: months[0].nam });
      }
    }
    loadMonths();
    return () => { mounted = false; };
  }, [currentMaNv]);

  /* ── 2. Load bảng lương khi đổi tháng ──────────────────────────── */
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
      console.warn("Không thể tải bảng lương:", err.message);
      setPayroll(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentMaNv, selectedMonth.thang, selectedMonth.nam]);

  useEffect(() => {
    if (viewMode === "month") loadPayroll();
  }, [viewMode, loadPayroll]);

  /* ── 3. Load tổng hợp năm khi đổi sang tab "Cả Năm" ──────────── */
  useEffect(() => {
    if (viewMode !== "year") return;
    let mounted = true;
    async function loadYear() {
      setIsLoading(true);
      try {
        const data = await getPayrollYearSummary(currentMaNv, selectedMonth.nam);
        if (mounted) setYearSummary(data);
      } catch (err) {
        console.warn("Lỗi tải tổng hợp năm:", err.message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadYear();
    return () => { mounted = false; };
  }, [viewMode, currentMaNv, selectedMonth.nam]);

  /* ── 4. Handlers điều hướng tháng ────────────────────────────── */
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

  const hasData = Boolean(payroll && payroll.hasData);

  const handlePrint = () => {
    if (!hasData) {
      showToast(`Bảng lương Tháng ${selectedMonth.thang}/${selectedMonth.nam} đang được cập nhật, chưa có phiếu để in.`);
      return;
    }
    window.print();
  };

  const handleExportExcel = () => {
    if (!hasData) {
      showToast(`Dữ liệu Tháng ${selectedMonth.thang}/${selectedMonth.nam} đang được cập nhật.`);
      return;
    }
    showToast("Chức năng xuất Excel/PDF đang được đồng bộ");
  };

  const handleSendEmail = () => {
    if (!hasData) {
      showToast(`Dữ liệu Tháng ${selectedMonth.thang}/${selectedMonth.nam} đang được cập nhật.`);
      return;
    }
    showToast("Bản sao bảng lương đã được gửi đến email nội bộ");
  };

  const handleViewDetail = () => {
    if (!hasData) {
      showToast(`Bảng lương Tháng ${selectedMonth.thang}/${selectedMonth.nam} đang được cập nhật, chưa có bảng kê chi tiết.`);
      return;
    }
    setIsDetailOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen pb-24 relative">
      {/* ── Toast thông báo ────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 animate-bounce">
          <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between text-xs font-semibold border border-slate-700 backdrop-blur-md">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage("")} className="ml-2 text-slate-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* ── Header TrungNguyenHR chung ─────────────────────────── */}
      <SharedEmployeeHeader
        onLogout={onLogout}
        onNotificationClick={() => showToast("Bạn có 1 thông báo mới từ Phòng Kế toán & Nhân sự")}
      />

      {/* ── Banner tiêu đề trang ────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-1">
        <span className="text-[11px] font-extrabold tracking-wider text-[#0EA5E9] uppercase block">
          THU NHẬP & PHÚC LỢI
        </span>
        <h2 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
          Bảng lương & Thu nhập
        </h2>
      </div>

      {/* ── Nội dung chính ─────────────────────────────────────── */}
      <main className="px-4 py-2 space-y-3.5">
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
            status={hasData ? payroll?.trang_thai : null}
            onPrev={handlePrevMonth}
            onNext={handleNextMonth}
          />
        )}

        {/* Card lương thực nhận */}
        <NetSalaryCard
          payroll={payroll}
          isHidden={isHidden}
          viewMode={viewMode}
          yearSummary={yearSummary}
          month={selectedMonth.thang}
          year={selectedMonth.nam}
        />

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
          hasData={hasData}
          onViewDetail={handleViewDetail}
        />

        {/* Thắc mắc về bảng lương? */}
        <PayrollFAQ />
      </main>

      {/* ── Thanh điều hướng dưới cùng ─────────────────────────── */}
      <BottomNavBar activeTab="payroll" />

      {/* ── Modal chi tiết bảng kê ─────────────────────────────── */}
      {hasData && (
        <PayrollDetailModal
          isOpen={isDetailOpen}
          payroll={payroll}
          isHidden={isHidden}
          onToggleHidden={(val) => setIsHidden(val)}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </div>
  );
}

export default EmployeePayroll;
