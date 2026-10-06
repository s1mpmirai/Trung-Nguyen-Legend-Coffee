import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building,
  User,
  CreditCard,
  RefreshCw,
  X,
  AlertCircle
} from "lucide-react";
import {
  getContracts,
  getContractDetail,
  createContract,
  updateContract,
  liquidateContract,
  deleteContract,
  getEmployeesList,
} from "../../../services/adminService";

export default function AdminContractsTab() {
  const [contracts, setContracts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ so_hieu_luc: 0, so_sap_het_han_30_ngay: 0, so_da_thanh_ly: 0 });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters & Pagination
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loaiHdFilter, setLoaiHdFilter] = useState("");
  const [trangThaiFilter, setTrangThaiFilter] = useState("");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLiquidateModal, setShowLiquidateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Employees list for selection in Create modal
  const [employeeOptions, setEmployeeOptions] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    ma_hd: "",
    ma_nv: "",
    loai_hd: "XAC_DINH_1_NAM",
    ngay_ky: new Date().toISOString().split("T")[0],
    ngay_bat_dau: new Date().toISOString().split("T")[0],
    ngay_ket_thuc: "",
    luong_co_ban: 10000000,
    ty_le_huong: 100,
    so_tai_khoan: "",
    ngan_hang: "Techcombank",
    ma_so_thue: "",
    so_bhxh: "",
    trang_thai: "HIEU_LUC",
  });

  const [liquidateData, setLiquidateData] = useState({
    ngay_ket_thuc: new Date().toISOString().split("T")[0],
  });

  // Load contracts
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = {
        page,
        page_size: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (loaiHdFilter) params.loai_hd = loaiHdFilter;
      if (trangThaiFilter) params.trang_thai = trangThaiFilter;
      if (expiringOnly) params.expiring_days = 30;

      const res = await getContracts(params);
      const data = res.data || res;
      setContracts(data.items || []);
      setTotalCount(data.total || 0);
      setStats({
        so_hieu_luc: data.so_hieu_luc || 0,
        so_sap_het_han_30_ngay: data.so_sap_het_han_30_ngay || 0,
        so_da_thanh_ly: data.so_da_thanh_ly || 0,
      });
    } catch (err) {
      console.error("Lỗi tải danh sách hợp đồng:", err);
      setErrorMessage("Không thể tải danh sách hợp đồng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }, [page, search, loaiHdFilter, trangThaiFilter, expiringOnly]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Load employee list for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getEmployeesList({ page: 1, page_size: 100 });
        const list = res.data?.items || res.items || [];
        setEmployeeOptions(list);
      } catch (err) {
        console.error("Lỗi tải danh sách nhân sự:", err);
      }
    };
    fetchEmployees();
  }, []);

  const showToastSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      ma_hd: "",
      ma_nv: employeeOptions[0]?.ma_nv || "",
      loai_hd: "XAC_DINH_1_NAM",
      ngay_ky: new Date().toISOString().split("T")[0],
      ngay_bat_dau: new Date().toISOString().split("T")[0],
      ngay_ket_thuc: "",
      luong_co_ban: 10000000,
      ty_le_huong: 100,
      so_tai_khoan: "",
      ngan_hang: "Techcombank",
      ma_so_thue: "",
      so_bhxh: "",
      trang_thai: "HIEU_LUC",
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (c) => {
    setSelectedContract(c);
    setFormData({
      loai_hd: c.loai_hd || "XAC_DINH_1_NAM",
      ngay_ky: c.ngay_ky ? c.ngay_ky.split("T")[0] : "",
      ngay_bat_dau: c.ngay_bat_dau ? c.ngay_bat_dau.split("T")[0] : "",
      ngay_ket_thuc: c.ngay_ket_thuc ? c.ngay_ket_thuc.split("T")[0] : "",
      luong_co_ban: c.luong_co_ban || 0,
      ty_le_huong: c.ty_le_huong || 100,
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
    try {
      await createContract(formData);
      showToastSuccess("Đã lập và ký hợp đồng mới thành công!");
      setShowCreateModal(false);
      fetchContracts();
    } catch (err) {
      alert("Lỗi khi tạo hợp đồng: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateContract(selectedContract.ma_hd, formData);
      showToastSuccess(`Đã cập nhật hợp đồng ${selectedContract.ma_hd} thành công!`);
      setShowEditModal(false);
      fetchContracts();
    } catch (err) {
      alert("Lỗi khi cập nhật hợp đồng: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleLiquidateSubmit = async (e) => {
    e.preventDefault();
    try {
      await liquidateContract(selectedContract.ma_hd, liquidateData);
      showToastSuccess(`Đã thanh lý hợp đồng ${selectedContract.ma_hd} thành công!`);
      setShowLiquidateModal(false);
      fetchContracts();
    } catch (err) {
      alert("Lỗi khi thanh lý hợp đồng: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      await deleteContract(selectedContract.ma_hd);
      showToastSuccess(`Đã xóa hợp đồng ${selectedContract.ma_hd} thành công!`);
      setShowDeleteModal(false);
      fetchContracts();
    } catch (err) {
      alert("Lỗi khi xóa hợp đồng: " + (err.response?.data?.detail || err.message));
    }
  };

  const formatVND = (val) => {
    if (!val && val !== 0) return "0 đ";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const getContractTypeLabel = (type) => {
    switch (type) {
      case "THU_VIEC":
        return { label: "Thử việc", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "XAC_DINH_1_NAM":
        return { label: "Xác định 1 năm", bg: "bg-sky-50 text-sky-700 border-sky-200" };
      case "XAC_DINH_3_NAM":
        return { label: "Xác định 3 năm", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "KHONG_XAC_DINH":
        return { label: "Không thời hạn", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "THOI_VU":
        return { label: "Thời vụ", bg: "bg-slate-50 text-slate-700 border-slate-200" };
      default:
        return { label: type || "Khác", bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "HIEU_LUC":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hiệu lực
          </span>
        );
      case "HET_HAN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Hết hạn
          </span>
        );
      case "DA_THANH_LY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <FileCheck className="w-3.5 h-3.5 text-slate-500" />
            Đã thanh lý
          </span>
        );
      case "TAM_HOAN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Tạm hoãn
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="flex flex-col gap-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase flex items-center gap-3">
            <FileText className="w-7 h-7 text-sky-600" />
            QUẢN LÝ HỢP ĐỒNG LAO ĐỘNG
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi hiệu lực, kỳ hạn, mức lương và chế độ đãi ngộ toàn thể nhân sự
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchContracts}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 text-xs shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`} />
            Làm mới
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Lập Hợp đồng mới
          </button>
        </div>
      </div>

      {/* ── SUCCESS TOAST ── */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── ERROR MESSAGE ── */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── TOP STAT METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
              {totalCount}
            </div>
            <div className="text-xs text-slate-500 font-medium">Tổng số hợp đồng</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-emerald-600">
              {stats.so_hieu_luc}
            </div>
            <div className="text-xs text-slate-500 font-medium">Đang có hiệu lực</div>
          </div>
        </div>

        <div
          onClick={() => {
            setExpiringOnly(!expiringOnly);
            setPage(1);
          }}
          className={`p-5 rounded-2xl border shadow-xs flex items-center gap-4 cursor-pointer transition ${
            expiringOnly
              ? "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400"
              : "bg-white border-slate-200/80 hover:border-amber-400"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              expiringOnly ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div
              className={`text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] ${
                expiringOnly ? "text-white" : "text-amber-600"
              }`}
            >
              {stats.so_sap_het_han_30_ngay}
            </div>
            <div className={`text-xs font-medium ${expiringOnly ? "text-amber-100" : "text-slate-500"}`}>
              Sắp hết hạn (≤ 30 ngày)
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-slate-700">
              {stats.so_da_thanh_ly}
            </div>
            <div className="text-xs text-slate-500 font-medium">Đã thanh lý</div>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo Mã HĐ, Mã NV, Họ tên..."
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
              <Search size={13} />
              <span>Tìm kiếm</span>
            </button>
          </div>

          {/* Loai HD */}
          <div className="min-w-[170px]">
            <select
              value={loaiHdFilter}
              onChange={(e) => {
                setLoaiHdFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              <option value="">Tất cả loại hợp đồng</option>
              <option value="THU_VIEC">HĐ Thử việc</option>
              <option value="XAC_DINH_1_NAM">HĐ Xác định 1 năm</option>
              <option value="XAC_DINH_3_NAM">HĐ Xác định 3 năm</option>
              <option value="KHONG_XAC_DINH">HĐ Không xác định</option>
              <option value="THOI_VU">HĐ Thời vụ</option>
            </select>
          </div>

          {/* Trang thai */}
          <div className="min-w-[150px]">
            <select
              value={trangThaiFilter}
              onChange={(e) => {
                setTrangThaiFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="HIEU_LUC">Hiệu lực</option>
              <option value="HET_HAN">Hết hạn</option>
              <option value="DA_THANH_LY">Đã thanh lý</option>
              <option value="TAM_HOAN">Tạm hoãn</option>
            </select>
          </div>
        </div>

        {/* Expiring Toggle Button */}
        <button
          onClick={() => {
            setExpiringOnly(!expiringOnly);
            setPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
            expiringOnly
              ? "bg-amber-500 text-white border-amber-600"
              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Sắp hết hạn 30 ngày</span>
        </button>
      </div>

      {/* ── TABLE OF CONTRACTS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
                <th className="py-3.5 px-4">Mã HĐ</th>
                <th className="py-3.5 px-4">Nhân sự thụ hưởng</th>
                <th className="py-3.5 px-4">Loại hợp đồng</th>
                <th className="py-3.5 px-4">Thời hạn HĐ</th>
                <th className="py-3.5 px-4">Lương thỏa thuận</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    Đang tải danh sách hợp đồng lao động...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Không tìm thấy hợp đồng lao động nào phù hợp
                  </td>
                </tr>
              ) : (
                contracts.map((c) => {
                  const typeBadge = getContractTypeLabel(c.loai_hd);
                  const isExpiring = c.con_lai_ngay !== null && c.con_lai_ngay >= 0 && c.con_lai_ngay <= 30 && c.trang_thai === "HIEU_LUC";

                  return (
                    <tr key={c.ma_hd} className="hover:bg-slate-50/80 transition-colors">
                      {/* Mã HĐ */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {c.ma_hd}
                      </td>

                      {/* Nhân sự thụ hưởng */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{c.ho_ten || "Chưa rõ họ tên"}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
                            {c.ma_nv}
                          </span>
                          <span>•</span>
                          <span>{c.ten_pb || "Chưa phân phòng"}</span>
                        </div>
                      </td>

                      {/* Loại HĐ */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${typeBadge.bg}`}>
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Thời hạn HĐ */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">
                          {c.ngay_bat_dau}
                          {c.ngay_ket_thuc ? ` → ${c.ngay_ket_thuc}` : " (Vô thời hạn)"}
                        </div>
                        {isExpiring && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Còn {c.con_lai_ngay} ngày hết hạn
                          </div>
                        )}
                      </td>

                      {/* Lương thỏa thuận */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{formatVND(c.luong_co_ban)}</div>
                        <div className="text-[11px] text-slate-500">
                          Tỷ lệ hưởng: <span className="font-semibold text-slate-700">{c.ty_le_huong}%</span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(c.trang_thai)}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Sửa */}
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            title="Chỉnh sửa điều khoản"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Thanh lý */}
                          {c.trang_thai === "HIEU_LUC" && (
                            <button
                              onClick={() => {
                                setSelectedContract(c);
                                setLiquidateData({ ngay_ket_thuc: new Date().toISOString().split("T")[0] });
                                setShowLiquidateModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Thanh lý hợp đồng"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Xóa */}
                          <button
                            onClick={() => {
                              setSelectedContract(c);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa hợp đồng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION BAR ── */}
        <div className="p-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-semibold text-slate-700">{contracts.length}</span> trên tổng số{" "}
            <span className="font-semibold text-slate-700">{totalCount}</span> hợp đồng
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────── MODAL: LẬP HỢP ĐỒNG MỚI ────────────────── */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                LẬP & KÝ MỚI HỢP ĐỒNG LAO ĐỘNG
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chọn nhân viên */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nhân sự ký hợp đồng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.ma_nv}
                    onChange={(e) => setFormData({ ...formData, ma_nv: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="">-- Chọn nhân sự --</option>
                    {employeeOptions.map((emp) => (
                      <option key={emp.ma_nv} value={emp.ma_nv}>
                        {emp.ma_nv} - {emp.ho_ten} ({emp.ten_pb || "Chưa PB"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Loại HĐ */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Loại hợp đồng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.loai_hd}
                    onChange={(e) => setFormData({ ...formData, loai_hd: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="THU_VIEC">Hợp đồng thử việc</option>
                    <option value="XAC_DINH_1_NAM">Hợp đồng xác định thời hạn 1 năm</option>
                    <option value="XAC_DINH_3_NAM">Hợp đồng xác định thời hạn 3 năm</option>
                    <option value="KHONG_XAC_DINH">Hợp đồng không xác định thời hạn</option>
                    <option value="THOI_VU">Hợp đồng thời vụ / khoán việc</option>
                  </select>
                </div>

                {/* Ngày ký */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ngày ký hợp đồng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.ngay_ky}
                    onChange={(e) => setFormData({ ...formData, ngay_ky: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Ngày bắt đầu */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ngày bắt đầu hiệu lực <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.ngay_bat_dau}
                    onChange={(e) => setFormData({ ...formData, ngay_bat_dau: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Ngày kết thúc */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ngày kết thúc (Bỏ trống nếu không xác định)
                  </label>
                  <input
                    type="date"
                    value={formData.ngay_ket_thuc}
                    onChange={(e) => setFormData({ ...formData, ngay_ket_thuc: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Lương cơ bản */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mức lương cơ bản thỏa thuận (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000000"
                    step="500000"
                    required
                    value={formData.luong_co_ban}
                    onChange={(e) => setFormData({ ...formData, luong_co_ban: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Tỷ lệ hưởng lương */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tỷ lệ hưởng lương (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    required
                    value={formData.ty_le_huong}
                    onChange={(e) => setFormData({ ...formData, ty_le_huong: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Số tài khoản ngân hàng */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Số tài khoản ngân hàng
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 19036789123456"
                    value={formData.so_tai_khoan}
                    onChange={(e) => setFormData({ ...formData, so_tai_khoan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Ngân hàng */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tên ngân hàng
                  </label>
                  <input
                    type="text"
                    placeholder="Techcombank, Vietcombank, MB..."
                    value={formData.ngan_hang}
                    onChange={(e) => setFormData({ ...formData, ngan_hang: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Mã số thuế */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mã số thuế cá nhân
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 8521369741"
                    value={formData.ma_so_thue}
                    onChange={(e) => setFormData({ ...formData, ma_so_thue: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Số BHXH */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Số sổ BHXH
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 7912345678"
                    value={formData.so_bhxh}
                    onChange={(e) => setFormData({ ...formData, so_bhxh: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  Ký và phát hành HĐ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: CẬP NHẬT ĐIỀU KHOẢN HỢP ĐỒNG ────────────────── */}
      {showEditModal && selectedContract && (
        <div
          onClick={() => setShowEditModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-sky-600" />
                  CẬP NHẬT ĐIỀU KHOẢN HỢP ĐỒNG: {selectedContract.ma_hd}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhân sự: <span className="font-semibold text-slate-700">{selectedContract.ho_ten}</span> ({selectedContract.ma_nv})
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Loại HĐ */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Loại hợp đồng
                  </label>
                  <select
                    value={formData.loai_hd}
                    onChange={(e) => setFormData({ ...formData, loai_hd: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="THU_VIEC">Hợp đồng thử việc</option>
                    <option value="XAC_DINH_1_NAM">Hợp đồng xác định thời hạn 1 năm</option>
                    <option value="XAC_DINH_3_NAM">Hợp đồng xác định thời hạn 3 năm</option>
                    <option value="KHONG_XAC_DINH">Hợp đồng không xác định thời hạn</option>
                    <option value="THOI_VU">Hợp đồng thời vụ / khoán việc</option>
                  </select>
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Trạng thái hợp đồng
                  </label>
                  <select
                    value={formData.trang_thai}
                    onChange={(e) => setFormData({ ...formData, trang_thai: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="HIEU_LUC">Hiệu lực</option>
                    <option value="HET_HAN">Hết hạn</option>
                    <option value="DA_THANH_LY">Đã thanh lý</option>
                    <option value="TAM_HOAN">Tạm hoãn</option>
                  </select>
                </div>

                {/* Ngày bắt đầu */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.ngay_bat_dau}
                    onChange={(e) => setFormData({ ...formData, ngay_bat_dau: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Ngày kết thúc */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.ngay_ket_thuc}
                    onChange={(e) => setFormData({ ...formData, ngay_ket_thuc: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Lương cơ bản */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Lương cơ bản (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.luong_co_ban}
                    onChange={(e) => setFormData({ ...formData, luong_co_ban: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Tỷ lệ hưởng lương */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tỷ lệ hưởng lương (%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.ty_le_huong}
                    onChange={(e) => setFormData({ ...formData, ty_le_huong: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Số tài khoản ngân hàng */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Số tài khoản ngân hàng
                  </label>
                  <input
                    type="text"
                    value={formData.so_tai_khoan}
                    onChange={(e) => setFormData({ ...formData, so_tai_khoan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Ngân hàng */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tên ngân hàng
                  </label>
                  <input
                    type="text"
                    value={formData.ngan_hang}
                    onChange={(e) => setFormData({ ...formData, ngan_hang: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Mã số thuế */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mã số thuế
                  </label>
                  <input
                    type="text"
                    value={formData.ma_so_thue}
                    onChange={(e) => setFormData({ ...formData, ma_so_thue: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Số BHXH */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Số sổ BHXH
                  </label>
                  <input
                    type="text"
                    value={formData.so_bhxh}
                    onChange={(e) => setFormData({ ...formData, so_bhxh: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: THANH LÝ HỢP ĐỒNG ────────────────── */}
      {showLiquidateModal && selectedContract && (
        <div
          onClick={() => setShowLiquidateModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 cursor-default"
          >
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                  Thanh lý Hợp đồng Lao động
                </h3>
                <p className="text-xs text-slate-500">Mã HĐ: {selectedContract.ma_hd}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Bạn có chắc chắn muốn thanh lý hợp đồng của nhân sự{" "}
              <strong className="text-slate-900">{selectedContract.ho_ten}</strong> ({selectedContract.ma_nv})? Hợp đồng sẽ được chuyển sang trạng thái <strong>ĐÃ THANH LÝ</strong>.
            </p>

            <form onSubmit={handleLiquidateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ngày kết thúc thanh lý
                </label>
                <input
                  type="date"
                  required
                  value={liquidateData.ngay_ket_thuc}
                  onChange={(e) => setLiquidateData({ ...liquidateData, ngay_ket_thuc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLiquidateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Xác nhận Thanh lý
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: XÁC NHẬN XÓA ────────────────── */}
      {showDeleteModal && selectedContract && (
        <div
          onClick={() => setShowDeleteModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 cursor-default"
          >
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                  Xác nhận xóa hợp đồng
                </h3>
                <p className="text-xs text-slate-500">Mã HĐ: {selectedContract.ma_hd}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa bản ghi hợp đồng lao động này khỏi hệ thống? Thao tác này không thể hoàn tác.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl cursor-pointer text-xs"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
