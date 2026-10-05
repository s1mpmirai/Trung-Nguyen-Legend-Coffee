import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  ShieldCheck,
  Award,
  Users,
  Check,
  X,
  KeyRound,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  getRoleMatrix,
  getRoles,
  assignRoleToEmployee,
  getEmployeePermissions,
  getAccountsList,
} from "../../../services/adminService";

// ────────────────── BẢNG DỊCH QUYỀN HẠN SANG TIẾNG VIỆT TỰ NHIÊN DỄ HIỂU ──────────────────
export const PERMISSION_MAP = {
  EMPLOYEE_VIEW: {
    label: "Xem danh sách & hồ sơ nhân sự",
    group: "Quản lý nhân sự",
    desc: "Tra cứu danh sách nhân viên, thông tin liên hệ và lý lịch làm việc",
  },
  EMPLOYEE_CREATE: {
    label: "Thêm nhân sự mới",
    group: "Quản lý nhân sự",
    desc: "Đăng ký tiếp nhận và tạo hồ sơ nhân sự mới vào hệ thống",
  },
  EMPLOYEE_UPDATE: {
    label: "Cập nhật thông tin nhân sự",
    group: "Quản lý nhân sự",
    desc: "Chỉnh sửa chức vụ, phòng ban, thông tin cá nhân và hợp đồng",
  },
  EMPLOYEE_DELETE: {
    label: "Xóa / Cho thôi việc nhân sự",
    group: "Quản lý nhân sự",
    desc: "Ngừng công tác hoặc xóa hồ sơ nhân sự khỏi danh sách hoạt động",
  },
  LEAVE_VIEW: {
    label: "Xem danh sách đơn từ",
    group: "Đơn từ & Phép",
    desc: "Theo dõi các loại đơn xin nghỉ phép, nghỉ việc, giải trình chấm công",
  },
  LEAVE_CREATE: {
    label: "Tạo và gửi đơn xin nghỉ",
    group: "Đơn từ & Phép",
    desc: "Gửi yêu cầu nghỉ phép, xin đi muộn hoặc xin đổi ca trực",
  },
  LEAVE_APPROVE: {
    label: "Phê duyệt hoặc từ chối đơn",
    group: "Đơn từ & Phép",
    desc: "Quyền ký duyệt hoặc từ chối các đề xuất đơn từ của cấp dưới",
  },
  ATTENDANCE_MANAGE: {
    label: "Quản lý chấm công & Ca làm việc",
    group: "Chấm công & Ca kíp",
    desc: "Theo dõi lượt ra vào, duyệt bổ sung giờ công và xếp ca làm việc",
  },
  PAYROLL_VIEW: {
    label: "Tra cứu phiếu lương & Bảng lương",
    group: "Lương bổng & Đãi ngộ",
    desc: "Xem chi tiết các khoản lương cứng, phụ cấp, thưởng và thực lĩnh",
  },
  PAYROLL_MANAGE: {
    label: "Tính toán & Phê duyệt bảng lương",
    group: "Lương bổng & Đãi ngộ",
    desc: "Khóa bảng lương tháng, tính thưởng phạt và duyệt chi trả toàn chuỗi",
  },
  PRODUCT_VIEW: {
    label: "Tra cứu danh mục sản phẩm & kho",
    group: "Kho vận & Vật tư",
    desc: "Xem số lượng tồn kho nguyên vật liệu, hạt cà phê, máy móc và vật phẩm",
  },
  PRODUCT_MANAGE: {
    label: "Quản lý nhập - xuất kho hàng hóa",
    group: "Kho vận & Vật tư",
    desc: "Thêm mới mã hàng, cập nhật số lượng tồn kho và điều chuyển kho",
  },
  SUPPLIER_VIEW: {
    label: "Xem thông tin đối tác & Nhà cung cấp",
    group: "Nhà cung cấp",
    desc: "Tra cứu danh bạ nhà cung cấp cà phê nhân, máy móc và dịch vụ",
  },
  SUPPLIER_MANAGE: {
    label: "Quản lý hồ sơ Nhà cung cấp",
    group: "Nhà cung cấp",
    desc: "Thêm mới, đánh giá chất lượng và cập nhật thông tin đối tác cung ứng",
  },
  ACCOUNT_MANAGE: {
    label: "Quản lý & Cấp tài khoản người dùng",
    group: "Bảo mật & Phân quyền",
    desc: "Khởi tạo tài khoản đăng nhập, khóa tài khoản và thiết lập mật khẩu",
  },
  PERMISSION_ASSIGN: {
    label: "Thiết lập phân quyền & Bổ nhiệm vai trò",
    group: "Bảo mật & Phân quyền",
    desc: "Thăng chức, bổ nhiệm chức danh và điều chỉnh ma trận quyền RBAC",
  },
};

