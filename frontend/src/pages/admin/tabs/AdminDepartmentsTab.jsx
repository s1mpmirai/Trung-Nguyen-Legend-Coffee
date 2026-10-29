import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
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

// Mã phòng ban do người dùng nhập (bỏ trống để hệ thống tự sinh mã kế tiếp)
const CODE_PATTERN = /^[A-Z0-9_-]{2,10}$/;

const EMPTY_FORM = { ma_pb: "", ten_pb: "", ma_truong_pb: "", sdt: "", mo_ta: "", trang_thai: 1 };

export default function AdminDepartmentsTab() {
  const [departments, setDepartments] = useState([]);
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

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingPb, setEditingPb] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [restoringId, setRestoringId] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getDepartments({
        sort_by: sort.by || undefined,
        sort_order: sort.by ? sort.order : undefined,
      });
      setDepartments(data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách phòng ban:", err);
      setDepartments([]);
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingPb(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pb) => {
    setModalMode("edit");
    setEditingPb(pb);
    setFormError("");
    setFormData({
      ma_pb: pb.ma_pb,
      ten_pb: pb.ten_pb,
      ma_truong_pb: pb.ma_truong_pb || "",
      sdt: pb.sdt || "",
      mo_ta: pb.mo_ta || "",
      trang_thai: pb.trang_thai ?? 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const code = formData.ma_pb.trim().toUpperCase();
    if (!formData.ten_pb.trim()) {
      setFormError("Vui lòng nhập tên phòng ban.");
      return;
    }
    if (modalMode === "create" && code && !CODE_PATTERN.test(code)) {
      setFormError("Mã phòng ban gồm 2–10 ký tự chữ in hoa, số, “-” hoặc “_” (ví dụ: PB12). Bỏ trống để hệ thống tự sinh.");
      return;
    }
    if (modalMode === "create" && code && departments.some((pb) => pb.ma_pb.toUpperCase() === code)) {
      setFormError(`Mã phòng ban ${code} đã tồn tại.`);
      return;
    }
    setFormError("");

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const created = await createDepartment({
          ma_pb: code || null,
          ten_pb: formData.ten_pb.trim(),
          ma_truong_pb: formData.ma_truong_pb.trim().toUpperCase() || null,
          sdt: formData.sdt.trim() || null,
          mo_ta: formData.mo_ta.trim() || null,
        });
        showToast(`Đã thêm phòng ban ${formData.ten_pb.trim()}${created?.ma_pb ? ` (${created.ma_pb})` : ""}.`);
      } else {
        await updateDepartment(editingPb.ma_pb, {
          ten_pb: formData.ten_pb.trim(),
          ma_truong_pb: formData.ma_truong_pb.trim().toUpperCase() || null,
          sdt: formData.sdt.trim() || null,
          mo_ta: formData.mo_ta.trim() || null,
          trang_thai: Number(formData.trang_thai),
        });
        showToast(`Đã cập nhật phòng ban ${formData.ten_pb.trim()}.`);
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setFormError(err.message || "Thao tác phòng ban thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (pb) => {
    if (pb.so_luong_nv > 0) {
      showToast(
        `Không thể xóa phòng ban “${pb.ten_pb}” vì còn ${pb.so_luong_nv} nhân sự trực thuộc. Hãy điều chuyển nhân sự trước.`,
        "error"
      );
      return;
    }
    setConfirm({
      title: "Xóa phòng ban?",
      message: (
        <>
          Phòng ban <strong>{pb.ten_pb} ({pb.ma_pb})</strong> sẽ chuyển sang “Ngừng hoạt động”. Dữ liệu vẫn được giữ lại và có
          thể khôi phục.
        </>
      ),
      confirmLabel: "Xóa phòng ban",
      onConfirm: async () => {
        await deleteDepartment(pb.ma_pb);
        setConfirm(null);
        showToast(`Đã xóa phòng ban ${pb.ten_pb} (chuyển sang Ngừng hoạt động).`);
        fetchDepartments();
      },
    });
  };

  const handleRestore = async (pb) => {
    if (restoringId) return;
    setRestoringId(pb.ma_pb);
    try {
      await updateDepartment(pb.ma_pb, { trang_thai: 1 });
      showToast(`Đã khôi phục phòng ban ${pb.ten_pb}.`);
      fetchDepartments();
    } catch (err) {
      showToast(err.message || "Khôi phục phòng ban thất bại.", "error");
    } finally {
      setRestoringId("");
    }
  };

  const term = searchTerm.toLowerCase();
  const filtered = departments.filter(
    (pb) =>
      !term ||
      pb.ma_pb.toLowerCase().includes(term) ||
      pb.ten_pb.toLowerCase().includes(term) ||
      (pb.ten_truong_pb && pb.ten_truong_pb.toLowerCase().includes(term))
  );

  const fieldClass = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500";

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
            CƠ CẤU TỔ CHỨC PHÒNG BAN
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý danh mục phòng ban, bổ nhiệm trưởng phòng và theo dõi số lượng nhân sự</p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0284c7] text-white hover:bg-sky-700 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={15} aria-hidden="true" />
          <span>Thêm phòng ban mới</span>
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-96">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              aria-label="Tìm phòng ban"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTriggerSearch();
                }
              }}
              placeholder="Tìm theo mã, tên phòng ban, trưởng phòng..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button
            type="button"
            onClick={handleTriggerSearch}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
            title="Tìm kiếm (Enter)"
          >
            <Search size={13} aria-hidden="true" />
            <span>Tìm</span>
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
                Tìm thấy <strong>{filtered.length}</strong> / {departments.length} phòng ban
              </>
            ) : (
              <>
                Tổng số: <strong>{departments.length}</strong> phòng ban
              </>
            )}
          </span>
          <button
            type="button"
            onClick={fetchDepartments}
            aria-label="Làm mới danh sách"
            title="Làm mới danh sách"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin text-sky-600" : ""} />
          </button>
        </div>
      </div>

      {/* Bảng phòng ban */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadError && !isLoading ? (
          <ErrorState error={loadError} onRetry={fetchDepartments} />
        ) : !isLoading && filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={searchTerm ? "Không tìm thấy phòng ban phù hợp" : "Chưa có phòng ban nào"}
            description={searchTerm ? `Không có phòng ban nào khớp với “${searchTerm}”.` : "Bấm “Thêm phòng ban mới” để tạo phòng ban đầu tiên."}
            hasFilters={Boolean(searchTerm)}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <div className={TABLE_SCROLL}>
            <table className={TABLE} aria-busy={isLoading}>
              <thead className={THEAD}>
                <tr className={THEAD_ROW}>
                  <SortableHeader className={`${TH} ${STICKY_TH} min-w-[90px]`} label="Mã PB" field="ma_pb" sort={sort} onSort={handleSort} />
                  <SortableHeader className={`${TH} min-w-[200px]`} label="Tên phòng ban" field="ten_pb" sort={sort} onSort={handleSort} />
                  <SortableHeader className={TH} label="Trưởng phòng" field="ten_truong_pb" sort={sort} onSort={handleSort} />
                  <th scope="col" className={TH}>Điện thoại</th>
                  <SortableHeader className={TH} label="Số lượng NV" field="so_luong_nv" sort={sort} onSort={handleSort} />
                  <th scope="col" className={TH}>Mô tả nhiệm vụ</th>
                  <th scope="col" className={`${TH} text-center`}>Thao tác</th>
                </tr>
              </thead>
              <tbody className={TBODY}>
                {isLoading ? (
                  <SkeletonRows rows={6} columns={7} />
                ) : (
                  filtered.map((pb) => {
                    const inactive = Number(pb.trang_thai) === 0;
                    return (
                      <tr key={pb.ma_pb} className={TR}>
                        <td className={`${TD} ${STICKY_TD} font-mono font-bold text-slate-900 whitespace-nowrap`}>{pb.ma_pb}</td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <span className="font-bold text-slate-800">{pb.ten_pb}</span>
                          {inactive && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              Ngừng hoạt động
                            </span>
                          )}
                        </td>

                        <td className={`${TD} whitespace-nowrap`}>
                          {pb.ten_truong_pb ? (
                            <div className="flex items-center gap-1.5">
                              <UserCheck size={14} className="text-emerald-600" aria-hidden="true" />
                              <span className="font-semibold text-slate-800">{pb.ten_truong_pb}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({pb.ma_truong_pb})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa bổ nhiệm</span>
                          )}
                        </td>

                        <td className={`${TD} text-slate-600 font-mono whitespace-nowrap`}>{pb.sdt || "—"}</td>

                        <td className={`${TD} whitespace-nowrap`}>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <Users size={12} aria-hidden="true" />
                            {pb.so_luong_nv || 0} nhân sự
                          </span>
                        </td>

                        <td className={`${TD} text-slate-500 max-w-xs truncate`} title={pb.mo_ta || undefined}>
                          {pb.mo_ta || "—"}
                        </td>

                        <td className={`${TD} text-center whitespace-nowrap`}>
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(pb)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                              title="Sửa thông tin / Bổ nhiệm trưởng phòng"
                              aria-label={`Sửa phòng ban ${pb.ten_pb}`}
                            >
                              <Edit size={15} />
                            </button>

                            {inactive ? (
                              <button
                                type="button"
                                onClick={() => handleRestore(pb)}
                                disabled={Boolean(restoringId)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-40"
                                title="Khôi phục phòng ban"
                                aria-label={`Khôi phục phòng ban ${pb.ten_pb}`}
                              >
                                {restoringId === pb.ma_pb ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => requestDelete(pb)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Xóa phòng ban (ngừng hoạt động, có thể khôi phục)"
                                aria-label={`Xóa phòng ban ${pb.ten_pb}`}
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

      {/* Modal Thêm / Sửa Phòng ban */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        canClose={!isSubmitting}
        labelledBy="department-form-title"
        panelClassName="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                <Building2 size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 id="department-form-title" className="font-bold text-sm text-slate-900">
                  {modalMode === "create" ? "Thêm phòng ban mới" : "Cập nhật phòng ban"}
                </h3>
                <p className="text-[11px] text-slate-400">Cơ cấu tổ chức doanh nghiệp</p>
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
                <label htmlFor="pb-code" className="block text-[11px] font-semibold text-slate-700">
                  Mã PB
                </label>
                <input
                  id="pb-code"
                  type="text"
                  value={formData.ma_pb}
                  disabled={modalMode === "edit"}
                  maxLength={10}
                  onChange={(e) => setFormData({ ...formData, ma_pb: e.target.value.toUpperCase() })}
                  placeholder="Tự sinh"
                  aria-describedby="pb-code-hint"
                  className={`${fieldClass} font-mono font-bold uppercase disabled:opacity-60`}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label htmlFor="pb-name" className="block text-[11px] font-semibold text-slate-700">
                  Tên phòng ban <span className="text-rose-500">*</span>
                </label>
                <input
                  id="pb-name"
                  type="text"
                  value={formData.ten_pb}
                  onChange={(e) => setFormData({ ...formData, ten_pb: e.target.value })}
                  placeholder="Ví dụ: Phòng Marketing"
                  required
                  className={`${fieldClass} font-medium`}
                />
              </div>
            </div>
            {modalMode === "create" && (
              <p id="pb-code-hint" className="text-[10px] text-slate-400 -mt-1.5">
                Bỏ trống mã để hệ thống tự sinh mã kế tiếp.
              </p>
            )}

            <div className="space-y-1">
              <label htmlFor="pb-head" className="block text-[11px] font-semibold text-slate-700">
                Mã nhân viên trưởng phòng
              </label>
              <input
                id="pb-head"
                type="text"
                value={formData.ma_truong_pb}
                onChange={(e) => setFormData({ ...formData, ma_truong_pb: e.target.value })}
                placeholder="Để trống nếu chưa bổ nhiệm"
                className={`${fieldClass} font-mono uppercase`}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="pb-phone" className="block text-[11px] font-semibold text-slate-700">
                Số điện thoại liên hệ
              </label>
              <input
                id="pb-phone"
                type="tel"
                value={formData.sdt}
                onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
                placeholder="Số điện thoại của phòng ban"
                className={fieldClass}
              />
            </div>

            {modalMode === "edit" && (
              <div className="space-y-1">
                <label htmlFor="pb-status" className="block text-[11px] font-semibold text-slate-700">
                  Trạng thái hoạt động
                </label>
                <select
                  id="pb-status"
                  value={formData.trang_thai}
                  onChange={(e) => setFormData({ ...formData, trang_thai: Number(e.target.value) })}
                  className={`${fieldClass} cursor-pointer`}
                >
                  <option value={1}>Đang hoạt động</option>
                  <option value={0}>Ngừng hoạt động (giữ lại hồ sơ cũ)</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="pb-desc" className="block text-[11px] font-semibold text-slate-700">
                Mô tả chức năng nhiệm vụ
              </label>
              <textarea
                id="pb-desc"
                value={formData.mo_ta}
                onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                rows={2}
                placeholder="Mô tả chức năng hoạt động chính của phòng ban..."
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
                {isSubmitting ? "Đang lưu..." : modalMode === "create" ? "Tạo phòng ban" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
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
