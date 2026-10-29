import React, { useState, useEffect, useCallback } from "react";
import { CalendarClock, AlertCircle, RefreshCw } from "lucide-react";

/* ── Sub-components ────────────────────────────────────────────── */
import SharedEmployeeHeader from "./components/SharedEmployeeHeader";
import ProfileHeader from "./components/ProfileHeader";
import BasicInfoSection from "./components/BasicInfoSection";
import WorkContactSection from "./components/WorkContactSection";
import AccountSettingsSection from "./components/AccountSettingsSection";
import BottomNavBar from "./components/BottomNavBar";
import EditProfileModal from "./components/EditProfileModal";
import ChangePasswordModal from "./components/ChangePasswordModal";
import PendingRequestBanner from "./components/PendingRequestBanner";
import EmployeeToast from "./components/EmployeeToast";
import useToast from "./utils/useToast";
import { getApiErrorMessage } from "./utils/format";

/* ── Services ──────────────────────────────────────────────────── */
import {
  getEmployeeProfile,
  getPendingProfileRequest,
  requestProfileUpdate,
  cancelProfileRequest,
  changePassword,
} from "../../services/employeeService";

/* ── Styles ────────────────────────────────────────────────────── */
import "./styles/EmployeeProfile.css";

/**
 * EmployeeProfile – Trang Hồ sơ & Thông tin cá nhân của nhân viên (Employee Portal)
 * - Nhân viên KHÔNG sửa trực tiếp hồ sơ: gửi yêu cầu chỉnh sửa để Quản lý phê duyệt
 * - Hiển thị yêu cầu đang chờ duyệt (cũ -> mới) và cho phép hủy
 * - Thông báo ngày nghỉ việc dự kiến (nếu đã lên lịch thôi việc)
 * - Đổi mật khẩu tài khoản
 */
function EmployeeProfile({ userSession, onLogout }) {
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { toast, showToast, hideToast } = useToast(4500);

  // Mã nhân viên hiện tại
  const currentMaNv = userSession?.ma_nv || localStorage.getItem("user_ma_nv");

  /* ── 1. Tải hồ sơ + yêu cầu chỉnh sửa đang chờ duyệt ─────────── */
  const loadPendingRequest = useCallback(async () => {
    try {
      setPendingRequest((await getPendingProfileRequest(currentMaNv)) || null);
    } catch (err) {
      console.warn("Không tải được yêu cầu chỉnh sửa hồ sơ:", err?.message);
    }
  }, [currentMaNv]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    const profile = await getEmployeeProfile(currentMaNv);
    setEmployee(profile);
    setIsLoading(false);
  }, [currentMaNv]);

  useEffect(() => {
    loadProfile();
    loadPendingRequest();
  }, [loadProfile, loadPendingRequest]);

  /* ── 2. Gửi yêu cầu chỉnh sửa (chờ Quản lý duyệt) ─────────────── */
  const handleSubmitProfileRequest = async (payload) => {
    const created = await requestProfileUpdate(currentMaNv, payload);
    setPendingRequest(created || null);
    showToast("Đã gửi yêu cầu chỉnh sửa. Hồ sơ sẽ được cập nhật sau khi Quản lý phê duyệt.", "success");
  };

  /* ── 3. Hủy yêu cầu đang chờ duyệt ─────────────────────────────── */
  const handleCancelProfileRequest = async (request) => {
    try {
      await cancelProfileRequest(request.ma_yc);
      setPendingRequest(null);
      showToast(`Đã hủy yêu cầu chỉnh sửa #${request.ma_yc}.`, "success");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Hủy yêu cầu thất bại. Vui lòng thử lại."), "error");
      loadPendingRequest();
    }
  };

  /* ── 4. Đổi mật khẩu ───────────────────────────────────────────── */
  const handleChangePassword = async (payload) => {
    await changePassword(payload);
    showToast("Đổi mật khẩu thành công. Hãy dùng mật khẩu mới cho lần đăng nhập sau.", "success");
  };

  return (
    <div className="flex-1 flex flex-col bg-cream min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] relative">
      <EmployeeToast message={toast?.message} type={toast?.type} onClose={hideToast} />

      {/* ── Header TrungNguyenHR chung ─────────────────────────── */}
      <SharedEmployeeHeader onLogout={onLogout} />

      {/* ── Banner tiêu đề trang ────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-1">
        <span className="text-[11px] font-extrabold tracking-wider text-gold-700 uppercase block">
          Thông tin tài khoản
        </span>
        <h1 className="text-xl font-extrabold text-coffee-900 leading-tight mt-0.5">
          Hồ sơ cá nhân
        </h1>
      </div>

      {/* ── Nội dung chính ──────────────────────────────────────── */}
      <main className="px-4 py-2.5 space-y-4">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500" role="status">
            <div className="w-8 h-8 border-2 border-coffee-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold">Đang tải thông tin hồ sơ...</p>
          </div>
        ) : !employee ? (
          <div className="py-20 text-center space-y-3" role="alert">
            <AlertCircle size={32} className="mx-auto text-rose-400" />
            <p className="text-xs font-semibold text-rose-700">
              Không tải được hồ sơ. Vui lòng thử lại hoặc đăng nhập lại.
            </p>
            <button
              type="button"
              onClick={loadProfile}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl bg-coffee-600 hover:bg-coffee-800 text-white text-xs font-bold"
            >
              <RefreshCw size={14} />
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {/* Thông báo đã lên lịch thôi việc (ngày nghỉ việc ở tương lai) */}
            {employee.isTerminationScheduled && (
              <section className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3.5" role="status">
                <CalendarClock size={18} className="text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">Ngày nghỉ việc dự kiến {employee.terminationDate}</p>
                  <p className="mt-0.5">
                    Bạn vẫn làm việc và sử dụng tài khoản bình thường đến hết ngày này.
                    {employee.terminationReason ? ` Lý do: ${employee.terminationReason}.` : ""}
                  </p>
                </div>
              </section>
            )}

            <ProfileHeader
              employee={employee}
              onEdit={() => setIsEditModalOpen(true)}
              hasPendingRequest={Boolean(pendingRequest)}
            />

            <PendingRequestBanner
              request={pendingRequest}
              onCancel={handleCancelProfileRequest}
              onEdit={() => setIsEditModalOpen(true)}
            />

            <BasicInfoSection employee={employee} />

            <WorkContactSection employee={employee} />

            <AccountSettingsSection
              onChangePassword={() => setIsPasswordModalOpen(true)}
              onLogout={onLogout}
            />
          </>
        )}
      </main>

      {/* ── Thanh điều hướng dưới cùng ─────────────────────────── */}
      <BottomNavBar activeTab="profile" />

      {/* ── Modal gửi yêu cầu chỉnh sửa thông tin cá nhân ───────── */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        employee={employee}
        pendingRequest={pendingRequest}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleSubmitProfileRequest}
      />

      {/* ── Modal đổi mật khẩu ──────────────────────────────────── */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}

export default EmployeeProfile;
