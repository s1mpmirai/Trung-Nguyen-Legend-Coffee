import React from "react";
import { Calendar, ShieldCheck } from "lucide-react";

/**
 * ProfileHeader – Phần đầu hồ sơ nhân viên (Không dùng avatar)
 * Đồng bộ với phong cách thẻ nhân viên trên trang Chấm công.
 */
function ProfileHeader({ employee }) {
  const {
    fullName,
    jobTitle,
    departmentFull,
    department,
    id,
    startDate,
    seniority,
    status,
  } = employee;

  return (
    <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3">
      {/* Hàng trên: Badge phòng ban & Trạng thái */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          <span className="text-[10px] font-extrabold text-[#0EA5E9] tracking-wider uppercase px-2 py-0.5 bg-sky-50 rounded-md border border-sky-100/60">
            {departmentFull || department || "Trung Nguyên Legend"}
          </span>
          <span className="text-xs text-slate-300">•</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
            {status || "Đang làm việc"}
          </span>
        </div>
      </div>

      {/* Thông tin tên & chức vụ */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {fullName || "Không có dữ liệu"}
        </h2>
        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
          <span className="font-semibold text-slate-700">{jobTitle || "Nhân viên"}</span>
          <span>•</span>
          <span>Mã NV: <strong className="text-[#0EA5E9] font-bold">{id}</strong></span>
        </div>
      </div>

      {/* Ngày vào làm & thâm niên */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-1.5">
          <Calendar size={13} className="text-slate-400" />
          <span>Vào làm: <strong className="text-slate-700 font-semibold">{startDate || "Không có dữ liệu"}</strong></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <ShieldCheck size={13} className="text-[#0EA5E9]" />
          <span>Thâm niên: <strong className="text-[#0EA5E9] font-semibold">{seniority || "Không có dữ liệu"}</strong></span>
        </div>
      </div>
    </section>
  );
}

export default ProfileHeader;
