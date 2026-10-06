import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Truck,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Building2,
  SlidersHorizontal,
  Layers,
  Sparkles
} from "lucide-react";
import {
  getProducts,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../../../services/adminService";

export default function AdminWarehouseTab() {
  const [activeSubTab, setActiveSubTab] = useState("products"); // "products" | "suppliers"

  // ────────────────── PRODUCTS STATE ──────────────────
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productSummary, setProductSummary] = useState({ tong_ton_kho: 0, tong_gia_tri_kho: 0 });
  const [productLoading, setProductLoading] = useState(false);
  const [productSearchInput, setProductSearchInput] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const productPageSize = 10;

  const handleTriggerProductSearch = () => {
    setProductSearch(productSearchInput.trim());
    setProductPage(1);
  };

  const handleProductSearchChange = (e) => {
    const val = e.target.value;
    setProductSearchInput(val);
    if (!val.trim()) {
      setProductSearch("");
      setProductPage(1);
    }
  };

  // Modals for Products
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);

  const [productFormData, setProductFormData] = useState({
    ma_sp: "",
    ten_sp: "",
    loai_sp: "Cà phê rang xay",
    ma_ncc: "",
    don_vi_tinh: "Hộp",
    quy_cach: "",
    gia_nhap: 50000,
    gia_ban: 90000,
    ton_kho: 100,
    mo_ta: "",
    trang_thai: 1,
  });

  const [stockFormData, setStockFormData] = useState({
    loai_thay_doi: "NHAP_KHO", // NHAP_KHO, XUAT_KHO, DIEU_CHINH
    so_luong: 10,
    ghi_chu: "",
  });

  // ────────────────── SUPPLIERS STATE ──────────────────
  const [suppliers, setSuppliers] = useState([]);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierSearchInput, setSupplierSearchInput] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatusFilter, setSupplierStatusFilter] = useState("");
  const [supplierPage, setSupplierPage] = useState(1);
  const supplierPageSize = 10;

  const handleTriggerSupplierSearch = () => {
    setSupplierSearch(supplierSearchInput.trim());
    setSupplierPage(1);
  };

  const handleSupplierSearchChange = (e) => {
    const val = e.target.value;
    setSupplierSearchInput(val);
    if (!val.trim()) {
      setSupplierSearch("");
      setSupplierPage(1);
    }
  };

  // Modals for Suppliers
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDeleteSupplierModal, setShowDeleteSupplierModal] = useState(false);

  const [supplierFormData, setSupplierFormData] = useState({
    ma_ncc: "",
    ten_ncc: "",
    dia_chi: "",
    tinh_thanh: "Đắk Lắk",
    sdt: "",
    email: "",
    nguoi_lien_he: "",
    loai_hang: "Cà phê nhân Robusta/Arabica",
    trang_thai: 1,
  });

  // Global toasts
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const showSuccess = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // ────────────────── FETCH PRODUCTS ──────────────────
  const fetchProductList = useCallback(async () => {
    setProductLoading(true);
    setErrorMessage("");
    try {
      const params = {
        page: productPage,
        page_size: productPageSize,
      };
      if (productSearch.trim()) params.search = productSearch.trim();
      if (categoryFilter) params.loai_sp = categoryFilter;
      if (lowStockFilter) params.low_stock = 30; // Cảnh báo dưới 30 đơn vị

      const res = await getProducts(params);
      const data = res.data || res;
      setProducts(data.items || []);
      setTotalProducts(data.total || 0);
      setProductSummary({
        tong_ton_kho: data.tong_ton_kho || 0,
        tong_gia_tri_kho: data.tong_gia_tri_kho || 0,
      });
    } catch (err) {
      console.error("Lỗi khi tải danh sách sản phẩm:", err);
      setErrorMessage("Không thể tải danh sách sản phẩm. Vui lòng thử lại!");
    } finally {
      setProductLoading(false);
    }
  }, [productPage, productSearch, categoryFilter, lowStockFilter]);

  // ────────────────── FETCH SUPPLIERS ──────────────────
  const fetchSupplierList = useCallback(async () => {
    setSupplierLoading(true);
    try {
      const params = {
        page: supplierPage,
        page_size: supplierPageSize,
      };
      if (supplierSearch.trim()) params.search = supplierSearch.trim();
      if (supplierStatusFilter !== "") params.trang_thai = Number(supplierStatusFilter);

      const res = await getSuppliers(params);
      const data = res.data || res;
      setSuppliers(data.items || []);
      setTotalSuppliers(data.total || 0);
    } catch (err) {
      console.error("Lỗi khi tải danh sách nhà cung cấp:", err);
    } finally {
      setSupplierLoading(false);
    }
  }, [supplierPage, supplierSearch, supplierStatusFilter]);

  useEffect(() => {
    if (activeSubTab === "products") {
      fetchProductList();
    } else {
      fetchSupplierList();
    }
  }, [activeSubTab, fetchProductList, fetchSupplierList]);

  // Also fetch suppliers once to populate product supplier dropdown
  useEffect(() => {
    fetchSupplierList();
  }, []);

  // ────────────────── PRODUCT HANDLERS ──────────────────
  const handleOpenCreateProduct = () => {
    setIsEditingProduct(false);
    setSelectedProduct(null);
    setProductFormData({
      ma_sp: "",
      ten_sp: "",
      loai_sp: "Cà phê rang xay",
      ma_ncc: suppliers[0]?.ma_ncc || "",
      don_vi_tinh: "Hộp",
      quy_cach: "",
      gia_nhap: 50000,
      gia_ban: 90000,
      ton_kho: 100,
      mo_ta: "",
      trang_thai: 1,
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod) => {
    setIsEditingProduct(true);
    setSelectedProduct(prod);
    setProductFormData({
      ten_sp: prod.ten_sp || "",
      loai_sp: prod.loai_sp || "Cà phê rang xay",
      ma_ncc: prod.ma_ncc || "",
      don_vi_tinh: prod.don_vi_tinh || "Hộp",
      quy_cach: prod.quy_cach || "",
      gia_nhap: prod.gia_nhap || 0,
      gia_ban: prod.gia_ban || 0,
      ton_kho: prod.ton_kho || 0,
      mo_ta: prod.mo_ta || "",
      trang_thai: prod.trang_thai ?? 1,
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (isEditingProduct) {
        await updateProduct(selectedProduct.ma_sp, productFormData);
        showSuccess(`Đã cập nhật sản phẩm ${selectedProduct.ma_sp} thành công!`);
      } else {
        await createProduct(productFormData);
        showSuccess("Đã thêm mới sản phẩm thành công!");
      }
      setShowProductModal(false);
      fetchProductList();
    } catch (err) {
      alert("Lỗi khi lưu sản phẩm: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleOpenStockModal = (prod) => {
    setSelectedProduct(prod);
    setStockFormData({
      loai_thay_doi: "NHAP_KHO",
      so_luong: 10,
      ghi_chu: "",
    });
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProductStock(selectedProduct.ma_sp, stockFormData);
      showSuccess(`Đã cập nhật tồn kho cho sản phẩm ${selectedProduct.ten_sp}!`);
      setShowStockModal(false);
      fetchProductList();
    } catch (err) {
      alert("Lỗi khi điều chỉnh tồn kho: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteProductSubmit = async () => {
    try {
      await deleteProduct(selectedProduct.ma_sp);
      showSuccess(`Đã xóa sản phẩm ${selectedProduct.ma_sp} khỏi kho!`);
      setShowDeleteProductModal(false);
      fetchProductList();
    } catch (err) {
      alert("Lỗi khi xóa sản phẩm: " + (err.response?.data?.detail || err.message));
    }
  };

  // ────────────────── SUPPLIER HANDLERS ──────────────────
  const handleOpenCreateSupplier = () => {
    setIsEditingSupplier(false);
    setSelectedSupplier(null);
    setSupplierFormData({
      ma_ncc: "",
      ten_ncc: "",
      dia_chi: "",
      tinh_thanh: "Đắk Lắk",
      sdt: "",
      email: "",
      nguoi_lien_he: "",
      loai_hang: "Cà phê nhân Robusta/Arabica",
      trang_thai: 1,
    });
    setShowSupplierModal(true);
  };

  const handleOpenEditSupplier = (sup) => {
    setIsEditingSupplier(true);
    setSelectedSupplier(sup);
    setSupplierFormData({
      ten_ncc: sup.ten_ncc || "",
      dia_chi: sup.dia_chi || "",
      tinh_thanh: sup.tinh_thanh || "",
      sdt: sup.sdt || "",
      email: sup.email || "",
      nguoi_lien_he: sup.nguoi_lien_he || "",
      loai_hang: sup.loai_hang || "",
      trang_thai: sup.trang_thai ?? 1,
    });
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      if (isEditingSupplier) {
        await updateSupplier(selectedSupplier.ma_ncc, supplierFormData);
        showSuccess(`Đã cập nhật nhà cung cấp ${selectedSupplier.ma_ncc} thành công!`);
      } else {
        await createSupplier(supplierFormData);
        showSuccess("Đã thêm nhà cung cấp mới thành công!");
      }
      setShowSupplierModal(false);
      fetchSupplierList();
    } catch (err) {
      alert("Lỗi khi lưu nhà cung cấp: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteSupplierSubmit = async () => {
    try {
      await deleteSupplier(selectedSupplier.ma_ncc);
      showSuccess(`Đã xóa nhà cung cấp ${selectedSupplier.ma_ncc}!`);
      setShowDeleteSupplierModal(false);
      fetchSupplierList();
    } catch (err) {
      alert("Lỗi khi xóa nhà cung cấp: " + (err.response?.data?.detail || err.message));
    }
  };

  const formatVND = (val) => {
    if (!val && val !== 0) return "0 đ";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const totalProductPages = Math.ceil(totalProducts / productPageSize) || 1;
  const totalSupplierPages = Math.ceil(totalSuppliers / supplierPageSize) || 1;

  return (
    <div className="flex flex-col gap-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase flex items-center gap-3">
            <Package className="w-7 h-7 text-sky-600" />
            KHO HÀNG & NHÀ CUNG CẤP NGUYÊN LIỆU
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị chuỗi cung ứng, kho cà phê hạt, rang xay, hòa tan và đối tác chiến lược
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeSubTab === "products") fetchProductList();
              else fetchSupplierList();
            }}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium transition cursor-pointer flex items-center gap-2 text-xs shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${(productLoading || supplierLoading) ? "animate-spin text-sky-600" : ""}`} />
            Làm mới
          </button>

          {activeSubTab === "products" ? (
            <button
              onClick={handleOpenCreateProduct}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm sản phẩm mới
            </button>
          ) : (
            <button
              onClick={handleOpenCreateSupplier}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm nhà cung cấp
            </button>
          )}
        </div>
      </div>

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab("products")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "products"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Danh mục Sản phẩm & Kho ({totalProducts})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("suppliers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "suppliers"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Nhà cung cấp Nguyên vật liệu ({totalSuppliers})</span>
        </button>
      </div>

      {/* ── SUCCESS TOAST ── */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── ERROR TOAST ── */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ══════════════════ TAB 1: SẢN PHẨM & KHO ══════════════════ */}
      {activeSubTab === "products" && (
        <div className="flex flex-col gap-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
                  {totalProducts}
                </div>
                <div className="text-xs text-slate-500 font-medium">Mặt hàng kinh doanh</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-sky-700">
                  {new Intl.NumberFormat("vi-VN").format(productSummary.tong_ton_kho)}
                </div>
                <div className="text-xs text-slate-500 font-medium">Tổng tồn kho (đơn vị)</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-emerald-700 truncate">
                  {formatVND(productSummary.tong_gia_tri_kho)}
                </div>
                <div className="text-xs text-slate-500 font-medium">Ước tính giá trị kho</div>
              </div>
            </div>

            <div
              onClick={() => {
                setLowStockFilter(!lowStockFilter);
                setProductPage(1);
              }}
              className={`p-5 rounded-2xl border shadow-xs flex items-center gap-4 cursor-pointer transition ${
                lowStockFilter
                  ? "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400"
                  : "bg-white border-slate-200/80 hover:border-amber-400"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  lowStockFilter ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {lowStockFilter ? "Đang lọc: Tồn ≤ 30" : "Cảnh báo hết hàng"}
                </div>
                <div className={`text-[11px] font-medium mt-0.5 ${lowStockFilter ? "text-amber-100" : "text-slate-500"}`}>
                  Click để bật lọc tồn kho thấp
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo Mã SP, Tên sản phẩm..."
                    value={productSearchInput}
                    onChange={handleProductSearchChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleTriggerProductSearch();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTriggerProductSearch}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Search size={13} />
                  <span>Tìm kiếm</span>
                </button>
              </div>

              {/* Loai SP Filter */}
              <div className="min-w-[180px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setProductPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="">Tất cả loại sản phẩm</option>
                  <option value="Cà phê rang xay">Cà phê rang xay</option>
                  <option value="Cà phê hòa tan">Cà phê hòa tan</option>
                  <option value="Cà phê hạt">Cà phê hạt mộc</option>
                  <option value="Dụng cụ pha chế">Dụng cụ & Phin pha</option>
                  <option value="Bao bì & Vật tư">Bao bì & Vật tư</option>
                </select>
              </div>
            </div>

            {/* Low stock quick button */}
            <button
              onClick={() => {
                setLowStockFilter(!lowStockFilter);
                setProductPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
                lowStockFilter
                  ? "bg-amber-500 text-white border-amber-600"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cảnh báo tồn kho ≤ 30</span>
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
                    <th className="py-3.5 px-4">Mã SP</th>
                    <th className="py-3.5 px-4">Tên sản phẩm</th>
                    <th className="py-3.5 px-4">Phân loại</th>
                    <th className="py-3.5 px-4">Đơn vị / Quy cách</th>
                    <th className="py-3.5 px-4">Giá nhập / Giá bán</th>
                    <th className="py-3.5 px-4">Tồn kho</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {productLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                        Đang tải danh mục sản phẩm kho...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        Không tìm thấy sản phẩm nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    products.map((prod) => {
                      const isLowStock = prod.ton_kho <= 30;

                      return (
                        <tr key={prod.ma_sp} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            {prod.ma_sp}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{prod.ten_sp}</div>
                            {prod.ten_ncc && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Truck className="w-3 h-3 text-slate-400" />
                                <span>{prod.ten_ncc}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {prod.loai_sp}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-medium">{prod.don_vi_tinh}</div>
                            <div className="text-[11px] text-slate-400">{prod.quy_cach || "—"}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-amber-700">{formatVND(prod.gia_ban)}</div>
                            <div className="text-[11px] text-slate-400">
                              Vốn: {formatVND(prod.gia_nhap)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold text-sm ${isLowStock ? "text-rose-600" : "text-slate-800"}`}>
                                {prod.ton_kho}
                              </span>
                              {isLowStock && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  Ít
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {prod.trang_thai === 1 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Đang bán
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                <XCircle className="w-3 h-3 text-slate-400" />
                                Tạm ngưng
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Cập nhật tồn kho nhanh */}
                              <button
                                onClick={() => handleOpenStockModal(prod)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Nhập / Xuất kho"
                              >
                                <Boxes className="w-4 h-4" />
                              </button>

                              {/* Sửa thông tin SP */}
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                title="Chỉnh sửa sản phẩm"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Xóa SP */}
                              <button
                                onClick={() => {
                                  setSelectedProduct(prod);
                                  setShowDeleteProductModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Xóa sản phẩm"
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

            {/* Pagination */}
            <div className="p-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <div>
                Hiển thị <span className="font-semibold text-slate-700">{products.length}</span> trên{" "}
                <span className="font-semibold text-slate-700">{totalProducts}</span> sản phẩm
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={productPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-slate-700">
                  Trang {productPage} / {totalProductPages}
                </span>
                <button
                  onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                  disabled={productPage >= totalProductPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ TAB 2: NHÀ CUNG CẤP ══════════════════ */}
      {activeSubTab === "suppliers" && (
        <div className="flex flex-col gap-6">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo Tên NCC, SĐT, Người liên hệ..."
                    value={supplierSearchInput}
                    onChange={handleSupplierSearchChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleTriggerSupplierSearch();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTriggerSupplierSearch}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Search size={13} />
                  <span>Tìm kiếm</span>
                </button>
              </div>

              {/* Status Filter */}
              <div className="min-w-[170px]">
                <select
                  value={supplierStatusFilter}
                  onChange={(e) => {
                    setSupplierStatusFilter(e.target.value);
                    setSupplierPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="1">Đang hợp tác</option>
                  <option value="0">Ngừng hợp tác</option>
                </select>
              </div>
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
                    <th className="py-3.5 px-4">Mã NCC</th>
                    <th className="py-3.5 px-4">Tên nhà cung cấp</th>
                    <th className="py-3.5 px-4">Loại mặt hàng</th>
                    <th className="py-3.5 px-4">Đại diện & Liên hệ</th>
                    <th className="py-3.5 px-4">Địa bàn / Tỉnh thành</th>
                    <th className="py-3.5 px-4">Số SP cung ứng</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {supplierLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                        Đang tải danh sách nhà cung cấp...
                      </td>
                    </tr>
                  ) : suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        Không tìm thấy nhà cung cấp nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((sup) => (
                      <tr key={sup.ma_ncc} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {sup.ma_ncc}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{sup.ten_ncc}</div>
                          <div className="text-[11px] text-slate-500">{sup.dia_chi || "—"}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {sup.loai_hang || "Nguyên liệu chung"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{sup.nguoi_lien_he || "—"}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {sup.sdt && <span>{sup.sdt}</span>}
                            {sup.email && <span>• {sup.email}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {sup.tinh_thanh || "—"}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {sup.so_san_pham_cung_cap || 0} sản phẩm
                        </td>

                        <td className="py-3.5 px-4">
                          {sup.trang_thai === 1 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Hợp tác
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              Ngừng
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditSupplier(sup)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Chỉnh sửa nhà cung cấp"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedSupplier(sup);
                                setShowDeleteSupplierModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Xóa nhà cung cấp"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <div>
                Hiển thị <span className="font-semibold text-slate-700">{suppliers.length}</span> trên{" "}
                <span className="font-semibold text-slate-700">{totalSuppliers}</span> đối tác
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSupplierPage((p) => Math.max(1, p - 1))}
                  disabled={supplierPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-slate-700">
                  Trang {supplierPage} / {totalSupplierPages}
                </span>
                <button
                  onClick={() => setSupplierPage((p) => Math.min(totalSupplierPages, p + 1))}
                  disabled={supplierPage >= totalSupplierPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: THÊM / SỬA SẢN PHẨM ────────────────── */}
      {showProductModal && (
        <div
          onClick={() => setShowProductModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {isEditingProduct ? `CẬP NHẬT SẢN PHẨM: ${selectedProduct?.ma_sp}` : "THÊM MỚI SẢN PHẨM VÀO KHO"}
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tên sản phẩm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cà phê G7 3in1 Hộp 18 gói"
                    value={productFormData.ten_sp}
                    onChange={(e) => setProductFormData({ ...productFormData, ten_sp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Phân loại sản phẩm <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={productFormData.loai_sp}
                    onChange={(e) => setProductFormData({ ...productFormData, loai_sp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Cà phê rang xay">Cà phê rang xay</option>
                    <option value="Cà phê hòa tan">Cà phê hòa tan</option>
                    <option value="Cà phê hạt">Cà phê hạt mộc</option>
                    <option value="Dụng cụ pha chế">Dụng cụ & Phin pha</option>
                    <option value="Bao bì & Vật tư">Bao bì & Vật tư</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nhà cung cấp
                  </label>
                  <select
                    value={productFormData.ma_ncc}
                    onChange={(e) => setProductFormData({ ...productFormData, ma_ncc: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="">-- Chưa gắn nhà cung cấp --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.ma_ncc} value={sup.ma_ncc}>
                        {sup.ma_ncc} - {sup.ten_ncc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Đơn vị tính <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Hộp, Gói, Bịch, Bao, Chiếc..."
                    value={productFormData.don_vi_tinh}
                    onChange={(e) => setProductFormData({ ...productFormData, don_vi_tinh: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Quy cách đóng gói
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Hộp 18 gói x 16g, Bao 50kg..."
                    value={productFormData.quy_cach}
                    onChange={(e) => setProductFormData({ ...productFormData, quy_cach: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Giá vốn nhập kho (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={productFormData.gia_nhap}
                    onChange={(e) => setProductFormData({ ...productFormData, gia_nhap: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Giá bán niêm yết (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={productFormData.gia_ban}
                    onChange={(e) => setProductFormData({ ...productFormData, gia_ban: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {!isEditingProduct && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Số lượng nhập kho ban đầu
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productFormData.ton_kho}
                      onChange={(e) => setProductFormData({ ...productFormData, ton_kho: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Trạng thái kinh doanh
                  </label>
                  <select
                    value={productFormData.trang_thai}
                    onChange={(e) => setProductFormData({ ...productFormData, trang_thai: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value={1}>Đang kinh doanh</option>
                    <option value={0}>Tạm ngưng kinh doanh</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Mô tả sản phẩm
                </label>
                <textarea
                  rows={2}
                  placeholder="Hương vị, công thức pha chế, ghi chú nguồn gốc..."
                  value={productFormData.mo_ta}
                  onChange={(e) => setProductFormData({ ...productFormData, mo_ta: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  {isEditingProduct ? "Cập nhật sản phẩm" : "Thêm vào kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: NHẬP / XUẤT KHO NHANH ────────────────── */}
      {showStockModal && selectedProduct && (
        <div
          onClick={() => setShowStockModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 cursor-default"
          >
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                  Điều chỉnh kho hàng
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedProduct.ten_sp} ({selectedProduct.ma_sp})
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs flex justify-between items-center">
              <span className="text-slate-600">Tồn kho hiện tại:</span>
              <span className="font-mono font-bold text-base text-slate-900">
                {selectedProduct.ton_kho} {selectedProduct.don_vi_tinh}
              </span>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Hình thức điều chỉnh <span className="text-rose-500">*</span>
                </label>
                <select
                  value={stockFormData.loai_thay_doi}
                  onChange={(e) => setStockFormData({ ...stockFormData, loai_thay_doi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="NHAP_KHO">Nhập thêm kho (+)</option>
                  <option value="XUAT_KHO">Xuất kho (-)</option>
                  <option value="DIEU_CHINH">Điều chỉnh kiểm kê thực tế</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Số lượng (đơn vị) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockFormData.so_luong}
                  onChange={(e) => setStockFormData({ ...stockFormData, so_luong: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ghi chú chứng từ / lý do
                </label>
                <input
                  type="text"
                  placeholder="VD: Nhập lô sản xuất mới, bù hao hụt..."
                  value={stockFormData.ghi_chu}
                  onChange={(e) => setStockFormData({ ...stockFormData, ghi_chu: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Xác nhận lưu kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: XÓA SẢN PHẨM ────────────────── */}
      {showDeleteProductModal && selectedProduct && (
        <div
          onClick={() => setShowDeleteProductModal(false)}
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
                  Xác nhận xóa sản phẩm
                </h3>
                <p className="text-xs text-slate-500">Mã SP: {selectedProduct.ma_sp}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm <strong>{selectedProduct.ten_sp}</strong> khỏi danh mục kho? Hành động này không thể hoàn tác.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteProductModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteProductSubmit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl cursor-pointer text-xs"
              >
                Xóa sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: THÊM / SỬA NHÀ CUNG CẤP ────────────────── */}
      {showSupplierModal && (
        <div
          onClick={() => setShowSupplierModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-500" />
                {isEditingSupplier ? `CẬP NHẬT NHÀ CUNG CẤP: ${selectedSupplier?.ma_ncc}` : "THÊM MỚI NHÀ CUNG CẤP"}
              </h2>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tên nhà cung cấp / Doanh nghiệp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Công ty TNHH Cà phê Buôn Ma Thuột..."
                    value={supplierFormData.ten_ncc}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, ten_ncc: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Loại hàng cung cấp
                  </label>
                  <input
                    type="text"
                    placeholder="Cà phê nhân, Bao bì, Thiết bị..."
                    value={supplierFormData.loai_hang}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, loai_hang: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Người đại diện liên hệ
                  </label>
                  <input
                    type="text"
                    placeholder="Họ tên người liên hệ..."
                    value={supplierFormData.nguoi_lien_he}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, nguoi_lien_he: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    placeholder="09xx..."
                    value={supplierFormData.sdt}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, sdt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@supplier.vn"
                    value={supplierFormData.email}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tỉnh / Thành phố
                  </label>
                  <input
                    type="text"
                    placeholder="Đắk Lắk, Lâm Đồng, TP.HCM..."
                    value={supplierFormData.tinh_thanh}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, tinh_thanh: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Trạng thái hợp tác
                  </label>
                  <select
                    value={supplierFormData.trang_thai}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, trang_thai: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value={1}>Đang hợp tác</option>
                    <option value={0}>Ngừng hợp tác</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Địa chỉ chi tiết
                  </label>
                  <input
                    type="text"
                    placeholder="Số nhà, đường, phường/xã..."
                    value={supplierFormData.dia_chi}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, dia_chi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  {isEditingSupplier ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: XÓA NHÀ CUNG CẤP ────────────────── */}
      {showDeleteSupplierModal && selectedSupplier && (
        <div
          onClick={() => setShowDeleteSupplierModal(false)}
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
                  Xác nhận xóa nhà cung cấp
                </h3>
                <p className="text-xs text-slate-500">Mã NCC: {selectedSupplier.ma_ncc}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Bạn có chắc muốn xóa đối tác <strong>{selectedSupplier.ten_ncc}</strong>? Lưu ý chỉ có thể xóa nhà cung cấp khi chưa có sản phẩm nào liên kết.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteSupplierModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-600 cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteSupplierSubmit}
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
