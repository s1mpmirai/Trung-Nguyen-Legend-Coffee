import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, ShieldAlert, X } from "lucide-react";
import Login from "./pages/auth/Login";
import AdminManagerLogin from "./pages/auth/AdminManagerLogin";
import AttendanceDashboard from "./pages/employee/AttendanceDashboard";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeePayroll from "./pages/employee/EmployeePayroll";
import LeaveRequests from "./pages/employee/LeaveRequests";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FirstTimePasswordModal from "./components/common/FirstTimePasswordModal";
import { getMe } from "./services/adminService";
import {
  getCleanRoute,
  navigateClean,
  replaceClean,
  canAccessAdminPortal,
  canAccessManagerPortal,
  getManageHome,
  getPortalHome,
  isLoginRoute,
  isManagePortalRoute,
} from "./utils/navigation";

// ───────────────────────── BỘ NHỚ ĐỆM PHIÊN (localStorage) ─────────────────────────
// localStorage chỉ là bộ nhớ đệm; vai trò / quyền thật luôn lấy lại từ GET /auth/me.
const SESSION_KEYS = [
  "user_ma_nv",
  "ma_nv",
  "auth_token",
  "access_token",
  "user_role",
  "user_permissions",
  "auth_portal",
];

const EMPLOYEE_ROUTES = ["attendance", "payroll", "profile", "personal", "requests", "leaves"];

const readPermissionsCache = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function readCachedSession() {
  const ma_nv = localStorage.getItem("user_ma_nv") || localStorage.getItem("ma_nv");
  const token = localStorage.getItem("access_token") || localStorage.getItem("auth_token");
  if (!ma_nv || !token) return null;
  return {
    ma_nv,
    token,
    role: String(localStorage.getItem("user_role") || "").toUpperCase(),
    permissions: readPermissionsCache(),
    portal: localStorage.getItem("auth_portal") === "manage" ? "manage" : "employee",
  };
}

function writeSessionCache(session) {
  if (!session) return;
  localStorage.setItem("user_ma_nv", session.ma_nv);
  localStorage.setItem("ma_nv", session.ma_nv);
  if (session.token) {
    localStorage.setItem("auth_token", session.token);
    localStorage.setItem("access_token", session.token);
  }
  localStorage.setItem("user_role", session.role || "");
  localStorage.setItem("user_permissions", JSON.stringify(session.permissions || []));
  localStorage.setItem("auth_portal", session.portal || "employee");
}

function clearSessionCache() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

const mergeMe = (session, me) => ({
  ...session,
  ma_nv: me?.ma_nv || session.ma_nv,
  role: String(me?.ma_vai_tro || session.role || "").toUpperCase(),
  permissions: Array.isArray(me?.permissions) ? me.permissions : session.permissions || [],
  ho_ten: me?.ho_ten || session.ho_ten,
  ten_pb: me?.ten_pb ?? session.ten_pb,
  ten_cv: me?.ten_cv ?? session.ten_cv,
  email: me?.email ?? session.email,
  must_change_password: Boolean(me?.must_change_password),
});

// ───────────────────────── GUARD ĐIỀU HƯỚNG ─────────────────────────
const isAdminRoute = (r) => r === "admin" || r.startsWith("admin/");
const isManagerRoute = (r) => r === "manager" || r.startsWith("manager/");

/** Trả về route được phép hiển thị cho phiên hiện tại (không gây side effect). */
function resolveRoute(route, session) {
  const r = String(route || "");
  if (!session) {
    if (r === "login") return "login";
    if (isManagePortalRoute(r)) return "login-manage";
    return "login";
  }
  // Người đã đăng nhập vẫn được mở trang đăng nhập khi chủ động truy cập (đổi tài khoản)
  if (isLoginRoute(r)) return r === "login" ? "login" : "login-manage";
  if (!r) return getPortalHome(session);
  if (isAdminRoute(r)) {
    return canAccessAdminPortal(session.role, session.permissions) ? r : getManageHome(session.role, session.permissions);
  }
  if (isManagerRoute(r)) {
    return canAccessManagerPortal(session.role, session.permissions) ? r : getManageHome(session.role, session.permissions);
  }
  if (EMPLOYEE_ROUTES.includes(r)) return r;
  return getPortalHome(session);
}

