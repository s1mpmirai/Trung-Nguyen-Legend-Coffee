import React, { useState, useEffect, useCallback } from "react";
import { Users, KeyRound, Building2, FileText, ShieldCheck, LayoutDashboard, RefreshCw, Briefcase } from "lucide-react";
import { getAdminStats } from "../../../services/adminService";
import ErrorState from "../../../components/common/ErrorState";
import { getRoleLabel } from "../../../utils/navigation";

const ROLE_DESCRIPTIONS = {
  ADMIN: "Toàn quyền hệ thống",
  QUAN_LY: "Quản lý nhân sự & lương",
  TRUONG_NHOM: "Giám sát nhóm",
  NHAN_VIEN: "Quyền cơ bản",
};

function MetricCard({ title, icon: Icon, value, children, onClick }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{title}</span>
        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <Icon size={18} aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4">
        <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-3xl text-slate-900 tracking-tight">{value}</span>
        <div className="flex items-center gap-2 mt-1.5 text-xs">{children}</div>
      </div>
    </>
  );
  const base = "bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left";
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={`${base} hover:border-sky-300 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`}
    >
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
}

export default function AdminOverviewTab({ onNavigateTab, allowedTabs = [] }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const can = (tab) => allowedTabs.includes(tab);
  const go = (tab) => (can(tab) ? () => onNavigateTab(tab) : undefined);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminStats();
      setStats(data?.data || data);
    } catch (err) {
      console.error("Lỗi khi tải thống kê quản trị:", err);
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const summary = stats || {};
  // Phân bố phòng ban chỉ đếm nhân sự đang làm việc nên tỷ lệ % tính trên cùng mẫu số
  const activeEmployees = summary.nhan_su_dang_lam || 0;
  const roleDistribution = summary.phan_bo_vai_tro || [];

  const shortcuts = [
    { tab: "accounts", icon: KeyRound, title: "Cấp tài khoản", note: `Chưa cấp: ${summary.nhan_su_chua_co_tai_khoan ?? 0}` },
    { tab: "permissions", icon: ShieldCheck, title: "Phân quyền RBAC", note: "Vai trò & quyền riêng" },
    { tab: "employees", icon: Users, title: "Danh bạ nhân sự", note: "Tìm kiếm nâng cao & sắp xếp" },
    { tab: "contracts", icon: FileText, title: "Hợp đồng lao động", note: `Sắp hết hạn: ${summary.hop_dong_sap_het_han_30_ngay ?? 0}` },
    { tab: "departments", icon: Building2, title: "Phòng ban", note: `${summary.tong_phong_ban ?? 0} phòng ban` },
    { tab: "positions", icon: Briefcase, title: "Chức vụ & thang lương", note: `${summary.tong_chuc_vu ?? 0} chức vụ` },
  ].filter((s) => can(s.tab));

  return (
    <div className="flex flex-col gap-6">
      {/* ───────────────── TIÊU ĐỀ ───────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            <LayoutDashboard size={12} className="text-sky-600" aria-hidden="true" />
            <span>Cổng Quản trị</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight uppercase">
            TỔNG QUAN QUẢN TRỊ HỆ THỐNG
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Số liệu tổng hợp về nhân sự, tài khoản, cơ cấu tổ chức và hợp đồng</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadStats}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer shadow-xs"
            title="Làm mới dữ liệu"
            aria-label="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
          </button>

          {can("accounts") && (
            <button
              type="button"
              onClick={() => onNavigateTab("accounts")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs cursor-pointer"
            >
              <KeyRound size={14} aria-hidden="true" />
              <span>Cấp tài khoản mới</span>
            </button>
          )}
        </div>
      </div>

      {loadError && !isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <ErrorState error={loadError} onRetry={loadStats} />
        </div>
      ) : isLoading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" role="status" aria-label="Đang tải số liệu">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs animate-pulse">
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-200 rounded mt-5" />
              <div className="h-3 w-36 bg-slate-100 rounded mt-3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ───────────────── 1. CHỈ SỐ CHÍNH ───────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard title="Tổng nhân sự" icon={Users} value={summary.tong_nhan_su ?? 0} onClick={go("employees")}>
              <span className="text-emerald-600 font-semibold">{summary.nhan_su_dang_lam ?? 0} đang làm</span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <span className="text-sky-600 font-medium">{summary.nhan_su_thu_viec ?? 0} thử việc</span>
            </MetricCard>

            <MetricCard title="Tài khoản đăng nhập" icon={KeyRound} value={summary.tong_tai_khoan ?? 0} onClick={go("accounts")}>
              <span className="text-emerald-600 font-semibold">{summary.tai_khoan_hoat_dong ?? 0} hoạt động</span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <span className="text-amber-600 font-medium">{summary.nhan_su_chua_co_tai_khoan ?? 0} chưa cấp</span>
            </MetricCard>

            <MetricCard title="Cơ cấu tổ chức" icon={Building2} value={summary.tong_phong_ban ?? 0} onClick={go("departments")}>
              <span className="text-slate-600 font-medium">phòng ban hoạt động</span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <span className="text-sky-600 font-semibold">{summary.tong_chuc_vu ?? 0} chức vụ</span>
            </MetricCard>

            <MetricCard title="Hợp đồng lao động" icon={FileText} value={summary.tong_hop_dong ?? 0} onClick={go("contracts")}>
              <span className="text-emerald-600 font-semibold">{summary.hop_dong_hieu_luc ?? 0} hiệu lực</span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <span className="text-amber-600 font-medium">{summary.hop_dong_sap_het_han_30_ngay ?? 0} sắp hết hạn</span>
            </MetricCard>
          </div>

          {/* ───────────────── 2. PHÒNG BAN & VAI TRÒ ───────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">Cơ cấu nhân sự theo phòng ban</h3>
              <p className="text-xs text-slate-500">
                Phân bố {activeEmployees} nhân sự đang làm việc trong {summary.tong_phong_ban ?? 0} phòng ban
              </p>

              <div className="space-y-3.5 mt-4">
                {(summary.phan_bo_phong_ban || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có dữ liệu phân bố phòng ban.</p>
                ) : (
                  (summary.phan_bo_phong_ban || []).map((pb) => {
                    const percent = Math.round(((pb.so_luong_nv || 0) / (activeEmployees || 1)) * 100);
                    return (
                      <div key={pb.ma_pb} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800">{pb.ten_pb}</span>
                          <span className="font-semibold text-slate-600">
                            {pb.so_luong_nv} nhân sự ({percent}%)
                          </span>
                        </div>
                        <div
                          className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-label={pb.ten_pb}
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">Phân bố vai trò tài khoản</h3>
                <p className="text-xs text-slate-500">{roleDistribution.length} vai trò đang được sử dụng</p>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  {roleDistribution.map((vt) => {
                    const totalAcc = summary.tong_tai_khoan || 1;
                    const percent = Math.round(((vt.so_tai_khoan || 0) / totalAcc) * 100);
                    return (
                      <div key={vt.ma_vai_tro} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">{getRoleLabel(vt.ma_vai_tro) || vt.ten_vai_tro}</span>
                          <span className="text-[10px] font-medium text-slate-400 text-right">{ROLE_DESCRIPTIONS[vt.ma_vai_tro] || ""}</span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <div className="flex items-baseline gap-1">
                            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl text-slate-900">{vt.so_tai_khoan}</span>
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

              {shortcuts.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex-1">
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900 mb-1">Lối tắt quản trị</h3>
                  <p className="text-xs text-slate-500 mb-4">Các chức năng bạn được phép sử dụng</p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {shortcuts.map((s) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.tab}
                          type="button"
                          onClick={() => onNavigateTab(s.tab)}
                          className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 flex flex-col gap-1.5 transition text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        >
                          <Icon className="w-5 h-5 text-sky-600" aria-hidden="true" />
                          <span className="font-semibold text-xs text-slate-800">{s.title}</span>
                          <span className="text-[11px] text-slate-400">{s.note}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
