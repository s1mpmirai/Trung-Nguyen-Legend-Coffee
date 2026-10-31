import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Shield,
  Award,
  Users,
  Check,
  X,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  RefreshCw,
  Search,
  ChevronDown,
  Lock,
  Pencil,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  getRoleMatrix,
  assignRoleToEmployee,
  getEmployeePermissions,
  getAccountsList,
  updateCustomPermissions,
  updateRolePermissions,
} from "../../../services/adminService";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import ErrorState from "../../../components/common/ErrorState";
import { SkeletonRows } from "../../../components/common/TableSkeleton";
import { isAdminRole } from "../../../utils/navigation";

// ────────────────── TÊN QUYỀN TIẾNG VIỆT DỄ HIỂU ──────────────────
export const PERMISSION_MAP = {
  EMPLOYEE_VIEW: { label: "Xem danh sách & hồ sơ nhân sự", desc: "Tra cứu danh sách nhân viên, thông tin liên hệ và lý lịch làm việc" },
  EMPLOYEE_CREATE: { label: "Thêm nhân sự mới", desc: "Tiếp nhận và tạo hồ sơ nhân sự mới trong hệ thống" },
  EMPLOYEE_UPDATE: { label: "Cập nhật thông tin nhân sự", desc: "Chỉnh sửa hồ sơ, điều chuyển và duyệt yêu cầu cập nhật hồ sơ" },
  EMPLOYEE_DELETE: { label: "Cho thôi việc nhân sự", desc: "Chấm dứt công tác (ngay hoặc theo ngày hiệu lực)" },
  CONTRACT_MANAGE: { label: "Quản lý hợp đồng lao động", desc: "Xem, ký mới, gia hạn, thanh lý hợp đồng lao động" },
  ORG_MANAGE: { label: "Quản lý cơ cấu tổ chức", desc: "Thêm, sửa, ngừng phòng ban, chức vụ và thang bậc lương" },
  LEAVE_VIEW: { label: "Xem đơn từ", desc: "Theo dõi đơn nghỉ phép, nghỉ việc và các loại đơn khác" },
  LEAVE_CREATE: { label: "Tạo và gửi đơn", desc: "Gửi đơn xin nghỉ phép, nghỉ không lương, nghỉ việc" },
  LEAVE_APPROVE: { label: "Phê duyệt / từ chối đơn", desc: "Ký duyệt hoặc từ chối đơn từ của cấp dưới" },
  ATTENDANCE_MANAGE: { label: "Quản lý chấm công", desc: "Theo dõi giờ vào/ra, duyệt và điều chỉnh công" },
  ATTENDANCE_LOCK: { label: "Chốt / mở khóa công tháng", desc: "Chốt bảng công trước khi tính lương, mở khóa khi lương chưa duyệt" },
  PAYROLL_VIEW: { label: "Xem phiếu lương", desc: "Xem chi tiết lương, phụ cấp, khấu trừ và thực lĩnh" },
  PAYROLL_MANAGE: { label: "Tính & duyệt bảng lương", desc: "Tính lương tháng, duyệt và xác nhận chi trả" },
  REPORT_VIEW: { label: "Xem báo cáo nhân sự", desc: "Báo cáo biến động tháng, cơ cấu trình độ – lương – thâm niên" },
  ACCOUNT_MANAGE: { label: "Quản lý tài khoản người dùng", desc: "Cấp tài khoản, khóa / mở khóa, đặt lại mật khẩu (vào được Cổng Quản trị)" },
  PERMISSION_ASSIGN: { label: "Phân quyền & bổ nhiệm vai trò", desc: "Gán vai trò và cấp / thu hồi quyền riêng cho nhân sự" },
};

// Nhãn nhóm quyền theo nhom_quyen trong CSDL
export const GROUP_MAP = {
  NHAN_SU: "Nhân sự",
  TO_CHUC: "Tổ chức",
  CHAM_CONG: "Chấm công",
  DON_TU: "Đơn từ & nghỉ phép",
  LUONG: "Lương",
  BAO_CAO: "Báo cáo",
  PHAN_QUYEN: "Tài khoản & phân quyền",
};
const GROUP_ORDER = ["NHAN_SU", "TO_CHUC", "CHAM_CONG", "DON_TU", "LUONG", "BAO_CAO", "PHAN_QUYEN"];

