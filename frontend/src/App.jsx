import React, { useState, useEffect } from "react";
import Login from "./pages/auth/Login";
import AdminManagerLogin from "./pages/auth/AdminManagerLogin";
import AttendanceDashboard from "./pages/employee/AttendanceDashboard";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeePayroll from "./pages/employee/EmployeePayroll";
import LeaveRequests from "./pages/employee/LeaveRequests";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FirstTimePasswordModal from "./components/common/FirstTimePasswordModal";
import { getCleanRoute, navigateClean } from "./utils/navigation";

/**
 * App – Root component tích hợp:
 *   - Login Nhân viên (/login)
 *   - Login Quản lý & Admin (/login-manage, /login-manager, /login-admin)
 *   - Cổng Quản Trị Tối Cao (/admin) - Dành riêng cho NV01 / ADMIN
 *   - Cổng Quản lý & Điều hành (/manager) - Dành cho QUAN_LY, TRUONG_NHOM, ADMIN
 *   - Chấm công (/attendance)
 *   - Bảng lương (/payroll)
 *   - Hồ sơ cá nhân (/profile)
 *   - Nghỉ phép & Đơn từ (/requests, /leaves)
 *
 * Hỗ trợ Clean Pathname routing và tự động giữ phiên đăng nhập qua localStorage.
 */

// Kiểm tra role có quyền Admin tối cao hay không (ADMIN hoặc NV01)
const isAdminRole = (role, ma_nv) => {
  if (ma_nv && String(ma_nv).toUpperCase() === "NV01") return true;
  if (!role) return false;
  return String(role).toUpperCase() === "ADMIN";
};

// Kiểm tra role có quyền quản lý hay không (ADMIN, QUAN_LY, TRUONG_NHOM)
const isManagerRole = (role) => {
  if (!role) return false;
  const upper = String(role).toUpperCase();
  return upper === "ADMIN" || upper === "QUAN_LY" || upper === "TRUONG_NHOM";
};

// Kiểm tra route đăng nhập quản lý & admin (Thống nhất 1 đường dẫn: login-manage)
const isManagerLoginRoute = (route) => {
  return route === "login-manage" || route === "login-manager" || route === "login-admin";
};

