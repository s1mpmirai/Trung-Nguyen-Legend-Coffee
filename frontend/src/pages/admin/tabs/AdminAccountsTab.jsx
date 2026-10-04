import React, { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Search,
  Filter,
  UserPlus,
  Lock,
  Unlock,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Edit2,
  Building2,
  Briefcase,
  Phone,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  getAccountsList,
  createAccount,
  updateAccount,
  updateAccountStatus,
  getEmployeesWithoutAccountDetails,
} from "../../../services/adminService";

export default function AdminAccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ────────────────── MODAL CẤP TÀI KHOẢN MỚI ──────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [unassignedList, setUnassignedList] = useState([]);
  const [unassignedIndex, setUnassignedIndex] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    ma_nv: "",
    ma_vai_tro: "NHAN_VIEN",
    mat_khau: "1",
  });

  // ────────────────── MODAL CHỈNH SỬA TÀI KHOẢN (VAI TRÒ / TRẠNG THÁI) ──────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editForm, setEditForm] = useState({
    ma_vai_tro: "NHAN_VIEN",
    trang_thai: "HOAT_DONG",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // ────────────────── MODAL ĐỔI MẬT KHẨU RIÊNG BIỆT ──────────────────
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ mat_khau_moi: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // ────────────────── TOAST THÔNG BÁO ──────────────────
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Tải danh sách tài khoản
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAccountsList({
        page,
        page_size: pageSize,
        search: searchTerm || undefined,
        ma_vai_tro: roleFilter || undefined,
        trang_thai: statusFilter || undefined,
      });
      setAccounts(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Lỗi khi tải danh sách tài khoản:", err);
      showToast("Không thể tải danh sách tài khoản.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ────────────────── XỬ LÝ CẤP TÀI KHOẢN TỰ SINH THEO THỨ TỰ ──────────────────
  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateLoading(true);
    try {
      const list = await getEmployeesWithoutAccountDetails();
      const employees = list || [];
      setUnassignedList(employees);
      setUnassignedIndex(0);

      if (employees.length > 0) {
        // Tự động chọn nhân viên đầu tiên theo đúng thứ tự tự nhiên (NV11, NV12...)
        setCreateForm({
          ma_nv: employees[0].ma_nv,
          ma_vai_tro: "NHAN_VIEN",
          mat_khau: "1",
        });
      }
    } catch (err) {
      console.error("Lỗi khi tải nhân viên chưa có tài khoản:", err);
      showToast("Không thể tải danh sách nhân viên chưa cấp tài khoản", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  // Chuyển sang nhân sự tiếp theo hoặc trước đó trong hàng chờ
  const handleSelectEmployeeByIndex = (idx) => {
    if (idx < 0 || idx >= unassignedList.length) return;
    setUnassignedIndex(idx);
    setCreateForm((prev) => ({
      ...prev,
      ma_nv: unassignedList[idx].ma_nv,
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.ma_nv) return;

    setIsSubmittingCreate(true);
    try {
      await createAccount({
        ma_nv: createForm.ma_nv,
        mat_khau: createForm.mat_khau || "1",
        ma_vai_tro: createForm.ma_vai_tro,
        trang_thai: "HOAT_DONG",
      });

      showToast(`Đã cấp tài khoản thành công cho nhân sự ${createForm.ma_nv}!`);
      fetchAccounts();

      // Cập nhật lại danh sách hàng chờ: loại bỏ nhân sự vừa được cấp
      const remaining = unassignedList.filter((emp) => emp.ma_nv !== createForm.ma_nv);
      setUnassignedList(remaining);

      if (remaining.length > 0) {
        // Tự động nhảy sang nhân sự tiếp theo theo thứ tự!
        const nextIdx = Math.min(unassignedIndex, remaining.length - 1);
        setUnassignedIndex(nextIdx);
        setCreateForm({
          ma_nv: remaining[nextIdx].ma_nv,
          ma_vai_tro: "NHAN_VIEN",
          mat_khau: "1",
        });
      } else {
        setIsCreateModalOpen(false);
      }
    } catch (err) {
      showToast(err.message || "Cấp tài khoản thất bại.", "error");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // ────────────────── XỬ LÝ CHỈNH SỬA TÀI KHOẢN (VAI TRÒ / TRẠNG THÁI) ──────────────────
  const handleOpenEditModal = (acc) => {
    if (acc.ma_vai_tro === "ADMIN" || acc.ma_nv === "NV01") {
      showToast("Tài khoản Quản trị viên tối cao (Admin) được bảo vệ, không thể chỉnh sửa!", "error");
      return;
    }
    setSelectedAccount(acc);
    setEditForm({
      ma_vai_tro: acc.ma_vai_tro || "NHAN_VIEN",
      trang_thai: acc.trang_thai || "HOAT_DONG",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;

    setIsSubmittingEdit(true);
    try {
      await updateAccount(selectedAccount.ma_nv, {
        ma_vai_tro: editForm.ma_vai_tro,
        trang_thai: editForm.trang_thai,
      });
      showToast(`Đã cập nhật vai trò và trạng thái tài khoản ${selectedAccount.ma_nv} thành công!`);
      setIsEditModalOpen(false);
      fetchAccounts();
    } catch (err) {
      showToast(err.message || "Cập nhật tài khoản thất bại.", "error");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // ────────────────── XỬ LÝ ĐỔI MẬT KHẨU RIÊNG BIỆT ──────────────────
  const handleOpenPasswordModal = () => {
    setPasswordForm({ mat_khau_moi: "" });
    setShowPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount || !passwordForm.mat_khau_moi.trim()) {
      showToast("Vui lòng nhập mật khẩu mới!", "error");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await updateAccount(selectedAccount.ma_nv, {
        mat_khau_moi: passwordForm.mat_khau_moi.trim(),
      });
      showToast(`Đã đổi mật khẩu cho tài khoản ${selectedAccount.ma_nv} thành công!`);
      setIsPasswordModalOpen(false);
    } catch (err) {
      showToast(err.message || "Đổi mật khẩu thất bại.", "error");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // ────────────────── KHÓA / MỞ KHÓA NHANH ──────────────────
  const handleToggleStatus = async (account) => {
    const newStatus = account.trang_thai === "HOAT_DONG" ? "KHOA" : "HOAT_DONG";
    const confirmMsg =
      newStatus === "KHOA"
        ? `Bạn có chắc chắn muốn KHÓA tài khoản của ${account.ho_ten} (${account.ma_nv})?`
        : `Bạn có muốn MỞ KHÓA tài khoản của ${account.ho_ten} (${account.ma_nv})?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await updateAccountStatus(account.ma_nv, newStatus);
      showToast(`Đã ${newStatus === "KHOA" ? "khóa" : "kích hoạt"} tài khoản ${account.ma_nv} thành công!`);
      fetchAccounts();
    } catch (err) {
      showToast(err.message || "Cập nhật trạng thái tài khoản thất bại", "error");
    }
  };

  const roleBadges = {
    ADMIN: "bg-sky-100 text-sky-800 border-sky-300 font-bold",
    QUAN_LY: "bg-sky-50 text-sky-800 border-sky-300 font-semibold",
    TRUONG_NHOM: "bg-purple-50 text-purple-800 border-purple-300 font-semibold",
    NHAN_VIEN: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const currentUnassignedEmp = unassignedList[unassignedIndex];
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="flex flex-col gap-6">
      {/* ───────────────── TOAST THÔNG BÁO ───────────────── */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-up ${
            toastType === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toastType === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ───────────────── HEADER TAB ───────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            <KeyRound size={12} className="text-sky-600" />
            <span>Quản trị tài khoản & Cấp quyền người dùng</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase">
            QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấp tài khoản tự động theo thứ tự nhân sự, đặt lại mật khẩu và phân quyền vai trò
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <UserPlus size={15} />
          <span>Cấp tài khoản mới</span>
        </button>
      </div>

      {/* ───────────────── THANH TÌM KIẾM & BỘ LỌC ───────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        {/* Form Search */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo Mã NV, Họ tên, Email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Vai trò */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">ADMIN (Quản trị viên)</option>
            <option value="QUAN_LY">QUẢN LÝ (Trưởng phòng)</option>
            <option value="TRUONG_NHOM">TRƯỞNG NHÓM (Team Lead)</option>
            <option value="NHAN_VIEN">NHÂN VIÊN</option>
          </select>

          {/* Trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="HOAT_DONG">Đang hoạt động</option>
            <option value="KHOA">Đã bị khóa</option>
          </select>

          {/* Làm mới */}
          <button
            type="button"
            onClick={fetchAccounts}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin text-sky-600" : ""} />
          </button>
        </div>
      </div>

      {/* ───────────────── BẢNG DANH SÁCH TÀI KHOẢN (HIỂN THỊ ĐỦ THÔNG TIN NHÂN SỰ) ───────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span className="text-xs font-medium">Đang tải danh sách tài khoản...</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            Không tìm thấy tài khoản nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Tài khoản & Mã NV</th>
                  <th className="py-3 px-4">Thông tin nhân sự</th>
                  <th className="py-3 px-4">Đơn vị công tác</th>
                  <th className="py-3 px-4">Liên hệ (SĐT / Email)</th>
                  <th className="py-3 px-4">Vai trò (RBAC)</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => {
                  const isLocked = acc.trang_thai === "KHOA";
                  const isAdmin = acc.ma_vai_tro === "ADMIN";

                  return (
                    <tr key={acc.ma_tk} className="hover:bg-slate-50/60 transition-colors">
                      {/* Mã NV & Mã TK */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 font-mono">{acc.ma_nv}</span>
                          <span className="text-[10px] text-slate-400 font-mono">TK #{acc.ma_tk}</span>
                        </div>
                      </td>

                      {/* Họ tên */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{acc.ho_ten || "Chưa cập nhật họ tên"}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {acc.lan_dn_cuoi ? `Đăng nhập: ${new Date(acc.lan_dn_cuoi).toLocaleDateString("vi-VN")}` : "Chưa từng đăng nhập"}
                        </div>
                      </td>

                      {/* Phòng ban & Chức vụ */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-medium">{acc.ten_pb || "Trụ sở chính"}</span>
                          <span className="text-[11px] text-slate-500">{acc.ten_cv || "Nhân sự"}</span>
                        </div>
                      </td>

                      {/* Liên hệ: SĐT & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          {acc.sdt && (
                            <span className="text-slate-700 font-medium flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-400" />
                              {acc.sdt}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Mail size={12} className="text-slate-400" />
                            {acc.email || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Vai trò */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] border uppercase ${
                            roleBadges[acc.ma_vai_tro] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {acc.ten_vai_tro || acc.ma_vai_tro}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Lock size={11} />
                            Đã khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Unlock size={11} />
                            Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Thao tác: Sửa / Đổi MK & Khóa / Mở khóa */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAdmin || acc.ma_nv === "NV01" ? (
                            <span
                              className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 select-none cursor-default"
                              title="Tài khoản Quản trị viên tối cao được bảo vệ, không thể chỉnh sửa"
                            >
                              Admin gốc
                            </span>
                          ) : (
                            <>
                              {/* Nút Sửa */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(acc)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                                title="Chỉnh sửa tài khoản"
                              >
                                <Edit2 size={15} />
                              </button>

                              {/* Nút Khóa / Mở khóa */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(acc)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  isLocked
                                    ? "text-emerald-600 hover:bg-emerald-50"
                                    : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                }`}
                                title={isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                              >
                                {isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hiển thị <strong>{accounts.length}</strong> trên tổng số <strong>{total}</strong> tài khoản
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────── MODAL: CẤP TÀI KHOẢN TỰ SINH THEO THỨ TỰ (KHÔNG CẦN SCROLL) ────────────────── */}
      {isCreateModalOpen && (
        <div
          onClick={() => setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-fade-in cursor-default"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                    Cấp Tài Khoản Người Dùng Mới
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tự động nhận diện nhân sự tiếp theo theo thứ tự mã nhân viên
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {createLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-7 h-7 animate-spin text-sky-600" />
                <span>Đang quét danh sách nhân sự chưa cấp tài khoản...</span>
              </div>
            ) : unassignedList.length === 0 ? (
              <div className="py-10 text-center text-slate-600 text-xs flex flex-col items-center gap-2">
                <CheckCircle2 size={32} className="text-emerald-500" />
                <span className="font-semibold text-slate-800 text-sm">Tuyệt vời!</span>
                <span>Tất cả nhân sự trong hệ thống đều đã được cấp tài khoản đăng nhập.</span>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
                {/* 1. THANH ĐIỀU HƯỚNG THỨ TỰ NHÂN SỰ TIẾP THEO (KHÔNG CẦN SCROLL) */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-700 border border-sky-200">
                      Hàng chờ: {unassignedList.length} nhân sự
                    </span>
                    <span className="text-xs text-slate-500">
                      Số <strong>{unassignedIndex + 1}</strong> / {unassignedList.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectEmployeeByIndex(unassignedIndex - 1)}
                      disabled={unassignedIndex <= 0}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft size={14} />
                      <span>Trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectEmployeeByIndex(unassignedIndex + 1)}
                      disabled={unassignedIndex >= unassignedList.length - 1}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      <span>Tiếp</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* 2. THẺ THÔNG TIN ĐẦY ĐỦ CỦA NHÂN SỰ ĐƯỢC CHỌN */}
                {currentUnassignedEmp && (
                  <div className="bg-sky-50/40 border border-sky-200/80 rounded-2xl p-4 text-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                          {currentUnassignedEmp.ho_ten}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-800">
                            {currentUnassignedEmp.ma_nv}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">{currentUnassignedEmp.ten_pb || "Chưa có PB"}</span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        Sẵn sàng cấp
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-200/50 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Briefcase size={13} className="text-sky-600 shrink-0" />
                        <span className="truncate">Chức vụ: <strong>{currentUnassignedEmp.ten_cv || "Nhân viên"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-sky-600 shrink-0" />
                        <span>SĐT: <strong>{currentUnassignedEmp.sdt || "Chưa có"}</strong></span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Mail size={13} className="text-sky-600 shrink-0" />
                        <span className="truncate">Email: <strong>{currentUnassignedEmp.email || "Chưa có"}</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. THIẾT LẬP VAI TRÒ & MẬT KHẨU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Chọn vai trò */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Phân cấp vai trò (RBAC) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={createForm.ma_vai_tro}
                      onChange={(e) => setCreateForm({ ...createForm, ma_vai_tro: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      <option value="NHAN_VIEN">NHÂN VIÊN (Tiêu chuẩn)</option>
                      <option value="TRUONG_NHOM">TRƯỞNG NHÓM (Team Lead)</option>
                      <option value="QUAN_LY">QUẢN LÝ (Trưởng phòng)</option>
                      <option value="ADMIN">ADMIN (Quản trị viên)</option>
                    </select>
                  </div>

                  {/* Mật khẩu khởi tạo */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Mật khẩu khởi tạo
                    </label>
                    <input
                      type="text"
                      value={createForm.mat_khau}
                      onChange={(e) => setCreateForm({ ...createForm, mat_khau: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  * Mật khẩu khởi tạo mặc định là <strong>1</strong>. Nhân sự có thể đổi mật khẩu sau khi đăng nhập.
                </p>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCreate || !currentUnassignedEmp}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingCreate ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    <span>Xác nhận cấp tài khoản ({createForm.ma_nv})</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: CHỈNH SỬA TÀI KHOẢN & ĐỔI MẬT KHẨU (EDIT ACCOUNT) ────────────────── */}
      {isEditModalOpen && selectedAccount && (
        <div
          onClick={() => setIsEditModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-fade-in cursor-default"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                    Chỉnh Sửa Tài Khoản
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Mã TK #{selectedAccount.ma_tk} • {selectedAccount.ma_nv}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chi tiết nhân sự */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedAccount.ho_ten}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-slate-200 text-slate-700">
                  {selectedAccount.ma_nv}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div>Phòng ban: <strong className="text-slate-800">{selectedAccount.ten_pb || "Trụ sở"}</strong></div>
                <div>Chức vụ: <strong className="text-slate-800">{selectedAccount.ten_cv || "Nhân sự"}</strong></div>
                {selectedAccount.sdt && <div>SĐT: <strong className="text-slate-800">{selectedAccount.sdt}</strong></div>}
                {selectedAccount.email && <div>Email: <strong className="text-slate-800">{selectedAccount.email}</strong></div>}
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              {/* Thay đổi vai trò */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Vai trò hệ thống (Quyền hạn)
                </label>
                <select
                  value={editForm.ma_vai_tro}
                  onChange={(e) => setEditForm({ ...editForm, ma_vai_tro: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="NHAN_VIEN">Nhân viên (Quyền hạn tiêu chuẩn)</option>
                  <option value="TRUONG_NHOM">Trưởng nhóm (Duyệt đơn & xem nhóm)</option>
                  <option value="QUAN_LY">Quản lý / Trưởng phòng (Toàn quyền quản lý)</option>
                </select>
              </div>

              {/* Thay đổi trạng thái */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Trạng thái tài khoản
                </label>
                <select
                  value={editForm.trang_thai}
                  onChange={(e) => setEditForm({ ...editForm, trang_thai: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="HOAT_DONG">Đang hoạt động (Cho phép đăng nhập)</option>
                  <option value="KHOA">Đã khóa (Tạm ngưng quyền truy cập)</option>
                </select>
              </div>

              {/* FOOTER: Nút Đổi Mật Khẩu ĐỐI DIỆN Nút Lưu Thay Đổi */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleOpenPasswordModal}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                  title="Mở giao diện đổi mật khẩu riêng cho nhân sự này"
                >
                  <KeyRound size={15} className="text-amber-600" />
                  <span>Đổi mật khẩu</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    {isSubmittingEdit ? <Loader2 size={14} className="animate-spin" /> : <Edit2 size={14} />}
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: ĐỔI MẬT KHẨU TÀI KHOẢN (ĐỘC LẬP) ────────────────── */}
      {isPasswordModalOpen && selectedAccount && (
        <div
          onClick={() => setIsPasswordModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                    Đổi Mật Khẩu Tài Khoản
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedAccount.ho_ten} • {selectedAccount.ma_nv}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPasswordForm({ mat_khau_moi: "1" })}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Đặt lại về mặc định (1)</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới..."
                    value={passwordForm.mat_khau_moi}
                    onChange={(e) => setPasswordForm({ mat_khau_moi: e.target.value })}
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <p className="text-[10px] text-slate-400">
                  * Mật khẩu mới sẽ có hiệu lực ngay lập tức. Nhân sự cần sử dụng mật khẩu này trong lần đăng nhập tiếp theo.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword || !passwordForm.mat_khau_moi.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingPassword ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  <span>Cập nhật mật khẩu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
