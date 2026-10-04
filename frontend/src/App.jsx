import React, { useState, useEffect } from "react";
import Login from "./pages/auth/Login";
import AdminManagerLogin from "./pages/auth/AdminManagerLogin";
import AttendanceDashboard from "./pages/employee/AttendanceDashboard";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeePayroll from "./pages/employee/EmployeePayroll";
import LeaveRequests from "./pages/employee/LeaveRequests";
import ManagerDashboard from "./pages/manager/ManagerDashboard";

/**
 * App – Root component tích hợp:
 *   - Login Nhân viên (#/login)
 *   - Login Quản lý & Admin (#/login-manager, #/login-admin)
 *   - Chấm công (AttendanceDashboard)
 *   - Bảng lương (EmployeePayroll)
 *   - Hồ sơ cá nhân (EmployeeProfile)
 *   - Quản lý & Admin Portal (ManagerDashboard)
 *
 * Hỗ trợ Hash-based routing (#/attendance, #/payroll, #/profile, #/manager, #/login-manager, #/login-admin)
 * và tự động giữ phiên đăng nhập qua localStorage.
 */

// Lấy route hiện tại từ pathname hoặc hash (chuẩn hóa bỏ dấu / và #)
const getCleanRoute = () => {
  const hash = window.location.hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  return path || hash || "";
};

// Điều hướng URL sạch (Clean pathname không có dấu #)
const navigateClean = (route) => {
  const clean = String(route || "").replace(/^#\/?/, "").replace(/^\/+/, "");
  const targetUrl = clean ? `/${clean}` : "/";
  if (window.location.pathname !== targetUrl) {
    window.history.pushState(null, "", targetUrl);
  }
  if (window.location.hash) {
    window.history.replaceState(null, "", targetUrl);
  }
  window.dispatchEvent(new Event("app-route-change"));
};

// Kiểm tra role có quyền quản lý hay không (ADMIN, QUAN_LY, TRUONG_NHOM)
const isManagerRole = (role) => {
  if (!role) return false;
  const upper = String(role).toUpperCase();
  return upper === "ADMIN" || upper === "QUAN_LY" || upper === "TRUONG_NHOM";
};

function App() {
  const [userSession, setUserSession] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const route = getCleanRoute();
    if (route === "login-admin" || route === "login-manager" || route === "login") {
      return route;
    }

    const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
    if (!savedMaNv) {
      if (route === "login-admin" || route === "login-manager") return route;
      return "login";
    }

    const savedRole = localStorage.getItem("user_role");

    if (route && route.startsWith("manager")) {
      // Chỉ cho phép truy cập nếu tài khoản có quyền Quản lý
      if (isManagerRole(savedRole)) {
        return route;
      }
      navigateClean("attendance");
      return "attendance";
    }

    return route || (isManagerRole(savedRole) ? "manager" : "attendance");
  });

  // Đồng bộ phiên đăng nhập khi khởi động
  useEffect(() => {
    const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
    const savedToken = localStorage.getItem("auth_token") || localStorage.getItem("access_token");
    const savedRole = localStorage.getItem("user_role");
    const route = getCleanRoute();

    // Nếu URL còn dấu #, chuẩn hóa ngay thành clean pathname
    if (window.location.hash) {
      const clean = window.location.hash.replace(/^#\/?/, "");
      window.history.replaceState(null, "", clean ? `/${clean}` : "/");
    }

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
      if (route === "login-admin" || route === "login-manager") {
        setCurrentPage(route);
      } else {
        setCurrentPage("login");
      }
    }
  }, []);

  // Lắng nghe thay đổi URL (popstate, hashchange, custom event) với Route Guard phân quyền chặt chẽ
  useEffect(() => {
    const handleRouteSync = () => {
      const route = getCleanRoute();

      // Nếu còn hash thì xóa hash để URL sạch 100%
      if (window.location.hash) {
        const clean = window.location.hash.replace(/^#\/?/, "");
        window.history.replaceState(null, "", clean ? `/${clean}` : "/");
      }

      // Cho phép mở trang đăng nhập chuyên biệt bất kể trạng thái session
      if (route === "login-admin" || route === "login-manager" || route === "login") {
        setCurrentPage(route);
        return;
      }

      const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
      if (!savedMaNv) {
        if (route === "login-admin" || route === "login-manager") {
          setCurrentPage(route);
        } else {
          setCurrentPage("login");
        }
        return;
      }

      const savedRole = localStorage.getItem("user_role");

      // Chặn nhân viên không có quyền quản lý truy cập /manager
      if (route && route.startsWith("manager")) {
        if (isManagerRole(savedRole)) {
          setCurrentPage(route);
        } else {
          alert("Bạn không có quyền truy cập vào khu vực Quản lý.");
          navigateClean("attendance");
          setCurrentPage("attendance");
        }
        return;
      }

      if (route) {
        setCurrentPage(route);
      }
    };

    window.addEventListener("popstate", handleRouteSync);
    window.addEventListener("hashchange", handleRouteSync);
    window.addEventListener("app-route-change", handleRouteSync);
    return () => {
      window.removeEventListener("popstate", handleRouteSync);
      window.removeEventListener("hashchange", handleRouteSync);
      window.removeEventListener("app-route-change", handleRouteSync);
    };
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

    // Điều hướng sạch: Quản lý / Admin vào /manager, Nhân viên vào /attendance
    if (isManagerRole(userData?.role)) {
      navigateClean("manager");
      setCurrentPage("manager");
    } else {
      navigateClean("attendance");
      setCurrentPage("attendance");
    }
  };

  const handleLogout = () => {
    const prevRole = userSession?.role || localStorage.getItem("user_role");
    localStorage.removeItem("user_ma_nv");
    localStorage.removeItem("ma_nv");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    setUserSession(null);

    // Chuyển về đúng trang đăng nhập tương ứng vai trò vừa đăng xuất (URL sạch)
    if (String(prevRole).toUpperCase() === "ADMIN") {
      navigateClean("login-admin");
      setCurrentPage("login-admin");
    } else if (isManagerRole(prevRole)) {
      navigateClean("login-manager");
      setCurrentPage("login-manager");
    } else {
      navigateClean("login");
      setCurrentPage("login");
    }
  };

  // 1. Nếu chưa đăng nhập hoặc đang ở các trang đăng nhập
  const isLoginPage = currentPage === "login" || currentPage === "login-admin" || currentPage === "login-manager";
  if (!userSession || isLoginPage) {
    if (currentPage === "login-admin" || currentPage === "login-manager") {
      return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-sky-50/40 to-slate-200 flex flex-col justify-center items-center">
          <AdminManagerLogin
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 flex justify-center items-start">
        <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] shadow-2xl flex flex-col relative overflow-x-hidden">
          <Login onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  // 2. Nếu vào trang quản lý (/manager), kiểm tra quyền quản lý
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
    navigateClean("attendance");
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