export const GROUP_MAP = {
  NHAN_SU: "Quản lý nhân sự",
  DON_TU: "Đơn từ & Nghỉ phép",
  CHAM_CONG: "Chấm công & Ca kíp",
  LUONG: "Lương bổng & Đãi ngộ",
  KHO: "Kho vận & Nhà cung cấp",
  PHAN_QUYEN: "Bảo mật & Phân quyền",
};

export const ROLE_LABELS = {
  ADMIN: "Quản trị viên tối cao",
  QUAN_LY: "Quản lý / Trưởng phòng",
  TRUONG_NHOM: "Trưởng nhóm / Giám sát",
  NHAN_VIEN: "Nhân viên tiêu chuẩn",
};

export default function AdminPermissionsTab() {
  const [matrixData, setMatrixData] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Danh sách nhân viên để tìm kiếm
  const [employeeList, setEmployeeList] = useState([]);

  // Thăng chức / Gán vai trò - Dropdown tìm kiếm
  const [promoteForm, setPromoteForm] = useState({
    ma_nv: "",
    ma_vai_tro: "TRUONG_NHOM",
  });
  const [promoteSearchText, setPromoteSearchText] = useState("");
  const [promoteDropdownOpen, setPromoteDropdownOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const promoteDropdownRef = useRef(null);

  // Kiểm tra quyền nhân sự cụ thể - Dropdown tìm kiếm
  const [inspectEmployeeId, setInspectEmployeeId] = useState("");
  const [inspectSearchText, setInspectSearchText] = useState("");
  const [inspectDropdownOpen, setInspectDropdownOpen] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const inspectDropdownRef = useRef(null);

  // Filter permission list
  const [searchQuery, setSearchQuery] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Lọc nhân viên cho dropdown
  const filterEmployees = (searchText) => {
    if (!searchText.trim()) return employeeList;
    const q = searchText.toLowerCase();
    return employeeList.filter(
      (e) =>
        (e.ma_nv && e.ma_nv.toLowerCase().includes(q)) ||
        (e.ho_ten && e.ho_ten.toLowerCase().includes(q)) ||
        (e.ma_vai_tro && ROLE_LABELS[e.ma_vai_tro]?.toLowerCase().includes(q))
    );
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (promoteDropdownRef.current && !promoteDropdownRef.current.contains(event.target)) {
        setPromoteDropdownOpen(false);
      }
      if (inspectDropdownRef.current && !inspectDropdownRef.current.contains(event.target)) {
        setInspectDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [matrix, rolesList] = await Promise.all([getRoleMatrix(), getRoles()]);
      setMatrixData(matrix);
      setRoles(rolesList || []);
    } catch (err) {
      console.error("Lỗi khi tải ma trận quyền:", err);
      showToast("Không thể tải ma trận phân quyền", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Load danh sách nhân viên có tài khoản
  const loadEmployeeList = async () => {
    try {
      const res = await getAccountsList({ page: 1, page_size: 200 });
      const items = res?.items || res?.data || res || [];
      setEmployeeList(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách nhân viên:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadEmployeeList();
  }, []);

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (!promoteForm.ma_nv) return;

    setIsPromoting(true);
    try {
      await assignRoleToEmployee(promoteForm.ma_nv, {
        ma_vai_tro: promoteForm.ma_vai_tro,
      });
      const roleName = ROLE_LABELS[promoteForm.ma_vai_tro] || promoteForm.ma_vai_tro;
      showToast(
        `Thăng chức thành công! Nhân sự ${promoteForm.ma_nv} hiện giữ vai trò: ${roleName}`
      );
      loadData();
      if (inspectEmployeeId === promoteForm.ma_nv) {
        handleInspectSubmit(null, promoteForm.ma_nv);
      }
    } catch (err) {
      showToast(err.message || "Thăng chức thất bại", "error");
    } finally {
      setIsPromoting(false);
    }
  };

  const handleInspectSubmit = async (e, forcedId) => {
    if (e) e.preventDefault();
    const targetId = forcedId || inspectEmployeeId;
    if (!targetId) return;

    setInspectLoading(true);
    try {
      const res = await getEmployeePermissions(targetId);
      setInspectResult(res);
    } catch (err) {
      showToast(err.message || `Không tìm thấy quyền của nhân sự ${targetId}`, "error");
      setInspectResult(null);
    } finally {
      setInspectLoading(false);
    }
  };

  // Lọc danh sách permissions theo từ khóa tìm kiếm
  const permissionsList = matrixData?.permissions || [];
  const matrixMap = matrixData?.matrix || {};

  const filteredPermissions = permissionsList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const pInfo = PERMISSION_MAP[p.ma_quyen] || {};
    const groupName = GROUP_MAP[p.nhom_quyen] || p.nhom_quyen || "";
    return (
      (pInfo.label && pInfo.label.toLowerCase().includes(q)) ||
      (pInfo.desc && pInfo.desc.toLowerCase().includes(q)) ||
      (groupName && groupName.toLowerCase().includes(q)) ||
      (p.ten_quyen && p.ten_quyen.toLowerCase().includes(q)) ||
      (p.mo_ta && p.mo_ta.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Toast thông báo */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            <Shield size={12} className="text-sky-600" />
            <span>Bảo mật & Thiết lập phân quyền hệ thống</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase">
            PHÂN QUYỀN HỆ THỐNG & BỔ NHIỆM CHỨC DANH
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng quy định 16 quyền hạn theo 4 cấp bậc vai trò và công cụ bổ nhiệm chức danh nhân sự
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 text-xs shadow-xs self-start sm:self-auto"
          title="Làm mới ma trận quyền"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* ───────────────── 1. KHỐI THAO TÁC: BỔ NHIỆM & TRA CỨU QUYỀN ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Thăng chức / Bổ nhiệm vai trò (6 cột) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <Award size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Bổ Nhiệm & Thăng Chức Nhân Sự</h3>
                <p className="text-[11px] text-slate-400">Đặc quyền quản trị của Quản trị viên tối cao</p>
              </div>
            </div>

            <form onSubmit={handlePromoteSubmit} className="space-y-4 mt-4">
              <div className="space-y-1.5" ref={promoteDropdownRef}>
                <label className="block text-xs font-semibold text-slate-700">
                  Chọn nhân sự cần bổ nhiệm <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={promoteSearchText}
                      onChange={(e) => {
                        setPromoteSearchText(e.target.value);
                        setPromoteDropdownOpen(true);
                      }}
                      onFocus={() => setPromoteDropdownOpen(true)}
                      placeholder="Tìm theo mã NV, tên hoặc vai trò..."
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <ChevronDown className={`w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${promoteDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {/* Selected badge */}
                  {promoteForm.ma_nv && !promoteDropdownOpen && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs">
                      <span className="font-bold text-sky-800">{promoteForm.ma_nv}</span>
                      <span className="text-sky-600">{employeeList.find(e => e.ma_nv === promoteForm.ma_nv)?.ho_ten || ''}</span>
                      <button type="button" onClick={() => { setPromoteForm({...promoteForm, ma_nv: ''}); setPromoteSearchText(''); }} className="ml-1 text-sky-400 hover:text-rose-500 cursor-pointer"><X size={12} /></button>
                    </div>
                  )}
                  {/* Dropdown */}
                  {promoteDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                      {filterEmployees(promoteSearchText).length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy nhân viên nào</div>
                      ) : (
                        filterEmployees(promoteSearchText).map((emp) => (
                          <button
                            key={emp.ma_nv}
                            type="button"
                            onClick={() => {
                              setPromoteForm({ ...promoteForm, ma_nv: emp.ma_nv });
                              setPromoteSearchText(emp.ma_nv + ' - ' + (emp.ho_ten || ''));
                              setPromoteDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-sky-50 transition-colors cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-b-0 ${
                              promoteForm.ma_nv === emp.ma_nv ? 'bg-sky-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {(emp.ho_ten || emp.ma_nv || '').substring(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900">{emp.ho_ten || emp.ma_nv}</span>
                                <span className="text-slate-400 ml-1.5 font-mono">({emp.ma_nv})</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              emp.ma_vai_tro === 'ADMIN' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              emp.ma_vai_tro === 'QUAN_LY' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                              emp.ma_vai_tro === 'TRUONG_NHOM' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {ROLE_LABELS[emp.ma_vai_tro] || emp.ma_vai_tro}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Vai trò chức danh mới <span className="text-rose-500">*</span>
                </label>
                <select
                  value={promoteForm.ma_vai_tro}
                  onChange={(e) => setPromoteForm({ ...promoteForm, ma_vai_tro: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="TRUONG_NHOM">TRƯỞNG NHÓM (Cấp quyền duyệt đơn từ & quản lý ca làm)</option>
                  <option value="QUAN_LY">QUẢN LÝ / TRƯỞNG PHÒNG (Toàn quyền điều hành phòng ban, duyệt lương & kho)</option>
                  <option value="ADMIN">QUẢN TRỊ VIÊN TỐI CAO (Toàn quyền quản trị hệ thống)</option>
                  <option value="NHAN_VIEN">NHÂN VIÊN TIÊU CHUẨN (Thu hồi quyền về mức cơ bản)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPromoting}
                className="w-full mt-2 py-3 px-4 bg-sky-600 text-white hover:bg-sky-700 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPromoting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Đang cập nhật quyền vào hệ thống...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận bổ nhiệm & Cập nhật quyền hạn</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            * Khi bổ nhiệm, vai trò mới sẽ được áp dụng ngay lập tức và nhân viên sẽ nhận đầy đủ các quyền tương ứng trong lần truy cập tiếp theo.
          </div>
        </div>

        {/* Tra cứu quyền hạn thực tế (6 cột) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <Users size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Tra Cứu Quyền Hạn Thực Tế</h3>
                <p className="text-[11px] text-slate-400">Kiểm tra chi tiết các quyền mà nhân sự đang nắm giữ</p>
              </div>
            </div>

            <div className="mt-4" ref={inspectDropdownRef}>
              <form onSubmit={handleInspectSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={inspectSearchText}
                    onChange={(e) => {
                      setInspectSearchText(e.target.value);
                      setInspectDropdownOpen(true);
                    }}
                    onFocus={() => setInspectDropdownOpen(true)}
                    placeholder="Tìm theo mã NV, tên nhân viên..."
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <ChevronDown className={`w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${inspectDropdownOpen ? 'rotate-180' : ''}`} />
                  {/* Dropdown */}
                  {inspectDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                      {filterEmployees(inspectSearchText).length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy nhân viên nào</div>
                      ) : (
                        filterEmployees(inspectSearchText).map((emp) => (
                          <button
                            key={emp.ma_nv}
                            type="button"
                            onClick={() => {
                              setInspectEmployeeId(emp.ma_nv);
                              setInspectSearchText(emp.ma_nv + ' - ' + (emp.ho_ten || ''));
                              setInspectDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-sky-50 transition-colors cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-b-0 ${
                              inspectEmployeeId === emp.ma_nv ? 'bg-sky-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {(emp.ho_ten || emp.ma_nv || '').substring(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900">{emp.ho_ten || emp.ma_nv}</span>
                                <span className="text-slate-400 ml-1.5 font-mono">({emp.ma_nv})</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              emp.ma_vai_tro === 'ADMIN' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              emp.ma_vai_tro === 'QUAN_LY' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                              emp.ma_vai_tro === 'TRUONG_NHOM' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {ROLE_LABELS[emp.ma_vai_tro] || emp.ma_vai_tro}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={inspectLoading || !inspectEmployeeId}
                  className="px-4 py-2.5 bg-sky-600 text-white hover:bg-sky-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inspectLoading ? <Loader2 size={14} className="animate-spin text-white" /> : "Tra cứu"}
                </button>
              </form>
            </div>

            {/* Kết quả tra cứu */}
            {inspectResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900">{inspectResult.ho_ten}</span>
                    <span className="text-slate-500 ml-1.5 font-mono font-bold">({inspectResult.ma_nv})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200">
                    {ROLE_LABELS[inspectResult.ma_vai_tro] || inspectResult.ten_vai_tro || inspectResult.ma_vai_tro}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">
                    Quyền hạn có hiệu lực ({((inspectResult.effective_permissions || inspectResult.quyen_hieu_luc) || []).length}/16 quyền):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 max-h-48 overflow-y-auto pr-1">
                    {((inspectResult.effective_permissions || inspectResult.quyen_hieu_luc) || []).map((q) => {
                      const pInfo = PERMISSION_MAP[q] || { label: q, group: "Chung" };
                      return (
                        <div
                          key={q}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] bg-white border border-slate-200 text-slate-800 flex items-center justify-between shadow-2xs hover:border-sky-300 transition"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            <span className="font-medium truncate">{pInfo.label}</span>
                          </div>
                          <span className="text-[9px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 shrink-0 ml-1">
                            {pInfo.group}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Quản trị viên có đủ 16/16 quyền hạn</span>
            <span className="font-semibold text-sky-600">Đã kích hoạt phân quyền RBAC</span>
          </div>
        </div>
      </div>

      {/* ───────────────── 2. BẢNG MA TRẬN 16 QUYỀN HẠN X 4 VAI TRÒ ───────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
              Ma Trận Quyền Hạn Chi Tiết Toàn Hệ Thống
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              So sánh chi tiết 16 quyền hạn theo ngôn ngữ nghiệp vụ giữa 4 cấp bậc vai trò
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tìm kiếm quyền */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm quyền hạn hoặc nhóm nghiệp vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Có quyền
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Không có
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span className="text-xs font-medium">Đang tải danh sách quyền hạn...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-2/5">Tên quyền hạn & Mô tả chức năng</th>
                  <th className="py-3 px-4 w-1/5">Phân nhóm nghiệp vụ</th>
                  <th className="py-3 px-3 text-center text-slate-700">Nhân viên (3)</th>
                  <th className="py-3 px-3 text-center text-purple-700">Trưởng nhóm (5)</th>
                  <th className="py-3 px-3 text-center text-sky-700">Quản lý (12)</th>
                  <th className="py-3 px-3 text-center text-sky-800 bg-sky-50/60">Admin (16)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không tìm thấy quyền hạn nào khớp với từ khóa tìm kiếm
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((perm) => {
                    const pInfo = PERMISSION_MAP[perm.ma_quyen] || {
                      label: perm.ten_quyen || perm.ma_quyen,
                      group: GROUP_MAP[perm.nhom_quyen] || perm.nhom_quyen,
                      desc: perm.mo_ta || "Quyền hạn hệ thống",
                    };
                    const groupLabel = GROUP_MAP[perm.nhom_quyen] || pInfo.group;

                    const hasNhanVien = matrixMap.NHAN_VIEN?.includes(perm.ma_quyen);
                    const hasTruongNhom = matrixMap.TRUONG_NHOM?.includes(perm.ma_quyen);
                    const hasQuanLy = matrixMap.QUAN_LY?.includes(perm.ma_quyen);
                    const hasAdmin = matrixMap.ADMIN?.includes(perm.ma_quyen) ?? true;

                    return (
                      <tr key={perm.ma_quyen} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs">{pInfo.label}</span>
                            <span className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {pInfo.desc}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                            {groupLabel}
                          </span>
                        </td>

                        {/* NHÂN VIÊN */}
                        <td className="py-3.5 px-3 text-center">
                          {hasNhanVien ? (
                            <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 items-center justify-center text-xs font-bold shadow-2xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>

                        {/* TRƯỞNG NHÓM */}
                        <td className="py-3.5 px-3 text-center">
                          {hasTruongNhom ? (
                            <span className="inline-flex w-5 h-5 rounded-full bg-purple-100 text-purple-700 items-center justify-center text-xs font-bold shadow-2xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>

                        {/* QUẢN LÝ */}
                        <td className="py-3.5 px-3 text-center">
                          {hasQuanLy ? (
                            <span className="inline-flex w-5 h-5 rounded-full bg-sky-100 text-sky-700 items-center justify-center text-xs font-bold shadow-2xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>

                        {/* ADMIN (Luôn có full 16 quyền) */}
                        <td className="py-3.5 px-3 text-center bg-sky-50/40">
                          {hasAdmin ? (
                            <span className="inline-flex w-5 h-5 rounded-full bg-sky-600 text-white font-bold items-center justify-center text-xs shadow-2xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
