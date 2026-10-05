import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  Phone,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
} from "lucide-react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../../services/adminService";

export default function AdminDepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingPb, setEditingPb] = useState(null);
  const [formData, setFormData] = useState({
    ma_pb: "",
    ten_pb: "",
    ma_truong_pb: "",
    sdt: "",
    mo_ta: "",
  });

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách phòng ban:", err);
      showToast("Không thể tải danh sách phòng ban", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingPb(null);
    setFormData({
      ma_pb: `PB0${departments.length + 1}`,
      ten_pb: "",
      ma_truong_pb: "",
      sdt: "028 3829 ",
      mo_ta: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pb) => {
    setModalMode("edit");
    setEditingPb(pb);
    setFormData({
      ma_pb: pb.ma_pb,
      ten_pb: pb.ten_pb,
      ma_truong_pb: pb.ma_truong_pb || "",
      sdt: pb.sdt || "",
      mo_ta: pb.mo_ta || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ten_pb.trim()) {
      showToast("Vui lòng nhập tên phòng ban", "error");
      return;
    }

    try {
      if (modalMode === "create") {
        await createDepartment({
          ma_pb: formData.ma_pb.trim().toUpperCase(),
          ten_pb: formData.ten_pb.trim(),
          ma_truong_pb: formData.ma_truong_pb.trim().toUpperCase() || null,
          sdt: formData.sdt.trim() || null,
          mo_ta: formData.mo_ta.trim() || null,
        });
        showToast(`Đã thêm phòng ban ${formData.ten_pb} thành công!`);
      } else {
        await updateDepartment(editingPb.ma_pb, {
          ten_pb: formData.ten_pb.trim(),
          ma_truong_pb: formData.ma_truong_pb.trim().toUpperCase() || null,
          sdt: formData.sdt.trim() || null,
          mo_ta: formData.mo_ta.trim() || null,
        });
        showToast(`Đã cập nhật thông tin phòng ban ${formData.ten_pb}!`);
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      showToast(err.message || "Thao tác phòng ban thất bại", "error");
    }
  };

  const handleDelete = async (pb) => {
    if (pb.so_luong_nv > 0) {
      alert(
        `Không thể xóa phòng ban "${pb.ten_pb}" vì vẫn còn ${pb.so_luong_nv} nhân sự trực thuộc! Vui lòng điều chuyển nhân sự trước.`
      );
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng ban "${pb.ten_pb}" (${pb.ma_pb})?`)) {
      return;
    }

    try {
      await deleteDepartment(pb.ma_pb);
      showToast(`Đã xóa phòng ban ${pb.ten_pb} thành công!`);
      fetchDepartments();
    } catch (err) {
      showToast(err.message || "Xóa phòng ban thất bại", "error");
    }
  };

  const filtered = departments.filter((pb) => {
    const term = searchTerm.toLowerCase();
    return (
      pb.ma_pb.toLowerCase().includes(term) ||
      pb.ten_pb.toLowerCase().includes(term) ||
      (pb.ten_truong_pb && pb.ten_truong_pb.toLowerCase().includes(term))
    );
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
            CƠ CẤU TỔ CHỨC PHÒNG BAN
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị danh mục khối phòng ban, bổ nhiệm trưởng phòng và phân bổ nhân sự
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0284c7] text-white hover:bg-sky-700 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Thêm phòng ban mới</span>
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
            placeholder="Tìm theo Mã PB, Tên phòng ban, Trưởng phòng..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Tổng số: <strong>{departments.length}</strong> phòng ban trực thuộc
        </span>
      </div>

      {/* Bảng danh sách phòng ban */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <span className="text-xs font-medium">Đang tải danh sách phòng ban...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            Không tìm thấy phòng ban nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Mã PB</th>
                  <th className="py-3 px-4">Tên phòng ban</th>
                  <th className="py-3 px-4">Trưởng phòng</th>
                  <th className="py-3 px-4">Điện thoại</th>
                  <th className="py-3 px-4">Số lượng NV</th>
                  <th className="py-3 px-4">Mô tả nhiệm vụ</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((pb) => (
                  <tr key={pb.ma_pb} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{pb.ma_pb}</td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">{pb.ten_pb}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {pb.ten_truong_pb ? (
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={14} className="text-emerald-600" />
                          <span className="font-semibold text-slate-800">{pb.ten_truong_pb}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({pb.ma_truong_pb})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa bổ nhiệm</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono">{pb.sdt || "—"}</td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <Users size={12} />
                        {pb.so_luong_nv || 0} nhân sự
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={pb.mo_ta}>
                      {pb.mo_ta || "—"}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(pb)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                          title="Sửa thông tin / Bổ nhiệm trưởng phòng"
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(pb)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa phòng ban"
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

      {/* Modal Thêm / Sửa Phòng ban */}
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
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {modalMode === "create" ? "Thêm Phòng Ban Mới" : "Cập Nhật Phòng Ban"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Thiết lập cấu trúc cơ cấu tổ chức tập đoàn</p>
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
                  <label className="block text-[11px] font-semibold text-slate-700">Mã PB *</label>
                  <input
                    type="text"
                    value={formData.ma_pb}
                    disabled={modalMode === "edit"}
                    onChange={(e) => setFormData({ ...formData, ma_pb: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Tên phòng ban *</label>
                  <input
                    type="text"
                    value={formData.ten_pb}
                    onChange={(e) => setFormData({ ...formData, ten_pb: e.target.value })}
                    placeholder="Ví dụ: Phòng Marketing"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Mã Trưởng phòng (Bổ nhiệm người đứng đầu)
                </label>
                <input
                  type="text"
                  value={formData.ma_truong_pb}
                  onChange={(e) => setFormData({ ...formData, ma_truong_pb: e.target.value })}
                  placeholder="Ví dụ: NV01, NV02, NV06... (để trống nếu chưa có)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  value={formData.sdt}
                  onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
                  placeholder="Ví dụ: 028 3829 1234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">Mô tả chức năng nhiệm vụ</label>
                <textarea
                  value={formData.mo_ta}
                  onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                  rows={2}
                  placeholder="Mô tả chức năng hoạt động chính của phòng ban..."
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
                  {modalMode === "create" ? "Tạo phòng ban" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
