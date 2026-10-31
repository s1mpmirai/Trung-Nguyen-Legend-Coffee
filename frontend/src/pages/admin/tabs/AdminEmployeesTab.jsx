import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Filter,
} from "lucide-react";
import { getEmployeesList, getDepartments, getPositions } from "../../../services/adminService";
import SortableHeader, { nextSort } from "../../../components/common/SortableHeader";
import { SkeletonRows } from "../../../components/common/TableSkeleton";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import {
  TABLE_SCROLL,
  TABLE,
  THEAD,
  THEAD_ROW,
  TH,
  TBODY,
  TR,
  TD,
  STICKY_TH,
  STICKY_TD,
} from "../../../components/common/tableStyles";

// Nhãn hiển thị khớp ENUM trong CSDL (00_full_hrm_lite.sql)
const STATUS_OPTIONS = [
  { value: "DANG_LAM", label: "Đang làm việc", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "NGHI_PHEP", label: "Nghỉ phép", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "NGHI_THAI_SAN", label: "Nghỉ thai sản", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "TAM_HOAN_HD", label: "Tạm hoãn HĐ", badge: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "DA_NGHI_VIEC", label: "Đã nghỉ việc", badge: "bg-rose-50 text-rose-700 border-rose-200" },
];

const CONTRACT_TYPE_OPTIONS = [
  { value: "THU_VIEC", label: "Thử việc" },
  { value: "XAC_DINH_1_NAM", label: "Xác định thời hạn 1 năm" },
  { value: "XAC_DINH_3_NAM", label: "Xác định thời hạn 3 năm" },
  { value: "KHONG_XAC_DINH", label: "Không xác định thời hạn" },
  { value: "THOI_VU", label: "Thời vụ" },
];

const GENDER_LABELS = { Nam: "Nam", Nu: "Nữ", Khac: "Khác" };

const EMPTY_FILTERS = {
  q: "",
  ma_pb: "",
  ma_cv: "",
  trang_thai: "",
  gioi_tinh: "",
  hinh_thuc_lam_viec: "",
  loai_hd: "",
  luong_tu: "",
  luong_den: "",
  ngay_vao_tu: "",
  ngay_vao_den: "",
};

// Các trường thuộc panel "Tìm kiếm nâng cao" (dùng để đếm số điều kiện đang áp dụng)
const ADVANCED_FIELDS = ["gioi_tinh", "hinh_thuc_lam_viec", "loai_hd", "luong_tu", "luong_den", "ngay_vao_tu", "ngay_vao_den"];

const inputClass =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition";
// Dropdown lọc nhanh: không dùng w-full để 3 ô nằm chung một hàng, chia đều chiều ngang còn lại
const selectClass =
  "flex-1 basis-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition cursor-pointer";

const formatDate = (val) => {
  if (!val) return "—";
  const [y, m, d] = String(val).split("T")[0].split("-");
  return d && m && y ? `${d}/${m}/${y}` : String(val);
};

const formatVND = (val) => (val || val === 0 ? `${Number(val).toLocaleString("vi-VN")} đ` : "—");

/**
 * AdminEmployeesTab – Danh bạ nhân sự (chỉ đọc) cho Admin:
 * tìm kiếm theo từ khóa, tìm kiếm nâng cao (khoảng lương, khoảng ngày vào làm, giới tính, loại HĐ...),
 * lọc theo phòng ban / chức vụ / trạng thái và sắp xếp theo cột. Toàn bộ xử lý phía server
 * qua GET /employees/get_employee_list.
 */
