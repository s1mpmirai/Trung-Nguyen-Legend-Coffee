import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useToast – quản lý thông báo nổi (tự ẩn sau `duration` ms, hủy hẹn giờ khi rời trang).
 * Trả về { toast, showToast(message, type), hideToast }
 */
export default function useToast(duration = 4000) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message, type = "info") => {
      clearTimeout(timerRef.current);
      setToast({ message, type });
      timerRef.current = setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { toast, showToast, hideToast };
}
