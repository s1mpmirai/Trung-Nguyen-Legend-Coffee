import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

/**
 * Tính trạng thái sắp xếp kế tiếp khi click tiêu đề cột:
 * cột mới -> tăng dần, bấm lại cùng cột -> đảo chiều.
 */
export function nextSort(current, field) {
  if (current.by === field) {
    return { by: field, order: current.order === "asc" ? "desc" : "asc" };
  }
  return { by: field, order: "asc" };
}

/**
 * SortableHeader – Ô tiêu đề bảng (<th>) bấm được để sắp xếp phía server.
 * Bên trong là một <button> để dùng được bằng bàn phím (Tab + Enter/Space); <th> giữ aria-sort.
 * sort: { by, order } hiện tại; onSort(field) được gọi khi bấm.
 */
export default function SortableHeader({ label, field, sort, onSort, className = "", align = "left" }) {
  const isActive = sort?.by === field;
  const Icon = !isActive ? ArrowUpDown : sort.order === "desc" ? ArrowDown : ArrowUp;
  const directionLabel = isActive ? (sort.order === "desc" ? "giảm dần" : "tăng dần") : "chưa sắp xếp";

  return (
    <th
      scope="col"
      className={`${className} whitespace-nowrap`}
      aria-sort={isActive ? (sort.order === "desc" ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        title={`Sắp xếp theo ${label}`}
        aria-label={`${label} – ${directionLabel}. Bấm để sắp xếp`}
        className={`inline-flex items-center gap-1 uppercase tracking-wider font-bold rounded-md -mx-1 px-1 py-0.5 cursor-pointer select-none hover:text-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors ${
          align === "right" ? "flex-row-reverse" : ""
        } ${isActive ? "text-sky-700" : ""}`}
      >
        <span>{label}</span>
        <Icon className={`w-3 h-3 shrink-0 ${isActive ? "text-sky-600" : "text-slate-300"}`} aria-hidden="true" />
      </button>
    </th>
  );
}
