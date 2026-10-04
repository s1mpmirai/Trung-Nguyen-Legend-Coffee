import React, { useState } from "react";
import { UserPlus, X, CheckCircle2, MapPin, Save } from "lucide-react";

export default function AddEmployeeModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    maNv: "NV1281",
    fullName: "",
    email: "",
    phone: "",
    birthDate: "1995-06-15",
    gender: "Nam",
    department: "fnb",
    role: "",
    contractType: "Hợp đồng Thử việc (02 tháng)",
    salary: "18,500,000",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
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
              <h2 className="text-base font-bold text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
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
              {/* Mã NV & Họ tên */}
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
                    title="Mã tự sinh"
                  />
                </div>
              </div>

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

              {/* Email & SĐT */}
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

              {/* Ngày sinh & Giới tính */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Ngày sinh</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                />
              </div>

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
            </div>
          </div>

          {/* Nhóm 2: Vị trí & Hợp đồng */}
          <div className="flex flex-col gap-3.5 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-sky-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Vị trí & Hợp đồng lao động
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Phòng ban */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Phòng ban trực thuộc <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="fnb">Vận hành Chuỗi F&B Legend</option>
                  <option value="rnd">Nghiên cứu & Phát triển (R&D)</option>
                  <option value="mkt">Marketing & Truyền thông</option>
                  <option value="tc">Tài chính - Kế toán</option>
                  <option value="ns">Nhân sự & Đào tạo</option>
                  <option value="bgd">Ban Giám Đốc</option>
                </select>
              </div>

              {/* Chức danh */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Chức danh / Vị trí <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chuyên viên Barista"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                />
              </div>

              {/* Loại hợp đồng */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Loại hợp đồng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all cursor-pointer"
                >
                  <option>Hợp đồng Thử việc (02 tháng)</option>
                  <option>Hợp đồng có thời hạn (12 tháng)</option>
                  <option>Hợp đồng có thời hạn (36 tháng)</option>
                  <option>Hợp đồng không xác định thời hạn</option>
                </select>
              </div>

              {/* Mức lương */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Mức lương đóng BHXH <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full pl-3 pr-11 py-2 bg-[#f8fafc] border border-slate-200 text-slate-800 font-mono text-xs font-bold rounded-xl focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-semibold text-slate-400">VNĐ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Khối GPS Chấm công */}
          <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-700 truncate">Địa điểm chấm công GPS</span>
                <span className="text-[11px] text-slate-400 truncate">
                  Trụ sở chính Trung Nguyên (82-84 Bùi Thị Xuân, Q.1) • R: 50m
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-semibold shrink-0 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Đã kích hoạt
            </span>
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
              <span>Lưu hồ sơ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
