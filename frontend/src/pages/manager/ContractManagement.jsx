import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  AlertCircle,
  RotateCcw,
  Filter,
  Loader2,
  Info,
} from "lucide-react";
import {
  getContracts,
  createContract,
  updateContract,
  liquidateContract,
  deleteContract,
  restoreContract,
  getEmployeesList,
} from "../../../services/adminService";
import SortableHeader, { nextSort } from "../../../components/common/SortableHeader";
import { SkeletonRows } from "../../../components/common/TableSkeleton";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Modal from "../../../components/common/Modal";
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

// Nhãn loại hợp đồng thống nhất trên toàn bộ màn hình (bộ lọc, bảng, biểu mẫu)
const CONTRACT_TYPES = [
  { value: "THU_VIEC", label: "Thử việc", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "XAC_DINH_1_NAM", label: "Xác định thời hạn 1 năm", badge: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "XAC_DINH_3_NAM", label: "Xác định thời hạn 3 năm", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "KHONG_XAC_DINH", label: "Không xác định thời hạn", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "THOI_VU", label: "Thời vụ", badge: "bg-slate-50 text-slate-700 border-slate-200" },
];

const STATUS_OPTIONS = [
  { value: "HIEU_LUC", label: "Hiệu lực" },
  { value: "HET_HAN", label: "Hết hạn" },
  { value: "DA_THANH_LY", label: "Đã thanh lý" },
  { value: "TAM_HOAN", label: "Tạm hoãn" },
  { value: "DA_HUY", label: "Đã xóa (có thể khôi phục)" },
];

// Trạng thái được phép chọn trực tiếp khi sửa hợp đồng (thanh lý phải qua chức năng Thanh lý)
const EDITABLE_STATUSES = ["HIEU_LUC", "HET_HAN", "TAM_HOAN"];

const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toInputDate = (val) => (val ? String(val).split("T")[0] : "");

const formatDate = (val) => {
  if (!val) return "";
  const [y, m, d] = String(val).split("T")[0].split("-");
  return d && m && y ? `${d}/${m}/${y}` : String(val);
};

const formatVND = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

const contractType = (value) =>
  CONTRACT_TYPES.find((t) => t.value === value) || { label: value || "Khác", badge: "bg-slate-50 text-slate-700 border-slate-200" };

const emptyForm = () => ({
  ma_nv: "",
  loai_hd: "XAC_DINH_1_NAM",
  ngay_ky: todayISO(),
  ngay_bat_dau: todayISO(),
  ngay_ket_thuc: "",
  luong_co_ban: "",
  ty_le_huong: 100,
  so_tai_khoan: "",
  ngan_hang: "",
  ma_so_thue: "",
  so_bhxh: "",
  trang_thai: "HIEU_LUC",
});

const inputClass =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-60";

const StatusBadge = ({ status }) => {
  const map = {
    HIEU_LUC: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2, label: "Hiệu lực" },
    HET_HAN: { cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: XCircle, label: "Hết hạn" },
    DA_THANH_LY: { cls: "bg-slate-100 text-slate-600 border-slate-300", Icon: FileCheck, label: "Đã thanh lý" },
    TAM_HOAN: { cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock, label: "Tạm hoãn" },
    DA_HUY: { cls: "bg-slate-100 text-slate-400 border-slate-200 line-through", Icon: Trash2, label: "Đã xóa" },
  };
  const info = map[status];
  if (!info) return <span>{status}</span>;
  const { cls, Icon, label } = info;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${cls}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {label}
    </span>
  );
};