export const ROLE_LABELS = {
  ADMIN: "Quản trị viên",
  QUAN_LY: "Quản lý",
  TRUONG_NHOM: "Trưởng nhóm",
  NHAN_VIEN: "Nhân viên",
};
const ROLE_ORDER = ["NHAN_VIEN", "TRUONG_NHOM", "QUAN_LY", "ADMIN"];
const ROLE_RANK = { NHAN_VIEN: 1, TRUONG_NHOM: 2, QUAN_LY: 3, ADMIN: 4 };
const ROLE_HINTS = {
  NHAN_VIEN: "quyền cơ bản: đơn từ, phiếu lương của bản thân",
  TRUONG_NHOM: "duyệt đơn, chấm công và theo dõi nhóm",
  QUAN_LY: "quản lý nhân sự, chấm công, lương và báo cáo",
  ADMIN: "toàn quyền hệ thống",
};
const ROLE_COLORS = {
  NHAN_VIEN: { head: "text-slate-700", dot: "bg-emerald-100 text-emerald-700" },
  TRUONG_NHOM: { head: "text-purple-700", dot: "bg-purple-100 text-purple-700" },
  QUAN_LY: { head: "text-sky-700", dot: "bg-sky-100 text-sky-700" },
  ADMIN: { head: "text-sky-800", dot: "bg-sky-600 text-white" },
};
const roleBadgeClass = (role) =>
  role === "ADMIN"
    ? "bg-rose-50 text-rose-700 border border-rose-200"
    : role === "QUAN_LY"
    ? "bg-sky-50 text-sky-700 border border-sky-200"
    : role === "TRUONG_NHOM"
    ? "bg-purple-50 text-purple-700 border border-purple-200"
    : "bg-slate-100 text-slate-600 border border-slate-200";

// Quyền chỉ Admin mới được cấp / thu hồi (máy chủ trả 403 với người khác)
const ADMIN_ONLY_PERMISSIONS = [
  "ACCOUNT_MANAGE",
  "PERMISSION_ASSIGN",
  "ORG_MANAGE",
  "CONTRACT_MANAGE",
  "PAYROLL_MANAGE",
  "ATTENDANCE_LOCK",
];

const permLabel = (perm) => PERMISSION_MAP[perm?.ma_quyen || perm]?.label || perm?.ten_quyen || perm?.ma_quyen || perm;

