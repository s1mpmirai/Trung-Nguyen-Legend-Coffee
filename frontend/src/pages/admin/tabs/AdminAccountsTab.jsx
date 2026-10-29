import React, { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Search,
  UserPlus,
  Lock,
  Unlock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  RefreshCw,
  Edit2,
  Briefcase,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Filter,
  RotateCcw,
  Wand2,
  Users,
} from "lucide-react";
import {
  getAccountsList,
  createAccount,
  updateAccount,
  updateAccountStatus,
  getEmployeesWithoutAccountDetails,
} from "../../../services/adminService";
import SortableHeader, { nextSort } from "../../../components/common/SortableHeader";
import { SkeletonRows } from "../../../components/common/TableSkeleton";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Modal from "../../../components/common/Modal";
import {
  TABLE_SCROLL,
  TABLE,
  THEAD,
  THEAD_ROW,
  TH,
  TBODY,
  TR,
  TD,
  STICKY_TH,
  STICKY_TD,
} from "../../../components/common/tableStyles";
import { getRoleLabel, isAdminRole } from "../../../utils/navigation";

// Danh sách vai trò dùng chung cho bộ lọc, form cấp mới và form chỉnh sửa.
// "ADMIN" chỉ hiện với người đang đăng nhập là Quản trị viên (máy chủ trả 403 nếu không phải).
const ROLE_OPTIONS = [
  { value: "NHAN_VIEN", label: "Nhân viên", hint: "Quyền hạn tiêu chuẩn" },
  { value: "TRUONG_NHOM", label: "Trưởng nhóm", hint: "Duyệt đơn và theo dõi nhóm" },
  { value: "QUAN_LY", label: "Quản lý", hint: "Quản lý nhân sự, chấm công, lương" },
  { value: "ADMIN", label: "Quản trị viên (ADMIN)", hint: "Toàn quyền hệ thống", adminOnly: true },
];

const STATUS_LABELS = { HOAT_DONG: "Đang hoạt động", KHOA: "Đã khóa" };

const MIN_PASSWORD = 6;

const roleBadges = {
  ADMIN: "bg-rose-50 text-rose-800 border-rose-200 font-bold",
  QUAN_LY: "bg-sky-50 text-sky-800 border-sky-300 font-semibold",
  TRUONG_NHOM: "bg-purple-50 text-purple-800 border-purple-300 font-semibold",
  NHAN_VIEN: "bg-slate-100 text-slate-700 border-slate-200",
};

const formatDate = (val) => {
  if (!val) return "";
  const [y, m, d] = String(val).split("T")[0].split("-");
  return d && m && y ? `${d}/${m}/${y}` : String(val);
};

// Sinh mật khẩu ngẫu nhiên (bỏ các ký tự dễ nhầm 0/O, 1/l/I)
const generatePassword = (length = 10) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values, (n) => chars[n % chars.length]).join("");
};

const validateNewPassword = (value) => {
  const v = value.trim();
  if (!v) return "Vui lòng nhập mật khẩu mới.";
  if (v.length < MIN_PASSWORD) return `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD} ký tự.`;
  if (v === "1") return "Không được dùng mật khẩu mặc định cũ. Hãy chọn mật khẩu khác.";
  return "";
};

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }
}

