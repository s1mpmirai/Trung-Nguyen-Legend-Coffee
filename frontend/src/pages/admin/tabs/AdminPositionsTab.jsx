import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  createSalaryScale,
} from "../../../services/adminService";

export default function AdminPositionsTab() {
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Thêm chức vụ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingCv, setEditingCv] = useState(null);
  const [formData, setFormData] = useState({
    ma_cv: "",
    ten_cv: "",
    cap_bac: 1,
    phu_cap_chuc_vu: 0,
    mo_ta: "",
  });

  // Modal Bậc lương chi tiết
  const [selectedCvForScales, setSelectedCvForScales] = useState(null);
  const [newScale, setNewScale] = useState({
    bac: 1,
    he_so: 1.0,
    muc_luong: 8000000,
    mo_ta: "",
  });
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      const data = await getPositions();
      setPositions(data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách chức vụ:", err);
      showToast("Không thể tải danh sách chức vụ", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingCv(null);
    setFormData({
      ma_cv: `CV0${positions.length + 1}`,
      ten_cv: "",
      cap_bac: 1,
      phu_cap_chuc_vu: 500000,
      mo_ta: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cv) => {
    setModalMode("edit");
    setEditingCv(cv);
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
    if (!formData.ten_cv.trim()) {
      showToast("Vui lòng nhập tên chức vụ", "error");
      return;
    }

    try {
      if (modalMode === "create") {
        await createPosition({
          ma_cv: formData.ma_cv.trim().toUpperCase(),
          ten_cv: formData.ten_cv.trim(),
          cap_bac: Number(formData.cap_bac),
          phu_cap_chuc_vu: Number(formData.phu_cap_chuc_vu),
          mo_ta: formData.mo_ta.trim() || null,
        });
        showToast(`Đã thêm chức vụ ${formData.ten_cv} thành công!`);
      } else {
        await updatePosition(editingCv.ma_cv, {
          ten_cv: formData.ten_cv.trim(),
          cap_bac: Number(formData.cap_bac),
          phu_cap_chuc_vu: Number(formData.phu_cap_chuc_vu),
          mo_ta: formData.mo_ta.trim() || null,
        });
        showToast(`Đã cập nhật chức vụ ${formData.ten_cv}!`);
      }
      setIsModalOpen(false);
      fetchPositions();
    } catch (err) {
      showToast(err.message || "Thao tác chức vụ thất bại", "error");
    }
  };

  const handleDelete = async (cv) => {
    if (cv.so_luong_nv > 0) {
      alert(`Không thể xóa chức vụ "${cv.ten_cv}" vì đang có ${cv.so_luong_nv} nhân sự đảm nhiệm!`);
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa chức vụ "${cv.ten_cv}" (${cv.ma_cv})?`)) {
      return;
    }

    try {
      await deletePosition(cv.ma_cv);
      showToast(`Đã xóa chức vụ ${cv.ten_cv} thành công!`);
      fetchPositions();
    } catch (err) {
      showToast(err.message || "Xóa chức vụ thất bại", "error");
    }
  };

  // Mở modal xem thang bảng lương
  const handleViewScales = (cv) => {
    setSelectedCvForScales(cv);
    const maxBac = (cv.thang_bac_luong || []).reduce((max, s) => Math.max(max, s.bac), 0);
    setNewScale({
      bac: maxBac + 1,
      he_so: 1.2,
      muc_luong: 10000000,
      mo_ta: `${cv.ten_cv} bậc ${maxBac + 1}`,
    });
    setIsScaleModalOpen(true);
  };

  const handleAddScaleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCvForScales) return;

    try {
      await createSalaryScale(selectedCvForScales.ma_cv, {
        bac: Number(newScale.bac),
        he_so: Number(newScale.he_so),
        muc_luong: Number(newScale.muc_luong),
        mo_ta: newScale.mo_ta || null,
      });
      showToast(`Đã thêm bậc ${newScale.bac} cho chức vụ ${selectedCvForScales.ten_cv}!`);
      setIsScaleModalOpen(false);
      fetchPositions();
    } catch (err) {
      showToast(err.message || "Thêm bậc lương thất bại", "error");
    }
  };

  const capBacLabels = {
    1: "Cấp 1 - Nhân viên",
    2: "Cấp 2 - Tổ trưởng / Trưởng nhóm",
    3: "Cấp 3 - Phó / Trưởng phòng",
    4: "Cấp 4 - Phó Giám đốc",
    5: "Cấp 5 - Ban Giám đốc",
  };

  const filtered = positions.filter((cv) => {
    const term = searchTerm.toLowerCase();
    return cv.ma_cv.toLowerCase().includes(term) || cv.ten_cv.toLowerCase().includes(term);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-up ${
            toastType === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toastType === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase">
            CHỨC VỤ & THANG BẢNG LƯƠNG
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình cấp bậc chức danh, mức phụ cấp và hệ số thang bảng lương chuẩn hóa
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0284c7] text-white hover:bg-sky-700 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Thêm chức vụ mới</span>
        </button>
      </div>

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã CV, Tên chức vụ..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Tổng số: <strong>{positions.length}</strong> chức danh hệ thống
        </span>
      </div>

      {/* Bảng danh sách chức vụ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span className="text-xs font-medium">Đang tải danh sách chức vụ...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            Không tìm thấy chức vụ nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Mã CV</th>
                  <th className="py-3 px-4">Tên chức vụ</th>
                  <th className="py-3 px-4">Cấp bậc</th>
                  <th className="py-3 px-4">Phụ cấp chức vụ</th>
                  <th className="py-3 px-4">Số nhân sự</th>
                  <th className="py-3 px-4">Thang bậc lương</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((cv) => (
                  <tr key={cv.ma_cv} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{cv.ma_cv}</td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">{cv.ten_cv}</td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {capBacLabels[cv.cap_bac] || `Cấp bậc ${cv.cap_bac}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-amber-700 font-mono">
                      {(cv.phu_cap_chuc_vu || 0).toLocaleString("vi-VN")} đ
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                        <Users size={13} className="text-slate-400" />
                        {cv.so_luong_nv || 0} người
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleViewScales(cv)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                      >
                        <Layers size={13} />
                        <span>{(cv.thang_bac_luong || []).length} bậc lương →</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                          title="Sửa thông tin chức vụ"
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(cv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa chức vụ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm / Sửa Chức vụ */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 animate-scale-up cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {modalMode === "create" ? "Thêm Chức Vụ Mới" : "Cập Nhật Chức Vụ"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Danh mục chức danh & phụ cấp chuẩn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Mã CV *</label>
                  <input
                    type="text"
                    value={formData.ma_cv}
                    disabled={modalMode === "edit"}
                    onChange={(e) => setFormData({ ...formData, ma_cv: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Tên chức vụ *</label>
                  <input
                    type="text"
                    value={formData.ten_cv}
                    onChange={(e) => setFormData({ ...formData, ten_cv: e.target.value })}
                    placeholder="Ví dụ: Giám sát vận hành"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Cấp bậc (1-5)</label>
                  <select
                    value={formData.cap_bac}
                    onChange={(e) => setFormData({ ...formData, cap_bac: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value={1}>1: Nhân viên</option>
                    <option value={2}>2: Tổ trưởng / Nhóm</option>
                    <option value={3}>3: Phó / Trưởng phòng</option>
                    <option value={4}>4: Phó Giám đốc</option>
                    <option value={5}>5: Ban Giám đốc</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Phụ cấp chức vụ (đ)</label>
                  <input
                    type="number"
                    step={100000}
                    value={formData.phu_cap_chuc_vu}
                    onChange={(e) => setFormData({ ...formData, phu_cap_chuc_vu: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">Mô tả trách nhiệm</label>
                <textarea
                  value={formData.mo_ta}
                  onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                  rows={2}
                  placeholder="Mô tả tiêu chuẩn năng lực & trách nhiệm chính..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0284c7] text-white hover:bg-sky-700 transition-colors shadow-sm cursor-pointer"
                >
                  {modalMode === "create" ? "Tạo chức vụ" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thang Bảng Lương theo Chức Vụ */}
      {isScaleModalOpen && selectedCvForScales && (
        <div
          onClick={() => setIsScaleModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 animate-scale-up cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Thang Bảng Lương: {selectedCvForScales.ten_cv}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mã chức vụ: {selectedCvForScales.ma_cv} | Phụ cấp:{" "}
                    {(selectedCvForScales.phu_cap_chuc_vu || 0).toLocaleString("vi-VN")} đ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScaleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Danh sách các bậc lương hiện tại */}
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
                          <span className="font-bold text-slate-800">
                            {scale.mo_ta || `Bậc ${scale.bac}`}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-2">
                            Hệ số: {Number(scale.he_so).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold font-mono text-emerald-700">
                        {Number(scale.muc_luong).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Form thêm bậc lương mới */}
            <form onSubmit={handleAddScaleSubmit} className="pt-3 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-800">Thêm bậc lương mới cho chức vụ này:</span>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Bậc *</label>
                  <input
                    type="number"
                    min={1}
                    value={newScale.bac}
                    onChange={(e) => setNewScale({ ...newScale, bac: Number(e.target.value) })}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Hệ số *</label>
                  <input
                    type="number"
                    step={0.05}
                    min={0.5}
                    value={newScale.he_so}
                    onChange={(e) => setNewScale({ ...newScale, he_so: Number(e.target.value) })}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Mức lương (đ) *</label>
                  <input
                    type="number"
                    step={500000}
                    value={newScale.muc_luong}
                    onChange={(e) => setNewScale({ ...newScale, muc_luong: Number(e.target.value) })}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600">Mô tả</label>
                <input
                  type="text"
                  value={newScale.mo_ta}
                  onChange={(e) => setNewScale({ ...newScale, mo_ta: e.target.value })}
                  placeholder="Ví dụ: Nhân viên sau 2 năm"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScaleModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs cursor-pointer"
                >
                  + Thêm bậc lương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
