import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

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
import EmployeeToast from "./components/EmployeeToast";
import useToast from "./utils/useToast";
import { getApiErrorMessage, isAbortError } from "./utils/format";

/* ── Services ──────────────────────────────────────────────────── */
import {
  getPayrollMonth,
  getPayrollMonths,
  getPayrollYearSummary,
} from "../../services/payrollService";
import { getEmployeeProfile } from "../../services/employeeService";

/* ── Styles ────────────────────────────────────────────────────── */
import "./styles/EmployeePayroll.css";

// Lớp gắn vào <body> khi trang Bảng lương đang mở: CSS in chỉ ẩn giao diện app (#root) khi có lớp này
const PRINT_SCOPE_CLASS = "tnl-payroll-print";

const isOfficial = (m) => m?.trang_thai === "DA_DUYET" || m?.trang_thai === "DA_TRA";

/**
 * EmployeePayroll – Trang Bảng Lương & Phiếu Thu Nhập (Employee Portal)
 *
 * Logic hiển thị:
 *   - Nhân viên chỉ nhận bảng lương ĐÃ DUYỆT / ĐÃ CHI TRẢ; tháng còn ở bản nháp -> API trả null
 *     -> hiển thị "Bảng lương tháng này đang chờ phòng Nhân sự duyệt".
 *   - Mỗi lần đổi tháng: hủy yêu cầu cũ (AbortController) + bỏ qua phản hồi cũ (request id),
 *     nên màn hình và bản in không bao giờ hiển thị dữ liệu của tháng khác.
 *   - In: dữ liệu cần in được "chụp" vào printJob, nên in bảng năm không làm đổi năm đang xem.
 */