/** Các trường điều khoản hợp đồng dùng chung cho form Lập mới và Cập nhật. */
function ContractTermsFields({ formData, setFormData, mode }) {
  const isIndefinite = formData.loai_hd === "KHONG_XAC_DINH";
  const set = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));
  const idPrefix = `contract-${mode}`;

  const handleTypeChange = (value) => {
    setFormData((prev) => {
      const next = { ...prev, loai_hd: value };
      if (value === "KHONG_XAC_DINH") next.ngay_ket_thuc = "";
      // Gợi ý tỷ lệ hưởng: thử việc 85%, chính thức 100% (chỉ khi người dùng chưa tự chỉnh)
      if (mode === "create") {
        if (value === "THU_VIEC" && Number(prev.ty_le_huong) === 100) next.ty_le_huong = 85;
        if (value !== "THU_VIEC" && prev.loai_hd === "THU_VIEC" && Number(prev.ty_le_huong) === 85) next.ty_le_huong = 100;
      }
      return next;
    });
  };

  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-type`} className="block text-slate-700 font-semibold mb-1">
          Loại hợp đồng <span className="text-rose-500">*</span>
        </label>
        <select
          id={`${idPrefix}-type`}
          required
          value={formData.loai_hd}
          onChange={(e) => handleTypeChange(e.target.value)}
          className={inputClass}
        >
          {CONTRACT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-sign`} className="block text-slate-700 font-semibold mb-1">
          Ngày ký hợp đồng <span className="text-rose-500">*</span>
        </label>
        <input
          id={`${idPrefix}-sign`}
          type="date"
          required
          value={formData.ngay_ky}
          onChange={(e) => set("ngay_ky", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-start`} className="block text-slate-700 font-semibold mb-1">
          Ngày bắt đầu hiệu lực <span className="text-rose-500">*</span>
        </label>
        <input
          id={`${idPrefix}-start`}
          type="date"
          required
          value={formData.ngay_bat_dau}
          onChange={(e) => set("ngay_bat_dau", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-end`} className="block text-slate-700 font-semibold mb-1">
          Ngày kết thúc {!isIndefinite && <span className="text-rose-500">*</span>}
        </label>
        <input
          id={`${idPrefix}-end`}
          type="date"
          required={!isIndefinite}
          disabled={isIndefinite}
          min={formData.ngay_bat_dau || undefined}
          value={formData.ngay_ket_thuc}
          onChange={(e) => set("ngay_ket_thuc", e.target.value)}
          className={inputClass}
        />
        {isIndefinite && <p className="text-[10px] text-slate-400 mt-1">Hợp đồng không xác định thời hạn không có ngày kết thúc.</p>}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-salary`} className="block text-slate-700 font-semibold mb-1">
          Lương cơ bản thỏa thuận (VNĐ) <span className="text-rose-500">*</span>
        </label>
        <input
          id={`${idPrefix}-salary`}
          type="number"
          min="1"
          step="1000"
          required
          placeholder="Nhập mức lương theo hợp đồng"
          value={formData.luong_co_ban}
          onChange={(e) => set("luong_co_ban", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-rate`} className="block text-slate-700 font-semibold mb-1">
          Tỷ lệ hưởng lương (%) <span className="text-rose-500">*</span>
        </label>
        <input
          id={`${idPrefix}-rate`}
          type="number"
          min="50"
          max="100"
          required
          value={formData.ty_le_huong}
          onChange={(e) => set("ty_le_huong", e.target.value)}
          className={inputClass}
        />
        <p className="text-[10px] text-slate-400 mt-1">Thử việc thường hưởng 85%, chính thức 100%.</p>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-account`} className="block text-slate-700 font-semibold mb-1">
          Số tài khoản ngân hàng
        </label>
        <input
          id={`${idPrefix}-account`}
          type="text"
          inputMode="numeric"
          value={formData.so_tai_khoan}
          onChange={(e) => set("so_tai_khoan", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-bank`} className="block text-slate-700 font-semibold mb-1">
          Tên ngân hàng
        </label>
        <input
          id={`${idPrefix}-bank`}
          type="text"
          placeholder="Ví dụ: Vietcombank"
          value={formData.ngan_hang}
          onChange={(e) => set("ngan_hang", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-tax`} className="block text-slate-700 font-semibold mb-1">
          Mã số thuế cá nhân
        </label>
        <input
          id={`${idPrefix}-tax`}
          type="text"
          value={formData.ma_so_thue}
          onChange={(e) => set("ma_so_thue", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-bhxh`} className="block text-slate-700 font-semibold mb-1">
          Số sổ BHXH
        </label>
        <input
          id={`${idPrefix}-bhxh`}
          type="text"
          value={formData.so_bhxh}
          onChange={(e) => set("so_bhxh", e.target.value)}
          className={inputClass}
        />
      </div>
    </>
  );
}

// Kiểm tra dữ liệu trước khi gửi; trả về thông báo lỗi hoặc ""
const validateTerms = (form) => {
  if (!form.luong_co_ban || Number(form.luong_co_ban) <= 0) return "Lương cơ bản phải lớn hơn 0.";
  const rate = Number(form.ty_le_huong);
  if (Number.isNaN(rate) || rate < 50 || rate > 100) return "Tỷ lệ hưởng lương phải trong khoảng 50% – 100%.";
  if (form.loai_hd !== "KHONG_XAC_DINH" && !form.ngay_ket_thuc) return "Vui lòng nhập ngày kết thúc hợp đồng.";
  if (form.ngay_ket_thuc && form.ngay_bat_dau && form.ngay_ket_thuc < form.ngay_bat_dau) {
    return "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
  }
  return "";
};

