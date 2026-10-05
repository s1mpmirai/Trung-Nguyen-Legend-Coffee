import React, { useState } from "react";
import { UserPlus, X, CheckCircle2, Save, ShieldCheck } from "lucide-react";

// Danh mục chuẩn hóa khớp 100% với CSDL (00_full_hrm_lite.sql)
export const DEPARTMENTS = [
  { id: "PB01", name: "Ban Giám Đốc" },
  { id: "PB02", name: "Phòng Nhân sự" },
  { id: "PB03", name: "Phòng Kế toán – Tài chính" },
  { id: "PB04", name: "Phòng Marketing" },
  { id: "PB05", name: "Phòng Kinh doanh (Chuỗi F&B)" },
  { id: "PB06", name: "Phòng Công nghệ Thông tin (IT)" },
  { id: "PB07", name: "Xưởng Sản xuất (Nhà máy)" },
  { id: "PB08", name: "Phòng Kinh doanh Chi nhánh Hà Nội" },
];

export const POSITIONS = [
  { id: "CV01", name: "Nhân viên (Thử việc / Mới)" },
  { id: "CV02", name: "Nhân viên chính" },
  { id: "CV03", name: "Tổ trưởng / Trưởng nhóm" },
  { id: "CV04", name: "Phó phòng" },
  { id: "CV05", name: "Trưởng phòng" },
  { id: "CV06", name: "Phó Giám đốc" },
  { id: "CV07", name: "Giám đốc" },
  { id: "CV08", name: "Tổng Giám đốc" },
];

export const BRANCHES = [
  {
    id: "CN01",
    name: "Trụ sở chính TP. Hồ Chí Minh",
    address: "82 Nguyễn Du / 82-84 Bùi Thị Xuân, Q.1",
    gps: "82-84 Bùi Thị Xuân, Q.1 • Bán kính: 50m",
  },
  {
    id: "CN02",
    name: "Nhà máy Buôn Ma Thuột",
    address: "KCN Hòa Phú, TP. Buôn Ma Thuột, Đắk Lắk",
    gps: "KCN Hòa Phú, Buôn Ma Thuột • Bán kính: 100m",
  },
  {
    id: "CN03",
    name: "Chi nhánh Hà Nội",
    address: "25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
    gps: "25 Lý Thường Kiệt, Hoàn Kiếm • Bán kính: 50m",
  },
  {
    id: "CN04",
    name: "Chi nhánh Đà Nẵng",
    address: "120 Bạch Đằng, Hải Châu, Đà Nẵng",
    gps: "120 Bạch Đằng, Hải Châu • Bán kính: 50m",
  },
  {
    id: "CN05",
    name: "Cửa hàng E-Coffee Quận 1",
    address: "15 Đồng Khởi, Quận 1, TP. HCM",
    gps: "15 Đồng Khởi, Quận 1 • Bán kính: 30m",
  },
];

export const CONTRACT_TYPES = [
  { id: "THU_VIEC", name: "Hợp đồng Thử việc (02 tháng)" },
  { id: "XAC_DINH_1_NAM", name: "Hợp đồng xác định thời hạn (12 tháng)" },
  { id: "XAC_DINH_3_NAM", name: "Hợp đồng xác định thời hạn (36 tháng)" },
  { id: "KHONG_XAC_DINH", name: "Hợp đồng không xác định thời hạn" },
];

export default function AddEmployeeModal({ isOpen, onClose, onSave }) {
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
    maCn: "CN01",
    startDate: todayStr,
    contractType: "THU_VIEC",
    salary: "18,500,000",
  });

  if (!isOpen) return null;

  const currentBranch = BRANCHES.find((b) => b.id === formData.maCn) || BRANCHES[0];

  const handleSubmit = (e) => {
    e.preventDefault();

    // Chuẩn hóa mức lương về số nguyên phục vụ DB DECIMAL(12,0)
    const cleanSalary = Number(String(formData.salary).replace(/[^0-9]/g, "")) || 18500000;
    const selectedDept = DEPARTMENTS.find((d) => d.id === formData.maPb);
    const selectedPos = POSITIONS.find((p) => p.id === formData.maCv);
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
      ma_cn: formData.maCn,
      ngay_vao_lam: formData.startDate,
      trang_thai: "DANG_LAM",
      hinh_thuc_lam_viec: "FULL_TIME",
      muc_luong: cleanSalary,
      loai_hd: formData.contractType,

      // Thuộc tính tương thích giao diện frontend
      maNv: formData.maNv === "Tự sinh (Hệ thống)" ? `NV${Math.floor(1280 + Math.random() * 500)}` : formData.maNv,
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      department: formData.maPb,
      deptName: selectedDept?.name || "Phòng ban",
      role: formData.maCv,
      roleName: selectedPos?.name || "Nhân sự",
      branchName: currentBranch.name,
      contractName: selectedContract?.name || "Hợp đồng lao động",
      salaryFormatted: `${cleanSalary.toLocaleString("vi-VN")} đ`,
      salary: cleanSalary,
    };

    if (onSave) {
      onSave(payload);
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn cursor-pointer"
    >
      <div
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
              <h2 className="text-base font-bold text-slate-800">
                Thêm hồ sơ nhân sự mới
              </h2>
              <p className="text-xs text-slate-400">
                Nhập thông tin nhân sự và kích hoạt tài khoản hệ thống TrungNguyenHR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
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
                  {DEPARTMENTS.map((dept) => (
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
                  {POSITIONS.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.id} - {pos.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chi nhánh / Nơi làm việc (Khóa ngoại DB ma_cn) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Chi nhánh / Cơ sở làm việc <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.maCn}
                  onChange={(e) => setFormData({ ...formData, maCn: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all cursor-pointer"
                >
                  {BRANCHES.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.id} - {branch.name}
                    </option>
                  ))}
                </select>
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
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Lưu hồ sơ </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
