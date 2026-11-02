-- =================================================================================
-- GỬI DUYỆT BẢNG LƯƠNG
-- Quy trình: Kế toán tính lương (NHAP) → bấm "Gửi duyệt" (CHO_DUYET, khóa không tính lại được)
--   → Ban Giám đốc duyệt (DA_DUYET) hoặc trả về Kế toán (NHAP) → Kế toán xác nhận chi trả (DA_TRA).
-- - Docker tự chạy file này sau 00 → 07 khi khởi tạo CSDL mới.
-- - Với CSDL đang chạy: docker exec -i trungnguyen_hrm_lite sh -c
--     'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/08_gui_duyet_bang_luong.sql
-- Chạy lại được nhiều lần.
-- =================================================================================

SET NAMES utf8mb4;
USE trungnguyen_hrm_lite;

ALTER TABLE bang_luong
    MODIFY trang_thai ENUM('NHAP', 'CHO_DUYET', 'DA_DUYET', 'DA_TRA') DEFAULT 'NHAP';

ALTER TABLE bang_luong
    ADD COLUMN IF NOT EXISTS nguoi_gui VARCHAR(10) NULL
        COMMENT 'Mã nhân viên Kế toán gửi bảng lương sang Ban Giám đốc duyệt' AFTER nguoi_duyet,
    ADD COLUMN IF NOT EXISTS ngay_gui DATETIME NULL
        COMMENT 'Thời điểm gửi duyệt' AFTER nguoi_gui;

ALTER TABLE bang_luong
    ADD CONSTRAINT fk_bl_nguoigui FOREIGN KEY IF NOT EXISTS (nguoi_gui)
        REFERENCES nhan_vien (ma_nv) ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE quyen
SET mo_ta = 'Tính bảng lương tháng từ bảng công đã chốt, gửi Ban Giám đốc duyệt và xác nhận chi trả'
WHERE ma_quyen = 'PAYROLL_MANAGE';

UPDATE quyen
SET mo_ta = 'Duyệt bảng lương Kế toán đã gửi hoặc trả về Kế toán để tính lại'
WHERE ma_quyen = 'PAYROLL_APPROVE';
