import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  Award,
  Users,
  Check,
  X,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ClipboardCheck,
  CreditCard,
  UserCheck,
  Sparkles,
  RefreshCw,
  Search,
  Info,
  Lock,
  FileBarChart2,
  UserX,
  Wallet,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import {
  getRoleMatrix,
  getEmployeePermissions,
  assignRoleToEmployee,
  updateCustomPermissions,
} from "../../services/adminService";
import ConfirmDialog from "./components/ConfirmDialog";
import {
  ADMIN_ONLY_PERMISSIONS,
  ROLES_ASSIGNABLE_BY_MANAGER,
  getApiErrorMessage,
  getManagerAccess,
} from "./managerUtils";

// Mô tả hiển thị cho các mã quyền đã biết. Danh sách & số lượng quyền luôn lấy từ máy chủ (/permissions/matrix);
// mã quyền mới chưa có mô tả ở đây vẫn hiển thị theo tên quyền trong CSDL.
const PERMISSION_META = [
  {
    ma_quyen: "ATTENDANCE_MANAGE",
    label: "Quản lý Chấm công & Ca làm việc",
    group: "Chấm công & Ca kíp",
    icon: Clock,
    color: "amber",
    desc: "Theo dõi bảng công hàng ngày, sửa giờ vào/ra và phê duyệt công (chốt công tháng là quyền riêng).",
    defaultFor: ["QUAN_LY", "TRUONG_NHOM"],
  },
  {
    ma_quyen: "LEAVE_APPROVE",
    label: "Phê duyệt Đơn từ Nghỉ phép & Đổi ca",
    group: "Đơn từ & Phép",
    icon: ClipboardCheck,
    color: "emerald",
    desc: "Ký duyệt hoặc từ chối các đơn xin nghỉ phép, đơn xin thôi việc của nhân viên trong đội ngũ.",
    defaultFor: ["QUAN_LY", "TRUONG_NHOM"],
  },
  {
    ma_quyen: "PAYROLL_MANAGE",
    label: "Tính toán & Phê duyệt Bảng lương",
    group: "Lương bổng & Đãi ngộ",
    icon: CreditCard,
    color: "purple",
    desc: "Xem tổng quỹ lương, tính toán thưởng phạt, kiểm tra phiếu lương và phê duyệt chi trả lương tháng.",
    defaultFor: ["QUAN_LY"],
  },
  {
    ma_quyen: "EMPLOYEE_VIEW",
    label: "Xem Danh sách & Hồ sơ Nhân sự",
    group: "Quản lý Nhân sự",
    icon: Users,
    color: "sky",
    desc: "Tra cứu danh bạ nhân sự, lý lịch công tác, hợp đồng lao động và thông tin liên lạc.",
    defaultFor: ["QUAN_LY", "TRUONG_NHOM"],
  },
  {
    ma_quyen: "EMPLOYEE_CREATE",
    label: "Thêm Nhân sự mới vào hệ thống",
    group: "Quản lý Nhân sự",
    icon: UserCheck,
    color: "indigo",
    desc: "Tiếp nhận và tạo mới hồ sơ nhân sự, đăng ký chức vụ và phòng ban trực thuộc.",
    defaultFor: ["QUAN_LY"],
  },
  {
    ma_quyen: "EMPLOYEE_UPDATE",
    label: "Cập nhật Hồ sơ & Duyệt chỉnh sửa",
    group: "Quản lý Nhân sự",
    icon: Shield,
    color: "blue",
    desc: "Phê duyệt các yêu cầu thay đổi thông tin cá nhân và cập nhật chức danh cho nhân viên.",
    defaultFor: ["QUAN_LY"],
  },
  {
    ma_quyen: "EMPLOYEE_DELETE",
    label: "Cho thôi việc nhân sự",
    group: "Quản lý Nhân sự",
    icon: UserX,
    color: "rose",
    desc: "Cho thôi việc với ngày hiệu lực (khóa tài khoản khi đến ngày), hủy lịch thôi việc.",
  },
  {
    ma_quyen: "ATTENDANCE_LOCK",
    label: "Chốt / mở khóa bảng công tháng",
    group: "Chấm công & Ca kíp",
    icon: Lock,
    color: "amber",
    desc: "Chốt công tháng (tự duyệt các bản ghi chờ duyệt) để tính lương, hoặc mở khóa khi bảng lương chưa duyệt.",
  },
  {
    ma_quyen: "REPORT_VIEW",
    label: "Xem báo cáo nhân sự",
    group: "Báo cáo",
    icon: FileBarChart2,
    color: "sky",
    desc: "Xem báo cáo biến động nhân sự theo tháng, thống kê trình độ, thâm niên và quỹ lương.",
  },
  {
    ma_quyen: "PAYROLL_VIEW",
    label: "Xem phiếu lương",
    group: "Lương bổng & Đãi ngộ",
    icon: Wallet,
    color: "purple",
    desc: "Xem phiếu lương cá nhân đã được duyệt.",
  },
];
const PERMISSION_META_MAP = Object.fromEntries(PERMISSION_META.map((p) => [p.ma_quyen, p]));

