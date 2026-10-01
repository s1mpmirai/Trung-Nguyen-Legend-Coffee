import React, { useState, useEffect } from "react";

/* ── Sub-components ────────────────────────────────────────────── */
import ProfileHeader from "./components/ProfileHeader";
import BasicInfoSection from "./components/BasicInfoSection";
import WorkContactSection from "./components/WorkContactSection";
import AccountSettingsSection from "./components/AccountSettingsSection";
import BottomNavBar from "./components/BottomNavBar";
import EditProfileModal from "./components/EditProfileModal";
import ChangePasswordModal from "./components/ChangePasswordModal";

/* ── Services ──────────────────────────────────────────────────── */
import {
  getEmployeeProfile,
  updateEmployeeContact,
  changePassword,
  FALLBACK_EMPLOYEE_PROFILE,
} from "../../services/employeeService";

/* ── Styles ────────────────────────────────────────────────────── */
import "./EmployeeProfile.css";

/**
 * EmployeeProfile – Trang Hồ sơ & Thông tin cá nhân của nhân viên.
 *
 * Tích hợp API Backend:
 *  - GET /api/v1/employees/profile/{ma_nv}: Lấy chi tiết hồ sơ & hợp đồng
 *  - PUT /api/v1/employees/profile/{ma_nv}: Cập nhật thông tin liên hệ
 *  - POST /api/v1/auth/change-password: Đổi mật khẩu tài khoản
 */
function EmployeeProfile() {
  const [employee, setEmployee] = useState(FALLBACK_EMPLOYEE_PROFILE);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Trạng thái modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Mã nhân viên hiện tại (lấy từ localStorage hoặc mặc định NV02 / WP-8824)
  const currentMaNv = localStorage.getItem("ma_nv") || "NV02";

  // Hiển thị toast thông báo
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── 1. Tải dữ liệu hồ sơ từ API khi mở trang ────────────────── */
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      try {
        const profile = await getEmployeeProfile(currentMaNv);
        if (isMounted && profile) {
          setEmployee(profile);
        }
      } catch (err) {
        console.warn("Dùng dữ liệu dự phòng:", err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [currentMaNv]);

  /* ── 2. Xử lý lưu thông tin liên hệ ──────────────────────────── */
  const handleSaveContact = async (updatedData) => {
    const updated = await updateEmployeeContact(employee.id, updatedData);
    setEmployee((prev) => ({ ...prev, ...updated }));
    showToast("Cập nhật thông tin liên hệ thành công!");
  };

  /* ── 3. Xử lý đổi mật khẩu ──────────────────────────────────── */
  const handleChangePassword = async ({ ma_nv, mat_khau_cu, mat_khau_moi }) => {
    await changePassword({ ma_nv, mat_khau_cu, mat_khau_moi });
    showToast("Đổi mật khẩu thành công!");
    setEmployee((prev) => ({ ...prev, lastPasswordChange: "Vừa xong" }));
  };

  /* ── 4. Xử lý đăng xuất ──────────────────────────────────────── */
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này?")) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("ma_nv");
      localStorage.removeItem("user_role");
      showToast("Đã đăng xuất thành công!", "info");
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="ep-page">
      {/* ── Thông báo Toast ─────────────────────────────────────── */}
      {toast && (
        <div className="ep-toast">
          <span className="ep-toast__icon">✓</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Header bar ─────────────────────────────────────────── */}
      <header className="ep-topbar">
        <div className="ep-topbar__brand">
          <span className="ep-topbar__logo">WORKPULSE HR</span>
        </div>
        <h1 className="ep-topbar__title">Cá Nhân</h1>

        {isLoading && (
          <span className="ep-loading-badge">
            <span className="ep-spinner" />
            Đang đồng bộ...
          </span>
        )}
      </header>

      {/* ── Nội dung chính (cuộn được) ─────────────────────────── */}
      <main className="ep-content">
        <ProfileHeader
          employee={employee}
          onEditProfile={() => setIsEditModalOpen(true)}
        />

        <BasicInfoSection employee={employee} />

        <WorkContactSection
          employee={employee}
          onEditContact={() => setIsEditModalOpen(true)}
        />

        <AccountSettingsSection
          lastPasswordChange={employee.lastPasswordChange}
          onChangePassword={() => setIsPasswordModalOpen(true)}
          onLogout={handleLogout}
        />
      </main>

      {/* ── Thanh điều hướng dưới cùng ─────────────────────────── */}
      <BottomNavBar activeTab="personal" />

      {/* ── Modal Cập nhật thông tin ───────────────────────────── */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        employee={employee}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveContact}
      />

      {/* ── Modal Đổi mật khẩu ─────────────────────────────────── */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        employeeId={employee.id}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handleChangePassword}
      />
    </div>
  );
}

export default EmployeeProfile;
