-- =================================================================================
-- TÁCH QUẢN TRỊ HỆ THỐNG (ADMIN) KHỎI QUẢN LÝ NGHIỆP VỤ
-- Theo yêu cầu đồ án (mục II.2): giao diện Admin tách biệt với giao diện quản lý nhân sự;
-- Admin chỉ thêm / xóa / phân quyền tài khoản và xem, tìm kiếm, lọc, sắp xếp dữ liệu.
--   - Admin là nhân viên IT riêng (NV21), KHÔNG phải Tổng Giám đốc.
--   - Tổng Giám đốc (NV01) chuyển sang vai trò Quản lý, dùng Cổng Quản lý.
--   - Vai trò ADMIN chỉ giữ 3 quyền hệ thống: ACCOUNT_MANAGE, PERMISSION_ASSIGN, EMPLOYEE_VIEW.
--   - Nghiệp vụ tổ chức / hợp đồng (ORG_MANAGE, CONTRACT_MANAGE) chuyển cho Ban Giám đốc và Phòng Nhân sự.
-- - Docker tự chạy file này sau 00 → 05 khi khởi tạo CSDL mới.
-- - Với CSDL đang chạy: docker exec -i trungnguyen_hrm_lite sh -c
--     'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/06_tach_quan_tri_he_thong.sql
-- Chạy lại được nhiều lần.
-- =================================================================================

SET NAMES utf8mb4;
USE trungnguyen_hrm_lite;

-- ---------------------------------------------------------------------------------
-- 1. Nhân viên IT phụ trách quản trị hệ thống (Phòng IT, cấp trên: Trưởng phòng IT NV06)
-- ---------------------------------------------------------------------------------
INSERT IGNORE INTO nhan_vien (ma_nv, ho_ten, ngay_sinh, gioi_tinh, cccd, dia_chi, sdt, email,
  so_nguoi_pt, ma_pb, ma_cv, ma_bac, ma_nql, ngay_nghi_viec, trang_thai) VALUES
('NV21', 'Trương Quốc Bảo', '1993-05-19', 'Nam', '079093000021', 'Quận 5, TPHCM',
  '0903456781', 'baotq@trungnguyen.com', 0, 'PB06', 'CV02', 4, 'NV06', NULL, 'DANG_LAM');

INSERT INTO bang_cap (ma_nv, trinh_do, chuyen_nganh, noi_dao_tao, nam_tot_nghiep, xep_loai, ghi_chu)
SELECT 'NV21', 'DAI_HOC', 'Hệ thống Thông tin', 'ĐH Sài Gòn (SGU)', 2015, 'GIOI', 'Quản trị hệ thống'
WHERE NOT EXISTS (SELECT 1 FROM bang_cap WHERE ma_nv = 'NV21');

INSERT IGNORE INTO hop_dong_lao_dong (ma_hd, ma_nv, loai_hd, ngay_ky, ngay_bat_dau, ngay_ket_thuc,
  luong_co_ban, ty_le_huong, so_tai_khoan, ngan_hang, ma_so_thue, so_bhxh, trang_thai) VALUES
('HD-021', 'NV21', 'KHONG_XAC_DINH', '2019-07-01', '2019-07-01', NULL,
  10000000, 100.00, '1021234567', 'Vietcombank', '8093021021', '7119000021', 'HIEU_LUC');

-- Tài khoản Quản trị hệ thống (mật khẩu mẫu '1', tự băm bcrypt ở lần đăng nhập đầu)
INSERT INTO tai_khoan (ma_nv, mat_khau, ma_vai_tro, trang_thai)
VALUES ('NV21', '1', 'ADMIN', 'HOAT_DONG')
ON DUPLICATE KEY UPDATE ma_vai_tro = 'ADMIN', trang_thai = 'HOAT_DONG';

-- ---------------------------------------------------------------------------------
-- 2. Tổng Giám đốc là người quản lý nghiệp vụ, không phải quản trị hệ thống
-- ---------------------------------------------------------------------------------
UPDATE tai_khoan SET ma_vai_tro = 'QUAN_LY' WHERE ma_nv = 'NV01';

-- ---------------------------------------------------------------------------------
-- 3. Vai trò ADMIN chỉ giữ quyền hệ thống (backend cũng chặn cứng, xem app/core/roles.py)
-- ---------------------------------------------------------------------------------
DELETE FROM vai_tro_quyen
WHERE ma_vai_tro = 'ADMIN'
  AND ma_quyen NOT IN ('ACCOUNT_MANAGE', 'PERMISSION_ASSIGN', 'EMPLOYEE_VIEW');

INSERT IGNORE INTO vai_tro_quyen (ma_vai_tro, ma_quyen) VALUES
    ('ADMIN', 'ACCOUNT_MANAGE'),
    ('ADMIN', 'PERMISSION_ASSIGN'),
    ('ADMIN', 'EMPLOYEE_VIEW');

UPDATE vai_tro
SET mo_ta = 'Quản trị hệ thống (IT): cấp / xóa / khóa tài khoản, phân quyền; chỉ xem dữ liệu nghiệp vụ'
WHERE ma_vai_tro = 'ADMIN';

-- Tài khoản ADMIN không giữ quyền nghiệp vụ cấp riêng
DELETE tkq FROM tai_khoan_quyen tkq
JOIN tai_khoan tk ON tk.ma_tk = tkq.ma_tk
WHERE tk.ma_vai_tro = 'ADMIN';

-- ---------------------------------------------------------------------------------
-- 4. Quyền nghiệp vụ toàn công ty trước đây Admin (NV01) giữ, nay cấp đúng người:
--    - Tổng Giám đốc (NV01): duyệt bảng lương, cơ cấu tổ chức, hợp đồng
--    - Phòng Nhân sự (NV02 trưởng phòng, NV08 phó phòng): cơ cấu tổ chức, hợp đồng
-- ---------------------------------------------------------------------------------
INSERT INTO tai_khoan_quyen (ma_tk, ma_quyen, duoc_cap)
SELECT tk.ma_tk, q.ma_quyen, 1
FROM tai_khoan tk
JOIN (SELECT 'PAYROLL_MANAGE' AS ma_quyen UNION ALL SELECT 'ORG_MANAGE' UNION ALL SELECT 'CONTRACT_MANAGE') q
WHERE tk.ma_nv = 'NV01'
ON DUPLICATE KEY UPDATE duoc_cap = 1;

INSERT INTO tai_khoan_quyen (ma_tk, ma_quyen, duoc_cap)
SELECT tk.ma_tk, q.ma_quyen, 1
FROM tai_khoan tk
JOIN (SELECT 'ORG_MANAGE' AS ma_quyen UNION ALL SELECT 'CONTRACT_MANAGE') q
WHERE tk.ma_nv IN ('NV02', 'NV08')
ON DUPLICATE KEY UPDATE duoc_cap = 1;
