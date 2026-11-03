import React, { useEffect, useMemo, useState } from "react";
import { checkEmployeeEmailAvailable, getDepartments, getPositions } from "../../../services/adminService";
import {
  COMPANY_EMAIL_DOMAIN,
  allowedPositions,
  cleanEmailLocalPart,
  defaultPosition,
  emailLocalPartError,
  toCompanyEmail,
} from "../../../utils/orgRules";
import { UserPlus, X, CheckCircle2, Save, Loader2 } from "lucide-react";
import { useEscapeKey } from "./ConfirmDialog";

export const CONTRACT_TYPES = [
  { id: "THU_VIEC", name: "Hợp đồng Thử việc (02 tháng)" },
  { id: "XAC_DINH_1_NAM", name: "Hợp đồng xác định thời hạn (12 tháng)" },
  { id: "XAC_DINH_3_NAM", name: "Hợp đồng xác định thời hạn (36 tháng)" },
  { id: "KHONG_XAC_DINH", name: "Hợp đồng không xác định thời hạn" },
];

export const EDUCATION_LEVELS = [
  { id: "THPT", name: "Trung học phổ thông" },
  { id: "TRUNG_CAP", name: "Trung cấp" },
  { id: "CAO_DANG", name: "Cao đẳng" },
  { id: "DAI_HOC", name: "Đại học" },
  { id: "THAC_SI", name: "Thạc sĩ" },
  { id: "TIEN_SI", name: "Tiến sĩ" },
  { id: "CHUNG_CHI", name: "Chứng chỉ nghề" },
];