function CopyButton({ text, label = "Sao chép" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyToClipboard(text)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer shrink-0"
      aria-label={copied ? "Đã sao chép" : label}
    >
      {copied ? <Check size={14} className="text-emerald-600" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span>{copied ? "Đã chép" : label}</span>
    </button>
  );
}

export default function AdminAccountsTab({ userSession }) {
  const actorIsAdmin = isAdminRole(userSession?.role);
  const selfMaNv = userSession?.ma_nv;
  const roleOptions = ROLE_OPTIONS.filter((o) => !o.adminOnly || actorIsAdmin);

  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sort, setSort] = useState({ by: "", order: "asc" });

  const activeFilterCount = [searchTerm, roleFilter, statusFilter].filter(Boolean).length;

  const handleSort = (field) => {
    setSort((prev) => nextSort(prev, field));
    setPage(1);
  };

  const handleTriggerSearch = () => {
    setSearchTerm(searchInput.trim());
    setPage(1);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim()) {
      setSearchTerm("");
      setPage(1);
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  // ────────────────── MODAL CẤP TÀI KHOẢN MỚI ──────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [unassignedList, setUnassignedList] = useState([]);
  const [unassignedIndex, setUnassignedIndex] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [createLoadError, setCreateLoadError] = useState(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({ ma_nv: "", ma_vai_tro: "NHAN_VIEN" });
  // Mật khẩu tạm vừa cấp: chỉ hiển thị MỘT lần
  const [createdCredential, setCreatedCredential] = useState(null);

  // ────────────────── MODAL CHỈNH SỬA TÀI KHOẢN (VAI TRÒ / TRẠNG THÁI) ──────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editForm, setEditForm] = useState({ ma_vai_tro: "NHAN_VIEN", trang_thai: "HOAT_DONG" });

  // ────────────────── MODAL ĐẶT LẠI MẬT KHẨU ──────────────────
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ────────────────── HỘP THOẠI XÁC NHẬN DÙNG CHUNG ──────────────────
  const [confirm, setConfirm] = useState(null);

  // ────────────────── TOAST THÔNG BÁO ──────────────────
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Tải danh sách tài khoản
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getAccountsList({
        page,
        page_size: pageSize,
        search: searchTerm || undefined,
        ma_vai_tro: roleFilter || undefined,
        trang_thai: statusFilter || undefined,
        sort_by: sort.by || undefined,
        sort_order: sort.by ? sort.order : undefined,
      });
      setAccounts(data?.items || []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error("Lỗi khi tải danh sách tài khoản:", err);
      setAccounts([]);
      setTotal(0);
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, roleFilter, statusFilter, sort]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ────────────────── CẤP TÀI KHOẢN THEO HÀNG CHỜ NHÂN SỰ ──────────────────
  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateLoading(true);
    setCreateLoadError(null);
    setCreateError("");
    try {
      const employees = (await getEmployeesWithoutAccountDetails()) || [];
      setUnassignedList(employees);
      setUnassignedIndex(0);
      setCreateForm({ ma_nv: employees[0]?.ma_nv || "", ma_vai_tro: "NHAN_VIEN" });
    } catch (err) {
      console.error("Lỗi khi tải nhân viên chưa có tài khoản:", err);
      setUnassignedList([]);
      setCreateLoadError(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSelectEmployeeByIndex = (idx) => {
    if (idx < 0 || idx >= unassignedList.length) return;
    setUnassignedIndex(idx);
    setCreateError("");
    setCreateForm((prev) => ({ ...prev, ma_nv: unassignedList[idx].ma_nv }));
  };

  const currentUnassignedEmp = unassignedList[unassignedIndex];

  const doCreateAccount = async () => {
    const target = currentUnassignedEmp;
    setIsSubmittingCreate(true);
    setCreateError("");
    try {
      const res = await createAccount({
        ma_nv: createForm.ma_nv,
        ma_vai_tro: createForm.ma_vai_tro,
        trang_thai: "HOAT_DONG",
      });

      setCreatedCredential({
        ma_nv: res?.ma_nv || createForm.ma_nv,
        ho_ten: target?.ho_ten || res?.ho_ten || "",
        ma_vai_tro: res?.ma_vai_tro || createForm.ma_vai_tro,
        mat_khau_tam: res?.mat_khau_tam || "",
      });
      fetchAccounts();

      // Loại nhân sự vừa cấp khỏi hàng chờ và chuyển sang người kế tiếp
      const remaining = unassignedList.filter((emp) => emp.ma_nv !== createForm.ma_nv);
      setUnassignedList(remaining);
      const nextIdx = Math.min(unassignedIndex, Math.max(remaining.length - 1, 0));
      setUnassignedIndex(nextIdx);
      setCreateForm({ ma_nv: remaining[nextIdx]?.ma_nv || "", ma_vai_tro: "NHAN_VIEN" });
    } catch (err) {
      setCreateError(err.message || "Cấp tài khoản thất bại.");
      throw err;
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!createForm.ma_nv || isSubmittingCreate) return;

    if (createForm.ma_vai_tro === "ADMIN") {
      setConfirm({
        title: "Cấp tài khoản Quản trị viên?",
        message: (
          <>
            Tài khoản của <strong>{currentUnassignedEmp?.ho_ten} ({createForm.ma_nv})</strong> sẽ có{" "}
            <strong>toàn quyền hệ thống</strong> (tài khoản, phân quyền, hợp đồng, tổ chức…). Chỉ cấp khi thật sự cần.
          </>
        ),
        confirmLabel: "Cấp quyền ADMIN",
        variant: "danger",
        onConfirm: async () => {
          await doCreateAccount();
          setConfirm(null);
        },
      });
      return;
    }

    doCreateAccount().catch(() => {});
  };

  // ────────────────── CHỈNH SỬA TÀI KHOẢN (VAI TRÒ / TRẠNG THÁI) ──────────────────
  const canManageAccount = (acc) => {
    if (!acc) return false;
    if (acc.ma_nv === selfMaNv) return false;
    if (isAdminRole(acc.ma_vai_tro) && !actorIsAdmin) return false;
    return true;
  };

  const handleOpenEditModal = (acc) => {
    if (!canManageAccount(acc)) return;
    setSelectedAccount(acc);
    setEditForm({
      ma_vai_tro: acc.ma_vai_tro || "NHAN_VIEN",
      trang_thai: acc.trang_thai || "HOAT_DONG",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const roleChanged = editForm.ma_vai_tro !== selectedAccount.ma_vai_tro;
    const statusChanged = editForm.trang_thai !== selectedAccount.trang_thai;
    if (!roleChanged && !statusChanged) {
      showToast("Không có thay đổi nào để lưu.", "info");
      return;
    }

    const locking = statusChanged && editForm.trang_thai === "KHOA";
    const toAdmin = roleChanged && editForm.ma_vai_tro === "ADMIN";

    setConfirm({
      title: locking ? "Khóa tài khoản và lưu thay đổi?" : "Xác nhận cập nhật tài khoản",
      message: (
        <div className="space-y-2">
          <p>
            Áp dụng các thay đổi sau cho <strong>{selectedAccount.ho_ten} ({selectedAccount.ma_nv})</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            {roleChanged && (
              <li>
                Vai trò: {getRoleLabel(selectedAccount.ma_vai_tro)} → <strong>{getRoleLabel(editForm.ma_vai_tro)}</strong>
              </li>
            )}
            {statusChanged && (
              <li>
                Trạng thái: {STATUS_LABELS[selectedAccount.trang_thai] || selectedAccount.trang_thai} →{" "}
                <strong>{STATUS_LABELS[editForm.trang_thai]}</strong>
              </li>
            )}
          </ul>
          {locking && <p className="text-rose-700 font-semibold">Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.</p>}
          {toAdmin && (
            <p className="text-rose-700 font-semibold">Vai trò ADMIN có toàn quyền hệ thống. Chỉ cấp khi thật sự cần.</p>
          )}
        </div>
      ),
      confirmLabel: locking ? "Khóa & lưu" : "Lưu thay đổi",
      variant: locking || toAdmin ? "danger" : "warning",
      onConfirm: async () => {
        const payload = {};
        if (roleChanged) payload.ma_vai_tro = editForm.ma_vai_tro;
        if (statusChanged) payload.trang_thai = editForm.trang_thai;
        await updateAccount(selectedAccount.ma_nv, payload);
        setConfirm(null);
        setIsEditModalOpen(false);
        showToast(`Đã cập nhật tài khoản ${selectedAccount.ma_nv}.`);
        fetchAccounts();
      },
    });
  };

  // ────────────────── ĐẶT LẠI MẬT KHẨU ──────────────────
  const handleOpenPasswordModal = () => {
    setNewPassword("");
    setPasswordError("");
    setShowPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const error = validateNewPassword(newPassword);
    setPasswordError(error);
    if (error) return;

    const value = newPassword.trim();
    setConfirm({
      title: "Đặt lại mật khẩu?",
      message: (
        <>
          Mật khẩu của <strong>{selectedAccount.ho_ten} ({selectedAccount.ma_nv})</strong> sẽ được thay ngay lập tức.
          Người dùng sẽ <strong>bắt buộc đổi mật khẩu</strong> ở lần đăng nhập tiếp theo.
        </>
      ),
      confirmLabel: "Đặt lại mật khẩu",
      variant: "warning",
      icon: KeyRound,
      onConfirm: async () => {
        await updateAccount(selectedAccount.ma_nv, { mat_khau_moi: value });
        setConfirm(null);
        setIsPasswordModalOpen(false);
        showToast(`Đã đặt lại mật khẩu cho ${selectedAccount.ma_nv}. Hãy gửi mật khẩu mới qua kênh an toàn.`);
      },
    });
  };

  // ────────────────── KHÓA / MỞ KHÓA NHANH ──────────────────
  const requestToggleStatus = (acc) => {
    const locking = acc.trang_thai === "HOAT_DONG";
    setConfirm({
      title: locking ? "Khóa tài khoản?" : "Mở khóa tài khoản?",
      message: locking ? (
        <>
          Tài khoản của <strong>{acc.ho_ten} ({acc.ma_nv})</strong> sẽ bị khóa và không thể đăng nhập cho đến khi được mở
          khóa.
        </>
      ) : (
        <>
          Tài khoản của <strong>{acc.ho_ten} ({acc.ma_nv})</strong> sẽ được đăng nhập trở lại.
        </>
      ),
      confirmLabel: locking ? "Khóa tài khoản" : "Mở khóa",
      variant: locking ? "danger" : "primary",
      icon: locking ? Lock : Unlock,
      onConfirm: async () => {
        await updateAccountStatus(acc.ma_nv, locking ? "KHOA" : "HOAT_DONG");
        setConfirm(null);
        showToast(`Đã ${locking ? "khóa" : "mở khóa"} tài khoản ${acc.ma_nv}.`);
        fetchAccounts();
      },
    });
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const selectClass =
    "px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer";

  return (
    <div className="flex flex-col gap-6">
      {/* ───────────────── TOAST THÔNG BÁO ───────────────── */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[70] p-4 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-up max-w-md ${
            toastType === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : toastType === "info"
              ? "bg-sky-50 border-sky-200 text-sky-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toastType === "error" ? <AlertCircle size={16} /> : toastType === "info" ? <Info size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ───────────────── HEADER TAB ───────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            <KeyRound size={12} className="text-sky-600" aria-hidden="true" />
            <span>Tài khoản & Phân quyền</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase">
            QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấp tài khoản theo hàng chờ nhân sự, đặt lại mật khẩu, khóa / mở khóa và gán vai trò
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <UserPlus size={15} aria-hidden="true" />
          <span>Cấp tài khoản mới</span>
        </button>
      </div>

      {/* ───────────────── THANH TÌM KIẾM & BỘ LỌC ───────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 w-full lg:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTriggerSearch();
                }
              }}
              aria-label="Tìm tài khoản"
              placeholder="Tìm theo mã NV, họ tên, email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleTriggerSearch}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Tìm kiếm (Enter)"
          >
            <Search size={14} aria-hidden="true" />
            <span>Tìm kiếm</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo vai trò"
            className={selectClass}
          >
            <option value="">Tất cả vai trò</option>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo trạng thái"
            className={selectClass}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="HOAT_DONG">Đang hoạt động</option>
            <option value="KHOA">Đã khóa</option>
          </select>

          {activeFilterCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <Filter size={11} aria-hidden="true" />
              Đang lọc: {activeFilterCount} điều kiện
            </span>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            disabled={activeFilterCount === 0}
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Đặt lại bộ lọc</span>
          </button>

          <button
            type="button"
            onClick={fetchAccounts}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Làm mới danh sách"
            aria-label="Làm mới danh sách"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin text-sky-600" : ""} />
          </button>
        </div>
      </div>

      {/* ───────────────── BẢNG DANH SÁCH TÀI KHOẢN ───────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadError && !isLoading ? (
          <ErrorState error={loadError} onRetry={fetchAccounts} />
        ) : !isLoading && accounts.length === 0 ? (
          <EmptyState
            icon={Users}
            title={activeFilterCount > 0 ? "Không tìm thấy tài khoản phù hợp" : "Chưa có tài khoản nào"}
            description={
              activeFilterCount > 0
                ? `Không có tài khoản nào khớp với ${activeFilterCount} điều kiện đang áp dụng.`
                : "Bấm “Cấp tài khoản mới” để cấp tài khoản đăng nhập cho nhân sự."
            }
            hasFilters={activeFilterCount > 0}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <div className={TABLE_SCROLL}>
            <table className={TABLE} aria-busy={isLoading}>
              <thead className={THEAD}>
                <tr className={THEAD_ROW}>
                  <SortableHeader className={`${TH} ${STICKY_TH} min-w-[110px]`} label="Mã NV" field="ma_nv" sort={sort} onSort={handleSort} />
                  <SortableHeader className={`${TH} min-w-[190px]`} label="Họ tên" field="ho_ten" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Đơn vị công tác" field="ten_pb" sort={sort} onSort={handleSort} />
                  <th scope="col" className={TH}>Liên hệ</th>
                  <SortableHeader className={TH} label="Vai trò" field="ma_vai_tro" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Trạng thái" field="trang_thai" sort={sort} onSort={handleSort} />
                  <th scope="col" className={`${TH} text-center`}>Thao tác</th>
                </tr>
              </thead>
              <tbody className={TBODY}>
                {isLoading ? (
                  <SkeletonRows rows={8} columns={7} />
                ) : (
                  accounts.map((acc) => {
                    const isLocked = acc.trang_thai === "KHOA";
                    const isSelf = acc.ma_nv === selfMaNv;
                    const isProtected = isAdminRole(acc.ma_vai_tro) && !actorIsAdmin;

                    return (
                      <tr key={acc.ma_tk || acc.ma_nv} className={TR}>
                        <td className={`${TD} ${STICKY_TD} whitespace-nowrap`}>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 font-mono">{acc.ma_nv}</span>
                            {acc.ma_tk && <span className="text-[10px] text-slate-400 font-mono">TK #{acc.ma_tk}</span>}
                          </div>
                        </td>

                        <td className={TD}>
                          <div className="font-semibold text-slate-900 whitespace-nowrap">{acc.ho_ten || "—"}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                            {acc.lan_dn_cuoi ? `Đăng nhập gần nhất: ${formatDate(acc.lan_dn_cuoi)}` : "Chưa từng đăng nhập"}
                          </div>
                        </td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <div className="flex flex-col">
                            <span className="text-slate-800 font-medium">{acc.ten_pb || "Chưa phân phòng ban"}</span>
                            <span className="text-[11px] text-slate-500">{acc.ten_cv || "—"}</span>
                          </div>
                        </td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-700 font-medium flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-400" aria-hidden="true" />
                              {acc.sdt || "—"}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Mail size={12} className="text-slate-400" aria-hidden="true" />
                              {acc.email || "—"}
                            </span>
                          </div>
                        </td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[11px] border ${
                              roleBadges[acc.ma_vai_tro] || "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {getRoleLabel(acc.ma_vai_tro)}
                          </span>
                        </td>

                        <td className={`${TD} whitespace-nowrap`}>
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <Lock size={11} aria-hidden="true" />
                              Đã khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Unlock size={11} aria-hidden="true" />
                              Hoạt động
                            </span>
                          )}
                        </td>

                        <td className={`${TD} text-center whitespace-nowrap`}>
                          <div className="flex items-center justify-center gap-1.5">
                            {isSelf ? (
                              <span
                                className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded-md border border-sky-200 select-none"
                                title="Không thể tự chỉnh sửa, khóa hoặc đổi vai trò tài khoản của chính mình"
                              >
                                Tài khoản của bạn
                              </span>
                            ) : isProtected ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 select-none"
                                title="Chỉ Quản trị viên mới được chỉnh sửa tài khoản Quản trị viên"
                              >
                                <ShieldCheck size={11} aria-hidden="true" />
                                Được bảo vệ
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(acc)}
                                  className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                                  title="Chỉnh sửa tài khoản"
                                  aria-label={`Chỉnh sửa tài khoản ${acc.ma_nv}`}
                                >
                                  <Edit2 size={15} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => requestToggleStatus(acc)}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                                    isLocked
                                      ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                      : "text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100"
                                  }`}
                                  title={isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                  aria-label={`${isLocked ? "Mở khóa" : "Khóa"} tài khoản ${acc.ma_nv}`}
                                >
                                  {isLocked ? <Unlock size={13} aria-hidden="true" /> : <Lock size={13} aria-hidden="true" />}
                                  <span>{isLocked ? "Mở khóa" : "Khóa"}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
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
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Trang trước"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Trang sau"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────── MODAL: CẤP TÀI KHOẢN THEO HÀNG CHỜ ────────────────── */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => !isSubmittingCreate && setIsCreateModalOpen(false)}
        canClose={!isSubmittingCreate}
        labelledBy="create-account-title"
        panelClassName="max-w-xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <UserPlus size={18} aria-hidden="true" />
            </div>
            <div>
              <h3 id="create-account-title" className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                Cấp tài khoản người dùng mới
              </h3>
              <p className="text-[11px] text-slate-500">Lần lượt theo thứ tự mã nhân viên chưa có tài khoản</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            disabled={isSubmittingCreate}
            aria-label="Đóng"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {createLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs" role="status">
            <Loader2 className="w-7 h-7 animate-spin text-sky-600" aria-hidden="true" />
            <span>Đang tải danh sách nhân sự chưa có tài khoản...</span>
          </div>
        ) : createLoadError ? (
          <ErrorState error={createLoadError} onRetry={handleOpenCreateModal} compact />
        ) : unassignedList.length === 0 ? (
          <div className="py-10 text-center text-slate-600 text-xs flex flex-col items-center gap-2">
            <CheckCircle2 size={32} className="text-emerald-500" aria-hidden="true" />
            <span className="font-semibold text-slate-800 text-sm">Đã cấp đủ tài khoản</span>
            <span>Tất cả nhân sự đang làm việc đều đã có tài khoản đăng nhập.</span>
          </div>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
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
                  disabled={unassignedIndex <= 0 || isSubmittingCreate}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                  <span>Trước</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectEmployeeByIndex(unassignedIndex + 1)}
                  disabled={unassignedIndex >= unassignedList.length - 1 || isSubmittingCreate}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <span>Tiếp</span>
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            {currentUnassignedEmp && (
              <div className="bg-sky-50/40 border border-sky-200/80 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                      {currentUnassignedEmp.ho_ten}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-800">
                        {currentUnassignedEmp.ma_nv}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span className="font-medium text-slate-700">{currentUnassignedEmp.ten_pb || "Chưa phân phòng ban"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-200/50 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase size={13} className="text-sky-600 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      Chức vụ: <strong>{currentUnassignedEmp.ten_cv || "—"}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-sky-600 shrink-0" aria-hidden="true" />
                    <span>
                      SĐT: <strong>{currentUnassignedEmp.sdt || "—"}</strong>
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Mail size={13} className="text-sky-600 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      Email: <strong>{currentUnassignedEmp.email || "—"}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="create-role" className="block text-xs font-semibold text-slate-700">
                Vai trò <span className="text-rose-500">*</span>
              </label>
              <select
                id="create-role"
                value={createForm.ma_vai_tro}
                onChange={(e) => setCreateForm({ ...createForm, ma_vai_tro: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} – {o.hint}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Hệ thống tự sinh <strong>mật khẩu tạm</strong> và chỉ hiển thị <strong>một lần</strong> sau khi cấp. Nhân sự bắt
                buộc phải đổi mật khẩu ở lần đăng nhập đầu tiên.
              </span>
            </div>

            {createError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>{createError}</span>
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmittingCreate}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={isSubmittingCreate || !currentUnassignedEmp}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingCreate ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <UserPlus size={14} aria-hidden="true" />}
                <span>{isSubmittingCreate ? "Đang cấp tài khoản..." : `Cấp tài khoản cho ${createForm.ma_nv}`}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ────────────────── MODAL: MẬT KHẨU TẠM (HIỂN THỊ MỘT LẦN) ────────────────── */}
      <Modal
        open={Boolean(createdCredential)}
        onClose={() => setCreatedCredential(null)}
        labelledBy="credential-title"
        panelClassName="max-w-md"
        closeOnBackdrop={false}
        zIndex="z-[60]"
      >
        {createdCredential && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 id="credential-title" className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                  Đã cấp tài khoản
                </h3>
                <p className="text-[11px] text-slate-500">
                  {createdCredential.ho_ten} • {createdCredential.ma_nv} • {getRoleLabel(createdCredential.ma_vai_tro)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">Mật khẩu tạm</span>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 text-emerald-300 font-mono text-sm font-bold tracking-wider select-all break-all"
                  aria-label="Mật khẩu tạm"
                >
                  {createdCredential.mat_khau_tam || "—"}
                </code>
                {createdCredential.mat_khau_tam && <CopyButton text={createdCredential.mat_khau_tam} />}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Mật khẩu này <strong>chỉ hiển thị một lần</strong> và không thể xem lại. Hãy gửi cho nhân sự qua kênh an toàn;
                nhân sự sẽ <strong>bắt buộc đổi mật khẩu</strong> ở lần đăng nhập đầu tiên.
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setCreatedCredential(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs cursor-pointer"
              >
                Tôi đã lưu mật khẩu
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ────────────────── MODAL: CHỈNH SỬA TÀI KHOẢN ────────────────── */}
      <Modal
        open={isEditModalOpen && Boolean(selectedAccount)}
        onClose={() => setIsEditModalOpen(false)}
        labelledBy="edit-account-title"
        panelClassName="max-w-lg"
      >
        {selectedAccount && (
          <>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Edit2 size={18} aria-hidden="true" />
                </div>
                <div>
                  <h3 id="edit-account-title" className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                    Chỉnh sửa tài khoản
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedAccount.ma_tk ? `Mã TK #${selectedAccount.ma_tk} • ` : ""}
                    {selectedAccount.ma_nv}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Đóng"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedAccount.ho_ten}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-slate-200 text-slate-700">
                  {selectedAccount.ma_nv}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div>
                  Phòng ban: <strong className="text-slate-800">{selectedAccount.ten_pb || "—"}</strong>
                </div>
                <div>
                  Chức vụ: <strong className="text-slate-800">{selectedAccount.ten_cv || "—"}</strong>
                </div>
                {selectedAccount.sdt && (
                  <div>
                    SĐT: <strong className="text-slate-800">{selectedAccount.sdt}</strong>
                  </div>
                )}
                {selectedAccount.email && (
                  <div>
                    Email: <strong className="text-slate-800">{selectedAccount.email}</strong>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="edit-role" className="block text-xs font-semibold text-slate-700">
                  Vai trò
                </label>
                <select
                  id="edit-role"
                  value={editForm.ma_vai_tro}
                  onChange={(e) => setEditForm({ ...editForm, ma_vai_tro: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {roleOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label} – {o.hint}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-status" className="block text-xs font-semibold text-slate-700">
                  Trạng thái tài khoản
                </label>
                <select
                  id="edit-status"
                  value={editForm.trang_thai}
                  onChange={(e) => setEditForm({ ...editForm, trang_thai: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 cursor-pointer ${
                    editForm.trang_thai === "KHOA"
                      ? "bg-rose-50 border-rose-300 text-rose-800 focus:ring-rose-500"
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:ring-sky-500"
                  }`}
                >
                  <option value="HOAT_DONG">Đang hoạt động (cho phép đăng nhập)</option>
                  <option value="KHOA">Khóa (chặn đăng nhập)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleOpenPasswordModal}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <KeyRound size={15} className="text-amber-600" aria-hidden="true" />
                  <span>Đặt lại mật khẩu</span>
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
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <Edit2 size={14} aria-hidden="true" />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* ────────────────── MODAL: ĐẶT LẠI MẬT KHẨU ────────────────── */}
      <Modal
        open={isPasswordModalOpen && Boolean(selectedAccount)}
        onClose={() => setIsPasswordModalOpen(false)}
        labelledBy="reset-password-title"
        panelClassName="max-w-md"
        zIndex="z-[55]"
      >
        {selectedAccount && (
          <>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <KeyRound size={18} aria-hidden="true" />
                </div>
                <div>
                  <h3 id="reset-password-title" className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                    Đặt lại mật khẩu
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedAccount.ho_ten} • {selectedAccount.ma_nv}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                aria-label="Đóng"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4 text-xs" noValidate>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="reset-password-input" className="block text-xs font-semibold text-slate-700">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPassword(generatePassword());
                      setShowPassword(true);
                      setPasswordError("");
                    }}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 size={11} aria-hidden="true" />
                    <span>Tạo mật khẩu ngẫu nhiên</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="reset-password-input"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={`Tối thiểu ${MIN_PASSWORD} ký tự`}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      aria-invalid={Boolean(passwordError)}
                      aria-describedby="reset-password-note"
                      className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        passwordError ? "border-rose-300" : "border-slate-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {newPassword.trim() && <CopyButton text={newPassword.trim()} />}
                </div>

                {passwordError && (
                  <p role="alert" className="text-[11px] font-semibold text-rose-600">
                    {passwordError}
                  </p>
                )}

                <p id="reset-password-note" className="text-[11px] text-slate-500 leading-relaxed">
                  Mật khẩu có hiệu lực ngay. Nhân sự sẽ <strong>bắt buộc đổi mật khẩu</strong> ở lần đăng nhập tiếp theo.
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
                  disabled={!newPassword.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <KeyRound size={14} aria-hidden="true" />
                  <span>Đặt lại mật khẩu</span>
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        icon={confirm?.icon}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
