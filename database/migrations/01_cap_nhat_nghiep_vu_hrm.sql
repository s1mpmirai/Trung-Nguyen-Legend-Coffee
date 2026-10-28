-- =================================================================================
-- CẬP NHẬT NGHIỆP VỤ HRM (PHẦN III) - chạy được nhiều lần (idempotent)
-- - Docker tự chạy file này sau 00_full_hrm_lite.sql khi khởi tạo CSDL mới.
-- - Với CSDL đang chạy: docker exec -i trungnguyen_hrm_lite sh -c
--     'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/01_cap_nhat_nghiep_vu_hrm.sql
-- =================================================================================

SET NAMES utf8mb4;
USE trungnguyen_hrm_lite;

-- 1. Loại công "Nghỉ không lương" khi duyệt đơn NGHI_KHONG_LUONG
ALTER TABLE bang_cham_cong
    MODIFY loai_cong ENUM('CONG_DU', 'DI_TRE', 'VE_SOM', 'NUA_CONG', 'NGHI_PHEP', 'NGHI_OM', 'NGHI_THAI_SAN',
                          'NGHI_KHONG_LUONG', 'NGHI_KHONG_PHEP', 'NGHI_LE', 'CUOI_TUAN') DEFAULT 'CONG_DU';

-- 2. Bảng lương lưu đủ các thành phần để nhân viên xem được cách tính lương
ALTER TABLE bang_luong
    ADD COLUMN IF NOT EXISTS so_gio_tang_ca DECIMAL(5,2) DEFAULT 0 AFTER so_cong_thuc_te,
    ADD COLUMN IF NOT EXISTS tien_tang_ca DECIMAL(12,0) DEFAULT 0 AFTER luong_theo_cong,
    ADD COLUMN IF NOT EXISTS giam_tru_gia_canh DECIMAL(12,0) DEFAULT 0 AFTER bhtn,
    ADD COLUMN IF NOT EXISTS thu_nhap_tinh_thue DECIMAL(12,0) DEFAULT 0 AFTER giam_tru_gia_canh;

-- 3. Quản lý được xóa (cho thôi việc) nhân sự và cấp quyền cho nhân sự
INSERT IGNORE INTO vai_tro_quyen (ma_vai_tro, ma_quyen) VALUES
    ('QUAN_LY', 'EMPLOYEE_DELETE'),
    ('QUAN_LY', 'PERMISSION_ASSIGN');
