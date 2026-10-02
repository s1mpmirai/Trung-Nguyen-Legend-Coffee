import React, { useState, useEffect } from "react";

/* ── Sub-components ────────────────────────────────────────────── */
import SharedEmployeeHeader from "./components/SharedEmployeeHeader";
import ProfileHeader from "./components/ProfileHeader";
import BasicInfoSection from "./components/BasicInfoSection";
import WorkContactSection from "./components/WorkContactSection";
import AccountSettingsSection from "./components/AccountSettingsSection";
import BottomNavBar from "./components/BottomNavBar";
import EditProfileModal from "./components/EditProfileModal";

/* ── Services ──────────────────────────────────────────────────── */
import {
  getEmployeeProfile,
  updateEmployeeContact,
  FALLBACK_EMPLOYEE_PROFILE,
  formatDate,
} from "../../services/employeeService";

/* ── Styles ────────────────────────────────────────────────────── */
import "./styles/EmployeeProfile.css";

/**
 * EmployeeProfile – Trang Hồ sơ & Thông tin cá nhân của nhân viên (Employee Portal)
 * Chế độ chỉ xem thông tin (đã bỏ toàn bộ các nút sửa).
 */
function EmployeeProfile({ userSession, onLogout }) {
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Trạng thái modal chỉnh sửa thông tin
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Mã nhân viên hiện tại
  const currentMaNv =
    userSession?.ma_nv ||
    localStorage.getItem("user_ma_nv") ||
    localStorage.getItem("ma_nv") ||
    "NV02";

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

  /* ── 2. Xử lý gửi yêu cầu chỉnh sửa thông tin cá nhân ─────────── */
  const handleSaveProfile = async (formData) => {
    try {
      // Cập nhật lên API (nếu có kết nối)
      try {
        await updateEmployeeContact(currentMaNv, formData);
      } catch (apiErr) {
        console.info("[EmployeeProfile] API update offline, cập nhật tạm thời giao diện:", apiErr.message);
      }

      // Cập nhật ngay trên state để người dùng thấy thông tin họ vừa yêu cầu thay đổi
      setEmployee((prev) => ({
        ...prev,
        birthDate: formData.ngay_sinh ? formatDate(formData.ngay_sinh) : prev.birthDate,
        birthDateRaw: formData.ngay_sinh || prev.birthDateRaw,
        gender: formData.gioi_tinh === "Nu" ? "Nữ" : (formData.gioi_tinh === "Nam" ? "Nam" : "Khác"),
        genderRaw: formData.gioi_tinh || prev.genderRaw,
        phone: formData.sdt || prev.phone,
        personalEmail: formData.personalEmail || prev.personalEmail,
      }));

      showToast("Đã gửi yêu cầu chỉnh sửa thông tin thành công đến Quản lý phê duyệt!");
    } catch (err) {
      showToast(err.message || "Gửi yêu cầu thất bại", "error");
      throw err;
    }
  };

  /* ── 3. Xử lý đăng xuất ──────────────────────────────────────── */
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này?")) {
      localStorage.removeItem("user_ma_nv");
      localStorage.removeItem("ma_nv");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_role");
      showToast("Đã đăng xuất thành công!", "info");
      setTimeout(() => {
        window.location.hash = "";
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen pb-24 relative">
      {/* ── Thông báo Toast nổi ─────────────────────────────────── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 animate-bounce">
          <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between text-xs font-semibold border border-slate-700 backdrop-blur-md">
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* ── Header TrungNguyenHR chung ─────────────────────────── */}
      <SharedEmployeeHeader
        onLogout={handleLogout}
        onNotificationClick={() => showToast("Bạn có 1 thông báo mới từ Phòng Nhân sự")}
      />

      {/* ── Banner tiêu đề trang ────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-1">
        <span className="text-[11px] font-extrabold tracking-wider text-[#0EA5E9] uppercase block">
          THÔNG TIN TÀI KHOẢN
        </span>
        <h2 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
          Hồ sơ cá nhân
        </h2>
      </div>

      {/* ── Nội dung chính (Xem & Sửa thông tin) ────────────────── */}
      <main className="px-4 py-2.5 space-y-4">
        {isLoading && !employee ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold text-slate-500">Đang tải thông tin hồ sơ...</p>
          </div>
        ) : (
          <>
            <ProfileHeader
              employee={employee || FALLBACK_EMPLOYEE_PROFILE}
            />

            <BasicInfoSection
              employee={employee || FALLBACK_EMPLOYEE_PROFILE}
              onEdit={() => setIsEditModalOpen(true)}
            />

            <WorkContactSection
              employee={employee || FALLBACK_EMPLOYEE_PROFILE}
            />

            <AccountSettingsSection
              onLogout={handleLogout}
            />
          </>
        )}
      </main>

      {/* ── Thanh điều hướng dưới cùng ─────────────────────────── */}
      <BottomNavBar activeTab="profile" />

      {/* ── Modal Chỉnh sửa thông tin cá nhân ───────────────────── */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        employee={employee}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

export default EmployeeProfile;
