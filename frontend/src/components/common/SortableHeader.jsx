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
 * sort: { by, order } hiện tại; onSort(field) được gọi khi click.
 */
export default function SortableHeader({ label, field, sort, onSort, className = "" }) {
  const isActive = sort?.by === field;
  const Icon = !isActive ? ArrowUpDown : sort.order === "desc" ? ArrowDown : ArrowUp;

  return (
    <th
      className={`${className} cursor-pointer select-none hover:text-sky-700 transition-colors`}
      onClick={() => onSort(field)}
      title={`Sắp xếp theo ${label}`}
      aria-sort={isActive ? (sort.order === "desc" ? "descending" : "ascending") : "none"}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className={`w-3 h-3 ${isActive ? "text-sky-600" : "text-slate-300"}`} />
      </span>
    </th>
  );
}