/** Ô chọn nhân sự có tìm kiếm (dùng cho Bổ nhiệm và Tra cứu quyền). */
function EmployeePicker({ id, employees, value, onSelect, placeholder }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = text.trim().toLowerCase();
  const filtered = !q
    ? employees
    : employees.filter(
        (e) =>
          (e.ma_nv && e.ma_nv.toLowerCase().includes(q)) ||
          (e.ho_ten && e.ho_ten.toLowerCase().includes(q)) ||
          (e.ma_vai_tro && (ROLE_LABELS[e.ma_vai_tro] || "").toLowerCase().includes(q))
      );

  return (
    <div className="relative" ref={wrapperRef}>
      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          if (value) onSelect(null);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <ChevronDown
        className={`w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform pointer-events-none ${open ? "rotate-180" : ""}`}
        aria-hidden="true"
      />
      {open && (
        <div
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy nhân sự nào</div>
          ) : (
            filtered.map((emp) => (
              <button
                key={emp.ma_nv}
                type="button"
                role="option"
                aria-selected={value === emp.ma_nv}
                onClick={() => {
                  onSelect(emp);
                  setText(`${emp.ma_nv} - ${emp.ho_ten || ""}`);
                  setOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-sky-50 transition-colors cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-b-0 ${
                  value === emp.ma_nv ? "bg-sky-50" : ""
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {(emp.ho_ten || emp.ma_nv || "").substring(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate">
                    <span className="font-bold text-slate-900">{emp.ho_ten || emp.ma_nv}</span>
                    <span className="text-slate-400 ml-1.5 font-mono">({emp.ma_nv})</span>
                  </span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${roleBadgeClass(emp.ma_vai_tro)}`}>
                  {ROLE_LABELS[emp.ma_vai_tro] || emp.ma_vai_tro}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPermissionsTab({ userSession }) {
  const actorIsAdmin = isAdminRole(userSession?.role);
  const selfMaNv = userSession?.ma_nv;

  const [matrixData, setMatrixData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);

  // Bổ nhiệm vai trò
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [promoteRole, setPromoteRole] = useState("TRUONG_NHOM");

  // Tra cứu quyền thực tế
  const [inspectTarget, setInspectTarget] = useState(null);
  const [inspectResult, setInspectResult] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [customPermsState, setCustomPermsState] = useState({});

  // Ma trận: chế độ chỉnh sửa (chỉ ADMIN)
  const [editMode, setEditMode] = useState(false);
  const [draftMatrix, setDraftMatrix] = useState({});

  // Tìm kiếm quyền
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [confirm, setConfirm] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const matrix = await getRoleMatrix();
      setMatrixData(matrix);
    } catch (err) {
      console.error("Lỗi khi tải ma trận quyền:", err);
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadEmployeeList = useCallback(async () => {
    try {
      const res = await getAccountsList({ page: 1, page_size: 200, sort_by: "ma_nv", sort_order: "asc" });
      const items = res?.items || res?.data || res || [];
      setEmployeeList(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách nhân sự:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadEmployeeList();
  }, [loadData, loadEmployeeList]);

  const permissionsList = matrixData?.permissions || [];
  const matrixMap = matrixData?.matrix || {};
  const totalPermissions = permissionsList.length;

  const roleColumns = useMemo(() => {
    const fromApi = (matrixData?.roles || []).map((r) => r.ma_vai_tro);
    const all = [...new Set([...ROLE_ORDER.filter((r) => fromApi.includes(r) || matrixMap[r]), ...fromApi])];
    return all.length ? all : ROLE_ORDER;
  }, [matrixData, matrixMap]);

  const roleName = (code) =>
    ROLE_LABELS[code] || (matrixData?.roles || []).find((r) => r.ma_vai_tro === code)?.ten_vai_tro || code;

  // ────────────────── BỔ NHIỆM / ĐỔI VAI TRÒ ──────────────────
  const assignableRoles = actorIsAdmin ? ["NHAN_VIEN", "TRUONG_NHOM", "QUAN_LY", "ADMIN"] : ["NHAN_VIEN", "TRUONG_NHOM"];

  const refreshInspect = async (maNv) => {
    if (!maNv) return;
    setInspectLoading(true);
    try {
      const res = await getEmployeePermissions(maNv);
      setInspectResult(res);
      const effective = res?.effective_permissions || [];
      const init = {};
      (matrixData?.permissions || []).forEach((p) => {
        init[p.ma_quyen] = effective.includes(p.ma_quyen);
      });
      effective.forEach((q) => {
        init[q] = true;
      });
      setCustomPermsState(init);
    } catch (err) {
      showToast(err.message || `Không tìm thấy quyền của nhân sự ${maNv}`, "error");
      setInspectResult(null);
    } finally {
      setInspectLoading(false);
    }
  };

  const handlePromoteSubmit = (e) => {
    e.preventDefault();
    if (!promoteTarget) return;
    if (promoteTarget.ma_nv === selfMaNv) {
      showToast("Không thể tự thay đổi vai trò của chính mình.", "error");
      return;
    }
    const oldRole = promoteTarget.ma_vai_tro;
    const newRole = promoteRole;
    if (oldRole === newRole) {
      showToast(`${promoteTarget.ho_ten} đang giữ vai trò ${roleName(newRole)}.`, "info");
      return;
    }
    const isUp = (ROLE_RANK[newRole] || 0) > (ROLE_RANK[oldRole] || 0);
    const toAdmin = newRole === "ADMIN";

    setConfirm({
      title: isUp ? "Xác nhận thăng vai trò" : "Xác nhận hạ vai trò",
      variant: toAdmin || !isUp ? "danger" : "warning",
      icon: Award,
      confirmLabel: isUp ? "Thăng vai trò" : "Hạ vai trò",
      message: (
        <div className="space-y-2">
          <p>
            <strong>
              {promoteTarget.ho_ten} ({promoteTarget.ma_nv})
            </strong>
            : {roleName(oldRole)} → <strong>{roleName(newRole)}</strong>
          </p>
          <p>Quyền mặc định mới: {ROLE_HINTS[newRole] || roleName(newRole)}. Áp dụng từ lần truy cập tiếp theo.</p>
          {toAdmin && <p className="text-rose-700 font-semibold">Vai trò Quản trị viên có toàn quyền hệ thống. Chỉ cấp khi thật sự cần.</p>}
          {!isUp && <p className="text-rose-700 font-semibold">Các quyền của vai trò cũ sẽ bị thu hồi.</p>}
        </div>
      ),
      onConfirm: async () => {
        await assignRoleToEmployee(promoteTarget.ma_nv, { ma_vai_tro: newRole });
        setConfirm(null);
        showToast(
          isUp
            ? `Đã thăng vai trò cho ${promoteTarget.ho_ten}: ${roleName(oldRole)} → ${roleName(newRole)}.`
            : `Đã chuyển vai trò của ${promoteTarget.ho_ten}: ${roleName(oldRole)} → ${roleName(newRole)}.`
        );
        setPromoteTarget((prev) => (prev ? { ...prev, ma_vai_tro: newRole } : prev));
        loadEmployeeList();
        if (inspectResult?.ma_nv === promoteTarget.ma_nv) refreshInspect(promoteTarget.ma_nv);
      },
    });
  };

  // ────────────────── QUYỀN RIÊNG CHO TÀI KHOẢN ──────────────────
  const handleInspectSubmit = (e) => {
    e.preventDefault();
    if (inspectTarget) refreshInspect(inspectTarget.ma_nv);
  };

  const canEditCustom = (pk) => actorIsAdmin || !ADMIN_ONLY_PERMISSIONS.includes(pk);

  const handleSaveCustomPermissions = () => {
    if (!inspectResult?.ma_nv) return;
    const effective = inspectResult.effective_permissions || [];
    const batch = Object.keys(customPermsState)
      .filter((pk) => Boolean(customPermsState[pk]) !== effective.includes(pk))
      .map((pk) => ({ ma_quyen: pk, duoc_cap: Boolean(customPermsState[pk]) }));

    if (batch.length === 0) {
      showToast("Không có thay đổi nào so với quyền hiện tại.", "info");
      return;
    }
    const grants = batch.filter((b) => b.duoc_cap);
    const revokes = batch.filter((b) => !b.duoc_cap);
    const grantsAdminPortal = grants.some((b) => b.ma_quyen === "ACCOUNT_MANAGE");

    setConfirm({
      title: "Lưu quyền riêng cho tài khoản?",
      variant: grantsAdminPortal || revokes.length ? "danger" : "warning",
      confirmLabel: "Lưu quyền",
      message: (
        <div className="space-y-2">
          <p>
            Tài khoản <strong>{inspectResult.ho_ten} ({inspectResult.ma_nv})</strong>:
          </p>
          {grants.length > 0 && (
            <p>
              <span className="font-semibold text-emerald-700">Cấp thêm:</span> {grants.map((b) => permLabel(b.ma_quyen)).join(", ")}
            </p>
          )}
          {revokes.length > 0 && (
            <p>
              <span className="font-semibold text-rose-700">Thu hồi:</span> {revokes.map((b) => permLabel(b.ma_quyen)).join(", ")}
            </p>
          )}
          {grantsAdminPortal && (
            <p className="text-rose-700 font-semibold">Quyền Quản lý tài khoản cho phép người này vào Cổng Quản trị.</p>
          )}
        </div>
      ),
      onConfirm: async () => {
        await updateCustomPermissions(inspectResult.ma_nv, { permissions: batch });
        setConfirm(null);
        showToast(`Đã lưu quyền riêng cho ${inspectResult.ho_ten} (${inspectResult.ma_nv}).`);
        await refreshInspect(inspectResult.ma_nv);
      },
    });
  };

  // ────────────────── CHỈNH MA TRẬN VAI TRÒ × QUYỀN (CHỈ ADMIN) ──────────────────
  const startEditMatrix = () => {
    const draft = {};
    roleColumns.filter((r) => r !== "ADMIN").forEach((r) => {
      draft[r] = [...(matrixMap[r] || [])];
    });
    setDraftMatrix(draft);
    setEditMode(true);
  };

  const toggleDraft = (role, maQuyen) => {
    setDraftMatrix((prev) => {
      const current = prev[role] || [];
      const next = current.includes(maQuyen) ? current.filter((q) => q !== maQuyen) : [...current, maQuyen];
      return { ...prev, [role]: next };
    });
  };

  const matrixChanges = useMemo(() => {
    if (!editMode) return [];
    return Object.keys(draftMatrix)
      .map((role) => {
        const before = matrixMap[role] || [];
        const after = draftMatrix[role] || [];
        return {
          role,
          added: after.filter((q) => !before.includes(q)),
          removed: before.filter((q) => !after.includes(q)),
          after,
        };
      })
      .filter((c) => c.added.length || c.removed.length);
  }, [editMode, draftMatrix, matrixMap]);

  const handleSaveMatrix = () => {
    if (matrixChanges.length === 0) {
      showToast("Ma trận chưa có thay đổi nào.", "info");
      return;
    }
    setConfirm({
      title: "Lưu thay đổi ma trận phân quyền?",
      variant: "danger",
      icon: Shield,
      confirmLabel: "Lưu ma trận",
      message: (
        <div className="space-y-2">
          <p>Quyền mặc định của các vai trò sau sẽ thay đổi và áp dụng cho mọi tài khoản thuộc vai trò đó:</p>
          <ul className="space-y-1.5">
            {matrixChanges.map((c) => (
              <li key={c.role} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-800">{roleName(c.role)}</div>
                {c.added.length > 0 && (
                  <div>
                    <span className="text-emerald-700 font-semibold">+ </span>
                    {c.added.map(permLabel).join(", ")}
                  </div>
                )}
                {c.removed.length > 0 && (
                  <div>
                    <span className="text-rose-700 font-semibold">− </span>
                    {c.removed.map(permLabel).join(", ")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ),
      onConfirm: async () => {
        let latest = null;
        try {
          for (const c of matrixChanges) {
            latest = await updateRolePermissions(c.role, c.after);
          }
        } catch (err) {
          // Một phần có thể đã lưu: tải lại ma trận thật từ máy chủ rồi báo lỗi trong hộp thoại
          loadData();
          throw err;
        }
        if (latest) setMatrixData(latest);
        else loadData();
        setConfirm(null);
        setEditMode(false);
        showToast(`Đã cập nhật ma trận phân quyền cho ${matrixChanges.length} vai trò.`);
      },
    });
  };

  // ────────────────── LỌC & NHÓM QUYỀN ──────────────────
  const filteredPermissions = permissionsList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const info = PERMISSION_MAP[p.ma_quyen] || {};
    const groupName = GROUP_MAP[p.nhom_quyen] || p.nhom_quyen || "";
    return [info.label, info.desc, groupName, p.ten_quyen, p.mo_ta, p.ma_quyen].some((s) => s && s.toLowerCase().includes(q));
  });

  const groupedPermissions = useMemo(() => {
    const groups = {};
    filteredPermissions.forEach((p) => {
      const key = p.nhom_quyen || "KHAC";
      (groups[key] = groups[key] || []).push(p);
    });
    const keys = Object.keys(groups).sort((a, b) => {
      const ia = GROUP_ORDER.indexOf(a);
      const ib = GROUP_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return keys.map((key) => ({ key, label: GROUP_MAP[key] || key, items: groups[key] }));
  }, [filteredPermissions]);

  const allPermissionGroups = useMemo(() => {
    const groups = {};
    permissionsList.forEach((p) => {
      const key = p.nhom_quyen || "KHAC";
      (groups[key] = groups[key] || []).push(p);
    });
    return Object.keys(groups)
      .sort((a, b) => {
        const ia = GROUP_ORDER.indexOf(a);
        const ib = GROUP_ORDER.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
      .map((key) => ({ key, label: GROUP_MAP[key] || key, items: groups[key] }));
  }, [permissionsList]);

  const columnCount = 2 + roleColumns.length;
  const effectivePerms = inspectResult?.effective_permissions || [];

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[70] p-4 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-up max-w-md ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : toast.type === "info"
              ? "bg-sky-50 border-sky-200 text-sky-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? <AlertCircle size={16} /> : toast.type === "info" ? <Info size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            <Shield size={12} className="text-sky-600" aria-hidden="true" />
            <span>Phân quyền theo vai trò (RBAC)</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase">
            PHÂN QUYỀN HỆ THỐNG & BỔ NHIỆM VAI TRÒ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalPermissions > 0
              ? `${totalPermissions} quyền chức năng chia theo ${roleColumns.length} vai trò, kèm công cụ bổ nhiệm và cấp quyền riêng`
              : "Ma trận quyền chức năng theo vai trò, kèm công cụ bổ nhiệm và cấp quyền riêng"}
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 text-xs shadow-xs self-start sm:self-auto"
          title="Làm mới ma trận quyền"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} aria-hidden="true" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* ───────────────── 1. BỔ NHIỆM & TRA CỨU QUYỀN ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bổ nhiệm vai trò */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <Award size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Bổ nhiệm / thay đổi vai trò</h3>
                <p className="text-[11px] text-slate-400">
                  {actorIsAdmin ? "Quản trị viên được gán mọi vai trò" : "Bạn được gán vai trò Nhân viên hoặc Trưởng nhóm"}
                </p>
              </div>
            </div>

            <form onSubmit={handlePromoteSubmit} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label htmlFor="promote-employee" className="block text-xs font-semibold text-slate-700">
                  Nhân sự <span className="text-rose-500">*</span>
                </label>
                <EmployeePicker
                  id="promote-employee"
                  employees={employeeList}
                  value={promoteTarget?.ma_nv}
                  onSelect={setPromoteTarget}
                  placeholder="Tìm theo mã NV, họ tên hoặc vai trò..."
                />
                {promoteTarget && (
                  <p className="text-[11px] text-slate-500">
                    Vai trò hiện tại:{" "}
                    <span className={`font-bold px-1.5 py-0.5 rounded ${roleBadgeClass(promoteTarget.ma_vai_tro)}`}>
                      {roleName(promoteTarget.ma_vai_tro)}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="promote-role" className="block text-xs font-semibold text-slate-700">
                  Vai trò mới <span className="text-rose-500">*</span>
                </label>
                <select
                  id="promote-role"
                  value={promoteRole}
                  onChange={(e) => setPromoteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>
                      {roleName(r)} – {ROLE_HINTS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!promoteTarget}
                className="w-full mt-2 py-3 px-4 bg-sky-600 text-white hover:bg-sky-700 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Xác nhận thay đổi vai trò</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Vai trò mới được áp dụng ngay; người dùng nhận đủ quyền tương ứng ở lần truy cập tiếp theo.
          </div>
        </div>

        {/* Tra cứu quyền thực tế */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Users size={18} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Tra cứu & cấp quyền riêng</h3>
              <p className="text-[11px] text-slate-400">Xem quyền đang có hiệu lực và cấp / thu hồi quyền riêng cho từng tài khoản</p>
            </div>
          </div>

          <form onSubmit={handleInspectSubmit} className="flex gap-2 mt-4">
            <div className="flex-1">
              <label htmlFor="inspect-employee" className="sr-only">
                Nhân sự cần tra cứu
              </label>
              <EmployeePicker
                id="inspect-employee"
                employees={employeeList}
                value={inspectTarget?.ma_nv}
                onSelect={setInspectTarget}
                placeholder="Tìm theo mã NV, họ tên..."
              />
            </div>
            <button
              type="submit"
              disabled={inspectLoading || !inspectTarget}
              className="px-4 py-2.5 bg-sky-600 text-white hover:bg-sky-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inspectLoading ? <Loader2 size={14} className="animate-spin text-white" aria-label="Đang tra cứu" /> : "Tra cứu"}
            </button>
          </form>

          {inspectResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="font-bold text-slate-900">{inspectResult.ho_ten}</span>
                  <span className="text-slate-500 ml-1.5 font-mono font-bold">({inspectResult.ma_nv})</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleBadgeClass(inspectResult.ma_vai_tro)}`}>
                  {roleName(inspectResult.ma_vai_tro) || inspectResult.ten_vai_tro}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  Quyền có hiệu lực: {effectivePerms.length}
                  {totalPermissions ? `/${totalPermissions}` : ""} quyền
                </span>
                {actorIsAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPermsState((prev) => ({ ...prev, ACCOUNT_MANAGE: true }));
                      showToast("Đã đánh dấu quyền Quản lý tài khoản – bấm “Lưu quyền tài khoản” để áp dụng.", "info");
                    }}
                    className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                    title="Đánh dấu quyền Quản lý tài khoản cho nhân viên IT"
                  >
                    <Sparkles size={11} aria-hidden="true" />
                    <span>Thiết lập nhanh: IT quản lý tài khoản</span>
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
                {allPermissionGroups.map((group) => (
                  <fieldset key={group.key}>
                    <legend className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{group.label}</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {group.items.map((p) => {
                        const checked = Boolean(customPermsState[p.ma_quyen]);
                        const editable = canEditCustom(p.ma_quyen);
                        const changed = checked !== effectivePerms.includes(p.ma_quyen);
                        const inRole = (inspectResult.vai_tro_quyen || []).includes(p.ma_quyen);
                        return (
                          <label
                            key={p.ma_quyen}
                            className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 transition select-none ${
                              editable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                            } ${
                              changed
                                ? "bg-amber-50 border-amber-300"
                                : checked
                                ? "bg-white border-sky-200"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                            title={!editable ? "Chỉ Quản trị viên được cấp / thu hồi quyền này" : undefined}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!editable}
                              onChange={() => setCustomPermsState((prev) => ({ ...prev, [p.ma_quyen]: !prev[p.ma_quyen] }))}
                              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
                            />
                            <span className="min-w-0">
                              <span className="font-semibold text-slate-800 flex items-center gap-1">
                                {permLabel(p)}
                                {!editable && <Lock size={10} className="text-slate-400" aria-hidden="true" />}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {inRole ? "Từ vai trò" : checked ? "Quyền riêng" : "Chưa có"}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveCustomPermissions}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Check size={13} aria-hidden="true" />
                  <span>Lưu quyền tài khoản</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ───────────────── 2. MA TRẬN QUYỀN × VAI TRÒ ───────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">Ma trận quyền theo vai trò</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalPermissions} quyền chức năng × {roleColumns.length} vai trò, nhóm theo nghiệp vụ.{" "}
              {actorIsAdmin ? "Quản trị viên có thể chỉnh quyền mặc định của từng vai trò." : "Chỉ Quản trị viên được chỉnh ma trận."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="text"
                  aria-label="Tìm quyền"
                  placeholder="Tìm quyền hoặc nhóm nghiệp vụ..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (!e.target.value.trim()) setSearchQuery("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setSearchQuery(searchInput.trim());
                    }
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery(searchInput.trim())}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Search size={12} aria-hidden="true" />
                <span>Tìm</span>
              </button>
            </div>

            {actorIsAdmin &&
              (editMode ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-amber-700">
                    {matrixChanges.length ? `${matrixChanges.length} vai trò đã thay đổi` : "Chưa có thay đổi"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setDraftMatrix({});
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw size={12} aria-hidden="true" />
                    Hủy chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMatrix}
                    disabled={matrixChanges.length === 0}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={12} aria-hidden="true" />
                    Lưu ma trận
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditMatrix}
                  disabled={isLoading || !matrixData}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <Pencil size={12} aria-hidden="true" />
                  Chỉnh ma trận
                </button>
              ))}
          </div>
        </div>

        {loadError && !isLoading ? (
          <ErrorState error={loadError} onRetry={loadData} />
        ) : (
          <div className="overflow-auto max-h-[75vh]">
            <table className="w-full text-left border-collapse text-xs" aria-busy={isLoading}>
              <thead className="sticky top-0 z-20 [&_th]:shadow-[inset_0_-1px_0_#e2e8f0]">
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4 min-w-[280px] bg-slate-50">
                    Quyền & mô tả chức năng
                  </th>
                  <th scope="col" className="py-3 px-4 bg-slate-50 whitespace-nowrap">
                    Mã quyền
                  </th>
                  {roleColumns.map((role) => (
                    <th
                      key={role}
                      scope="col"
                      className={`py-3 px-3 text-center whitespace-nowrap ${role === "ADMIN" ? "bg-sky-50" : "bg-slate-50"} ${
                        ROLE_COLORS[role]?.head || "text-slate-700"
                      }`}
                    >
                      <div>{roleName(role)}</div>
                      <div className="text-[10px] font-semibold normal-case tracking-normal text-slate-400">
                        {role === "ADMIN"
                          ? "Toàn quyền"
                          : `${(editMode ? draftMatrix[role] : matrixMap[role])?.length || 0}/${totalPermissions} quyền`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows rows={8} columns={columnCount} />
                ) : groupedPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={columnCount} className="py-8 text-center text-slate-400">
                      Không tìm thấy quyền nào khớp với từ khóa tìm kiếm
                    </td>
                  </tr>
                ) : (
                  groupedPermissions.map((group) => (
                    <React.Fragment key={group.key}>
                      <tr className="bg-slate-50/70">
                        <th
                          scope="colgroup"
                          colSpan={columnCount}
                          className="py-2 px-4 text-[10px] font-bold uppercase tracking-wider text-sky-700 border-y border-slate-200/70"
                        >
                          {group.label} <span className="text-slate-400 font-semibold">({group.items.length})</span>
                        </th>
                      </tr>
                      {group.items.map((perm) => {
                        const info = PERMISSION_MAP[perm.ma_quyen] || { label: perm.ten_quyen || perm.ma_quyen, desc: perm.mo_ta || "" };
                        return (
                          <tr key={perm.ma_quyen} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{info.label}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{info.desc || perm.mo_ta}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">{perm.ma_quyen}</td>
                            {roleColumns.map((role) => {
                              if (role === "ADMIN") {
                                return (
                                  <td key={role} className="py-3 px-3 text-center bg-sky-50/40">
                                    <span
                                      className="inline-flex w-5 h-5 rounded-full bg-sky-600 text-white items-center justify-center shadow-2xs"
                                      title="Quản trị viên luôn có toàn quyền"
                                    >
                                      <Check size={12} aria-hidden="true" />
                                      <span className="sr-only">Có quyền</span>
                                    </span>
                                  </td>
                                );
                              }
                              const original = (matrixMap[role] || []).includes(perm.ma_quyen);
                              if (editMode) {
                                const checked = (draftMatrix[role] || []).includes(perm.ma_quyen);
                                const changed = checked !== original;
                                return (
                                  <td key={role} className={`py-3 px-3 text-center ${changed ? "bg-amber-50" : ""}`}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleDraft(role, perm.ma_quyen)}
                                      aria-label={`${roleName(role)}: ${info.label}`}
                                      className={`w-4 h-4 rounded cursor-pointer accent-sky-600 ${changed ? "ring-2 ring-amber-400" : ""}`}
                                    />
                                  </td>
                                );
                              }
                              return (
                                <td key={role} className="py-3 px-3 text-center">
                                  {original ? (
                                    <span
                                      className={`inline-flex w-5 h-5 rounded-full items-center justify-center shadow-2xs ${
                                        ROLE_COLORS[role]?.dot || "bg-emerald-100 text-emerald-700"
                                      }`}
                                    >
                                      <Check size={12} aria-hidden="true" />
                                      <span className="sr-only">Có quyền</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-bold">
                                      <X size={12} className="inline" aria-hidden="true" />
                                      <span className="sr-only">Không có quyền</span>
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
