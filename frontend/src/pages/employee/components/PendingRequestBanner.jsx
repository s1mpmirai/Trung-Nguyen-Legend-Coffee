import React, { useState } from "react";
import { Hourglass, ArrowRight, Loader2 } from "lucide-react";
import { PROFILE_FIELD_LABELS, formatProfileValue } from "./profileFields";

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
};

/**
 * PendingRequestBanner – Yêu cầu chỉnh sửa hồ sơ đang chờ Quản lý duyệt:
 * hiển thị giá trị cũ -> mới của từng trường, lý do và nút "Hủy yêu cầu" (có bước xác nhận).
 */
function PendingRequestBanner({ request, onCancel, onEdit }) {
  const [confirming, setConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!request) return null;

  const changes = Object.entries(request.thong_tin_moi || {}).filter(([key]) => PROFILE_FIELD_LABELS[key]);

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel(request);
      setConfirming(false);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <section
      className="bg-gold-50 border border-gold-200 rounded-2xl p-4 space-y-3"
      aria-labelledby="pending-request-title"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white text-gold-700 border border-gold-200 flex items-center justify-center flex-shrink-0">
          <Hourglass size={17} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 id="pending-request-title" className="text-sm font-bold text-coffee-900">
            Yêu cầu chỉnh sửa hồ sơ đang chờ duyệt
          </h3>
          <p className="text-[11px] text-coffee-700 mt-0.5">
            Mã yêu cầu #{request.ma_yc}
            {request.ngay_tao ? ` • Gửi lúc ${formatDateTime(request.ngay_cap_nhat || request.ngay_tao)}` : ""}
          </p>
        </div>
      </div>

      {changes.length > 0 && (
        <ul className="bg-white rounded-xl border border-gold-100 divide-y divide-gold-100">
          {changes.map(([key, newValue]) => (
            <li key={key} className="px-3 py-2 text-xs">
              <span className="block text-[11px] font-semibold text-slate-500">{PROFILE_FIELD_LABELS[key]}</span>
              <span className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="text-slate-500 line-through decoration-slate-300">
                  {formatProfileValue(key, request.thong_tin_cu?.[key])}
                </span>
                <ArrowRight size={12} className="text-gold-700 flex-shrink-0" aria-label="đổi thành" />
                <strong className="text-coffee-900 break-all">{formatProfileValue(key, newValue)}</strong>
              </span>
            </li>
          ))}
        </ul>
      )}

      {request.ly_do && (
        <p className="text-xs text-coffee-800">
          <span className="font-semibold">Lý do:</span> {request.ly_do}
        </p>
      )}

      {confirming ? (
        <div className="flex items-center justify-between gap-2 bg-white rounded-xl border border-rose-200 p-2.5" role="alertdialog" aria-label="Xác nhận hủy yêu cầu">
          <span className="text-xs font-semibold text-rose-700">Hủy yêu cầu chỉnh sửa này?</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isCancelling}
              className="min-h-[36px] px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Giữ lại
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="min-h-[36px] px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-70"
            >
              {isCancelling && <Loader2 size={12} className="animate-spin" />}
              Xác nhận hủy
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 min-h-[40px] rounded-xl bg-white border border-gold-200 text-coffee-800 text-xs font-bold hover:bg-gold-100"
            >
              Sửa yêu cầu
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex-1 min-h-[40px] rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50"
          >
            Hủy yêu cầu
          </button>
        </div>
      )}
    </section>
  );
}

export default PendingRequestBanner;
