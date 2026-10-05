import React, { useState, useEffect } from "react";
import {
  Users,
  KeyRound,
  Package,
  FileText,
  Building2,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  RefreshCw,
  Boxes,
  Truck
} from "lucide-react";
import { getAdminStats } from "../../../services/adminService";

export default function AdminOverviewTab({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStats = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await getAdminStats();
      setStats(data.data || data);
    } catch (err) {
      console.error("Lỗi khi tải thống kê Admin:", err);
      setErrorMessage("Không thể tải số liệu thống kê. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatVND = (val) => {
    if (!val && val !== 0) return "0 đ";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  if (isLoading && !stats) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        <span className="text-xs font-medium">Đang tải số liệu tổng quan hệ thống...</span>
      </div>
    );
  }

  const summary = stats || {};
  const totalEmployees = summary.tong_nhan_su || 20;

  return (
    <div className="flex flex-col gap-6">
      {/* ───────────────── HEADER TIÊU ĐỀ ───────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            <Sparkles size={12} className="text-sky-600" />
            <span>Trung tâm chỉ huy & Quản trị tối cao</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase">
            TỔNG QUAN QUẢN TRỊ HỆ THỐNG
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu tổng thể toàn chuỗi Trung Nguyên Legend thời gian thực
          </p>
        </div>

        {/* Nút hành động nhanh của Admin */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadStats}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("accounts")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs cursor-pointer"
          >
            <KeyRound size={14} />
            <span>Cấp tài khoản mới</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("departments")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <Building2 size={14} className="text-sky-600" />
            <span>Thêm phòng ban</span>
          </button>
        </div>
      </div>

      {/* ───────────────── 1. BỐN THẺ CHỈ SỐ CỐT LÕI (4 KEY METRIC CARDS) ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Tổng nhân sự */}
        <div
          onClick={() => onNavigateTab("employees")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-sky-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng nhân sự toàn chuỗi</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900 tracking-tight">
              {summary.tong_nhan_su || 20}
            </span>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="text-emerald-600 font-semibold">{summary.nhan_su_dang_lam || 19} đang làm</span>
              <span className="text-slate-300">•</span>
              <span className="text-sky-600 font-medium">{summary.nhan_su_thu_viec || 1} thử việc</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Tài khoản hệ thống */}
        <div
          onClick={() => onNavigateTab("accounts")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-sky-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tài khoản đăng nhập</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <KeyRound size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900 tracking-tight">
              {summary.tong_tai_khoan || 9}
            </span>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="text-emerald-600 font-semibold">{summary.tai_khoan_hoat_dong || 9} hoạt động</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600 font-medium">{summary.nhan_su_chua_co_tai_khoan || 10} chưa cấp</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Kho hàng & Sản phẩm */}
        <div
          onClick={() => onNavigateTab("warehouse")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-sky-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kho hàng & Mặt hàng</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900 tracking-tight">
              {summary.tong_san_pham || 10}
            </span>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="text-slate-600 font-medium">Tồn: {new Intl.NumberFormat("vi-VN").format(summary.tong_so_luong_ton_kho || 9900)}</span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-600 font-semibold">{summary.san_pham_canh_bao_ton_it || 2} ít hàng</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Hợp đồng lao động */}
        <div
          onClick={() => onNavigateTab("contracts")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-sky-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Hợp đồng lao động</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900 tracking-tight">
              {summary.tong_hop_dong || 20}
            </span>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="text-emerald-600 font-semibold">{summary.hop_dong_hieu_luc || 19} hiệu lực</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600 font-medium">{summary.hop_dong_sap_het_han_30_ngay || 0} sắp hết</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────── 2. CƠ CẤU PHÒNG BAN & PHÂN QUYỀN RBAC ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái: Cơ cấu nhân sự theo phòng ban (7 cột) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                Cơ Cấu Nhân Sự Theo Phòng Ban
              </h3>
              <p className="text-xs text-slate-500">Phân bố {totalEmployees} nhân sự trong 8 phòng ban</p>
            </div>
            <button
              onClick={() => onNavigateTab("departments")}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Chi tiết</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-3.5 mt-3">
            {(summary.phan_bo_phong_ban || []).map((pb) => {
              const percent = Math.round((pb.so_luong_nv / (totalEmployees || 1)) * 100);
              return (
                <div key={pb.ma_pb} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{pb.ten_pb}</span>
                    <span className="font-semibold text-slate-600">
                      {pb.so_luong_nv} nhân sự ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột phải: Phân bổ vai trò & Phím tắt quản trị (5 cột) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Phân bổ vai trò RBAC */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                  Phân Bổ Vai Trò Hệ Thống (RBAC)
                </h3>
                <p className="text-xs text-slate-500">4 cấp bậc tài khoản đăng nhập</p>
              </div>
              <button
                onClick={() => onNavigateTab("permissions")}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Phân quyền</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              {(summary.phan_bo_vai_tro || []).map((vt) => {
                const totalAcc = summary.tong_tai_khoan || 1;
                const percent = Math.round(((vt.so_tai_khoan || 0) / totalAcc) * 100);
                const roleLevel = {
                  ADMIN: "Toàn quyền hệ thống",
                  QUAN_LY: "Quản lý phòng ban",
                  TRUONG_NHOM: "Giám sát nhóm",
                  NHAN_VIEN: "Nhân sự tiêu chuẩn",
                }[vt.ma_vai_tro] || "Cấp bậc vai trò";

                return (
                  <div
                    key={vt.ma_vai_tro}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{vt.ten_vai_tro}</span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {roleLevel}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl text-slate-900">
                          {vt.so_tai_khoan}
                        </span>
                        <span className="text-[11px] text-slate-400">tài khoản</span>
                      </div>
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tiện ích thao tác nhanh */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex-1">
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900 mb-1">
              Phím Tắt Quản Trị Hệ Thống
            </h3>
            <p className="text-xs text-slate-500 mb-4">Các tác vụ điều hành thường nhật</p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigateTab("accounts")}
                className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 flex flex-col gap-1.5 transition text-left cursor-pointer"
              >
                <KeyRound className="w-5 h-5 text-sky-600" />
                <span className="font-semibold text-xs text-slate-800">Cấp tài khoản</span>
                <span className="text-[11px] text-slate-400">Còn 10 nhân sự</span>
              </button>

              <button
                onClick={() => onNavigateTab("permissions")}
                className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 flex flex-col gap-1.5 transition text-left cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span className="font-semibold text-xs text-slate-800">Thăng chức NV</span>
                <span className="text-[11px] text-slate-400">Lên Trưởng nhóm</span>
              </button>

              <button
                onClick={() => onNavigateTab("contracts")}
                className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 flex flex-col gap-1.5 transition text-left cursor-pointer"
              >
                <FileText className="w-5 h-5 text-sky-600" />
                <span className="font-semibold text-xs text-slate-800">Ký hợp đồng</span>
                <span className="text-[11px] text-slate-400">Thử việc, 1-3 năm</span>
              </button>

              <button
                onClick={() => onNavigateTab("warehouse")}
                className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 flex flex-col gap-1.5 transition text-left cursor-pointer"
              >
                <Boxes className="w-5 h-5 text-sky-600" />
                <span className="font-semibold text-xs text-slate-800">Kho cà phê</span>
                <span className="text-[11px] text-slate-400">9.900 đơn vị tồn</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
