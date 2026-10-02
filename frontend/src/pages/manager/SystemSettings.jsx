import React, { useState } from "react";
import {
  Settings,
  MapPin,
  Calendar,
  Clock,
  Smartphone,
  Shield,
  RotateCcw,
  CheckCircle2,
  Building2,
  Factory,
  Store,
  Plus,
  Radio,
  Wifi,
  Sliders,
  Check,
  Info,
  Timer,
  Moon,
  Workflow,
  Sparkles,
  Zap,
  Activity
} from "lucide-react";

export default function SystemSettings() {
  const [activeCategory, setActiveCategory] = useState("gps");
  const [toast, setToast] = useState("");
  const [pingLatency, setPingLatency] = useState("14ms");
  const [isPinging, setIsPinging] = useState(false);

  // GPS Geofencing radii
  const [hqRadius, setHqRadius] = useState(50);
  const [factoryRadius, setFactoryRadius] = useState(200);
  const [storeRadius, setStoreRadius] = useState(30);

  // Grace period & OT
  const [gracePeriod, setGracePeriod] = useState(15);
  const [otStartTime, setOtStartTime] = useState("18:00");

  // Workflow auto routing toggles
  const [autoRouteShortLeave, setAutoRouteShortLeave] = useState(true);
  const [strictMultiTierLongLeave, setStrictMultiTierLongLeave] = useState(true);

  // Wifi BSSID
  const [wifiList, setWifiList] = useState([
    { ssid: "TrungNguyen_Corp_5G", bssid: "00:14:22:01:23:45", branch: "Trụ sở chính" },
    { ssid: "Coffee_Legend_Internal", bssid: "04:D5:90:3A:1B:78", branch: "Đồng Khởi Store" },
  ]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handlePing = () => {
    setIsPinging(true);
    setTimeout(() => {
      const lat = Math.floor(Math.random() * 8 + 10);
      setPingLatency(`${lat}ms`);
      setIsPinging(false);
      showToast(`Đã kiểm tra kết nối Socket Mobile App: ${lat}ms (Rất tốt)`);
    }, 700);
  };

  const handleSave = () => {
    showToast("Đã lưu và đồng bộ toàn bộ tham số GPS, ca làm và quy chế sang 3.420 thiết bị di động!");
  };

  const handleReset = () => {
    setHqRadius(50);
    setFactoryRadius(200);
    setStoreRadius(30);
    setGracePeriod(15);
    setOtStartTime("18:00");
    setAutoRouteShortLeave(true);
    setStrictMultiTierLongLeave(true);
    showToast("Đã khôi phục cài đặt quy chuẩn mặc định của Tập đoàn Trung Nguyên.");
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* ──────────────── HEADER BAR ──────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold text-[11px] uppercase tracking-wider border border-sky-200/50">
              System Administration
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Đồng bộ máy chủ v2.4 Live
            </span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl text-slate-900 tracking-tight">
            Cài đặt hệ thống & Quy chuẩn chấm công
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình tham số Geofencing GPS, ca kíp, dung sai thời gian và luồng duyệt tự động tương thích ứng dụng TrungNguyenHR Mobile.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 transition-all shadow-xs text-xs font-semibold active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>
          <button
            onClick={handleSave}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white text-xs font-semibold shadow-sm shadow-sky-600/20 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Lưu cấu hình hệ thống</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* ──────────────── MAIN SETTINGS HUB GRID ──────────────── */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Sub-Menu (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <div className="px-3 py-2 mb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Hạng mục cấu hình
              </span>
            </div>

            {/* Menu 1 */}
            <button
              onClick={() => setActiveCategory("gps")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                activeCategory === "gps"
                  ? "bg-sky-50 text-sky-700 border-l-[3px] border-sky-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className={`w-4 h-4 ${activeCategory === "gps" ? "text-sky-600" : "text-slate-400"}`} />
                <span>Quy chuẩn Chấm công GPS & Wifi</span>
              </div>
            </button>

            {/* Menu 2 */}
            <button
              onClick={() => setActiveCategory("leave")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                activeCategory === "leave"
                  ? "bg-sky-50 text-sky-700 border-l-[3px] border-sky-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className={`w-4 h-4 ${activeCategory === "leave" ? "text-sky-600" : "text-slate-400"}`} />
                <span>Chính sách Phép năm & Nghỉ lễ</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">12 ngày</span>
            </button>

            {/* Menu 3 */}
            <button
              onClick={() => setActiveCategory("shifts")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                activeCategory === "shifts"
                  ? "bg-sky-50 text-sky-700 border-l-[3px] border-sky-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4 ${activeCategory === "shifts" ? "text-sky-600" : "text-slate-400"}`} />
                <span>Cấu hình Ca làm & Tăng ca OT</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            </button>

            {/* Menu 4 */}
            <button
              onClick={() => setActiveCategory("mobile")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                activeCategory === "mobile"
                  ? "bg-sky-50 text-sky-700 border-l-[3px] border-sky-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className={`w-4 h-4 ${activeCategory === "mobile" ? "text-sky-600" : "text-slate-400"}`} />
                <span>Tích hợp Thiết bị & Mobile</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </button>

            {/* Menu 5 */}
            <button
              onClick={() => setActiveCategory("security")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                activeCategory === "security"
                  ? "bg-sky-50 text-sky-700 border-l-[3px] border-sky-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className={`w-4 h-4 ${activeCategory === "security" ? "text-sky-600" : "text-slate-400"}`} />
                <span>Bảo mật & Phân quyền Tài khoản</span>
              </div>
            </button>
          </div>

          {/* Live Sync Realtime Card */}
          <div className="bg-gradient-to-br from-sky-50/80 via-white to-sky-50/30 rounded-2xl p-5 border border-sky-100 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
                <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-sm">
                  Đồng bộ Mobile App
                </span>
              </div>
              <span className="font-mono text-[10px] text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md font-semibold">
                REST & Socket v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tọa độ GPS và bán kính chấm công được mã hóa SHA-256 đồng bộ tức thì đến 3.420 thiết bị di động nhân viên trực thuộc Tập đoàn.
            </p>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Độ trễ truyền nhận</span>
                <span className="font-bold text-emerald-600 text-xs">
                  {pingLatency} • Rất ổn định
                </span>
              </div>
              <button
                onClick={handlePing}
                disabled={isPinging}
                className="px-2.5 py-1 rounded-lg text-sky-700 bg-sky-50 hover:bg-sky-100 font-semibold text-[11px] transition-colors disabled:opacity-50"
              >
                {isPinging ? "Đang ping..." : "Ping lại"}
              </button>
            </div>
          </div>

          {/* Quick Tips Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
              <Info className="w-4 h-4 text-amber-500" />
              <span>Lưu ý Geofencing</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nên đặt bán kính tối thiểu 30m tại các tòa nhà cao tầng để bù sai số định vị GPS do phản xạ tín hiệu kính hoặc mây mù.
            </p>
          </div>
        </div>

        {/* Right Settings Workspace (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
          {/* SECTION 1: Geofencing GPS Locations */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-600" />
                  <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                    Địa điểm chấm công hợp lệ (GPS Geofencing)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập tọa độ tâm và dung sai bán kính (mét) để mobile app mở khóa nút Check-in.
                </p>
              </div>
              <button
                onClick={() => showToast("Mở biểu mẫu thêm địa điểm chấm công mới")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm điểm mới</span>
              </button>
            </div>

            {/* Location List */}
            <div className="flex flex-col gap-3">
              {/* Location 1: Headquarters */}
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">Trụ sở chính Tập đoàn</span>
                        <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Ưu tiên cao
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        82-84 Bùi Thị Xuân, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 mt-0.5 block">
                        Lat: 10.771239, Long: 106.690852
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-bold text-sky-600">
                      {hqRadius}m
                    </span>
                    <span className="text-[11px] text-slate-400">bán kính</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] text-slate-400 w-8">15m</span>
                  <input
                    type="range"
                    min="15"
                    max="300"
                    value={hqRadius}
                    onChange={(e) => setHqRadius(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <span className="text-[10px] text-slate-400 w-8 text-right">300m</span>
                </div>
              </div>

              {/* Location 2: Buôn Ma Thuột Factory */}
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Factory className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          Nhà máy Sản xuất Cà phê Buôn Ma Thuột
                        </span>
                        <span className="px-2 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
                          Khu công nghiệp
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Lô A2-A3 KCN Tân An, TP. Buôn Ma Thuột, Đắk Lắk
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 mt-0.5 block">
                        Lat: 12.710441, Long: 108.067339
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-bold text-sky-600">
                      {factoryRadius}m
                    </span>
                    <span className="text-[11px] text-slate-400">bán kính</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] text-slate-400 w-8">50m</span>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={factoryRadius}
                    onChange={(e) => setFactoryRadius(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <span className="text-[10px] text-slate-400 w-8 text-right">500m</span>
                </div>
              </div>

              {/* Location 3: Flagship Store */}
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          Chi nhánh Legend Đồng Khởi
                        </span>
                        <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          Chuỗi F&B
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Số 80 Đồng Khởi, Bến Nghé, Quận 1, TP. Hồ Chí Minh
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 mt-0.5 block">
                        Lat: 10.774591, Long: 106.702811
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-bold text-sky-600">
                      {storeRadius}m
                    </span>
                    <span className="text-[11px] text-slate-400">bán kính</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] text-slate-400 w-8">10m</span>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    value={storeRadius}
                    onChange={(e) => setStoreRadius(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <span className="text-[10px] text-slate-400 w-8 text-right">150m</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Shift Timings & Grace Period Settings */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" />
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                Khung giờ ca & Dung sai đi muộn (Grace Period)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Grace late period */}
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-between gap-3 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">
                    Dung sai đi muộn cho phép
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Không ghi nhận vi phạm nếu nhân viên Check-in trong phạm vi này.
                  </p>
                </div>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-amber-500" />
                    <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-base">
                      {gracePeriod}
                    </span>
                    <span className="text-xs text-slate-500">phút</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setGracePeriod((p) => Math.max(0, p - 5))}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setGracePeriod((p) => Math.min(60, p + 5))}
                      className="w-7 h-7 rounded-lg bg-sky-600 text-white hover:bg-sky-700 flex items-center justify-center font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Áp dụng ca sáng (08:00 - 08:{gracePeriod} không trừ công)
                </span>
              </div>

              {/* Overtime Rule */}
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-between gap-3 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">
                    Mốc tính giờ làm thêm (OT)
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thời gian bắt đầu kích hoạt hệ số nhân lương 1.5x ngày thường.
                  </p>
                </div>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-sky-600" />
                    <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900 text-base">
                      {otStartTime}
                    </span>
                    <span className="text-xs text-slate-500">giờ chiều</span>
                  </div>
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[11px] font-semibold rounded-lg">
                    Ca hành chính
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Yêu cầu có đơn đăng ký OT được duyệt trước
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Auto Approval Workflow Routing */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-sky-600" />
                <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-slate-900">
                  Luồng phê duyệt đơn từ thông minh
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                Đang kích hoạt
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Rule 1 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        Nghỉ phép dưới 1 ngày (≤ 8 giờ)
                      </span>
                      <span className="px-1.5 py-0.2 bg-sky-100 text-sky-700 rounded text-[10px] font-semibold">
                        Tự động định tuyến
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Chuyển tiếp trực tiếp cho Trưởng nhóm / Quản lý trực tiếp duyệt cấp 1
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoRouteShortLeave}
                  onChange={(e) => setAutoRouteShortLeave(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer accent-sky-600"
                />
              </div>

              {/* Rule 2 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        Đơn thôi việc & Nghỉ dài hạn (&gt; 3 ngày)
                      </span>
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[10px] font-semibold">
                        Bắt buộc đa tầng
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Bắt buộc chuyển tiếp qua Trưởng phòng Nhân sự & Tổng Giám đốc phê duyệt
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={strictMultiTierLongLeave}
                  onChange={(e) => setStrictMultiTierLongLeave(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer accent-sky-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
