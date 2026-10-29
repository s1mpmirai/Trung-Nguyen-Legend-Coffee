import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FilePen,
  Loader2,
  RefreshCw,
  ShieldOff,
  X,
  XCircle,
} from "lucide-react";
import apiClient from "../../../services/apiClient";
import ConfirmDialog from "./ConfirmDialog";
import {
  formatDateTimeVN,
  formatDateVN,
  getApiErrorMessage,
  getManagerAccess,
  isForbiddenError,
} from "../managerUtils";

/** Nhãn tiếng Việt cho các trường nhân viên được phép đề nghị sửa */
export const PROFILE_FIELD_LABELS = {
  sdt: "Số điện thoại",
  email: "Email",
  dia_chi: "Địa chỉ",
  ngay_sinh: "Ngày sinh",
  gioi_tinh: "Giới tính",
  so_tai_khoan: "Số tài khoản ngân hàng",
  ngan_hang: "Ngân hàng",
  ma_so_thue: "Mã số thuế",
  so_bhxh: "Số sổ BHXH",
};

const GENDER_LABELS = { Nam: "Nam", Nu: "Nữ", Khac: "Khác" };

const STATUS_META = {
  CHO_DUYET: { label: "Chờ duyệt", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
  DA_DUYET: { label: "Đã duyệt", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  TU_CHOI: { label: "Đã từ chối", cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: XCircle },
  DA_HUY: { label: "Nhân viên đã hủy", cls: "bg-slate-100 text-slate-600 border-slate-200", Icon: X },
};

const FILTERS = [
  { id: "CHO_DUYET", label: "Chờ duyệt" },
  { id: "DA_DUYET", label: "Đã duyệt" },
  { id: "TU_CHOI", label: "Đã từ chối" },
  { id: "ALL", label: "Tất cả" },
];

const formatFieldValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "ngay_sinh") return formatDateVN(value);
  if (key === "gioi_tinh") return GENDER_LABELS[value] || value;
  return String(value);
};

/**
 * Duyệt yêu cầu cập nhật hồ sơ cá nhân do nhân viên gửi (quyền EMPLOYEE_UPDATE).
 * GET  /employees/manager/profile-requests?trang_thai=...
 * PUT  /employees/manager/profile-requests/{ma_yc}/review  {trang_thai, y_kien_duyet}
 */
