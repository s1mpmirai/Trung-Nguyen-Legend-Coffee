-- =================================================================================
-- LƯU TỶ LỆ HƯỞNG LƯƠNG VÀO BẢNG LƯƠNG + CHUYỂN HỢP ĐỒNG QUÁ HẠN SANG "HẾT HẠN"
-- - bang_luong.ty_le_huong: tỷ lệ hưởng (%) của hợp đồng đã dùng khi tính lương tháng đó,
--   để phiếu lương in đúng tỷ lệ thực trả (thử việc 85–100%, chính thức 100%) thay vì luôn ghi 85%.
--   Bảng lương cũ: điền 85 cho bảng lương thử việc, 100 cho bảng lương chính thức.
-- - Hợp đồng đã qua ngày kết thúc mà vẫn ghi Hiệu lực được chuyển sang Hết hạn
--   (từ nay máy chủ tự làm việc này mỗi giờ).
-- - Docker tự chạy file này sau 00 → 09 khi khởi tạo CSDL mới.
-- - Với CSDL đang chạy (nên sao lưu trước bằng database/backup/backup.sh): docker exec -i trungnguyen_hrm_lite sh -c
--     'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/10_ty_le_huong_bang_luong.sql
-- Chạy lại được nhiều lần.
-- =================================================================================

SET NAMES utf8mb4;
USE trungnguyen_hrm_lite;

ALTER TABLE bang_luong
    ADD COLUMN IF NOT EXISTS ty_le_huong DECIMAL(5,2) NULL
        COMMENT 'Tỷ lệ hưởng lương (%) của hợp đồng dùng khi tính lương tháng này' AFTER he_so_luong;

START TRANSACTION;

UPDATE bang_luong
SET ty_le_huong = CASE WHEN ghi_chu LIKE 'Thử việc%' THEN 85.00 ELSE 100.00 END
WHERE ty_le_huong IS NULL;

UPDATE hop_dong_lao_dong
SET trang_thai = 'HET_HAN'
WHERE trang_thai = 'HIEU_LUC' AND ngay_ket_thuc IS NOT NULL AND ngay_ket_thuc < CURDATE();

COMMIT;
