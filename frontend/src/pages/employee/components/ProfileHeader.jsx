import React from "react";
import { Calendar, ShieldCheck } from "lucide-react";

/**
 * ProfileHeader – Phần đầu hồ sơ nhân viên (không dùng avatar)
 * Đồng bộ với phong cách thẻ nhân viên trên trang Chấm công.
 */
function ProfileHeader({ employee, onEdit, hasPendingRequest = false }) {
  const { fullName, jobTitle, department, id, startDate, seniority, status, workingType } = employee;

  return (
    <section className="bg-white rounded-2xl p-4 border border-coffee-100 shadow-[0_2px_10px_rgba(62,39,35,0.04)] space-y-3">
      {/* Hàng trên: Badge phòng ban & Trạng thái + Nút Sửa */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 min-w-0">
          <span className="text-[10px] font-extrabold text-coffee-700 tracking-wider uppercase px-2 py-0.5 bg-coffee-50 rounded-md border border-coffee-100">
            {department}
          </span>
          <span className="text-xs text-slate-300" aria-hidden="true">•</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              workingType === "PART_TIME"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-100/80"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1 ${workingType === "PART_TIME" ? "bg-amber-500" : "bg-emerald-500"}`}
              aria-hidden="true"
            ></span>
            {status}
          </span>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            type="button"
            className="inline-flex items-center flex-shrink-0 space-x-1 min-h-[36px] px-2.5 text-xs font-semibold text-coffee-700 bg-coffee-50 hover:bg-coffee-100 rounded-lg border border-coffee-200 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <svg viewBox="0 0 20 20" fill="none" width="13" height="13" aria-hidden="true">
              <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.5 2.5a2.121 2.121 0 013 3L10 14l-4 1 1-4 8.5-8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{hasPendingRequest ? "Sửa yêu cầu" : "Yêu cầu sửa"}</span>
          </button>
        )}
      </div>

      {/* Thông tin tên & chức vụ */}
      <div>
        <h2 className="text-xl font-bold text-coffee-900 tracking-tight">
          {fullName}
        </h2>
        <div className="flex items-center flex-wrap gap-x-2 text-xs text-slate-500 mt-1">
          <span className="font-semibold text-slate-700">{jobTitle}</span>
          <span aria-hidden="true">•</span>
          <span>Mã NV: <strong className="text-coffee-700 font-bold">{id}</strong></span>
        </div>
      </div>

      {/* Ngày vào làm & thâm niên */}
      <div className="pt-2 border-t border-coffee-100 flex items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center space-x-1.5">
          <Calendar size={13} className="text-slate-400" aria-hidden="true" />
          <span>Vào làm: <strong className="text-slate-700 font-semibold">{startDate}</strong></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <ShieldCheck size={13} className="text-gold-600" aria-hidden="true" />
          <span>Thâm niên: <strong className="text-coffee-700 font-semibold">{seniority}</strong></span>
        </div>
      </div>
    </section>
  );
}

export default ProfileHeader;
