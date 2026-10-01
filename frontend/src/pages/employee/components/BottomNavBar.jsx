import React from "react";
import { Clock, FileText, DollarSign, User } from "lucide-react";

/**
 * BottomNavBar – Thanh điều hướng dưới cùng dùng chung cho cả 4 trang:
 * 1. Chấm công (#/attendance)
 * 2. Đơn từ (#/requests)
 * 3. Bảng lương (#/payroll)
 * 4. Cá nhân (#/profile)
 */
const NAV_ITEMS = [
  { key: "attendance", label: "Chấm công", icon: Clock, hash: "#/attendance" },
  { key: "requests", label: "Đơn từ", icon: FileText, hash: "#/requests" },
  { key: "payroll", label: "Bảng lương", icon: DollarSign, hash: "#/payroll" },
  { key: "profile", label: "Cá nhân", icon: User, hash: "#/profile" },
];

export default function BottomNavBar({ activeTab = "attendance" }) {
  // Chuẩn hóa activeTab nếu truyền vào 'personal' -> 'profile', 'leaves' -> 'requests'
  const currentKey =
    activeTab === "personal" ? "profile" : activeTab === "leaves" ? "requests" : activeTab;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 py-2 px-4 flex items-center justify-around z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === currentKey;
        const IconComponent = item.icon;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              window.location.hash = item.hash;
            }}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all ${
              isActive ? "text-[#0EA5E9]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <IconComponent size={20} className={isActive ? "stroke-[2.5]" : "stroke-2"} />
            <span className="text-[10px] font-semibold leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