function App() {
  const [userSession, setUserSession] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Điều hướng người dùng vào đúng cổng theo phân quyền vai trò
  const routeUserToPortal = (role, maNv) => {
    let target = "attendance";
    if (isAdminRole(role, maNv)) {
      target = "admin";
    } else if (isManagerRole(role)) {
      target = "manager";
    }
    window.history.replaceState({ inApp: true, page: target }, "", `/${target}`);
    setCurrentPage(target);
  };
  const [currentPage, setCurrentPage] = useState(() => {
    const route = getCleanRoute();
    if (isManagerLoginRoute(route)) {
      if (route !== "login-manage") {
        window.history.replaceState(null, "", "/login-manage");
      }
      return "login-manage";
    }
    if (route === "login") {
      return "login";
    }

    const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
    if (!savedMaNv) {
      if (isManagerLoginRoute(route)) {
        window.history.replaceState(null, "", "/login-manage");
        return "login-manage";
      }
      return "login";
    }

    const savedRole = localStorage.getItem("user_role");

    // Nếu vào route admin (/admin)
    if (route && route.startsWith("admin")) {
      if (isAdminRole(savedRole, savedMaNv)) {
        return route;
      }
      if (isManagerRole(savedRole)) {
        navigateClean("manager");
        return "manager";
      }
      navigateClean("attendance");
      return "attendance";
    }

    // Nếu vào route quản lý (/manager)
    if (route && route.startsWith("manager")) {
      if (isManagerRole(savedRole)) {
        return route;
      }
      navigateClean("attendance");
      return "attendance";
    }

    // Route mặc định theo quyền hạn:
    if (isAdminRole(savedRole, savedMaNv)) return "admin";
    if (isManagerRole(savedRole)) return "manager";
    return route || "attendance";
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
      localStorage.setItem("user_ma_nv", savedMaNv);
      localStorage.setItem("ma_nv", savedMaNv);
      if (savedToken) {
        localStorage.setItem("auth_token", savedToken);
        localStorage.setItem("access_token", savedToken);
      }
      if (savedRole) {
        localStorage.setItem("user_role", savedRole);
      }
      if (!window.history.state || !window.history.state.inApp) {
        window.history.replaceState({ inApp: true, page: route || "attendance" }, "", window.location.pathname);
      }
    } else {
      if (isManagerLoginRoute(route)) {
        if (route !== "login-manage") {
          window.history.replaceState(null, "", "/login-manage");
        }
        setCurrentPage("login-manage");
      } else {
        setCurrentPage("login");
      }
    }
  }, []);

  // Lắng nghe thay đổi URL (popstate, hashchange, custom event) với Route Guard và Bảo mật nút Quay lại (Back button)
  useEffect(() => {
    // 1. Khi ấn nút Quay lại (Back/Forward) của trình duyệt:
    // Hủy toàn bộ phiên làm việc, KHÔNG cho phép khôi phục session trước, out ngay ra trang đăng nhập tương ứng vai trò
    const handlePopState = (e) => {
      const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
      const savedRole = localStorage.getItem("user_role");

      if (savedMaNv) {
        // Nếu là điều hướng lịch sử trong ứng dụng: cho phép điều hướng bình thường
        if (e.state && e.state.inApp) {
          handleRouteSync();
          return;
        }

        const isMgrOrAdmin = isAdminRole(savedRole, savedMaNv) || isManagerRole(savedRole);
        localStorage.removeItem("user_ma_nv");
        localStorage.removeItem("ma_nv");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_role");
        setUserSession(null);
        setMustChangePassword(false);

        const targetLogin = isMgrOrAdmin ? "login-manage" : "login";
        window.history.replaceState(null, "", `/${targetLogin}`);
        setCurrentPage(targetLogin);
        return;
      }

      // Nếu không có session (đang ở các trang login), đồng bộ điều hướng bình thường
      handleRouteSync();
    };

    // 2. Đồng bộ route nội bộ (App Route Change / Hash Change)
    const handleRouteSync = () => {
      const route = getCleanRoute();

      // Nếu còn hash thì xóa hash để URL sạch 100%
      if (window.location.hash) {
        const clean = window.location.hash.replace(/^#\/?/, "");
        window.history.replaceState(null, "", clean ? `/${clean}` : "/");
      }

      // Cho phép mở trang đăng nhập chuyên biệt bất kể trạng thái session
      if (isManagerLoginRoute(route)) {
        if (route !== "login-manage") {
          window.history.replaceState(null, "", "/login-manage");
        }
        setCurrentPage("login-manage");
        return;
      }
      if (route === "login") {
        setCurrentPage("login");
        return;
      }

      const savedMaNv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
      if (!savedMaNv) {
        // Chưa đăng nhập mà truy cập route của quản lý/admin -> về login-manage
        if (route.startsWith("admin") || route.startsWith("manager") || isManagerLoginRoute(route)) {
          if (route !== "login-manage") {
            window.history.replaceState(null, "", "/login-manage");
          }
          setCurrentPage("login-manage");
        } else {
          window.history.replaceState(null, "", "/login");
          setCurrentPage("login");
        }
        return;
      }

      const savedRole = localStorage.getItem("user_role");

      // Chặn nếu không có quyền admin truy cập /admin
      if (route && route.startsWith("admin")) {
        if (isAdminRole(savedRole, savedMaNv)) {
          setCurrentPage(route);
        } else if (isManagerRole(savedRole)) {
          alert("Khu vực Cổng Admin Tối Cao chỉ dành cho Quản trị viên (NV01).");
          navigateClean("manager");
          setCurrentPage("manager");
        } else {
          alert("Bạn không có quyền truy cập vào Cổng Quản trị viên.");
          navigateClean("attendance");
          setCurrentPage("attendance");
        }
        return;
      }

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

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handleRouteSync);
    window.addEventListener("app-route-change", handleRouteSync);
    return () => {
      window.removeEventListener("popstate", handlePopState);
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

    // BẮT BUỘC: Nếu là tài khoản vừa tạo/dùng mật khẩu khởi tạo mặc định -> Đổi mật khẩu đầu tiên
    if (userData?.must_change_password) {
      setMustChangePassword(true);
      return;
    }

    // Điều hướng vào đúng cổng theo phân quyền:
    routeUserToPortal(userData?.role, userData?.ma_nv);
  };

  const handlePasswordChanged = (updatedSession) => {
    setUserSession(updatedSession);
    setMustChangePassword(false);
    if (updatedSession?.token) {
      localStorage.setItem("auth_token", updatedSession.token);
      localStorage.setItem("access_token", updatedSession.token);
    }
    if (updatedSession?.role) {
      localStorage.setItem("user_role", updatedSession.role);
    }
    // Sau khi đổi mật khẩu đầu tiên thành công, truy cập ngay vào portal phân quyền của họ:
    routeUserToPortal(updatedSession?.role, updatedSession?.ma_nv);
  };

  const handleLogout = () => {
    const prevRole = userSession?.role || localStorage.getItem("user_role");
    const prevMaNv = userSession?.ma_nv || localStorage.getItem("user_ma_nv");
    localStorage.removeItem("user_ma_nv");
    localStorage.removeItem("ma_nv");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    setUserSession(null);
    setMustChangePassword(false);

    // Chuyển về đúng trang đăng nhập tương ứng vai trò vừa đăng xuất (URL sạch)
    if (isAdminRole(prevRole, prevMaNv) || isManagerRole(prevRole)) {
      window.history.replaceState(null, "", "/login-manage");
      setCurrentPage("login-manage");
    } else {
      window.history.replaceState(null, "", "/login");
      setCurrentPage("login");
    }
  };

  // 1. Nếu chưa đăng nhập hoặc đang ở các trang đăng nhập
  const isLoginPage = currentPage === "login" || isManagerLoginRoute(currentPage);
  if (!userSession || isLoginPage) {
    if (isManagerLoginRoute(currentPage)) {
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

  // 1.5. Nếu tài khoản bắt buộc phải đổi mật khẩu đầu tiên:
  if (mustChangePassword && userSession) {
    return (
      <FirstTimePasswordModal
        userSession={userSession}
        onPasswordChanged={handlePasswordChanged}
        onLogout={handleLogout}
      />
    );
  }

  // 2. Nếu vào Cổng Quản trị viên (/admin), kiểm tra quyền Admin
  if (currentPage.startsWith("admin")) {
    const role = userSession?.role || localStorage.getItem("user_role");
    const maNv = userSession?.ma_nv || localStorage.getItem("user_ma_nv");
    if (isAdminRole(role, maNv)) {
      return (
        <AdminDashboard
          userSession={userSession}
          onLogout={handleLogout}
          onSwitchToManager={() => {
            navigateClean("manager");
            setCurrentPage("manager");
          }}
          onSwitchToEmployee={() => {
            navigateClean("attendance");
            setCurrentPage("attendance");
          }}
        />
      );
    }
    // Nếu không phải admin, kiểm tra có phải manager không
    if (isManagerRole(role)) {
      navigateClean("manager");
      setCurrentPage("manager");
    } else {
      navigateClean("attendance");
      setCurrentPage("attendance");
    }
  }

  // 3. Nếu vào Cổng Quản lý (/manager), kiểm tra quyền quản lý
  if (currentPage.startsWith("manager")) {
    const role = userSession?.role || localStorage.getItem("user_role");
    const maNv = userSession?.ma_nv || localStorage.getItem("user_ma_nv");
    if (isManagerRole(role)) {
      return (
        <ManagerDashboard
          userSession={userSession}
          onLogout={handleLogout}
          onSwitchToEmployee={() => {
            navigateClean("attendance");
            setCurrentPage("attendance");
          }}
          onSwitchToAdmin={
            isAdminRole(role, maNv)
              ? () => {
                  navigateClean("admin");
                  setCurrentPage("admin");
                }
              : undefined
          }
        />
      );
    }
    navigateClean("attendance");
  }

  // 4. Điều hướng các trang Nhân viên
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
