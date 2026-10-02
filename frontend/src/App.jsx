import React, { useState, useEffect } from "react";
import Login from "./pages/auth/Login";
import AttendanceDashboard from "./pages/employee/AttendanceDashboard";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeePayroll from "./pages/employee/EmployeePayroll";
import LeaveRequests from "./pages/employee/LeaveRequests";

/**
 * App – Root component tích hợp:
 *   - Login (Trang đăng nhập)
 *   - Chấm công (AttendanceDashboard)
 *   - Bảng lương (EmployeePayroll)
 *   - Hồ sơ cá nhân (EmployeeProfile)
 *
 * Hỗ trợ Hash-based routing (#/attendance, #/payroll, #/profile)
 * và tự động giữ phiên đăng nhập qua localStorage.
 */
function App() {
  const [userSession, setUserSession] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
    if (!savedMaNv) return "login";
    const hash = window.location.hash.replace("#/", "");
    return hash || "attendance";
  });

  // Đồng bộ phiên đăng nhập khi khởi động
  useEffect(() => {
    const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
    const savedToken = localStorage.getItem("auth_token") || localStorage.getItem("access_token");

    if (savedMaNv) {
      setUserSession({
        ma_nv: savedMaNv,
        token: savedToken,
      });
      // Đảm bảo đồng bộ cả 2 khóa để cả attendanceService và apiClient đều dùng được
      localStorage.setItem("user_ma_nv", savedMaNv);
      localStorage.setItem("ma_nv", savedMaNv);
      if (savedToken) {
        localStorage.setItem("auth_token", savedToken);
        localStorage.setItem("access_token", savedToken);
      }
    } else {
      setCurrentPage("login");
    }
  }, []);

  // Lắng nghe thay đổi URL Hash (#/attendance, #/payroll, #/profile)
  useEffect(() => {
    const handleHashChange = () => {
      const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
      if (!savedMaNv) {
        setCurrentPage("login");
        return;
      }
      const hash = window.location.hash.replace("#/", "");
      if (hash) {
        setCurrentPage(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUserSession(userData);
    if (userData?.ma_nv) {
      localStorage.setItem("user_ma_nv", userData.ma_nv);
      localStorage.setItem("ma_nv", userData.ma_nv);
    }
    if (userData?.access_token) {
      localStorage.setItem("auth_token", userData.access_token);
      localStorage.setItem("access_token", userData.access_token);
    }
    window.location.hash = "#/attendance";
    setCurrentPage("attendance");
  };

  const handleLogout = () => {
    localStorage.removeItem("user_ma_nv");
    localStorage.removeItem("ma_nv");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    setUserSession(null);
    window.location.hash = "";
    setCurrentPage("login");
  };

  // Nếu chưa đăng nhập, hiển thị trang Login
  if (!userSession && currentPage === "login") {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center items-start">
        <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] shadow-2xl flex flex-col relative overflow-x-hidden">
          <Login onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  // Điều hướng các trang sau khi đăng nhập
  const renderContent = () => {
    switch (currentPage) {
      case "payroll":
        return <EmployeePayroll userSession={userSession} onLogout={handleLogout} />;
      case "profile":
      case "personal":
        return <EmployeeProfile userSession={userSession} onLogout={handleLogout} />;
      case "requests":
      case "leaves":
        return <LeaveRequests userSession={userSession} onLogout={handleLogout} />;
      case "attendance":
      default:
        return (
          <AttendanceDashboard
            userSession={userSession}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start">
      <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] shadow-2xl flex flex-col relative overflow-x-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