// Chuẩn hóa dữ liệu gửi API: chuỗi rỗng → null, số → Number
const toPayload = (form) => ({
  loai_hd: form.loai_hd,
  ngay_ky: form.ngay_ky || null,
  ngay_bat_dau: form.ngay_bat_dau || null,
  ngay_ket_thuc: form.loai_hd === "KHONG_XAC_DINH" ? null : form.ngay_ket_thuc || null,
  luong_co_ban: Number(form.luong_co_ban),
  ty_le_huong: Number(form.ty_le_huong),
  so_tai_khoan: form.so_tai_khoan.trim() || null,
  ngan_hang: form.ngan_hang.trim() || null,
  ma_so_thue: form.ma_so_thue.trim() || null,
  so_bhxh: form.so_bhxh.trim() || null,
});

export default function AdminContractsTab() {
  const [contracts, setContracts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ so_hieu_luc: 0, so_sap_het_han_30_ngay: 0, so_da_thanh_ly: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Filters & Pagination
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loaiHdFilter, setLoaiHdFilter] = useState("");
  const [trangThaiFilter, setTrangThaiFilter] = useState("");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sort, setSort] = useState({ by: "", order: "asc" });

  const activeFilterCount = [search, loaiHdFilter, trangThaiFilter, expiringOnly ? "1" : ""].filter(Boolean).length;

  const handleSort = (field) => {
    setSort((prev) => nextSort(prev, field));
    setPage(1);
  };

  const handleTriggerSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim()) {
      setSearch("");
      setPage(1);
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setLoaiHdFilter("");
    setTrangThaiFilter("");
    setExpiringOnly(false);
    setPage(1);
  };

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [liquidateDate, setLiquidateDate] = useState(todayISO());
  const [restoringId, setRestoringId] = useState("");

  // Danh sách nhân sự cho form lập hợp đồng
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeLoadError, setEmployeeLoadError] = useState("");

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = { page, page_size: pageSize };
      if (search.trim()) params.search = search.trim();
      if (loaiHdFilter) params.loai_hd = loaiHdFilter;
      if (trangThaiFilter) params.trang_thai = trangThaiFilter;
      if (expiringOnly) params.expiring_days = 30;
      if (sort.by) {
        params.sort_by = sort.by;
        params.sort_order = sort.order;
      }

      const res = await getContracts(params);
      const data = res?.data || res || {};
      setContracts(data.items || []);
      setTotalCount(data.total || 0);
      setStats({
        so_hieu_luc: data.so_hieu_luc || 0,
        so_sap_het_han_30_ngay: data.so_sap_het_han_30_ngay || 0,
        so_da_thanh_ly: data.so_da_thanh_ly || 0,
      });
    } catch (err) {
      console.error("Lỗi tải danh sách hợp đồng:", err);
      setContracts([]);
      setTotalCount(0);
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, loaiHdFilter, trangThaiFilter, expiringOnly, sort]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getEmployeesList({ page: 1, page_size: 200, trang_thai: "DANG_LAM", sort_by: "ma_nv", sort_order: "asc" });
        setEmployeeOptions(res?.data?.items || res?.items || []);
      } catch (err) {
        console.error("Lỗi tải danh sách nhân sự:", err);
        setEmployeeLoadError(err.message || "Không tải được danh sách nhân sự.");
      }
    };
    fetchEmployees();
  }, []);

  const handleOpenCreateModal = () => {
    setFormData(emptyForm());
    setFormError("");
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (c) => {
    setSelectedContract(c);
    setFormError("");
    setFormData({
      ma_nv: c.ma_nv,
      loai_hd: c.loai_hd || "XAC_DINH_1_NAM",
      ngay_ky: toInputDate(c.ngay_ky),
      ngay_bat_dau: toInputDate(c.ngay_bat_dau),
      ngay_ket_thuc: toInputDate(c.ngay_ket_thuc),
      luong_co_ban: c.luong_co_ban ?? "",
      ty_le_huong: c.ty_le_huong ?? 100,
      so_tai_khoan: c.so_tai_khoan || "",
      ngan_hang: c.ngan_hang || "",
      ma_so_thue: c.ma_so_thue || "",
      so_bhxh: c.so_bhxh || "",
      trang_thai: c.trang_thai || "HIEU_LUC",
    });
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.ma_nv) {
      setFormError("Vui lòng chọn nhân sự ký hợp đồng.");
      return;
    }
    const error = validateTerms(formData);
    setFormError(error);
    if (error) return;

    setIsSubmitting(true);
    try {
      const created = await createContract({ ...toPayload(formData), ma_nv: formData.ma_nv, trang_thai: "HIEU_LUC" });
      showToast(`Đã lập hợp đồng ${created?.ma_hd || ""} cho nhân sự ${formData.ma_nv}.`);
      setShowCreateModal(false);
      fetchContracts();
    } catch (err) {
      setFormError(err.message || "Không thể lập hợp đồng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !selectedContract) return;
    const error = validateTerms(formData);
    setFormError(error);
    if (error) return;

    const payload = toPayload(formData);
    // Chỉ gửi trạng thái khi hợp đồng đang ở trạng thái được phép sửa trực tiếp
    if (EDITABLE_STATUSES.includes(selectedContract.trang_thai) && EDITABLE_STATUSES.includes(formData.trang_thai)) {
      payload.trang_thai = formData.trang_thai;
    }

    setIsSubmitting(true);
    try {
      await updateContract(selectedContract.ma_hd, payload);
      showToast(`Đã cập nhật hợp đồng ${selectedContract.ma_hd}.`);
      setShowEditModal(false);
      fetchContracts();
    } catch (err) {
      setFormError(err.message || "Không thể cập nhật hợp đồng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestLiquidate = (c) => {
    setSelectedContract(c);
    setLiquidateDate(todayISO());
    setConfirm({ type: "liquidate", contract: c });
  };

  const requestDelete = (c) => {
    setSelectedContract(c);
    setConfirm({ type: "delete", contract: c });
  };

  const handleConfirm = async () => {
    const c = confirm?.contract;
    if (!c) return;
    if (confirm.type === "liquidate") {
      await liquidateContract(c.ma_hd, { ngay_ket_thuc: liquidateDate });
      showToast(`Đã thanh lý hợp đồng ${c.ma_hd} (ngày kết thúc ${formatDate(liquidateDate)}).`);
    } else {
      await deleteContract(c.ma_hd);
      showToast(`Đã xóa hợp đồng ${c.ma_hd} (có thể khôi phục).`);
    }
    setConfirm(null);
    fetchContracts();
  };

  const handleRestore = async (c) => {
    if (restoringId) return;
    setRestoringId(c.ma_hd);
    try {
      await restoreContract(c.ma_hd);
      showToast(`Đã khôi phục hợp đồng ${c.ma_hd}.`);
      fetchContracts();
    } catch (err) {
      showToast(err.message || "Không thể khôi phục hợp đồng.", "error");
    } finally {
      setRestoringId("");
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const selectedEmployee = employeeOptions.find((emp) => emp.ma_nv === formData.ma_nv);
  const editStatusLocked = selectedContract && !EDITABLE_STATUSES.includes(selectedContract.trang_thai);

  const filterSelectClass =
    "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer";

  return (
    <div className="flex flex-col gap-6">
      {/* ── TOAST ── */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[70] p-4 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-up max-w-md ${
            toast.type === "error" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase flex items-center gap-3">
            <FileText className="w-7 h-7 text-sky-600" aria-hidden="true" />
            QUẢN LÝ HỢP ĐỒNG LAO ĐỘNG
          </h1>
          <p className="text-xs text-slate-500 mt-1">Theo dõi hiệu lực, kỳ hạn, mức lương và thanh lý hợp đồng của nhân sự</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchContracts}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 text-xs shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`} aria-hidden="true" />
            Làm mới
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Lập hợp đồng mới
          </button>
        </div>
      </div>

      {/* ── THẺ THỐNG KÊ ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <FileText className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">{totalCount}</div>
            <div className="text-xs text-slate-500 font-medium">
              {activeFilterCount > 0 ? "Hợp đồng khớp bộ lọc" : "Tổng số hợp đồng"}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-emerald-600">{stats.so_hieu_luc}</div>
            <div className="text-xs text-slate-500 font-medium">Đang có hiệu lực (toàn hệ thống)</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setExpiringOnly(!expiringOnly);
            setPage(1);
          }}
          aria-pressed={expiringOnly}
          className={`p-5 rounded-2xl border shadow-xs flex items-center gap-4 cursor-pointer transition text-left ${
            expiringOnly ? "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400" : "bg-white border-slate-200/80 hover:border-amber-400"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              expiringOnly ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600"
            }`}
          >
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className={`text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] ${expiringOnly ? "text-white" : "text-amber-600"}`}>
              {stats.so_sap_het_han_30_ngay}
            </div>
            <div className={`text-xs font-medium ${expiringOnly ? "text-amber-100" : "text-slate-500"}`}>
              Sắp hết hạn (≤ 30 ngày) – bấm để lọc
            </div>
          </div>
        </button>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <FileCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-slate-700">{stats.so_da_thanh_ly}</div>
            <div className="text-xs text-slate-500 font-medium">Đã thanh lý (toàn hệ thống)</div>
          </div>
        </div>
      </div>

      {/* ── THANH TÌM KIẾM & BỘ LỌC ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                aria-label="Tìm hợp đồng"
                placeholder="Tìm theo mã HĐ, mã NV, họ tên..."
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleTriggerSearch();
                  }
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>
            <button
              type="button"
              onClick={handleTriggerSearch}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Search size={13} aria-hidden="true" />
              <span>Tìm kiếm</span>
            </button>
          </div>

          <div className="min-w-[190px]">
            <select
              aria-label="Lọc theo loại hợp đồng"
              value={loaiHdFilter}
              onChange={(e) => {
                setLoaiHdFilter(e.target.value);
                setPage(1);
              }}
              className={filterSelectClass}
            >
              <option value="">Tất cả loại hợp đồng</option>
              {CONTRACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[160px]">
            <select
              aria-label="Lọc theo trạng thái"
              value={trangThaiFilter}
              onChange={(e) => {
                setTrangThaiFilter(e.target.value);
                setPage(1);
              }}
              className={filterSelectClass}
            >
              <option value="">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setExpiringOnly(!expiringOnly);
              setPage(1);
            }}
            aria-pressed={expiringOnly}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
              expiringOnly ? "bg-amber-500 text-white border-amber-600" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sắp hết hạn 30 ngày</span>
          </button>

          {activeFilterCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <Filter size={11} aria-hidden="true" />
              Đang lọc: {activeFilterCount} điều kiện
            </span>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            disabled={activeFilterCount === 0}
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>
      </div>

      {/* ── BẢNG HỢP ĐỒNG ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadError && !loading ? (
          <ErrorState error={loadError} onRetry={fetchContracts} />
        ) : !loading && contracts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={activeFilterCount > 0 ? "Không tìm thấy hợp đồng phù hợp" : "Chưa có hợp đồng lao động"}
            description={
              activeFilterCount > 0
                ? `Không có hợp đồng nào khớp với ${activeFilterCount} điều kiện đang áp dụng.`
                : "Bấm “Lập hợp đồng mới” để ký hợp đồng cho nhân sự."
            }
            hasFilters={activeFilterCount > 0}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <div className={TABLE_SCROLL}>
            <table className={TABLE} aria-busy={loading}>
              <thead className={THEAD}>
                <tr className={`${THEAD_ROW} text-[11px] font-['Plus_Jakarta_Sans',sans-serif]`}>
                  <SortableHeader className={`${TH} ${STICKY_TH} min-w-[110px]`} label="Mã HĐ" field="ma_hd" sort={sort} onSort={handleSort} />
                  <SortableHeader className={`${TH} min-w-[220px]`} label="Nhân sự" field="ho_ten" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Loại hợp đồng" field="loai_hd" sort={sort} onSort={handleSort} />
                  <SortableHeader className={`${TH} min-w-[190px]`} label="Thời hạn" field="ngay_ket_thuc" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Lương thỏa thuận" field="luong_co_ban" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Trạng thái" field="trang_thai" sort={sort} onSort={handleSort} />
                  <th scope="col" className={`${TH} text-center`}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className={TBODY}>
                {loading ? (
                  <SkeletonRows rows={8} columns={7} />
                ) : (
                  contracts.map((c) => {
                    const typeInfo = contractType(c.loai_hd);
                    const isExpiring =
                      c.con_lai_ngay !== null && c.con_lai_ngay !== undefined && c.con_lai_ngay >= 0 && c.con_lai_ngay <= 30 && c.trang_thai === "HIEU_LUC";
                    const isActive = c.trang_thai === "HIEU_LUC";
                    const isDeleted = c.trang_thai === "DA_HUY";

                    return (
                      <tr key={c.ma_hd} className={TR}>
                        <td className={`${TD} ${STICKY_TD} font-mono font-bold text-slate-800 whitespace-nowrap`}>{c.ma_hd}</td>

                        <td className={TD}>
                          <div className="font-semibold text-slate-900 whitespace-nowrap">{c.ho_ten || "—"}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 whitespace-nowrap">
                            <span className="font-mono bg-slate-100 px-1.5 rounded text-slate-700">{c.ma_nv}</span>
                            <span aria-hidden="true">•</span>
                            <span>{c.ten_pb || "Chưa phân phòng ban"}</span>
                          </div>
                        </td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${typeInfo.badge}`}>
                            {typeInfo.label}
                          </span>
                        </td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <div className="text-slate-700 font-medium">
                            {formatDate(c.ngay_bat_dau) || "—"}
                            {c.ngay_ket_thuc ? ` → ${formatDate(c.ngay_ket_thuc)}` : " (không thời hạn)"}
                          </div>
                          {isExpiring && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200">
                              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                              Còn {c.con_lai_ngay} ngày hết hạn
                            </div>
                          )}
                        </td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <div className="font-bold text-slate-900">{formatVND(c.luong_co_ban)}</div>
                          <div className="text-[11px] text-slate-500">
                            Tỷ lệ hưởng: <span className="font-semibold text-slate-700">{c.ty_le_huong}%</span>
                          </div>
                        </td>

                        <td className={TD}>
                          <StatusBadge status={c.trang_thai} />
                        </td>

                        <td className={`${TD} text-center whitespace-nowrap`}>
                          <div className="flex items-center justify-center gap-1.5">
                            {!isDeleted && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(c)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                                title="Chỉnh sửa điều khoản"
                                aria-label={`Chỉnh sửa hợp đồng ${c.ma_hd}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {isActive && (
                              <button
                                type="button"
                                onClick={() => requestLiquidate(c)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                                title="Thanh lý hợp đồng (bắt buộc trước khi xóa)"
                                aria-label={`Thanh lý hợp đồng ${c.ma_hd}`}
                              >
                                <FileCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                Thanh lý
                              </button>
                            )}

                            {isDeleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestore(c)}
                                disabled={Boolean(restoringId)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer disabled:opacity-40"
                                title="Khôi phục hợp đồng"
                                aria-label={`Khôi phục hợp đồng ${c.ma_hd}`}
                              >
                                {restoringId === c.ma_hd ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                              </button>
                            ) : (
                              // Hợp đồng đang hiệu lực phải thanh lý trước nên không hiển thị nút Xóa
                              !isActive && (
                                <button
                                  type="button"
                                  onClick={() => requestDelete(c)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Xóa hợp đồng (có thể khôi phục)"
                                  aria-label={`Xóa hợp đồng ${c.ma_hd}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PHÂN TRANG ── */}
        <div className="p-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-semibold text-slate-700">{contracts.length}</span> trên tổng số{" "}
            <span className="font-semibold text-slate-700">{totalCount}</span> hợp đồng
            {activeFilterCount > 0 ? " khớp bộ lọc" : ""}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Trang trước"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Trang sau"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────── MODAL: LẬP HỢP ĐỒNG MỚI ────────────────── */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        canClose={!isSubmitting}
        labelledBy="contract-create-title"
        panelClassName="max-w-2xl rounded-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 id="contract-create-title" className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" aria-hidden="true" />
            Lập hợp đồng lao động mới
          </h2>
          <button
            type="button"
            onClick={() => setShowCreateModal(false)}
            disabled={isSubmitting}
            aria-label="Đóng"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4 text-xs" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="contract-create-employee" className="block text-slate-700 font-semibold mb-1">
                Nhân sự ký hợp đồng <span className="text-rose-500">*</span>
              </label>
              <select
                id="contract-create-employee"
                required
                value={formData.ma_nv}
                onChange={(e) => setFormData((prev) => ({ ...prev, ma_nv: e.target.value }))}
                className={inputClass}
              >
                <option value="">-- Chọn nhân sự --</option>
                {employeeOptions.map((emp) => (
                  <option key={emp.ma_nv} value={emp.ma_nv}>
                    {emp.ma_nv} - {emp.ho_ten} ({emp.ten_pb || "Chưa phân phòng ban"})
                  </option>
                ))}
              </select>
              {employeeLoadError && <p className="text-[11px] text-rose-600 mt-1">{employeeLoadError}</p>}
              {selectedEmployee && (
                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedEmployee.ten_cv || "—"} • {selectedEmployee.ten_pb || "Chưa phân phòng ban"}
                </p>
              )}
            </div>

            <ContractTermsFields formData={formData} setFormData={setFormData} mode="create" />
          </div>

          {formError && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              {isSubmitting ? "Đang lập hợp đồng..." : "Lập hợp đồng"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ────────────────── MODAL: CẬP NHẬT ĐIỀU KHOẢN ────────────────── */}
      <Modal
        open={showEditModal && Boolean(selectedContract)}
        onClose={() => setShowEditModal(false)}
        canClose={!isSubmitting}
        labelledBy="contract-edit-title"
        panelClassName="max-w-2xl rounded-2xl"
      >
        {selectedContract && (
          <>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 id="contract-edit-title" className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-sky-600" aria-hidden="true" />
                  Cập nhật hợp đồng {selectedContract.ma_hd}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhân sự: <span className="font-semibold text-slate-700">{selectedContract.ho_ten}</span> ({selectedContract.ma_nv})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                aria-label="Đóng"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4 text-xs" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="contract-edit-status" className="block text-slate-700 font-semibold mb-1">
                    Trạng thái hợp đồng
                  </label>
                  {editStatusLocked ? (
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedContract.trang_thai} />
                      <span className="text-[11px] text-slate-500">Không đổi trạng thái tại đây.</span>
                    </div>
                  ) : (
                    <>
                      <select
                        id="contract-edit-status"
                        value={formData.trang_thai}
                        onChange={(e) => setFormData((prev) => ({ ...prev, trang_thai: e.target.value }))}
                        className={inputClass}
                      >
                        {STATUS_OPTIONS.filter((s) => EDITABLE_STATUSES.includes(s.value)).map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Info size={11} aria-hidden="true" />
                        Muốn chấm dứt hợp đồng, dùng nút “Thanh lý” để ghi nhận ngày kết thúc.
                      </p>
                    </>
                  )}
                </div>

                <ContractTermsFields formData={formData} setFormData={setFormData} mode="edit" />
              </div>

              {formError && (
                <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* ────────────────── XÁC NHẬN THANH LÝ / XÓA ────────────────── */}
      <ConfirmDialog
        open={Boolean(confirm)}
        variant="danger"
        icon={confirm?.type === "liquidate" ? FileCheck : Trash2}
        title={confirm?.type === "liquidate" ? "Thanh lý hợp đồng lao động?" : "Xóa hợp đồng?"}
        message={
          confirm?.type === "liquidate" ? (
            <>
              Hợp đồng <strong>{confirm?.contract?.ma_hd}</strong> của <strong>{confirm?.contract?.ho_ten}</strong> (
              {confirm?.contract?.ma_nv}) sẽ chuyển sang <strong>Đã thanh lý</strong> kể từ ngày kết thúc bên dưới.
            </>
          ) : (
            <>
              Hợp đồng <strong>{confirm?.contract?.ma_hd}</strong> sẽ chuyển sang “Đã xóa”: không còn tính vào thâm niên, lương
              và báo cáo, nhưng bản ghi vẫn được giữ lại và có thể khôi phục.
            </>
          )
        }
        confirmLabel={confirm?.type === "liquidate" ? "Thanh lý hợp đồng" : "Xóa hợp đồng"}
        confirmDisabled={confirm?.type === "liquidate" && !liquidateDate}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      >
        {confirm?.type === "liquidate" && (
          <div>
            <label htmlFor="liquidate-date" className="block text-slate-700 font-semibold mb-1">
              Ngày kết thúc (thanh lý) <span className="text-rose-500">*</span>
            </label>
            <input
              id="liquidate-date"
              type="date"
              required
              min={toInputDate(confirm?.contract?.ngay_bat_dau) || undefined}
              value={liquidateDate}
              onChange={(e) => setLiquidateDate(e.target.value)}
              className={inputClass}
            />
            <p className="text-[10px] text-slate-400 mt-1">Hợp đồng chỉ có thể xóa sau khi đã thanh lý.</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