// Thứ bậc vai trò để phân biệt thăng chức / hạ vai trò khi thông báo
const ROLE_RANK = { NHAN_VIEN: 0, TRUONG_NHOM: 1, QUAN_LY: 2, ADMIN: 3 };
const ROLE_COLUMN_ORDER = ["NHAN_VIEN", "TRUONG_NHOM", "QUAN_LY", "ADMIN"];

const ROLE_LABELS = {
  ADMIN: "Quản trị viên tối cao",
  QUAN_LY: "Quản lý / Trưởng phòng",
  TRUONG_NHOM: "Trưởng nhóm / Giám sát",
  NHAN_VIEN: "Nhân viên tiêu chuẩn",
};

export default function RolePermissions({ userSession }) {
  const access = getManagerAccess(userSession);
  const actorIsAdmin = access.isAdmin;
  const [activeSubTab, setActiveSubTab] = useState("configure"); // 'configure' | 'matrix'
  const [employees, setEmployees] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleTriggerSearch = () => {
    setSearchTerm(searchInput.trim());
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim()) {
      setSearchTerm("");
    }
  };

  // Nhân sự được chọn để cấu hình quyền
  const [selectedMaNv, setSelectedMaNv] = useState(""); // Mặc định chọn người đầu tiên trong danh sách
  const [empDetail, setEmpDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Trạng thái toggles các quyền (checkbox/switch)
  const [permsState, setPermsState] = useState({});
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  // Bổ nhiệm vai trò
  const [promoteRole, setPromoteRole] = useState("TRUONG_NHOM");
  const [isPromoting, setIsPromoting] = useState(false);
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
  const [roleError, setRoleError] = useState("");

  // Ma trận quyền
  const [matrixData, setMatrixData] = useState(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [matrixError, setMatrixError] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // 1. Tải danh sách nhân viên
  const loadEmployees = async () => {
    setIsLoadingList(true);
    try {
      const res = await apiClient.get("/employees/get_employee_list", {
        params: { page: 1, page_size: 200 },
      });
      const items = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      setEmployees(items);
      if (items.length > 0 && !selectedMaNv) {
        const firstOther = items.find((e) => e.ma_nv !== access.maNv) || items[0];
        setSelectedMaNv(firstOther.ma_nv);
      }
    } catch (err) {
      showToast(`Không thể tải danh sách nhân viên: ${getApiErrorMessage(err)}`, "error");
    } finally {
      setIsLoadingList(false);
    }
  };

  // 2. Tải chi tiết quyền của nhân viên đang chọn
  const loadEmployeeDetail = async (maNv) => {
    if (!maNv) return;
    setIsLoadingDetail(true);
    try {
      const data = await getEmployeePermissions(maNv);
      setEmpDetail(data);
      setPromoteRole(data.ma_vai_tro === "TRUONG_NHOM" ? "NHAN_VIEN" : "TRUONG_NHOM");

      // Trạng thái bật / tắt của từng quyền = quyền hiệu lực hiện tại của nhân sự
      const initialPerms = {};
      (data.effective_permissions || []).forEach((code) => {
        initialPerms[code] = true;
      });
      setPermsState(initialPerms);
    } catch (err) {
      setEmpDetail(null);
      showToast(getApiErrorMessage(err, `Không thể tải quyền của nhân sự ${maNv}`), "error");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 3. Tải ma trận phân quyền
  const loadMatrix = async () => {
    setIsLoadingMatrix(true);
    setMatrixError("");
    try {
      const matrix = await getRoleMatrix();
      setMatrixData(matrix);
    } catch (err) {
      setMatrixError(getApiErrorMessage(err, "Không tải được danh mục quyền."));
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadMatrix();
  }, []);

  useEffect(() => {
    if (selectedMaNv) {
      loadEmployeeDetail(selectedMaNv);
    }
  }, [selectedMaNv]);

  // Danh mục quyền lấy từ máy chủ (tổng số quyền theo dữ liệu, không gán cứng)
  const permissionCatalog = useMemo(
    () =>
      (matrixData?.permissions || []).map((perm) => {
        const meta = PERMISSION_META_MAP[perm.ma_quyen] || {};
        return {
          ma_quyen: perm.ma_quyen,
          label: perm.ten_quyen || meta.label || perm.ma_quyen,
          group: perm.nhom_quyen || meta.group || "Khác",
          desc: meta.desc || perm.mo_ta || "",
          icon: meta.icon || KeyRound,
          adminOnly: ADMIN_ONLY_PERMISSIONS.includes(perm.ma_quyen),
        };
      }),
    [matrixData]
  );

  // Quyền chỉ ADMIN mới cấp / thu hồi được (Quản lý gửi lên sẽ bị 403)
  const isPermLocked = (perm) => perm.adminOnly && !actorIsAdmin;

  // Không được sửa quyền của chính mình; Quản lý không được sửa tài khoản Quản lý / Admin
  const targetRole = empDetail?.ma_vai_tro;
  const editBlockedReason = !empDetail
    ? ""
    : empDetail.ma_nv === access.maNv
    ? "Bạn không thể tự thay đổi vai trò hoặc quyền của chính mình."
    : !actorIsAdmin && (targetRole === "ADMIN" || targetRole === "QUAN_LY")
    ? "Chỉ Admin mới được thay đổi vai trò / quyền của tài khoản Quản lý hoặc Admin."
    : "";

  const roleOptions = [
    { value: "NHAN_VIEN", label: "NHÂN VIÊN" },
    { value: "TRUONG_NHOM", label: "TRƯỞNG NHÓM" },
    { value: "QUAN_LY", label: "QUẢN LÝ" },
  ].filter((opt) => actorIsAdmin || ROLES_ASSIGNABLE_BY_MANAGER.includes(opt.value));

  // Toggle switch quyền
  const handleTogglePerm = (maQuyen) => {
    const perm = permissionCatalog.find((p) => p.ma_quyen === maQuyen);
    if (editBlockedReason || (perm && isPermLocked(perm))) return;
    setPermsState((prev) => ({
      ...prev,
      [maQuyen]: !prev[maQuyen],
    }));
  };

  // 4. Lưu phân quyền web vào CSDL (tai_khoan_quyen)
  const handleSavePermissions = async () => {
    if (!selectedMaNv || !empDetail || isSavingPerms || editBlockedReason) return;
    setIsSavingPerms(true);
    try {
      const rolePerms = empDetail.vai_tro_quyen || [];
      const batch = [];

      permissionCatalog.forEach((p) => {
        if (isPermLocked(p)) return; // không gửi quyền chỉ Admin được cấp
        const isChecked = Boolean(permsState[p.ma_quyen]);
        const hasInRole = rolePerms.includes(p.ma_quyen);

        if (isChecked && !hasInRole) {
          // Bật quyền mà vai trò chưa có -> Cấp thêm
          batch.push({ ma_quyen: p.ma_quyen, duoc_cap: true });
        } else if (!isChecked && hasInRole) {
          // Tắt quyền mà vai trò đã có -> Thu hồi
          batch.push({ ma_quyen: p.ma_quyen, duoc_cap: false });
        } else if (isChecked && hasInRole) {
          // Khôi phục quyền vai trò nếu trước đó bị thu hồi
          if ((empDetail.custom_quyen_thu_hoi || []).includes(p.ma_quyen)) {
            batch.push({ ma_quyen: p.ma_quyen, duoc_cap: true });
          }
        }
      });

      if (batch.length === 0) {
        showToast("Không có thay đổi nào so với phân quyền hiện tại.", "info");
        setIsSavingPerms(false);
        return;
      }

      await updateCustomPermissions(selectedMaNv, { permissions: batch });
      showToast(`Đã lưu thiết lập quyền sử dụng web cho nhân sự ${empDetail.ho_ten} (${selectedMaNv})!`);
      await loadEmployeeDetail(selectedMaNv);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Lưu phân quyền thất bại"), "error");
    } finally {
      setIsSavingPerms(false);
    }
  };

  // 5. Bổ nhiệm vai trò: thăng chức hoặc hạ vai trò (có xác nhận trước)
  const currentRole = empDetail?.ma_vai_tro;
  const isDemotion = (ROLE_RANK[promoteRole] ?? 0) < (ROLE_RANK[currentRole] ?? 0);

  const handleAssignRole = async () => {
    if (!selectedMaNv || isPromoting || editBlockedReason) return;
    setIsPromoting(true);
    setRoleError("");
    const demoted = isDemotion;
    const newRoleLabel = ROLE_LABELS[promoteRole] || promoteRole;
    try {
      await assignRoleToEmployee(selectedMaNv, { ma_vai_tro: promoteRole });
      setRoleConfirmOpen(false);
      showToast(
        demoted
          ? `Đã chuyển ${empDetail?.ho_ten || selectedMaNv} về vai trò ${newRoleLabel}.`
          : `Đã bổ nhiệm ${empDetail?.ho_ten || selectedMaNv} làm ${newRoleLabel}.`
      );
      await loadEmployeeDetail(selectedMaNv);
      await loadEmployees();
    } catch (err) {
      // 403: Quản lý không được bổ nhiệm ADMIN / QUAN_LY hoặc sửa tài khoản Quản lý
      setRoleError(getApiErrorMessage(err, "Đổi vai trò thất bại"));
    } finally {
      setIsPromoting(false);
    }
  };

  // Cột vai trò của ma trận lấy theo dữ liệu máy chủ (giữ thứ tự cấp bậc quen thuộc)
  const matrixColumns = useMemo(() => {
    const roles = Array.isArray(matrixData?.roles) ? matrixData.roles : [];
    const fromData = roles.length
      ? roles.map((r) => (typeof r === "string" ? { ma_vai_tro: r } : r))
      : Object.keys(matrixData?.matrix || {}).map((code) => ({ ma_vai_tro: code }));
    return [...fromData].sort(
      (a, b) =>
        (ROLE_COLUMN_ORDER.indexOf(a.ma_vai_tro) + 1 || 99) - (ROLE_COLUMN_ORDER.indexOf(b.ma_vai_tro) + 1 || 99)
    );
  }, [matrixData]);

  // Lọc danh sách nhân viên theo từ khóa tìm kiếm
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const q = searchTerm.toLowerCase();
    return employees.filter(
      (e) =>
        (e.ma_nv && e.ma_nv.toLowerCase().includes(q)) ||
        (e.ho_ten && e.ho_ten.toLowerCase().includes(q)) ||
        (e.ten_pb && e.ten_pb.toLowerCase().includes(q)) ||
        (e.ten_cv && e.ten_cv.toLowerCase().includes(q))
    );
  }, [employees, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      {/* Toast thông báo */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-up ${
            toastType === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : toastType === "info"
              ? "bg-sky-50 border-sky-200 text-sky-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toastType === "error" ? (
            <AlertCircle size={16} />
          ) : toastType === "info" ? (
            <Info size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ───────────────── HEADER TIÊU ĐỀ & CHUYỂN TAB ───────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            <ShieldCheck size={12} className="text-sky-600" />
            <span>Phân quyền vận hành & Cấp quyền sử dụng Web</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase">
            CẤP QUYỀN SỬ DỤNG WEB & BỔ NHIỆM CHỨC DANH
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thiết lập quyền vận hành (Chấm công, Duyệt lương, Phê duyệt đơn từ) cho nhân sự trong đội ngũ
          </p>
        </div>

        {/* Nút chuyển đổi Sub-tab */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("configure")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "configure"
                ? "bg-white text-sky-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cấp quyền Web theo Nhân sự
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("matrix")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "matrix"
                ? "bg-white text-sky-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ma trận phân quyền RBAC
          </button>
        </div>
      </div>

      {/* ───────────────── VIEW 1: CẤP QUYỀN SỬ DỤNG WEB THEO NHÂN SỰ ───────────────── */}
      {activeSubTab === "configure" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (4 CỘT): DANH SÁCH NHÂN SỰ ĐỂ CHỌN */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 uppercase">Danh sách Nhân sự</h3>
                  <span className="text-[11px] text-slate-400">
                    {filteredEmployees.length} nhân sự
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={loadEmployees}
                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                title="Làm mới danh sách"
              >
                <RefreshCw size={14} className={isLoadingList ? "animate-spin text-sky-600" : ""} />
              </button>
            </div>

            {/* Ô tìm kiếm */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  placeholder="Tìm mã NV, họ tên, phòng ban..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <button
                type="button"
                onClick={handleTriggerSearch}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                title="Tìm kiếm (Enter)"
              >
                <Search size={13} />
                <span>Tìm</span>
              </button>
            </div>

            {/* Danh sách cuộn */}
            <div className="flex flex-col gap-1.5 max-h-[580px] overflow-y-auto pr-1">
              {isLoadingList ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                  <span>Đang tải danh sách nhân sự...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Không tìm thấy nhân viên nào phù hợp
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedMaNv === emp.ma_nv;
                  return (
                    <button
                      key={emp.ma_nv}
                      type="button"
                      onClick={() => setSelectedMaNv(emp.ma_nv)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-sky-50/80 border-sky-300 shadow-xs ring-1 ring-sky-400/30"
                          : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {(emp.ho_ten || emp.ma_nv || "").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate">{emp.ho_ten}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-bold text-sky-700">{emp.ma_nv}</span>
                            <span>•</span>
                            <span className="truncate">{emp.ten_pb || "Chưa phân bổ"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right max-w-[96px]">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 truncate max-w-full">
                          {emp.ten_cv || "—"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI (8 CỘT): CHI TIẾT VÀ BẢNG THIẾT LẬP QUYỀN SỬ DỤNG WEB */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {isLoadingDetail ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-xs font-medium">Đang tải thông tin quyền của nhân sự...</span>
              </div>
            ) : !empDetail ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-xs">
                Vui lòng chọn một nhân sự từ danh sách bên trái để cấu hình quyền
              </div>
            ) : (
              <>
                {/* 1. THẺ THÔNG TIN NHÂN SỰ ĐƯỢC CHỌN & THĂNG CHỨC TRƯỞNG NHÓM */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                      {(empDetail.ho_ten || empDetail.ma_nv || "").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-base text-slate-900">{empDetail.ho_ten}</h2>
                        <span className="px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 font-mono font-bold text-xs">
                          {empDetail.ma_nv}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>Phòng ban: <strong>{empDetail.ten_pb || "Chưa phân bổ"}</strong></span>
                        <span>•</span>
                        <span>Chức vụ: <strong>{empDetail.ten_cv || "Nhân viên"}</strong></span>
                        <span>•</span>
                        <span>
                          Vai trò:{" "}
                          <span className="font-bold text-sky-700">
                            {ROLE_LABELS[empDetail.ma_vai_tro] || empDetail.ten_vai_tro || empDetail.ma_vai_tro}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Bổ nhiệm vai trò (Quản lý chỉ bổ nhiệm Nhân viên / Trưởng nhóm) */}
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80 shrink-0">
                    <select
                      value={promoteRole}
                      onChange={(e) => setPromoteRole(e.target.value)}
                      disabled={Boolean(editBlockedReason)}
                      aria-label="Vai trò mới"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {roleOptions.map((opt) => {
                        const rank = ROLE_RANK[opt.value] ?? 0;
                        const curRank = ROLE_RANK[currentRole] ?? 0;
                        const prefix = rank > curRank ? "Thăng lên" : rank < curRank ? "Hạ về" : "Giữ nguyên";
                        return (
                          <option key={opt.value} value={opt.value}>
                            {prefix}: {opt.label}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setRoleError("");
                        setRoleConfirmOpen(true);
                      }}
                      disabled={isPromoting || promoteRole === empDetail.ma_vai_tro || Boolean(editBlockedReason)}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      {isPromoting ? <Loader2 size={13} className="animate-spin" /> : <Award size={13} />}
                      <span>Đổi vai trò</span>
                    </button>
                  </div>
                </div>

                {editBlockedReason && (
                  <div
                    role="note"
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-start gap-2"
                  >
                    <Lock size={15} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{editBlockedReason}</span>
                  </div>
                )}

                {/* 2. KHỐI THIẾT LẬP CÁC QUYỀN SỬ DỤNG WEB (CHẤM CÔNG, DUYỆT LƯƠNG, DUYỆT ĐƠN...) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 uppercase">
                        Thiết lập Quyền Vận Hành Web
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Bật hoặc tắt các quyền cho nhân sự •{" "}
                        <strong className="text-slate-600">
                          {permissionCatalog.filter((p) => permsState[p.ma_quyen]).length}/{permissionCatalog.length}
                        </strong>{" "}
                        quyền đang có hiệu lực
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSavePermissions}
                      disabled={isSavingPerms || Boolean(editBlockedReason) || permissionCatalog.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
                    >
                      {isSavingPerms ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Đang lưu vào hệ thống...</span>
                        </>
                      ) : (
                        <>
                          <Check size={15} />
                          <span>LƯU PHÂN QUYỀN WEB</span>
                        </>
                      )}
                    </button>
                  </div>

                  {matrixError && (
                    <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      {matrixError}
                    </div>
                  )}
                  {isLoadingMatrix && permissionCatalog.length === 0 && (
                    <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                      <span>Đang tải danh mục quyền...</span>
                    </div>
                  )}

                  {/* Danh sách quyền (lấy từ máy chủ) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissionCatalog.map((perm) => {
                      const Icon = perm.icon;
                      const isChecked = Boolean(permsState[perm.ma_quyen]);
                      const locked = isPermLocked(perm) || Boolean(editBlockedReason);
                      const isDefaultInRole = (empDetail.vai_tro_quyen || []).includes(perm.ma_quyen);
                      const isCustomGranted = (empDetail.custom_quyen_cap || []).includes(perm.ma_quyen);
                      const isCustomRevoked = (empDetail.custom_quyen_thu_hoi || []).includes(perm.ma_quyen);

                      return (
                        <div
                          key={perm.ma_quyen}
                          role="switch"
                          aria-checked={isChecked}
                          aria-disabled={locked}
                          tabIndex={locked ? -1 : 0}
                          onClick={() => handleTogglePerm(perm.ma_quyen)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              handleTogglePerm(perm.ma_quyen);
                            }
                          }}
                          title={
                            isPermLocked(perm)
                              ? "Chỉ Admin mới được cấp / thu hồi quyền này"
                              : editBlockedReason || undefined
                          }
                          className={`p-4 rounded-xl border transition-all select-none flex flex-col justify-between gap-3 ${
                            locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                          } ${
                            isChecked
                              ? "bg-slate-50/80 border-sky-300 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? "bg-sky-600 text-white"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                <Icon size={18} />
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900 leading-tight">
                                  {perm.label}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                  {perm.group}
                                </div>
                              </div>
                            </div>

                            {/* Switch bật / tắt */}
                            <div className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                tabIndex={-1}
                                aria-hidden="true"
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {perm.desc}
                          </p>

                          {/* Status Badge */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                            {isPermLocked(perm) ? (
                              <span className="text-slate-500 font-bold flex items-center gap-1">
                                <Lock size={11} />
                                Chỉ Admin được cấp
                              </span>
                            ) : isCustomGranted ? (
                              <span className="text-purple-600 font-bold flex items-center gap-1">
                                <Sparkles size={11} />
                                Quyền riêng được cấp thêm
                              </span>
                            ) : isCustomRevoked ? (
                              <span className="text-rose-600 font-bold flex items-center gap-1">
                                <X size={11} />
                                Đã bị Quản lý thu hồi
                              </span>
                            ) : isDefaultInRole ? (
                              <span className="text-sky-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                Quyền mặc định theo vai trò
                              </span>
                            ) : (
                              <span className="text-slate-400">Chưa được cấp</span>
                            )}

                            <span className="font-mono text-slate-400">{perm.ma_quyen}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ghi chú hướng dẫn cho Quản lý */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-800 text-[11px] flex items-start gap-2.5">
                    <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Cơ chế hiệu lực quyền:</strong> Khi bật hoặc tắt quyền và bấm{" "}
                      <strong>"LƯU PHÂN QUYỀN WEB"</strong>, hệ thống ghi nhận vào CSDL bảng <code>tai_khoan_quyen</code>;
                      nhân sự nhận quyền mới ở lần đăng nhập tiếp theo.
                      {!actorIsAdmin && (
                        <>
                          {" "}
                          Các quyền quản trị (tài khoản, phân quyền, tổ chức, hợp đồng) và vai trò Quản lý / Admin chỉ Admin
                          mới cấp được.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ───────────────── VIEW 2: MA TRẬN PHÂN QUYỀN RBAC (ĐỐI CHIẾU VAI TRÒ) ───────────────── */}
      {activeSubTab === "matrix" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase">
                Ma Trận Phân Quyền Vai Trò Hệ Thống (RBAC Matrix)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bảng đối chiếu quyền mặc định giữa {matrixColumns.length} vai trò •{" "}
                {(matrixData?.permissions || []).length} quyền trong hệ thống
              </p>
            </div>
            <button
              type="button"
              onClick={loadMatrix}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={isLoadingMatrix ? "animate-spin text-sky-600" : ""} />
              <span>Làm mới ma trận</span>
            </button>
          </div>

          {isLoadingMatrix ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-7 h-7 animate-spin text-sky-600" />
              <span>Đang tải ma trận phân quyền...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Quyền chức năng</th>
                    <th className="py-3 px-4">Nhóm quyền</th>
                    {matrixColumns.map((role) => (
                      <th key={role.ma_vai_tro} className="py-3 px-4 text-center">
                        {role.ten_vai_tro || ROLE_LABELS[role.ma_vai_tro] || role.ma_vai_tro}
                        <span className="block text-[10px] font-semibold text-slate-400">
                          {(matrixData?.matrix?.[role.ma_vai_tro] || []).length} quyền
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {matrixError && (
                    <tr>
                      <td colSpan={2 + matrixColumns.length} className="py-6 text-center text-rose-700">
                        {matrixError}
                      </td>
                    </tr>
                  )}
                  {(matrixData?.permissions || []).map((perm) => {
                    const matrixMap = matrixData?.matrix || {};

                    return (
                      <tr key={perm.ma_quyen} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{perm.ten_quyen}</div>
                          <div className="text-[10px] font-mono text-slate-400">{perm.ma_quyen}</div>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500 font-semibold">
                          {perm.nhom_quyen}
                        </td>
                        {matrixColumns.map((role) => (
                          <td key={role.ma_vai_tro} className="py-3 px-4 text-center">
                            {(matrixMap[role.ma_vai_tro] || []).includes(perm.ma_quyen) ? (
                              <CheckCircle2 size={16} className="text-emerald-600 inline" aria-label="Có quyền" />
                            ) : (
                              <span className="text-slate-300" aria-label="Không có quyền">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Xác nhận đổi vai trò (thăng chức / hạ vai trò) */}
      <ConfirmDialog
        open={roleConfirmOpen && Boolean(empDetail)}
        tone={isDemotion ? "warning" : "primary"}
        icon={Award}
        title={isDemotion ? "Xác nhận hạ vai trò" : "Xác nhận bổ nhiệm vai trò"}
        description={
          empDetail && (
            <>
              {isDemotion ? "Chuyển" : "Bổ nhiệm"} <strong>{empDetail.ho_ten}</strong> ({empDetail.ma_nv}) từ vai trò{" "}
              <strong>{ROLE_LABELS[currentRole] || currentRole}</strong> {isDemotion ? "về" : "lên"}{" "}
              <strong>{ROLE_LABELS[promoteRole] || promoteRole}</strong>? Quyền mặc định của nhân sự sẽ thay đổi theo vai
              trò mới.
            </>
          )
        }
        confirmLabel={isDemotion ? "Hạ vai trò" : "Bổ nhiệm"}
        busy={isPromoting}
        error={roleError}
        onCancel={() => !isPromoting && setRoleConfirmOpen(false)}
        onConfirm={handleAssignRole}
      />
    </div>
  );
}
