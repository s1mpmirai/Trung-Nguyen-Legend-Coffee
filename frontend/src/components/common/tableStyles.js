/**
 * tableStyles.js – lớp Tailwind dùng chung cho bảng dữ liệu cổng Quản trị:
 * vùng cuộn 2 chiều, tiêu đề dính (sticky thead) và cột đầu tiên dính (mã NV / mã HĐ / mã).
 *
 * Cách dùng:
 *   <div className={TABLE_SCROLL}>
 *     <table className={TABLE}>
 *       <thead className={THEAD}><tr className={THEAD_ROW}>
 *         <th className={`${TH} ${STICKY_TH}`}>Mã</th> ...
 *       <tbody className={TBODY}><tr className={TR}>
 *         <td className={`${TD} ${STICKY_TD}`}>NV001</td> ...
 */

// Bóng mờ bên phải cột dính để tách khỏi phần cuộn ngang
const STICKY_SHADOW =
  "after:absolute after:inset-y-0 after:right-0 after:w-2 after:translate-x-full after:pointer-events-none after:bg-gradient-to-r after:from-slate-900/[0.06] after:to-transparent";

export const TABLE_SCROLL = "overflow-auto max-h-[70vh] overscroll-contain";
export const TABLE = "w-full text-left border-collapse text-xs";
export const THEAD = "sticky top-0 z-20 [&_th]:shadow-[inset_0_-1px_0_#e2e8f0]";
export const THEAD_ROW = "bg-slate-50 text-slate-500 font-bold uppercase tracking-wider";
export const TH = "py-3 px-4 whitespace-nowrap bg-slate-50";
export const TBODY = "divide-y divide-slate-100";
export const TR = "group hover:bg-slate-50/70 transition-colors";
export const TD = "py-3.5 px-4";
export const STICKY_TH = `sticky left-0 z-30 bg-slate-50 ${STICKY_SHADOW}`;
export const STICKY_TD = `sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors ${STICKY_SHADOW}`;
