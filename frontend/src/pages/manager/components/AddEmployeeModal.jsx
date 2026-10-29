import React, { useEffect, useMemo, useState } from "react";
import { getDepartments, getPositions } from "../../../services/adminService";
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
    email: "",
    phone: "",
    birthDate: "1995-06-15",
    gender: "Nam",
    maPb: "PB05",
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

  useEscapeKey(isOpen, onClose, isSaving);

  // Chỉ cho chọn phòng ban / chức vụ đang hoạt động (đã xóa mềm thì không hiện)
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // Danh sách Quản lý trực tiếp: ưu tiên nhân sự cùng phòng ban đang chọn lên đầu
  const sortedManagerOptions = useMemo(() => {
    const deptName = departments.find((d) => d.id === formData.maPb)?.name || "";
    return [...managerOptions].sort((a, b) => {
      const aSame = a.dept === deptName ? 0 : 1;
      const bSame = b.dept === deptName ? 0 : 1;
      if (aSame !== bSame) return aSame - bSame;
      return String(a.name || "").localeCompare(String(b.name || ""), "vi");
    });
  }, [managerOptions, departments, formData.maPb]);
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([getDepartments({ trang_thai: 1 }), getPositions({ trang_thai: 1 })])
      .then(([pbs, cvs]) => {
        const deptList = (pbs || []).map((pb) => ({ id: pb.ma_pb, name: pb.ten_pb }));
        const posList = (cvs || []).map((cv) => ({ id: cv.ma_cv, name: cv.ten_cv }));
        setDepartments(deptList);
        setPositions(posList);
        // Giá trị mặc định phải nằm trong danh sách đang hoạt động
        setFormData((prev) => ({
          ...prev,
          maPb: deptList.some((d) => d.id === prev.maPb) ? prev.maPb : deptList[0]?.id || "",
          maCv: posList.some((p) => p.id === prev.maCv) ? prev.maCv : posList[0]?.id || "",
        }));
      })
      .catch((err) => setLoadError(`Không tải được danh mục phòng ban / chức vụ: ${err.message}`));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

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
      email: formData.email.trim(),
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

    setIsSaving(true);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn cursor-pointer"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-employee-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 cursor-default"
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
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Email doanh nghiệp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nam.nguyen@trungnguyen.com.vn"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                />
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
                  onChange={(e) => setFormData({ ...formData, maPb: e.target.value })}
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
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.id} - {pos.name}
                    </option>
                  ))}
                </select>
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
                  aria-describedby="add-emp-ma-nql-help"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">— Mặc định: Trưởng phòng ban —</option>
                  {sortedManagerOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {`${m.id} - ${m.name}${
                        m.role || m.dept ? ` (${[m.role, m.dept].filter(Boolean).join(" • ")})` : ""
                      }`}
                    </option>
                  ))}
                </select>
                <p id="add-emp-ma-nql-help" className="text-[11px] text-slate-400">
                  Bỏ trống = Trưởng phòng ban. Người được chọn sẽ duyệt đơn từ và chấm công của nhân sự này.
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