export default function AddEmployeeModal({ isOpen, onClose, onSave, managerOptions = [] }) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    maNv: "Tự sinh (Hệ thống)",
    fullName: "",
    cccd: "",
    emailLocal: "",
    phone: "",
    birthDate: "1995-06-15",
    gender: "Nam",
    maPb: "PB02",
    maCv: "CV01",
    startDate: todayStr,
    contractType: "THU_VIEC",
    salary: "",
    educationLevel: "DAI_HOC",
    major: "",
    managerId: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEscapeKey(isOpen, onClose, isSaving);

  // Chỉ cho chọn phòng ban / chức vụ đang hoạt động (đã xóa mềm thì không hiện)
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // Chức danh / vị trí theo phòng ban: Ban Giám đốc chỉ có Giám đốc, phòng khác chỉ Trưởng phòng và Nhân viên
  const positionOptions = useMemo(() => {
    const allowed = allowedPositions(formData.maPb);
    return positions.filter((p) => allowed.includes(p.id));
  }, [positions, formData.maPb]);

  // Quản lý trực tiếp: chỉ nhân sự cùng phòng ban, trưởng phòng ban lên đầu
  const sameDeptManagers = useMemo(() => {
    const headId = departments.find((d) => d.id === formData.maPb)?.headId;
    return managerOptions
      .filter((m) => m.deptId === formData.maPb)
      .sort((a, b) => {
        if (a.id === headId) return -1;
        if (b.id === headId) return 1;
        return String(a.name || "").localeCompare(String(b.name || ""), "vi");
      });
  }, [managerOptions, departments, formData.maPb]);

  /** Mặc định quản lý trực tiếp là trưởng phòng ban (nếu đang làm việc trong phòng). */
  const defaultManagerFor = (maPb, deptList = departments) => {
    const headId = deptList.find((d) => d.id === maPb)?.headId;
    return headId && managerOptions.some((m) => m.id === headId && m.deptId === maPb) ? headId : "";
  };

  // Đổi phòng ban: chức vụ và quản lý trực tiếp đi theo phòng ban mới
  const handleDepartmentChange = (maPb) => {
    setFormData((prev) => ({
      ...prev,
      maPb,
      maCv: allowedPositions(maPb).includes(prev.maCv) ? prev.maCv : defaultPosition(maPb),
      managerId: defaultManagerFor(maPb),
    }));
  };
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([getDepartments({ trang_thai: 1 }), getPositions({ trang_thai: 1 })])
      .then(([pbs, cvs]) => {
        const deptList = (pbs || []).map((pb) => ({ id: pb.ma_pb, name: pb.ten_pb, headId: pb.ma_truong_pb || "" }));
        const posList = (cvs || []).map((cv) => ({ id: cv.ma_cv, name: cv.ten_cv }));
        setDepartments(deptList);
        setPositions(posList);
        // Giá trị mặc định phải nằm trong danh sách đang hoạt động và đúng quy tắc của phòng ban
        setFormData((prev) => {
          const maPb = deptList.some((d) => d.id === prev.maPb) ? prev.maPb : deptList[0]?.id || "";
          const allowed = allowedPositions(maPb).filter((id) => posList.some((p) => p.id === id));
          const maCv = allowed.includes(prev.maCv) ? prev.maCv : allowed.includes(defaultPosition(maPb)) ? defaultPosition(maPb) : allowed[0] || "";
          const managerStillValid = managerOptions.some((m) => m.id === prev.managerId && m.deptId === maPb);
          return {
            ...prev,
            maPb,
            maCv,
            managerId: managerStillValid ? prev.managerId : defaultManagerFor(maPb, deptList),
          };
        });
      })
      .catch((err) => setLoadError(`Không tải được danh mục phòng ban / chức vụ: ${err.message}`));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Danh sách nhân sự / phòng ban tải xong sau khi mở form: chọn trưởng phòng ban làm quản lý mặc định
  useEffect(() => {
    if (!isOpen) return;
    setFormData((prev) => {
      const stillValid = managerOptions.some((m) => m.id === prev.managerId && m.deptId === prev.maPb);
      if (stillValid) return prev;
      const next = defaultManagerFor(prev.maPb);
      return next === prev.managerId ? prev : { ...prev, managerId: next };
    });
  }, [isOpen, managerOptions, departments]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    // Email doanh nghiệp: kiểm tra định dạng trước, rồi hỏi máy chủ email đã tồn tại chưa
    const formatError = emailLocalPartError(formData.emailLocal);
    if (formatError) {
      setEmailError(formatError);
      return;
    }
    setIsSaving(true);
    let companyEmail = toCompanyEmail(formData.emailLocal);
    try {
      const res = await checkEmployeeEmailAvailable(companyEmail);
      companyEmail = res?.email || companyEmail;
      setEmailError("");
    } catch (err) {
      setEmailError(
        err?.status === 409 ? err.message : "Không kiểm tra được email. Vui lòng kiểm tra kết nối rồi thử lại."
      );
      setIsSaving(false);
      return;
    }

    // Chuẩn hóa mức lương về số nguyên phục vụ DB DECIMAL(12,0)
    const cleanSalary = Number(String(formData.salary).replace(/[^0-9]/g, ""));
    const selectedDept = departments.find((d) => d.id === formData.maPb);
    const selectedPos = positions.find((p) => p.id === formData.maCv);
    const selectedContract = CONTRACT_TYPES.find((c) => c.id === formData.contractType);

    const payload = {
      // Thuộc tính chuẩn schema CSDL (00_full_hrm_lite.sql)
      ho_ten: formData.fullName.trim(),
      ngay_sinh: formData.birthDate,
      gioi_tinh: formData.gender === "Nữ" ? "Nu" : formData.gender === "Khác" ? "Khac" : "Nam",
      cccd: formData.cccd.trim(),
      sdt: formData.phone.trim(),
      email: companyEmail,
      ma_pb: formData.maPb,
      ma_cv: formData.maCv,
      ngay_vao_lam: formData.startDate,
      trang_thai: "DANG_LAM",
      hinh_thuc_lam_viec: "FULL_TIME",
      muc_luong: cleanSalary,
      loai_hd: formData.contractType,
      trinh_do: formData.educationLevel,
      chuyen_nganh: formData.major.trim() || null,
      // Quản lý trực tiếp (tùy chọn): bỏ trống = Trưởng phòng ban
      ma_nql: formData.managerId || null,

      // Thuộc tính tương thích giao diện frontend
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      department: formData.maPb,
      deptName: selectedDept?.name || "Phòng ban",
      role: formData.maCv,
      roleName: selectedPos?.name || "Nhân sự",
      contractName: selectedContract?.name || "Hợp đồng lao động",
      salaryFormatted: `${cleanSalary.toLocaleString("vi-VN")} đ`,
      salary: cleanSalary,
    };

    try {
      // onSave trả về false khi máy chủ từ chối -> giữ modal để người dùng sửa lại
      const ok = onSave ? await onSave(payload) : true;
      if (ok !== false) onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={() => !isSaving && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 overflow-y-auto animate-fade-in cursor-pointer"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-employee-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 cursor-default animate-scale-up"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 id="add-employee-title" className="text-base font-bold text-slate-800">
                Thêm hồ sơ nhân sự mới
              </h2>
              <p className="text-xs text-slate-400">
                Nhập thông tin nhân sự và kích hoạt tài khoản hệ thống TrungNguyenHR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          {loadError && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {loadError}
            </div>
          )}
          {/* Nhóm 1: Thông tin cá nhân & Định danh */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-sky-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Thông tin cá nhân & Định danh
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Mã NV */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Mã nhân viên <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={formData.maNv}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-sky-700 font-mono text-xs font-bold rounded-xl cursor-not-allowed"
                  />
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-500 absolute right-3 pointer-events-none"
                    title="Mã tự sinh theo CSDL"
                  />
                </div>
              </div>

              {/* Họ tên */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Họ và tên đầy đủ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Hoàng Nhật Nam"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                />
              </div>

              {/* CCCD (NOT NULL UNIQUE trong DB) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Số CCCD / CMND <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="Ví dụ: 079095001281"
                  value={formData.cccd}
                  onChange={(e) => setFormData({ ...formData, cccd: e.target.value.replace(/[^0-9]/g, "") })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 font-mono placeholder:text-slate-400 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                />
              </div>

              {/* SĐT */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Số điện thoại liên lạc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0908 123 456"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="add-emp-email" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Email doanh nghiệp <span className="text-rose-500">*</span>
                </label>
                <div
                  className={`w-full flex items-center bg-[#f8fafc] border rounded-xl text-xs transition-all focus-within:bg-white focus-within:ring-2 ${
                    emailError
                      ? "border-rose-400 focus-within:ring-rose-100"
                      : "border-slate-200 focus-within:border-sky-500 focus-within:ring-sky-100"
                  }`}
                >
                  <input
                    id="add-emp-email"
                    type="text"
                    required
                    inputMode="email"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="vd: nam.nguyen"
                    value={formData.emailLocal}
                    onChange={(e) => {
                      setFormData({ ...formData, emailLocal: cleanEmailLocalPart(e.target.value) });
                      if (emailError) setEmailError("");
                    }}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby="add-emp-email-msg"
                    className="min-w-0 flex-1 pl-3 py-2 bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                  {formData.emailLocal && (
                    <span className="pr-3 text-slate-500 font-medium whitespace-nowrap select-none" aria-hidden="true">
                      @{COMPANY_EMAIL_DOMAIN}
                    </span>
                  )}
                </div>
                <p
                  id="add-emp-email-msg"
                  role={emailError ? "alert" : undefined}
                  className={`text-[11px] ${emailError ? "text-rose-600 font-medium" : "text-slate-400"}`}
                >
                  {emailError || `Chỉ nhập phần trước @${COMPANY_EMAIL_DOMAIN}.`}
                </p>
              </div>

              {/* Ngày sinh */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Ngày sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                />
              </div>

              {/* Giới tính */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Giới tính</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              {/* Ngày vào làm (NOT NULL trong DB) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Ngày vào làm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Vị trí & Hợp đồng lao động */}
          <div className="flex flex-col gap-3.5 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-sky-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Vị trí & Hợp đồng lao động
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Phòng ban (Khóa ngoại DB ma_pb) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Phòng ban trực thuộc <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.maPb}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.id} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chức vụ (Khóa ngoại DB ma_cv) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Chức danh / Vị trí <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.maCv}
                  onChange={(e) => setFormData({ ...formData, maCv: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all cursor-pointer"
                >
                  {positionOptions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.id} - {pos.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  {allowedPositions(formData.maPb).length === 1
                    ? "Ban Giám đốc chỉ có vị trí Giám đốc."
                    : "Phòng ban chỉ có vị trí Trưởng phòng hoặc Nhân viên."}
                </p>
              </div>


              {/* Quản lý trực tiếp (tùy chọn) */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="add-emp-ma-nql" className="text-xs font-semibold text-slate-700">
                  Quản lý trực tiếp
                </label>
                <select
                  id="add-emp-ma-nql"
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  disabled={sameDeptManagers.length === 0}
                  aria-describedby="add-emp-ma-nql-help"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sameDeptManagers.length === 0 && <option value="">— Phòng ban chưa có nhân sự —</option>}
                  {sameDeptManagers.length > 0 && !formData.managerId && <option value="">— Chọn quản lý trực tiếp —</option>}
                  {sameDeptManagers.map((m) => {
                    const isHead = m.id === departments.find((d) => d.id === formData.maPb)?.headId;
                    return (
                      <option key={m.id} value={m.id}>
                        {`${m.id} - ${m.name}${m.role ? ` (${m.role})` : ""}${isHead ? " • Trưởng phòng ban" : ""}`}
                      </option>
                    );
                  })}
                </select>
                <p id="add-emp-ma-nql-help" className="text-[11px] text-slate-400">
                  Chỉ chọn nhân sự cùng phòng ban, mặc định là trưởng phòng ban. Người được chọn sẽ duyệt đơn từ và chấm công
                  của nhân sự này.
                </p>
              </div>

              {/* Loại hợp đồng (Khớp bảng hop_dong_lao_dong) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Loại hợp đồng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all cursor-pointer"
                >
                  {CONTRACT_TYPES.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trình độ học vấn (lưu vào bảng bang_cap) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Trình độ học vấn <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all cursor-pointer"
                >
                  {EDUCATION_LEVELS.map((lv) => (
                    <option key={lv.id} value={lv.id}>
                      {lv.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Chuyên ngành</label>
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="VD: Quản trị kinh doanh"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                />
              </div>

              {/* Mức lương cơ bản */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Mức lương đóng BHXH (Lương cơ bản) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full pl-3 pr-12 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 font-mono text-xs font-bold rounded-xl focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">VNĐ</span>
                </div>
              </div>
            </div>
          </div>


          {/* Modal Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? "Đang lưu..." : "Lưu hồ sơ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