export default function ProfileRequestsPanel({ userSession, onPendingCountChange }) {
  const access = getManagerAccess(userSession);
  const canReview = access.can("EMPLOYEE_UPDATE");

  const [filter, setFilter] = useState("CHO_DUYET");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [toast, setToast] = useState(null);

  // Hộp thoại duyệt / từ chối
  const [reviewTarget, setReviewTarget] = useState(null); // { request, decision: "DA_DUYET" | "TU_CHOI" }
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Giữ callback trong ref để không tải lại danh sách khi component cha render lại
  const countCallbackRef = useRef(onPendingCountChange);
  countCallbackRef.current = onPendingCountChange;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadRequests = useCallback(async () => {
    if (!canReview) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await apiClient.get("/employees/manager/profile-requests", {
        params: { trang_thai: filter === "ALL" ? undefined : filter },
      });
      const list = Array.isArray(data) ? data : [];
      setRequests(list);
      setForbidden(false);
      if (filter === "CHO_DUYET") countCallbackRef.current?.(list.length);
    } catch (err) {
      setRequests([]);
      if (isForbiddenError(err)) setForbidden(true);
      setLoadError(getApiErrorMessage(err, "Không tải được danh sách yêu cầu sửa hồ sơ."));
    } finally {
      setIsLoading(false);
    }
  }, [canReview, filter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const openReview = (request, decision) => {
    setReviewTarget({ request, decision });
    setReviewComment("");
    setReviewError("");
  };

  const closeReview = () => {
    if (isReviewing) return;
    setReviewTarget(null);
  };

  const handleConfirmReview = async () => {
    if (!reviewTarget) return;
    const { request, decision } = reviewTarget;
    const comment = reviewComment.trim();
    if (decision === "TU_CHOI" && !comment) {
      setReviewError("Vui lòng nhập lý do từ chối để phản hồi cho nhân viên.");
      return;
    }
    setIsReviewing(true);
    setReviewError("");
    try {
      await apiClient.put(`/employees/manager/profile-requests/${request.ma_yc}/review`, {
        trang_thai: decision,
        y_kien_duyet: comment || (decision === "DA_DUYET" ? "Đồng ý cập nhật hồ sơ" : undefined),
      });
      showToast(
        decision === "DA_DUYET"
          ? `Đã phê duyệt yêu cầu #${request.ma_yc}: hồ sơ của ${request.ho_ten || request.ma_nv} đã được cập nhật.`
          : `Đã từ chối yêu cầu #${request.ma_yc} của ${request.ho_ten || request.ma_nv}.`
      );
      setReviewTarget(null);
      await loadRequests();
    } catch (err) {
      setReviewError(getApiErrorMessage(err, "Không thể xử lý yêu cầu."));
    } finally {
      setIsReviewing(false);
    }
  };

  const pendingCount = useMemo(
    () => requests.filter((r) => r.trang_thai === "CHO_DUYET").length,
    [requests]
  );

  if (!canReview) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 flex flex-col items-center gap-3 text-center">
        <ShieldOff className="w-8 h-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">Bạn không có quyền duyệt yêu cầu sửa hồ sơ</p>
        <p className="text-xs text-slate-500 max-w-md">
          Chức năng này cần quyền <strong>Cập nhật hồ sơ nhân sự (EMPLOYEE_UPDATE)</strong>. Vui lòng liên hệ Quản lý
          hoặc Quản trị viên nếu bạn cần được cấp quyền.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* Tiêu đề */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <FilePen className="w-5 h-5 text-sky-600" />
            Yêu cầu sửa hồ sơ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhân viên không tự sửa hồ sơ trực tiếp: mọi thay đổi thông tin cá nhân, ngân hàng, thuế, BHXH đều cần Quản lý
            phê duyệt. Khi duyệt, hệ thống ghi đè giá trị mới vào hồ sơ.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          disabled={isLoading}
          className="self-start md:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl self-start" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === f.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {f.label}
            {f.id === "CHO_DUYET" && filter === "CHO_DUYET" && !isLoading && (
              <span className="ml-1.5 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {toast && (
        <div
          role="status"
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>
            {forbidden ? "Bạn không có quyền xem yêu cầu sửa hồ sơ. " : ""}
            {loadError}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-sky-600" />
          <span className="text-xs">Đang tải yêu cầu sửa hồ sơ...</span>
        </div>
      ) : !loadError && requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 py-14 flex flex-col items-center gap-2 text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-emerald-300" />
          <span className="text-xs font-semibold text-slate-600">
            {filter === "CHO_DUYET" ? "Không có yêu cầu nào đang chờ duyệt." : "Không có yêu cầu nào."}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((req) => {
            const meta = STATUS_META[req.trang_thai] || STATUS_META.CHO_DUYET;
            const StatusIcon = meta.Icon;
            const newInfo = req.thong_tin_moi || {};
            const oldInfo = req.thong_tin_cu || {};
            const fields = Object.keys(newInfo).filter((k) => PROFILE_FIELD_LABELS[k]);
            const isOwn = access.maNv && req.ma_nv === access.maNv;
            const isPending = req.trang_thai === "CHO_DUYET";

            return (
              <article
                key={req.ma_yc}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                <header className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-sky-600 text-xs">#{req.ma_yc}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {req.ho_ten || req.ma_nv}{" "}
                        <span className="font-mono text-[11px] font-semibold text-slate-400">({req.ma_nv})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {[req.ten_pb, req.ten_cv].filter(Boolean).join(" • ") || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
                    <span>Gửi lúc {formatDateTimeVN(req.ngay_tao)}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-bold ${meta.cls}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </div>
                </header>

                <div className="p-5 flex flex-col gap-4">
                  {/* Bảng so sánh giá trị cũ -> mới */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                    <table className="w-full text-left text-xs min-w-[520px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                          <th className="py-2 px-3 font-semibold w-48">Thông tin</th>
                          <th className="py-2 px-3 font-semibold">Giá trị hiện tại</th>
                          <th className="py-2 px-3 w-6" aria-hidden="true"></th>
                          <th className="py-2 px-3 font-semibold">Giá trị đề nghị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fields.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-3 px-3 text-slate-400 italic">
                              Yêu cầu không có trường thông tin hợp lệ.
                            </td>
                          </tr>
                        ) : (
                          fields.map((key) => (
                            <tr key={key}>
                              <td className="py-2 px-3 font-semibold text-slate-700">{PROFILE_FIELD_LABELS[key]}</td>
                              <td className="py-2 px-3 text-slate-500 line-through decoration-slate-300">
                                {formatFieldValue(key, oldInfo[key])}
                              </td>
                              <td className="py-2 px-1 text-slate-300" aria-hidden="true">
                                <ArrowRight className="w-3.5 h-3.5" />
                              </td>
                              <td className="py-2 px-3 font-semibold text-sky-800">{formatFieldValue(key, newInfo[key])}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-500">Lý do nhân viên đưa ra: </span>
                    <span className="text-slate-700">{req.ly_do || "Không ghi lý do"}</span>
                  </div>

                  {!isPending && (req.ten_nguoi_duyet || req.nguoi_duyet || req.y_kien_duyet) && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex flex-col gap-0.5 ${
                        req.trang_thai === "TU_CHOI"
                          ? "bg-rose-50/70 border-rose-200 text-rose-800"
                          : "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                      }`}
                    >
                      <span>
                        <strong>Người xử lý:</strong> {req.ten_nguoi_duyet || req.nguoi_duyet || "—"}
                        {req.ngay_duyet ? ` • ${formatDateTimeVN(req.ngay_duyet)}` : ""}
                      </span>
                      {req.y_kien_duyet && (
                        <span>
                          <strong>Ý kiến:</strong> {req.y_kien_duyet}
                        </span>
                      )}
                    </div>
                  )}

                  {isPending && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 pt-1">
                      {isOwn ? (
                        <span className="text-[11px] italic text-slate-500">
                          Đây là yêu cầu của chính bạn — cần một Quản lý khác phê duyệt.
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openReview(req, "TU_CHOI")}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            <span>Từ chối</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openReview(req, "DA_DUYET")}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Phê duyệt</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(reviewTarget)}
        tone={reviewTarget?.decision === "TU_CHOI" ? "danger" : "success"}
        title={
          reviewTarget?.decision === "TU_CHOI"
            ? `Từ chối yêu cầu #${reviewTarget?.request.ma_yc}`
            : `Phê duyệt yêu cầu #${reviewTarget?.request.ma_yc}`
        }
        description={
          reviewTarget?.decision === "TU_CHOI" ? (
            <>
              Hồ sơ của <strong>{reviewTarget?.request.ho_ten || reviewTarget?.request.ma_nv}</strong> sẽ giữ nguyên.
              Lý do từ chối được gửi lại cho nhân viên.
            </>
          ) : (
            <>
              Các giá trị đề nghị sẽ được ghi đè vào hồ sơ của{" "}
              <strong>{reviewTarget?.request.ho_ten || reviewTarget?.request.ma_nv}</strong> ngay sau khi duyệt.
            </>
          )
        }
        confirmLabel={reviewTarget?.decision === "TU_CHOI" ? "Xác nhận từ chối" : "Phê duyệt & cập nhật hồ sơ"}
        busy={isReviewing}
        error={reviewError}
        onCancel={closeReview}
        onConfirm={handleConfirmReview}
      >
        <label className="flex flex-col gap-1.5">
          <span className="font-bold text-slate-700">
            {reviewTarget?.decision === "TU_CHOI" ? (
              <>
                Lý do từ chối <span className="text-rose-500">*</span>
              </>
            ) : (
              "Ý kiến phê duyệt (không bắt buộc)"
            )}
          </span>
          <textarea
            rows={3}
            value={reviewComment}
            onChange={(e) => {
              setReviewComment(e.target.value);
              if (reviewError) setReviewError("");
            }}
            placeholder={
              reviewTarget?.decision === "TU_CHOI"
                ? "Ví dụ: Số tài khoản không khớp chủ tài khoản, vui lòng gửi lại kèm ảnh thẻ ngân hàng..."
                : "Ví dụ: Đã đối chiếu giấy tờ gốc"
            }
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none resize-none"
          />
        </label>
      </ConfirmDialog>
    </div>
  );
}
