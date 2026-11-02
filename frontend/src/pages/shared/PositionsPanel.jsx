import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingUp,
  Layers,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  createSalaryScale,
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

const CODE_PATTERN = /^[A-Z0-9_-]{2,10}$/;

const EMPTY_FORM = { ma_cv: "", ten_cv: "", cap_bac: 1, phu_cap_chuc_vu: 0, mo_ta: "" };

const CAP_BAC_LABELS = {
  1: "Cấp 1 - Nhân viên",
  2: "Cấp 2 - Tổ trưởng / Trưởng nhóm",
  3: "Cấp 3 - Phó / Trưởng phòng",
  4: "Cấp 4 - Phó Giám đốc",
  5: "Cấp 5 - Ban Giám đốc",
};

const formatMoney = (val) => `${Number(val || 0).toLocaleString("vi-VN")} đ`;

export default function AdminPositionsTab() {
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({ by: "", order: "asc" });

  const handleSort = (field) => setSort((prev) => nextSort(prev, field));
  const handleTriggerSearch = () => setSearchTerm(searchInput.trim());
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim()) setSearchTerm("");
  };
  const handleResetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  // Modal Thêm / Sửa chức vụ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingCv, setEditingCv] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Thang bậc lương
  const [selectedCvForScales, setSelectedCvForScales] = useState(null);
  const [newScale, setNewScale] = useState({ bac: 1, he_so: "", muc_luong: "", mo_ta: "" });
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [scaleError, setScaleError] = useState("");
  const [isSubmittingScale, setIsSubmittingScale] = useState(false);

  const [confirm, setConfirm] = useState(null);
  const [restoringId, setRestoringId] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchPositions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getPositions({
        sort_by: sort.by || undefined,
        sort_order: sort.by ? sort.order : undefined,
      });
      setPositions(data || []);
      return data || [];
    } catch (err) {
      console.error("Lỗi khi tải danh sách chức vụ:", err);
      setPositions([]);
      setLoadError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingCv(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cv) => {
    setModalMode("edit");
    setEditingCv(cv);
    setFormError("");
    setFormData({
      ma_cv: cv.ma_cv,
      ten_cv: cv.ten_cv,
      cap_bac: cv.cap_bac || 1,
      phu_cap_chuc_vu: cv.phu_cap_chuc_vu || 0,
      mo_ta: cv.mo_ta || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const code = formData.ma_cv.trim().toUpperCase();
    if (!formData.ten_cv.trim()) {
      setFormError("Vui lòng nhập tên chức vụ.");
      return;
    }
    if (modalMode === "create" && code && !CODE_PATTERN.test(code)) {
      setFormError("Mã chức vụ gồm 2–10 ký tự chữ in hoa, số, “-” hoặc “_” (ví dụ: CV12). Bỏ trống để hệ thống tự sinh.");
      return;
    }
    if (modalMode === "create" && code && positions.some((cv) => cv.ma_cv.toUpperCase() === code)) {
      setFormError(`Mã chức vụ ${code} đã tồn tại.`);
      return;
    }
    if (Number(formData.phu_cap_chuc_vu) < 0) {
      setFormError("Phụ cấp chức vụ không được âm.");
      return;
    }
    setFormError("");

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const created = await createPosition({
          ma_cv: code || null,
          ten_cv: formData.ten_cv.trim(),
          cap_bac: Number(formData.cap_bac),
          phu_cap_chuc_vu: Number(formData.phu_cap_chuc_vu) || 0,
          mo_ta: formData.mo_ta.trim() || null,
        });
        showToast(`Đã thêm chức vụ ${formData.ten_cv.trim()}${created?.ma_cv ? ` (${created.ma_cv})` : ""}.`);
      } else {
        await updatePosition(editingCv.ma_cv, {
          ten_cv: formData.ten_cv.trim(),
          cap_bac: Number(formData.cap_bac),
          phu_cap_chuc_vu: Number(formData.phu_cap_chuc_vu) || 0,
          mo_ta: formData.mo_ta.trim() || null,
        });
        showToast(`Đã cập nhật chức vụ ${formData.ten_cv.trim()}.`);
      }
      setIsModalOpen(false);
      fetchPositions();
    } catch (err) {
      setFormError(err.message || "Thao tác chức vụ thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (cv) => {
    if (cv.so_luong_nv > 0) {
      showToast(`Không thể xóa chức vụ “${cv.ten_cv}” vì đang có ${cv.so_luong_nv} nhân sự đảm nhiệm.`, "error");
      return;
    }
    setConfirm({
      title: "Xóa chức vụ?",
      message: (
        <>
          Chức vụ <strong>{cv.ten_cv} ({cv.ma_cv})</strong> sẽ chuyển sang “Ngừng sử dụng”. Thang bậc lương vẫn được giữ lại và
          có thể khôi phục.
        </>
      ),
      confirmLabel: "Xóa chức vụ",
      onConfirm: async () => {
        await deletePosition(cv.ma_cv);
        setConfirm(null);
        showToast(`Đã xóa chức vụ ${cv.ten_cv} (chuyển sang Ngừng sử dụng).`);
        fetchPositions();
      },
    });
  };

  const handleRestore = async (cv) => {
    if (restoringId) return;
    setRestoringId(cv.ma_cv);
    try {
      await updatePosition(cv.ma_cv, { trang_thai: 1 });
      showToast(`Đã khôi phục chức vụ ${cv.ten_cv}.`);
      fetchPositions();
    } catch (err) {
      showToast(err.message || "Khôi phục chức vụ thất bại.", "error");
    } finally {
      setRestoringId("");
    }
  };

  const handleViewScales = (cv) => {
    setSelectedCvForScales(cv);
    const maxBac = (cv.thang_bac_luong || []).reduce((max, s) => Math.max(max, s.bac), 0);
    setNewScale({ bac: maxBac + 1, he_so: "", muc_luong: "", mo_ta: "" });
    setScaleError("");
    setIsScaleModalOpen(true);
  };

  const handleAddScaleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCvForScales || isSubmittingScale) return;
    const bac = Number(newScale.bac);
    const heSo = Number(newScale.he_so);
    const mucLuong = Number(newScale.muc_luong);
    if (!bac || bac < 1) return setScaleError("Bậc lương phải từ 1 trở lên.");
    if ((selectedCvForScales.thang_bac_luong || []).some((s) => Number(s.bac) === bac)) {
      return setScaleError(`Bậc ${bac} đã tồn tại cho chức vụ này.`);
    }
    if (!newScale.he_so || heSo <= 0) return setScaleError("Vui lòng nhập hệ số lương lớn hơn 0.");
    if (!newScale.muc_luong || mucLuong <= 0) return setScaleError("Vui lòng nhập mức lương lớn hơn 0.");
    setScaleError("");

    setIsSubmittingScale(true);
    try {
      await createSalaryScale(selectedCvForScales.ma_cv, {
        ma_cv: selectedCvForScales.ma_cv,
        bac,
        he_so: heSo,
        muc_luong: mucLuong,
        mo_ta: newScale.mo_ta.trim() || null,
      });
      showToast(`Đã thêm bậc ${bac} cho chức vụ ${selectedCvForScales.ten_cv}.`);
      const fresh = await fetchPositions();
      const updated = fresh.find((cv) => cv.ma_cv === selectedCvForScales.ma_cv);
      if (updated) {
        setSelectedCvForScales(updated);
        const maxBac = (updated.thang_bac_luong || []).reduce((max, s) => Math.max(max, s.bac), 0);
        setNewScale({ bac: maxBac + 1, he_so: "", muc_luong: "", mo_ta: "" });
      } else {
        setIsScaleModalOpen(false);
      }
    } catch (err) {
      setScaleError(err.message || "Thêm bậc lương thất bại.");
    } finally {
      setIsSubmittingScale(false);
    }
  };

  const term = searchTerm.toLowerCase();
  const filtered = positions.filter((cv) => !term || cv.ma_cv.toLowerCase().includes(term) || cv.ten_cv.toLowerCase().includes(term));

  const fieldClass = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500";
  const scaleFieldClass = "w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div className="flex flex-col gap-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase">
            CHỨC VỤ & THANG BẢNG LƯƠNG
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Cấu hình cấp bậc chức danh, phụ cấp chức vụ và hệ số thang bảng lương</p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0284c7] text-white hover:bg-sky-700 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={15} aria-hidden="true" />
          <span>Thêm chức vụ mới</span>
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-96">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              aria-label="Tìm chức vụ"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTriggerSearch();
                }
              }}
              placeholder="Tìm theo mã, tên chức vụ..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button
            type="button"
            onClick={handleTriggerSearch}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Search size={13} aria-hidden="true" />
            <span>Tìm kiếm</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {searchTerm && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Đặt lại bộ lọc
            </button>
          )}
          <span className="text-xs text-slate-500 font-medium">
            {searchTerm ? (
              <>
                Tìm thấy <strong>{filtered.length}</strong> / {positions.length} chức vụ
              </>
            ) : (
              <>
                Tổng số: <strong>{positions.length}</strong> chức vụ
              </>
            )}
          </span>
          <button
            type="button"
            onClick={fetchPositions}
            aria-label="Làm mới danh sách"
            title="Làm mới danh sách"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin text-sky-600" : ""} />
          </button>
        </div>
      </div>

      {/* Bảng chức vụ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadError && !isLoading ? (
          <ErrorState error={loadError} onRetry={fetchPositions} />
        ) : !isLoading && filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={searchTerm ? "Không tìm thấy chức vụ phù hợp" : "Chưa có chức vụ nào"}
            description={searchTerm ? `Không có chức vụ nào khớp với “${searchTerm}”.` : "Bấm “Thêm chức vụ mới” để tạo chức vụ đầu tiên."}
            hasFilters={Boolean(searchTerm)}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <div className={TABLE_SCROLL}>
            <table className={TABLE} aria-busy={isLoading}>
              <thead className={THEAD}>
                <tr className={THEAD_ROW}>
                  <SortableHeader className={`${TH} ${STICKY_TH} min-w-[90px]`} label="Mã CV" field="ma_cv" sort={sort} onSort={handleSort} />
                  <SortableHeader className={`${TH} min-w-[200px]`} label="Tên chức vụ" field="ten_cv" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Cấp bậc" field="cap_bac" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Phụ cấp chức vụ" field="phu_cap_chuc_vu" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Số nhân sự" field="so_luong_nv" sort={sort} onSort={handleSort} />
                  <th scope="col" className={TH}>Thang bậc lương</th>
                  <th scope="col" className={`${TH} text-center`}>Thao tác</th>
                </tr>
              </thead>
              <tbody className={TBODY}>
                {isLoading ? (
                  <SkeletonRows rows={6} columns={7} />
                ) : (
                  filtered.map((cv) => {
                    const inactive = Number(cv.trang_thai) === 0;
                    return (
                      <tr key={cv.ma_cv} className={TR}>
                        <td className={`${TD} ${STICKY_TD} font-mono font-bold text-slate-900 whitespace-nowrap`}>{cv.ma_cv}</td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <span className="font-bold text-slate-800">{cv.ten_cv}</span>
                          {inactive && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              Ngừng sử dụng
                            </span>
                          )}
                        </td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {CAP_BAC_LABELS[cv.cap_bac] || `Cấp ${cv.cap_bac}`}
                          </span>
                        </td>

                        <td className={`${TD} font-bold text-amber-700 font-mono whitespace-nowrap`}>{formatMoney(cv.phu_cap_chuc_vu)}</td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                            <Users size={13} className="text-slate-400" aria-hidden="true" />
                            {cv.so_luong_nv || 0} người
                          </span>
                        </td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <button
                            type="button"
                            onClick={() => handleViewScales(cv)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                          >
                            <Layers size={13} aria-hidden="true" />
                            <span>{(cv.thang_bac_luong || []).length} bậc lương →</span>
                          </button>
                        </td>

                        <td className={`${TD} text-center whitespace-nowrap`}>
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cv)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                              title="Sửa thông tin chức vụ"
                              aria-label={`Sửa chức vụ ${cv.ten_cv}`}
                            >
                              <Edit size={15} />
                            </button>

                            {inactive ? (
                              <button
                                type="button"
                                onClick={() => handleRestore(cv)}
                                disabled={Boolean(restoringId)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-40"
                                title="Khôi phục chức vụ"
                                aria-label={`Khôi phục chức vụ ${cv.ten_cv}`}
                              >
                                {restoringId === cv.ma_cv ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => requestDelete(cv)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Xóa chức vụ (ngừng sử dụng, có thể khôi phục)"
                                aria-label={`Xóa chức vụ ${cv.ten_cv}`}
                              >
                                <Trash2 size={15} />
                              </button>
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
      </div>

      {/* Modal Thêm / Sửa Chức vụ */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        canClose={!isSubmitting}
        labelledBy="position-form-title"
        panelClassName="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                <Briefcase size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 id="position-form-title" className="font-bold text-sm text-slate-900">
                  {modalMode === "create" ? "Thêm chức vụ mới" : "Cập nhật chức vụ"}
                </h3>
                <p className="text-[11px] text-slate-400">Danh mục chức danh & phụ cấp</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              aria-label="Đóng"
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer disabled:opacity-40"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs" noValidate>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1">
                <label htmlFor="cv-code" className="block text-[11px] font-semibold text-slate-700">
                  Mã CV
                </label>
                <input
                  id="cv-code"
                  type="text"
                  value={formData.ma_cv}
                  disabled={modalMode === "edit"}
                  maxLength={10}
                  onChange={(e) => setFormData({ ...formData, ma_cv: e.target.value.toUpperCase() })}
                  placeholder="Tự sinh"
                  className={`${fieldClass} font-mono font-bold uppercase disabled:opacity-60`}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label htmlFor="cv-name" className="block text-[11px] font-semibold text-slate-700">
                  Tên chức vụ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cv-name"
                  type="text"
                  value={formData.ten_cv}
                  onChange={(e) => setFormData({ ...formData, ten_cv: e.target.value })}
                  placeholder="Ví dụ: Giám sát vận hành"
                  required
                  className={`${fieldClass} font-medium`}
                />
              </div>
            </div>
            {modalMode === "create" && <p className="text-[10px] text-slate-400 -mt-1.5">Bỏ trống mã để hệ thống tự sinh mã kế tiếp.</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="cv-level" className="block text-[11px] font-semibold text-slate-700">
                  Cấp bậc (1-5)
                </label>
                <select
                  id="cv-level"
                  value={formData.cap_bac}
                  onChange={(e) => setFormData({ ...formData, cap_bac: Number(e.target.value) })}
                  className={`${fieldClass} font-semibold cursor-pointer`}
                >
                  {Object.entries(CAP_BAC_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="cv-allowance" className="block text-[11px] font-semibold text-slate-700">
                  Phụ cấp chức vụ (đ)
                </label>
                <input
                  id="cv-allowance"
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.phu_cap_chuc_vu}
                  onChange={(e) => setFormData({ ...formData, phu_cap_chuc_vu: e.target.value })}
                  className={`${fieldClass} font-mono font-bold`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="cv-desc" className="block text-[11px] font-semibold text-slate-700">
                Mô tả trách nhiệm
              </label>
              <textarea
                id="cv-desc"
                value={formData.mo_ta}
                onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                rows={2}
                placeholder="Mô tả tiêu chuẩn năng lực & trách nhiệm chính..."
                className={fieldClass}
              ></textarea>
            </div>

            {formError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0284c7] text-white hover:bg-sky-700 transition-colors shadow-sm cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
                {isSubmitting ? "Đang lưu..." : modalMode === "create" ? "Tạo chức vụ" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal Thang bảng lương theo chức vụ */}
      <Modal
        open={isScaleModalOpen && Boolean(selectedCvForScales)}
        onClose={() => setIsScaleModalOpen(false)}
        canClose={!isSubmittingScale}
        labelledBy="scale-title"
        panelClassName="max-w-lg"
      >
        {selectedCvForScales && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <TrendingUp size={18} aria-hidden="true" />
                </div>
                <div>
                  <h3 id="scale-title" className="font-bold text-sm text-slate-900">
                    Thang bảng lương: {selectedCvForScales.ten_cv}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mã chức vụ: {selectedCvForScales.ma_cv} | Phụ cấp: {formatMoney(selectedCvForScales.phu_cap_chuc_vu)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScaleModalOpen(false)}
                disabled={isSubmittingScale}
                aria-label="Đóng"
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Các bậc lương hiện có:</span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {(selectedCvForScales.thang_bac_luong || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có bậc lương nào được thiết lập.</p>
                ) : (
                  (selectedCvForScales.thang_bac_luong || []).map((scale) => (
                    <div
                      key={scale.ma_bac || scale.bac}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                          {scale.bac}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800">{scale.mo_ta || `Bậc ${scale.bac}`}</span>
                          <span className="text-[11px] text-slate-400 ml-2">Hệ số: {Number(scale.he_so).toFixed(2)}</span>
                        </div>
                      </div>
                      <span className="font-bold font-mono text-emerald-700">{formatMoney(scale.muc_luong)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={handleAddScaleSubmit} className="pt-3 border-t border-slate-100 space-y-3 text-xs" noValidate>
              <span className="text-xs font-bold text-slate-800">Thêm bậc lương mới:</span>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label htmlFor="scale-level" className="block text-[11px] font-semibold text-slate-600">
                    Bậc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="scale-level"
                    type="number"
                    min={1}
                    value={newScale.bac}
                    onChange={(e) => setNewScale({ ...newScale, bac: e.target.value })}
                    required
                    className={scaleFieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="scale-coef" className="block text-[11px] font-semibold text-slate-600">
                    Hệ số <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="scale-coef"
                    type="number"
                    step={0.01}
                    min={0.01}
                    placeholder="VD: 2.34"
                    value={newScale.he_so}
                    onChange={(e) => setNewScale({ ...newScale, he_so: e.target.value })}
                    required
                    className={scaleFieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="scale-salary" className="block text-[11px] font-semibold text-slate-600">
                    Mức lương (đ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="scale-salary"
                    type="number"
                    min={1}
                    step={1000}
                    value={newScale.muc_luong}
                    onChange={(e) => setNewScale({ ...newScale, muc_luong: e.target.value })}
                    required
                    className={`${scaleFieldClass} text-emerald-700`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="scale-desc" className="block text-[11px] font-semibold text-slate-600">
                  Mô tả
                </label>
                <input
                  id="scale-desc"
                  type="text"
                  value={newScale.mo_ta}
                  onChange={(e) => setNewScale({ ...newScale, mo_ta: e.target.value })}
                  placeholder={`${selectedCvForScales.ten_cv} bậc ${newScale.bac || ""}`}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {scaleError && (
                <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{scaleError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScaleModalOpen(false)}
                  disabled={isSubmittingScale}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingScale}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingScale ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
                  {isSubmittingScale ? "Đang thêm..." : "Thêm bậc lương"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant="danger"
        icon={Trash2}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