export default function AdminEmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // draft: giá trị đang nhập trên form; filters: điều kiện đã áp dụng để gọi API
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [sort, setSort] = useState({ by: "ma_nv", order: "asc" });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    // Danh mục cho dropdown lọc lấy từ CSDL, không viết cứng
    Promise.all([getDepartments(), getPositions()])
      .then(([pbList, cvList]) => {
        setDepartments(pbList || []);
        setPositions(cvList || []);
      })
      .catch((err) => console.error("Lỗi tải danh mục phòng ban / chức vụ:", err));
  }, []);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = { page, page_size: pageSize, sort_by: sort.by, sort_order: sort.order };
      Object.entries(filters).forEach(([key, val]) => {
        if (String(val).trim() !== "") params[key] = String(val).trim();
      });

      const data = await getEmployeesList(params);
      setEmployees(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error("Lỗi tải danh bạ nhân sự:", err);
      setEmployees([]);
      setTotal(0);
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters, sort]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const validate = (values) => {
    const { luong_tu, luong_den, ngay_vao_tu, ngay_vao_den } = values;
    if (luong_tu !== "" && Number(luong_tu) < 0) return "Mức lương không được âm.";
    if (luong_tu !== "" && luong_den !== "" && Number(luong_tu) > Number(luong_den)) {
      return "Mức lương 'từ' phải nhỏ hơn hoặc bằng mức lương 'đến'.";
    }
    if (ngay_vao_tu && ngay_vao_den && ngay_vao_tu > ngay_vao_den) {
      return "Ngày vào làm 'từ' phải trước hoặc bằng ngày 'đến'.";
    }
    return "";
  };

  const applyFilters = (next) => {
    const error = validate(next);
    setValidationError(error);
    if (error) return;
    setFilters(next);
    setPage(1);
  };

  // Dropdown lọc nhanh áp dụng ngay khi chọn
  const handleQuickFilter = (key, value) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    applyFilters(next);
  };

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setValidationError("");
    setSort({ by: "ma_nv", order: "asc" });
    setPage(1);
  };

  const handleSort = (field) => {
    setSort((prev) => nextSort(prev, field));
    setPage(1);
  };

  const advancedCount = ADVANCED_FIELDS.filter((k) => String(filters[k]).trim() !== "").length;
  // Đếm TẤT CẢ điều kiện đang áp dụng: từ khóa, phòng ban, chức vụ, trạng thái và các trường nâng cao
  const activeFilterCount = Object.keys(EMPTY_FILTERS).filter((k) => String(filters[k]).trim() !== "").length;
  const statusInfo = (value) => STATUS_OPTIONS.find((s) => s.value === value);
  const contractLabel = (value) => CONTRACT_TYPE_OPTIONS.find((c) => c.value === value)?.label || value || "—";

  return (
    <div className="flex flex-col gap-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase flex items-center gap-3">
            <Users className="w-7 h-7 text-sky-600" />
            DANH BẠ NHÂN SỰ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu hồ sơ nhân sự toàn hệ thống (chỉ đọc): tìm kiếm, tìm kiếm nâng cao, lọc và sắp xếp
          </p>
        </div>

        <button
          onClick={fetchEmployees}
          className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 text-xs shadow-xs self-start md:self-auto"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* ── THANH TÌM KIẾM & LỌC NHANH ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
        {/* Hàng 1: ô tìm kiếm */}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters(draft);
          }}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã NV, Họ tên, Email, SĐT, CCCD..."
              value={draft.q}
              onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              className={`${inputClass} pl-10`}
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Search size={13} />
            <span>Tìm kiếm</span>
          </button>
        </form>

        {/* Hàng 2: 3 bộ lọc nhanh + Tìm kiếm nâng cao + Đặt lại trên cùng một hàng */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={draft.ma_pb}
            onChange={(e) => handleQuickFilter("ma_pb", e.target.value)}
            className={`${selectClass} min-w-[170px]`}
            aria-label="Lọc theo phòng ban"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((pb) => (
              <option key={pb.ma_pb} value={pb.ma_pb}>
                {pb.ten_pb}
              </option>
            ))}
          </select>

          <select
            value={draft.ma_cv}
            onChange={(e) => handleQuickFilter("ma_cv", e.target.value)}
            className={`${selectClass} min-w-[150px]`}
            aria-label="Lọc theo chức vụ"
          >
            <option value="">Tất cả chức vụ</option>
            {positions.map((cv) => (
              <option key={cv.ma_cv} value={cv.ma_cv}>
                {cv.ten_cv}
              </option>
            ))}
          </select>

          <select
            value={draft.trang_thai}
            onChange={(e) => handleQuickFilter("trang_thai", e.target.value)}
            className={`${selectClass} min-w-[150px]`}
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer shrink-0 whitespace-nowrap ${
              showAdvanced || advancedCount > 0
                ? "bg-sky-50 text-sky-700 border-sky-300"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Tìm kiếm nâng cao{advancedCount > 0 ? ` (${advancedCount})` : ""}</span>
          </button>

          {activeFilterCount > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 shrink-0 whitespace-nowrap"
              aria-live="polite"
            >
              <Filter size={11} aria-hidden="true" />
              Đang lọc: {activeFilterCount} điều kiện
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            disabled={activeFilterCount === 0 && sort.by === "ma_nv" && sort.order === "asc"}
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
            title="Xóa toàn bộ điều kiện tìm kiếm và sắp xếp"
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>

        {/* ── PANEL TÌM KIẾM NÂNG CAO ── */}
        {showAdvanced && (
          <form
            className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters(draft);
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">Giới tính</span>
              <select
                value={draft.gioi_tinh}
                onChange={(e) => setDraft({ ...draft, gioi_tinh: e.target.value })}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Tất cả</option>
                {Object.entries(GENDER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">Hình thức làm việc</span>
              <select
                value={draft.hinh_thuc_lam_viec}
                onChange={(e) => setDraft({ ...draft, hinh_thuc_lam_viec: e.target.value })}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Tất cả</option>
                <option value="FULL_TIME">Toàn thời gian</option>
                <option value="PART_TIME">Bán thời gian</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">Loại hợp đồng</span>
              <select
                value={draft.loai_hd}
                onChange={(e) => setDraft({ ...draft, loai_hd: e.target.value })}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Tất cả</option>
                {CONTRACT_TYPE_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">Lương cơ bản (VNĐ)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="500000"
                  placeholder="Từ"
                  value={draft.luong_tu}
                  onChange={(e) => setDraft({ ...draft, luong_tu: e.target.value })}
                  className={inputClass}
                />
                <span className="text-slate-400 text-xs">–</span>
                <input
                  type="number"
                  min="0"
                  step="500000"
                  placeholder="Đến"
                  value={draft.luong_den}
                  onChange={(e) => setDraft({ ...draft, luong_den: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 lg:col-span-2">
              <span className="text-[11px] font-semibold text-slate-500">Ngày vào làm</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={draft.ngay_vao_tu}
                  onChange={(e) => setDraft({ ...draft, ngay_vao_tu: e.target.value })}
                  className={inputClass}
                />
                <span className="text-slate-400 text-xs">–</span>
                <input
                  type="date"
                  value={draft.ngay_vao_den}
                  onChange={(e) => setDraft({ ...draft, ngay_vao_den: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-end lg:col-span-2 gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <SlidersHorizontal size={13} />
                Áp dụng điều kiện
              </button>
            </div>
          </form>
        )}

        {validationError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {validationError}
          </div>
        )}
      </div>

      {/* ── BẢNG KẾT QUẢ ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadError && !isLoading ? (
          <ErrorState error={loadError} onRetry={fetchEmployees} />
        ) : !isLoading && employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title={activeFilterCount > 0 ? "Không tìm thấy nhân sự phù hợp" : "Chưa có hồ sơ nhân sự"}
            description={
              activeFilterCount > 0
                ? `Không có nhân sự nào khớp với ${activeFilterCount} điều kiện đang áp dụng.`
                : "Danh bạ sẽ hiển thị tại đây khi có hồ sơ nhân sự."
            }
            hasFilters={activeFilterCount > 0}
            onResetFilters={handleReset}
          />
        ) : (
          <div className={TABLE_SCROLL}>
            <table className={TABLE} aria-busy={isLoading}>
              <thead className={THEAD}>
                <tr className={THEAD_ROW}>
                  <SortableHeader className={`${TH} ${STICKY_TH} min-w-[96px]`} label="Mã NV" field="ma_nv" sort={sort} onSort={handleSort} />
                  <SortableHeader className={`${TH} min-w-[200px]`} label="Họ tên" field="ho_ten" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Phòng ban" field="ten_pb" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Chức vụ" field="ten_cv" sort={sort} onSort={handleSort} />
                  <th scope="col" className={TH}>Liên hệ</th>
                  <SortableHeader className={TH} label="Ngày vào làm" field="ngay_vao_lam" sort={sort} onSort={handleSort} />
                  <th scope="col" className={TH}>Loại HĐ</th>
                  <SortableHeader className={`${TH} text-right`} align="right" label="Lương cơ bản" field="luong_co_ban" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Trạng thái" field="trang_thai" sort={sort} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className={TBODY}>
                {isLoading ? (
                  <SkeletonRows rows={8} columns={9} />
                ) : employees.map((emp) => {
                  const status = statusInfo(emp.trang_thai);
                  return (
                    <tr key={emp.ma_nv} className={TR}>
                      <td className={`${TD} ${STICKY_TD} font-mono font-bold text-slate-900 whitespace-nowrap`}>{emp.ma_nv}</td>
                      <td className={TD}>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 whitespace-nowrap">{emp.ho_ten}</span>
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">
                            {GENDER_LABELS[emp.gioi_tinh] || emp.gioi_tinh || "—"} • {formatDate(emp.ngay_sinh)}
                          </span>
                        </div>
                      </td>
                      <td className={`${TD} text-slate-700 whitespace-nowrap`}>{emp.ten_pb || "—"}</td>
                      <td className={`${TD} text-slate-700 whitespace-nowrap`}>{emp.ten_cv || "—"}</td>
                      <td className={TD}>
                        <div className="flex flex-col gap-0.5 text-[11px] text-slate-500 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Phone size={11} aria-hidden="true" /> {emp.sdt || "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail size={11} aria-hidden="true" /> {emp.email || "—"}
                          </span>
                        </div>
                      </td>
                      <td className={`${TD} text-slate-700 whitespace-nowrap`}>{formatDate(emp.ngay_vao_lam)}</td>
                      <td className={`${TD} text-slate-700 whitespace-nowrap`}>{contractLabel(emp.loai_hd)}</td>
                      <td className={`${TD} text-right font-semibold text-slate-900 whitespace-nowrap`}>{formatVND(emp.muc_luong)}</td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            status?.badge || "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {status?.label || emp.trang_thai}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hiển thị <strong>{employees.length}</strong> trên tổng số <strong>{total}</strong> nhân sự
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Trang trước"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 font-semibold text-slate-700">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Trang sau"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
