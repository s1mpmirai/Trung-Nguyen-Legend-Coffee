-- =================================================================================
-- PHẠM VI PHÂN QUYỀN + TÁCH NHIỆM VỤ BẢNG LƯƠNG
-- - Docker tự chạy file này sau 00 → 04 khi khởi tạo CSDL mới.
-- - Với CSDL đang chạy: docker exec -i trungnguyen_hrm_lite sh -c
--     'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/05_pham_vi_phan_quyen.sql
-- Chạy lại được nhiều lần. Lưu ý: mục 2 đưa ma trận của QUAN_LY về mặc định mới,
-- nếu Admin đã bật lại PAYROLL_MANAGE / ATTENDANCE_LOCK cho QUAN_LY thì sẽ bị gỡ.
-- =================================================================================

SET NAMES utf8mb4;
USE trungnguyen_hrm_lite;

-- ---------------------------------------------------------------------------------
-- 1. Bảng lương: ghi người lập và người duyệt để chặn "tự lập - tự duyệt"
-- ---------------------------------------------------------------------------------
ALTER TABLE bang_luong
    ADD COLUMN IF NOT EXISTS nguoi_lap VARCHAR(10) NULL
        COMMENT 'Mã nhân viên bấm tính lương lần gần nhất' AFTER ghi_chu,
    ADD COLUMN IF NOT EXISTS nguoi_duyet VARCHAR(10) NULL
        COMMENT 'Mã nhân viên duyệt bảng lương' AFTER nguoi_lap;

ALTER TABLE bang_luong
    ADD CONSTRAINT fk_bl_nguoilap FOREIGN KEY IF NOT EXISTS (nguoi_lap)
        REFERENCES nhan_vien (ma_nv) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT fk_bl_nguoiduyet FOREIGN KEY IF NOT EXISTS (nguoi_duyet)
        REFERENCES nhan_vien (ma_nv) ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------------
-- 2. Quản lý (trưởng phòng) không còn mặc định tính lương / chốt công toàn công ty.
--    Hai quyền này có tác dụng toàn công ty nên cấp riêng cho đúng bộ phận.
-- ---------------------------------------------------------------------------------
DELETE FROM vai_tro_quyen
WHERE ma_vai_tro = 'QUAN_LY' AND ma_quyen IN ('PAYROLL_MANAGE', 'ATTENDANCE_LOCK');

-- Phòng Kế toán – Tài chính (NV03) tính lương; Admin (NV01) duyệt
INSERT INTO tai_khoan_quyen (ma_tk, ma_quyen, duoc_cap)
SELECT ma_tk, 'PAYROLL_MANAGE', 1 FROM tai_khoan WHERE ma_nv = 'NV03'
ON DUPLICATE KEY UPDATE duoc_cap = 1;

-- Phòng Nhân sự (NV02 trưởng phòng, NV08 phó phòng) chốt công tháng
INSERT INTO tai_khoan_quyen (ma_tk, ma_quyen, duoc_cap)
SELECT ma_tk, 'ATTENDANCE_LOCK', 1 FROM tai_khoan WHERE ma_nv IN ('NV02', 'NV08')
ON DUPLICATE KEY UPDATE duoc_cap = 1;
