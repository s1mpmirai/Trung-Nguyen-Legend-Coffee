import React from "react";

const WIDTHS = ["w-16", "w-32", "w-24", "w-28", "w-20", "w-24", "w-14", "w-20", "w-16"];

/**
 * SkeletonRows – các hàng <tr> giả lập trong lúc tải, đặt bên trong <tbody>
 * để giữ nguyên bố cục cột của bảng.
 */
export function SkeletonRows({ rows = 6, columns = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="animate-pulse" aria-hidden="true">
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="py-3.5 px-4">
              <div className={`h-3 rounded-md bg-slate-200/80 ${WIDTHS[(r + c) % WIDTHS.length]}`} />
              {c === 1 && <div className="h-2.5 mt-2 rounded-md bg-slate-100 w-20" />}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * TableSkeleton – khối bảng giả lập (thay cho vòng xoay tải dữ liệu).
 * Dùng khi bảng thật chưa được render.
 */
export default function TableSkeleton({ rows = 6, columns = 6, label = "Đang tải dữ liệu..." }) {
  return (
    <div role="status" aria-live="polite" className="overflow-hidden">
      <span className="sr-only">{label}</span>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200/80" aria-hidden="true">
            {Array.from({ length: columns }).map((_, c) => (
              <th key={c} className="py-3.5 px-4">
                <div className="h-2.5 rounded bg-slate-200 w-16 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <SkeletonRows rows={rows} columns={columns} />
        </tbody>
      </table>
    </div>
  );
}