/** Đọc route hiện tại, chuẩn hóa URL (bỏ dấu #, gộp các đường dẫn đăng nhập cũ). */
function readCurrentRoute() {
  if (window.location.hash) {
    const clean = window.location.hash.replace(/^#\/?/, "");
    window.history.replaceState(window.history.state, "", clean ? `/${clean}` : "/");
  }
  const route = getCleanRoute();
  if (route === "login-manager" || route === "login-admin") {
    window.history.replaceState(null, "", "/login-manage");
    return "login-manage";
  }
  return route;
}

function FullScreenLoader({ label }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-500" role="status">
      <Loader2 className="w-8 h-8 animate-spin text-sky-600" aria-hidden="true" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(readCachedSession);
  // Có phiên trong bộ nhớ đệm → xác thực lại với máy chủ trước khi hiển thị cổng
  const [authChecking, setAuthChecking] = useState(() => Boolean(readCachedSession()));
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [route, setRoute] = useState(readCurrentRoute);
  const [notice, setNotice] = useState("");

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Thông báo ngắn (vd: bị chuyển hướng vì không có quyền)
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const goTo = useCallback((target) => {
    replaceClean(target);
    setRoute(target);
  }, []);

  // Lấy vai trò / quyền / họ tên mới nhất từ máy chủ và cập nhật bộ nhớ đệm
  const refreshSession = useCallback(async (base) => {
    const me = await getMe();
    const next = mergeMe(base, me);
    writeSessionCache(next);
    setSession(next);
    setMustChangePassword(next.must_change_password);
    return next;
  }, []);

  // 1. Khởi động: xác thực phiên đã lưu bằng GET /auth/me
  useEffect(() => {
    const cached = readCachedSession();
    if (!cached) {
      clearSessionCache();
      return undefined;
    }
    if (!window.history.state || !window.history.state.inApp) {
      window.history.replaceState({ inApp: true, page: getCleanRoute() }, "", window.location.pathname);
    }

    let cancelled = false;
    refreshSession(cached)
      .then(() => {
        if (!cancelled) setAuthChecking(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status === 401) {
          // apiClient đã xóa phiên và đang chuyển về trang đăng nhập
          return;
        }
        if (err?.status === 403) {
          // Tài khoản bị khóa / không còn hiệu lực
          clearSessionCache();
          setSession(null);
          setNotice(err.message || "Tài khoản của bạn hiện không thể truy cập hệ thống.");
          goTo(cached.portal === "manage" ? "login-manage" : "login");
        }
        // Lỗi mạng: tạm dùng dữ liệu đệm, các API sau sẽ tự báo lỗi
        setAuthChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshSession, goTo]);

  // 2. Lắng nghe điều hướng (Back/Forward, hashchange, navigateClean)
  useEffect(() => {
    const handleRouteSync = () => setRoute(readCurrentRoute());

    const handlePopState = (e) => {
      const current = sessionRef.current;
      const target = getCleanRoute();
      // Bấm Back về trang đăng nhập trong khi vẫn còn phiên: đưa về trang chủ của cổng, KHÔNG đăng xuất
      if (current && !(e.state && e.state.inApp) && isLoginRoute(target)) {
        const home = getPortalHome(current);
        replaceClean(home);
        setRoute(home);
        return;
      }
      handleRouteSync();
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

  // 3. Guard: route hiện tại không hợp lệ với quyền → thay URL trong effect (không setState khi render)
  const resolvedRoute = resolveRoute(route, session);
  useEffect(() => {
    if (authChecking || resolvedRoute === route) return;
    if (session && (isAdminRoute(route) || isManagerRoute(route))) {
      setNotice(
        isAdminRoute(route)
          ? "Cổng Quản trị chỉ dành cho Quản trị viên hoặc tài khoản được cấp quyền Quản lý tài khoản."
          : "Bạn không có quyền truy cập Cổng Quản lý."
      );
    }
    goTo(resolvedRoute);
  }, [authChecking, resolvedRoute, route, session, goTo]);

  const handleLoginSuccess = (userData, portalOrigin = "employee") => {
    const next = {
      ma_nv: userData?.ma_nv,
      token: userData?.token || userData?.access_token,
      role: String(userData?.role || userData?.ma_vai_tro || "").toUpperCase(),
      permissions: Array.isArray(userData?.permissions) ? userData.permissions : [],
      portal: portalOrigin === "manage" ? "manage" : "employee",
      must_change_password: Boolean(userData?.must_change_password),
    };
    writeSessionCache(next);
    setSession(next);

    // BẮT BUỘC: tài khoản mới cấp / vừa được Admin đặt lại mật khẩu → đổi mật khẩu trước khi vào cổng
    if (next.must_change_password) {
      setMustChangePassword(true);
      return;
    }

    setMustChangePassword(false);
    goTo(getPortalHome(next));
    // Bổ sung họ tên, phòng ban... và xác nhận lại quyền từ máy chủ
    refreshSession(next).catch(() => {});
  };

  const handlePasswordChanged = (updatedSession) => {
    const next = {
      ...(sessionRef.current || {}),
      ...updatedSession,
      role: String(updatedSession?.role || sessionRef.current?.role || "").toUpperCase(),
      must_change_password: false,
    };
    writeSessionCache(next);
    setSession(next);
    setMustChangePassword(false);
    goTo(getPortalHome(next));
    refreshSession(next).catch(() => {});
  };

  const handleLogout = () => {
    const current = sessionRef.current;
    const isManageUser =
      current?.portal === "manage" || isAdminRoute(resolvedRoute) || isManagerRoute(resolvedRoute);

    clearSessionCache();
    setSession(null);
    setMustChangePassword(false);
    goTo(isManageUser ? "login-manage" : "login");
  };

  const notificationToast = notice ? (
    <div
      role="status"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] max-w-md w-[calc(100%-2rem)] p-3.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 shadow-xl flex items-start gap-2.5 text-xs font-semibold animate-slide-up"
    >
      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span className="flex-1">{notice}</span>
      <button
        type="button"
        onClick={() => setNotice("")}
        aria-label="Đóng thông báo"
        className="text-amber-600 hover:text-amber-800 cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  ) : null;

  // 0. Đang xác thực phiên với máy chủ
  if (authChecking) {
    return <FullScreenLoader label="Đang xác thực phiên đăng nhập..." />;
  }

  // 0.5. Bắt buộc đổi mật khẩu lần đầu: chặn toàn bộ ứng dụng (cả 3 cổng), kể cả ngay sau khi đăng nhập
  if (session && mustChangePassword) {
    return (
      <FirstTimePasswordModal
        userSession={session}
        onPasswordChanged={handlePasswordChanged}
        onLogout={handleLogout}
      />
    );
  }

  // 1. Chưa đăng nhập hoặc đang ở trang đăng nhập
  if (!session || isLoginRoute(resolvedRoute)) {
    if (resolvedRoute === "login-manage") {
      return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-sky-50/40 to-slate-200 flex flex-col justify-center items-center">
          {notificationToast}
          <AdminManagerLogin onLoginSuccess={(userData) => handleLoginSuccess(userData, "manage")} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 flex justify-center items-start">
        {notificationToast}
        <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] shadow-2xl flex flex-col relative overflow-x-hidden">
          <Login onLoginSuccess={(userData) => handleLoginSuccess(userData, "employee")} />
        </div>
      </div>
    );
  }

  const canAdmin = canAccessAdminPortal(session.role, session.permissions);
  const canManager = canAccessManagerPortal(session.role, session.permissions);
  const switchToAdmin = canAdmin ? () => navigateClean("admin") : undefined;
  const switchToManager = canManager ? () => navigateClean("manager") : undefined;
  const switchToEmployee = () => navigateClean("attendance");

  // 2. Cổng Quản trị (/admin/<tab>) – resolveRoute đã kiểm tra quyền
  if (isAdminRoute(resolvedRoute)) {
    return (
      <>
        {notificationToast}
        <AdminDashboard
          userSession={session}
          routeTab={resolvedRoute.split("/")[1] || ""}
          onLogout={handleLogout}
          onSwitchToManager={switchToManager}
          onSwitchToEmployee={switchToEmployee}
        />
      </>
    );
  }

  // 3. Cổng Quản lý (/manager)
  if (isManagerRoute(resolvedRoute)) {
    return (
      <>
        {notificationToast}
        <ManagerDashboard
          userSession={session}
          onLogout={handleLogout}
          onSwitchToEmployee={switchToEmployee}
          onSwitchToAdmin={switchToAdmin}
        />
      </>
    );
  }

  // 4. Cổng Nhân viên
  const renderContent = () => {
    switch (resolvedRoute) {
      case "payroll":
        return <EmployeePayroll userSession={session} onLogout={handleLogout} />;
      case "profile":
      case "personal":
        return <EmployeeProfile userSession={session} onLogout={handleLogout} />;
      case "requests":
      case "leaves":
        return <LeaveRequests userSession={session} onLogout={handleLogout} />;
      case "attendance":
      default:
        return <AttendanceDashboard userSession={session} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start">
      {notificationToast}
      <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] shadow-2xl flex flex-col relative overflow-x-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
