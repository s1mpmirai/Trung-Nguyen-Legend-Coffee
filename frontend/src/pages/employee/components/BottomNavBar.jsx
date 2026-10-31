import React from "react";
import { Clock, FileText, Wallet, User } from "lucide-react";
import { navigateClean } from "../../../utils/navigation";

/**
 * BottomNavBar – Thanh điều hướng dưới cùng dùng chung cho cả 4 trang:
 * 1. Chấm công (/attendance)
 * 2. Đơn từ (/requests)
 * 3. Bảng lương (/payroll)
 * 4. Cá nhân (/profile)
 *
 * Khả năng truy cập: aria-current="page" cho tab đang mở, vùng chạm ≥ 48px,
 * chừa khoảng an toàn (safe-area) cho iPhone có thanh Home.
 * Các trang dùng lớp pb-[calc(6rem+env(safe-area-inset-bottom))] để nội dung không bị thanh này che.
 */
const NAV_ITEMS = [
  { key: "attendance", label: "Chấm công", icon: Clock },
  { key: "requests", label: "Đơn từ", icon: FileText },
  { key: "payroll", label: "Bảng lương", icon: Wallet },
  { key: "profile", label: "Cá nhân", icon: User },
];

export default function BottomNavBar({ activeTab = "attendance" }) {
  // Chuẩn hóa activeTab nếu truyền vào 'personal' -> 'profile', 'leaves' -> 'requests'
  const currentKey =
    activeTab === "personal" ? "profile" : activeTab === "leaves" ? "requests" : activeTab;

  return (
    <nav
      aria-label="Điều hướng Cổng nhân viên"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur border-t border-coffee-100 px-2 pt-1 pb-[env(safe-area-inset-bottom)] z-40 shadow-[0_-2px_12px_rgba(14,165,233,0.08)]"
    >
      <ul className="flex items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === currentKey;
          const IconComponent = item.icon;

          return (
            <li key={item.key} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  if (!isActive) navigateClean(item.key);
                }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`relative w-full min-h-[56px] min-w-[48px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                  isActive ? "text-coffee-700" : "text-slate-500 hover:text-coffee-600"
                }`}
              >
                {/* Vạch vàng đồng phía trên tab đang mở */}
                <span
                  aria-hidden="true"
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all ${
                    isActive ? "w-8 bg-gold-500" : "w-0 bg-transparent"
                  }`}
                />
                <IconComponent size={21} className={isActive ? "stroke-[2.5]" : "stroke-2"} aria-hidden="true" />
                <span className={`text-[11px] leading-none ${isActive ? "font-bold" : "font-semibold"}`}>
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
