import React from "react";

// Hiện khối đăng nhập nhanh ở cả bản dev lẫn bản build (Docker).
// Muốn ẩn khi triển khai thật: build với biến môi trường VITE_SHOW_DEMO_ACCOUNTS=false
const SHOW_DEMO_ACCOUNTS = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== "false";

/**
 * DemoAccountButtons – nút đăng nhập nhanh bằng tài khoản demo trên trang đăng nhập.
 * accounts: [{ id, password, label, icon }]; bấm nút gọi onSelect(id, password).
 */
export default function DemoAccountButtons({ accounts = [], onSelect, disabled = false }) {
  if (!SHOW_DEMO_ACCOUNTS || accounts.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        <span>Đăng nhập nhanh tài khoản demo</span>
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
      </div>

      <div className={`grid gap-2 ${accounts.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {accounts.map(({ id, password, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(id, password)}
            title={`Đăng nhập bằng tài khoản ${id} (mật khẩu: ${password})`}
            className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-xs hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {Icon && <Icon size={15} aria-hidden="true" />}
            <span>{label}</span>
            <span className="font-mono text-[11px] text-slate-400">{id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