function EmployeePayroll({ userSession, onLogout }) {
  /* ── State ───────────────────────────────────────────────────── */
  const [availableMonths, setAvailableMonths] = useState([]);
  const [monthsLoaded, setMonthsLoaded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Mặc định tháng liền trước; sẽ chuyển sang tháng có lương gần nhất khi danh sách tháng tải xong
    const now = new Date();
    return now.getMonth() === 0
      ? { thang: 12, nam: now.getFullYear() - 1 }
      : { thang: now.getMonth(), nam: now.getFullYear() };
  });
  // status: "loading" | "ready" | "empty" | "error"
  const [payrollState, setPayrollState] = useState({ status: "loading", data: null, error: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const [isHidden, setIsHidden] = useState(true); // Mặc định ẩn số tiền để bảo mật
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printJob, setPrintJob] = useState(null); // { mode: "month" | "year", payroll?, summary?, year? }
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [profile, setProfile] = useState(null);
  const requestIdRef = useRef(0);

  const { toast, showToast, hideToast } = useToast(4500);

  // Mã NV hiện tại
  const currentMaNv = userSession?.ma_nv || localStorage.getItem("user_ma_nv");

  /* ── 0. Phạm vi CSS in: chỉ áp dụng khi trang này đang mở ──────── */
  useEffect(() => {
    document.body.classList.add(PRINT_SCOPE_CLASS);
    return () => document.body.classList.remove(PRINT_SCOPE_CLASS);
  }, []);

  /* ── 1. Danh sách các tháng có bảng lương chính thức ──────────── */
  useEffect(() => {
    let mounted = true;
    getPayrollMonths(currentMaNv)
      .then((months) => {
        if (!mounted) return;
        const list = Array.isArray(months) ? months : [];
        setAvailableMonths(list);
        // Mặc định chọn tháng đã duyệt / đã chi trả gần nhất
        const latest = list.find(isOfficial);
        if (latest) setSelectedMonth({ thang: Number(latest.thang), nam: Number(latest.nam) });
      })
      .catch((err) => console.warn("Lỗi tải danh sách tháng lương:", err?.message))
      .finally(() => {
        if (mounted) setMonthsLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [currentMaNv]);

  /* ── 2. Hồ sơ (năm vào làm, phòng ban, người phụ thuộc cho bản in) ── */
  useEffect(() => {
    let mounted = true;
    getEmployeeProfile(currentMaNv).then((emp) => {
      if (mounted && emp) setProfile(emp);
    });
    return () => {
      mounted = false;
    };
  }, [currentMaNv]);

  /* ── 3. Bảng lương của kỳ đang chọn (chống race khi đổi tháng nhanh) ── */
  useEffect(() => {
    if (!monthsLoaded) return undefined;
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    setPayrollState({ status: "loading", data: null, error: "" });
    setIsDetailOpen(false);

    getPayrollMonth(currentMaNv, selectedMonth.thang, selectedMonth.nam, { signal: controller.signal })
      .then((data) => {
        if (requestId !== requestIdRef.current) return; // phản hồi của tháng cũ -> bỏ qua
        setPayrollState({ status: data ? "ready" : "empty", data, error: "" });
      })
      .catch((err) => {
        if (isAbortError(err) || requestId !== requestIdRef.current) return;
        setPayrollState({
          status: "error",
          data: null,
          error: getApiErrorMessage(err, "Không tải được bảng lương. Vui lòng thử lại."),
        });
      });

    return () => controller.abort();
  }, [monthsLoaded, currentMaNv, selectedMonth.thang, selectedMonth.nam, reloadKey]);

  // Chỉ dùng dữ liệu khớp đúng kỳ đang chọn (lớp bảo vệ thứ hai)
  const payroll =
    payrollState.status === "ready" &&
    Number(payrollState.data?.thang) === selectedMonth.thang &&
    Number(payrollState.data?.nam) === selectedMonth.nam
      ? payrollState.data
      : null;
  const viewStatus = !monthsLoaded ? "loading" : payrollState.status === "ready" && !payroll ? "loading" : payrollState.status;
  const hasData = Boolean(payroll);

  /* ── 4. Chọn tháng/năm ─────────────────────────────────────────── */
  const handleSelectMonth = useCallback((thang, nam) => {
    setSelectedMonth((prev) => {
      const next = { thang: Number(thang), nam: Number(nam || prev.nam) };
      return next.thang === prev.thang && next.nam === prev.nam ? prev : next;
    });
  }, []);

  /* ── 5. In ấn ──────────────────────────────────────────────────── */
  // Gọi window.print() sau khi bản in đã render xong dữ liệu của printJob
  useEffect(() => {
    if (!printJob) return undefined;
    const handleAfterPrint = () => setPrintJob(null);
    window.addEventListener("afterprint", handleAfterPrint);
    const timer = setTimeout(() => window.print(), 80);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printJob]);

  const handlePrintMonth = () => {
    if (!payroll) {
      showToast(`Tháng ${selectedMonth.thang}/${selectedMonth.nam} chưa có phiếu lương đã duyệt để in.`, "info");
      return;
    }
    setPrintJob({ mode: "month", payroll });
  };

  const handlePrintYear = async (targetYear) => {
    const yearToPrint = Number(targetYear) || selectedMonth.nam;
    setIsPreparingPrint(true);
    try {
      const summary = await getPayrollYearSummary(currentMaNv, yearToPrint);
      const hasYearData = Boolean(summary && Array.isArray(summary.chi_tiet_thang) && summary.chi_tiet_thang.length > 0);
      if (!hasYearData) {
        showToast(`Năm ${yearToPrint} chưa có bảng lương đã duyệt nào để in.`, "info");
        return;
      }
      // Chỉ chụp dữ liệu vào printJob – KHÔNG đổi năm đang xem trên màn hình
      setPrintJob({ mode: "year", summary, year: yearToPrint });
    } catch (err) {
      showToast(getApiErrorMessage(err, `Không tải được bảng lương năm ${yearToPrint}.`), "error");
    } finally {
      setIsPreparingPrint(false);
    }
  };

  const handleViewDetail = () => {
    if (!payroll) return;
    setIsDetailOpen(true);
  };

  const printMode = printJob?.mode || "month";

  return (
    <div className="flex-1 flex flex-col bg-cream min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] relative">
      <EmployeeToast message={toast?.message} type={toast?.type} onClose={hideToast} />

      {/* ── Header TrungNguyenHR chung ─────────────────────────── */}
      <SharedEmployeeHeader onLogout={onLogout} />

      {/* ── Banner tiêu đề trang ────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-1">
        <span className="text-[11px] font-extrabold tracking-wider text-gold-700 uppercase block">
          Thu nhập & Phúc lợi
        </span>
        <h1 className="text-xl font-extrabold text-coffee-900 leading-tight mt-0.5">
          Bảng lương & Thu nhập
        </h1>
      </div>

      {/* ── Nội dung chính ─────────────────────────────────────── */}
      <main className="px-4 py-2 space-y-3.5">
        <MonthNavigator
          month={selectedMonth.thang}
          year={selectedMonth.nam}
          availableMonths={availableMonths}
          onSelectMonth={handleSelectMonth}
          startYear={profile?.startYear}
          disabled={!monthsLoaded}
        />

        <NetSalaryCard
          status={viewStatus}
          payroll={payroll}
          errorMessage={payrollState.error}
          onRetry={() => setReloadKey((k) => k + 1)}
          isHidden={isHidden}
          onToggleHide={() => setIsHidden((v) => !v)}
          month={selectedMonth.thang}
          year={selectedMonth.nam}
        />

        <QuickActions
          onPrintMonth={handlePrintMonth}
          onPrintYear={() => setIsPrintModalOpen(true)}
          canPrintMonth={hasData}
          disabled={isPreparingPrint}
        />

        {hasData && (
          <SalarySummaryBar payroll={payroll} isHidden={isHidden} onViewDetail={handleViewDetail} />
        )}
      </main>

      {/* ── Thanh điều hướng dưới cùng ─────────────────────────── */}
      <BottomNavBar activeTab="payroll" />

      {/* ── Modal bảng kê chi tiết & cách tính lương ───────────── */}
      <PayrollDetailModal
        isOpen={isDetailOpen && hasData}
        payroll={payroll}
        isHidden={isHidden}
        onToggleHidden={() => setIsHidden((v) => !v)}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* ── Modal chọn in theo tháng hoặc theo năm ─────────────── */}
      <PrintSelectModal
        isOpen={isPrintModalOpen}
        month={selectedMonth.thang}
        year={selectedMonth.nam}
        availableMonths={availableMonths}
        hasMonthData={hasData}
        isPreparing={isPreparingPrint}
        onClose={() => setIsPrintModalOpen(false)}
        onPrintMonth={handlePrintMonth}
        onPrintYear={handlePrintYear}
      />

      {/* ── Bản in A4 chính thức: gắn trực tiếp vào <body> để không bị giới hạn bởi khung max-w-md ── */}
      {createPortal(
        <PayrollPrintView
          mode={printMode}
          payroll={printMode === "month" ? (printJob?.payroll || payroll) : null}
          yearSummary={printMode === "year" ? printJob?.summary : null}
          year={printJob?.year}
          employee={profile}
        />,
        document.body
      )}
    </div>
  );
}

export default EmployeePayroll;
