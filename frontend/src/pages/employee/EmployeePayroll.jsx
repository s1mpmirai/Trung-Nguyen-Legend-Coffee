import React, { useState, useEffect, useCallback } from "react";

/* ── Sub-components ────────────────────────────────────────────── */
import SharedEmployeeHeader from "./components/SharedEmployeeHeader";
import MonthNavigator from "./components/MonthNavigator";
import NetSalaryCard from "./components/NetSalaryCard";
import QuickActions from "./components/QuickActions";
import SalarySummaryBar from "./components/SalarySummaryBar";
import PayrollDetailModal from "./components/PayrollDetailModal";
import BottomNavBar from "./components/BottomNavBar";
import PayrollPrintView from "./components/PayrollPrintView";
import PrintSelectModal from "./components/PrintSelectModal";

/* ── Services ──────────────────────────────────────────────────── */
import {
  getPayrollMonth,
  getPayrollMonths,
  getPayrollYearSummary,
} from "../../services/payrollService";
import { getEmployeeProfile } from "../../services/employeeService";

/* ── Styles ────────────────────────────────────────────────────── */
import "./styles/EmployeePayroll.css";

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
  const [printMode, setPrintMode] = useState("month");   // "month" | "year"
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
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
      try {
        const months = await getPayrollMonths(currentMaNv);
        if (mounted && months && months.length > 0) {
          setAvailableMonths(months);
          // Mặc định chọn tháng đã chốt lương gần nhất từ Database (DA_DUYET hoặc DA_TRA)
          const latestClosed = months.find(
            (m) => m.trang_thai === "DA_DUYET" || m.trang_thai === "DA_TRA"
          ) || months[0];

          if (latestClosed) {
            setSelectedMonth({ thang: latestClosed.thang, nam: latestClosed.nam });
          }
        } else if (mounted) {
          // Nếu DB chưa có bản ghi, tính theo tháng chốt gần nhất của thời gian thực (tháng hiện tại - 1)
          const now = new Date();
          const curM = now.getMonth() + 1;
          const curY = now.getFullYear();
          const prevM = curM === 1 ? 12 : curM - 1;
          const prevY = curM === 1 ? curY - 1 : curY;
          setSelectedMonth({ thang: prevM, nam: prevY });
        }
      } catch (err) {
        console.warn("Lỗi load danh sách tháng:", err);
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

  /* ── 4. Handler chọn tháng/năm trực tiếp ───────────────────────── */
  const handleSelectMonth = (thang, nam) => {
    setSelectedMonth({
      thang: Number(thang),
      nam: Number(nam || selectedMonth.nam),
    });
  };

  const hasData = Boolean(payroll && payroll.hasData);

  const handlePrintMonth = () => {
    if (!hasData) {
      showToast(`Bảng lương Tháng ${selectedMonth.thang}/${selectedMonth.nam} đang được cập nhật, chưa có phiếu để in.`);
      return;
    }
    setPrintMode("month");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Lấy năm vào làm của nhân viên để giới hạn danh sách năm
  const [employeeStartYear, setEmployeeStartYear] = useState(2024);

  useEffect(() => {
    let mounted = true;
    async function loadEmp() {
      try {
        const emp = await getEmployeeProfile(currentMaNv);
        if (mounted && emp?.startDate) {
          // startDate dạng DD/MM/YYYY
          const parts = emp.startDate.split("/");
          if (parts.length === 3) {
            const y = parseInt(parts[2], 10);
            if (!isNaN(y) && y > 1990) setEmployeeStartYear(y);
          }
        }
      } catch (_) {}
    }
    loadEmp();
    return () => { mounted = false; };
  }, [currentMaNv]);

  const handlePrintYear = async (targetYear = selectedMonth.nam) => {
    const yearToPrint = Number(targetYear) || selectedMonth.nam;
    let summary = null;
    try {
      summary = await getPayrollYearSummary(currentMaNv, yearToPrint);
      if (summary) setYearSummary(summary);
    } catch (err) {
      console.warn("Lỗi nạp năm:", err);
    }

    const hasYearData = Boolean(
      summary && (summary.tong_gross > 0 || (summary.chi_tiet_thang && summary.chi_tiet_thang.length > 0))
    );

    if (!hasYearData) {
      showToast(`Dữ liệu bảng lương năm ${yearToPrint} đang được cập nhật, chưa có bảng để in.`);
      return;
    }

    // Cập nhật selectedMonth.nam sang năm muốn in để PayrollPrintView đồng bộ
    setSelectedMonth((prev) => ({ ...prev, nam: yearToPrint }));
    setPrintMode("year");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
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
        {/* Bộ chọn tháng/năm trực tiếp (gọn gàng, canh giữa) */}
        <MonthNavigator
          month={selectedMonth.thang}
          year={selectedMonth.nam}
          availableMonths={availableMonths}
          onSelectMonth={handleSelectMonth}
          startYear={employeeStartYear}
        />

        {/* Card lương thực nhận */}
        <NetSalaryCard
          payroll={payroll}
          isHidden={isHidden}
          onToggleHide={() => setIsHidden((v) => !v)}
          viewMode={viewMode}
          yearSummary={yearSummary}
          month={selectedMonth.thang}
          year={selectedMonth.nam}
        />

        {/* Hành động nhanh */}
        <QuickActions
          onPrint={() => setIsPrintModalOpen(true)}
          onSendEmail={handleSendEmail}
        />

        {/* Tổng Gross & Khấu trừ + link chi tiết */}
        <SalarySummaryBar
          payroll={payroll}
          isHidden={isHidden}
          hasData={hasData}
          onViewDetail={handleViewDetail}
        />
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

      {/* ── Modal chọn in theo tháng hoặc theo năm ─────────────── */}
      <PrintSelectModal
        isOpen={isPrintModalOpen}
        month={selectedMonth.thang}
        year={selectedMonth.nam}
        startYear={employeeStartYear}
        hasMonthData={hasData}
        onClose={() => setIsPrintModalOpen(false)}
        onPrintMonth={handlePrintMonth}
        onPrintYear={handlePrintYear}
      />

      {/* ── Bản in chính thức (Theo tháng / Theo năm) ──────────── */}
      <PayrollPrintView
        printMode={printMode}
        payroll={payroll}
        yearSummary={yearSummary}
        month={selectedMonth.thang}
        year={selectedMonth.nam}
      />
    </div>
  );
}

export default EmployeePayroll;
