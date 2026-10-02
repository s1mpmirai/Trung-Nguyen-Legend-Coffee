import React, { useState, useEffect } from "react";
import Login from "./pages/auth/Login";
import AttendanceDashboard from "./pages/employee/AttendanceDashboard";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeePayroll from "./pages/employee/EmployeePayroll";
import LeaveRequests from "./pages/employee/LeaveRequests";
import ManagerDashboard from "./pages/manager/ManagerDashboard";

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

// Kiểm tra role có quyền quản lý hay không (ADMIN, QUAN_LY, TRUONG_NHOM)
const isManagerRole = (role) => {
  if (!role) return false;
  const upper = String(role).toUpperCase();
  return upper === "ADMIN" || upper === "QUAN_LY" || upper === "TRUONG_NHOM";
};

function App() {
  const [userSession, setUserSession] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
    if (!savedMaNv) return "login";

    const savedRole = localStorage.getItem("user_role");
    const hash = window.location.hash.replace("#/", "");

    if (hash && hash.startsWith("manager")) {
      // Chỉ cho phép truy cập nếu tài khoản có quyền Quản lý
      if (isManagerRole(savedRole)) {
        return hash;
      }
      window.location.hash = "#/attendance";
      return "attendance";
    }

    return hash || (isManagerRole(savedRole) ? "manager" : "attendance");
  });

  // Đồng bộ phiên đăng nhập khi khởi động
  useEffect(() => {
    const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
    const savedToken = localStorage.getItem("auth_token") || localStorage.getItem("access_token");
    const savedRole = localStorage.getItem("user_role");

    if (savedMaNv) {
      setUserSession({
        ma_nv: savedMaNv,
        token: savedToken,
        role: savedRole,
      });
      // Đảm bảo đồng bộ các khóa để các service dùng được
      localStorage.setItem("user_ma_nv", savedMaNv);
      localStorage.setItem("ma_nv", savedMaNv);
      if (savedToken) {
        localStorage.setItem("auth_token", savedToken);
        localStorage.setItem("access_token", savedToken);
      }
      if (savedRole) {
        localStorage.setItem("user_role", savedRole);
      }
    } else {
      setCurrentPage("login");
    }
  }, []);

  // Lắng nghe thay đổi URL Hash với Route Guard phân quyền chặt chẽ
  useEffect(() => {
    const handleHashChange = () => {
      const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
      if (!savedMaNv) {
        setCurrentPage("login");
        return;
      }

      const savedRole = localStorage.getItem("user_role");
      const hash = window.location.hash.replace("#/", "");

      // Chặn nhân viên không có quyền quản lý truy cập #/manager
      if (hash && hash.startsWith("manager")) {
        if (isManagerRole(savedRole)) {
          setCurrentPage(hash);
        } else {
          // Nhân viên thường không có quyền -> đưa về trang Chấm công
          alert("Bạn không có quyền truy cập vào khu vực Quản lý.");
          window.location.hash = "#/attendance";
          setCurrentPage("attendance");
        }
        return;
      }

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
    if (userData?.token || userData?.access_token) {
      const token = userData.token || userData.access_token;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("access_token", token);
    }
    if (userData?.role) {
      localStorage.setItem("user_role", userData.role);
    }

    // Điều hướng theo Role: Quản lý vào #/manager, Nhân viên vào #/attendance
    if (isManagerRole(userData?.role)) {
      window.location.hash = "#/manager";
      setCurrentPage("manager");
    } else {
      window.location.hash = "#/attendance";
      setCurrentPage("attendance");
    }
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

  // 1. Nếu chưa đăng nhập, hiển thị trang Login
  if (!userSession || currentPage === "login") {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center items-start">
        <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] shadow-2xl flex flex-col relative overflow-x-hidden">
          <Login onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  // 2. Nếu vào trang quản lý (#/manager), kiểm tra quyền quản lý
  if (currentPage.startsWith("manager")) {
    const role = userSession?.role || localStorage.getItem("user_role");
    if (isManagerRole(role)) {
      return (
        <ManagerDashboard
          userSession={userSession}
          onLogout={handleLogout}
        />
      );
    }
    // Nếu không có quyền, chuyển về chấm công
    window.location.hash = "#/attendance";
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
