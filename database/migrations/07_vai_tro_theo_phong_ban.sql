-- =================================================================================
-- VAI TRÒ THEO PHÒNG BAN NGHIỆP VỤ + THU GỌN CƠ CẤU CÒN 4 PHÒNG
-- - Bỏ vai trò chung chung QUAN_LY / TRUONG_NHOM, thay bằng vai trò theo phòng ban:
--     ADMIN         Phòng IT – quản trị hệ thống (giữ nguyên)
--     BAN_GIAM_DOC  Ban Giám đốc – xem toàn công ty, báo cáo, duyệt đơn, duyệt bảng lương
--     NHAN_SU       Phòng Nhân sự – hồ sơ, hợp đồng, cơ cấu tổ chức, chấm công / chốt công, duyệt đơn
--     KE_TOAN       Phòng Kế toán – tính lương, xác nhận chi trả
--     NHAN_VIEN     Mọi nhân sự còn lại
-- - Tách quyền lương: PAYROLL_MANAGE = Tính lương & xác nhận chi trả (Kế toán),
--   PAYROLL_APPROVE = Duyệt / trả bảng lương về Nháp (Ban Giám đốc).
-- - Quy trình lương: Kế toán (NV11) lập → Ban Giám đốc (NV01) duyệt → Kế toán xác nhận chi trả;
--   riêng bảng lương của Ban Giám đốc do Kế toán trưởng NV03 duyệt (cấp riêng PAYROLL_APPROVE,
--   backend chỉ cho NV03 duyệt bảng lương của thành viên Ban Giám đốc).
-- - Ngừng 4 phòng Marketing, Kinh doanh, Xưởng Sản xuất, Kinh doanh Miền Bắc;
--   toàn bộ nhân sự của 4 phòng này chuyển về Phòng Nhân sự, cấp trên trực tiếp là NV02.
--   Chức vụ, bậc lương, hợp đồng giữ nguyên; phòng ban chỉ xóa mềm để giữ lịch sử.
-- - Docker tự chạy file này sau 00 → 06 khi khởi tạo CSDL mới.
-- - Với CSDL đang chạy (nên sao lưu trước): docker exec -i trungnguyen_hrm_lite sh -c
--     'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/07_vai_tro_theo_phong_ban.sql
-- Chạy lại được nhiều lần.
-- =================================================================================

SET NAMES utf8mb4;
USE trungnguyen_hrm_lite;

START TRANSACTION;

-- ---------------------------------------------------------------------------------
-- 0. Tách quyền tính lương và duyệt lương
-- ---------------------------------------------------------------------------------
INSERT INTO quyen (ma_quyen, ten_quyen, nhom_quyen, mo_ta) VALUES
    ('PAYROLL_APPROVE', 'Duyệt bảng lương', 'LUONG', 'Duyệt bảng lương tháng hoặc trả về Nháp để tính lại')
ON DUPLICATE KEY UPDATE ten_quyen = VALUES(ten_quyen), nhom_quyen = VALUES(nhom_quyen), mo_ta = VALUES(mo_ta);

UPDATE quyen
SET ten_quyen = 'Tính lương', mo_ta = 'Tính bảng lương tháng từ bảng công đã chốt và xác nhận chi trả'
WHERE ma_quyen = 'PAYROLL_MANAGE';

-- ---------------------------------------------------------------------------------
-- 1. Vai trò mới
-- ---------------------------------------------------------------------------------
INSERT INTO vai_tro (ma_vai_tro, ten_vai_tro, mo_ta, he_thong) VALUES
    ('BAN_GIAM_DOC', 'Ban Giám đốc',  'Xem toàn công ty, báo cáo, duyệt đơn và duyệt bảng lương (không tính lương)', 1),
    ('NHAN_SU',      'Phòng Nhân sự', 'Hồ sơ nhân sự, hợp đồng, cơ cấu tổ chức, chấm công / chốt công, duyệt đơn', 1),
    ('KE_TOAN',      'Phòng Kế toán', 'Tính lương, đối soát bảng công, xác nhận chi trả lương (không duyệt lương)', 1)
ON DUPLICATE KEY UPDATE ten_vai_tro = VALUES(ten_vai_tro), mo_ta = VALUES(mo_ta), he_thong = 1;

UPDATE vai_tro
SET ten_vai_tro = 'Quản trị hệ thống (Phòng IT)'
WHERE ma_vai_tro = 'ADMIN';

-- ---------------------------------------------------------------------------------
-- 2. Quyền mặc định của từng vai trò (mọi vai trò đều giữ quyền cá nhân của Nhân viên)
-- ---------------------------------------------------------------------------------
DELETE FROM vai_tro_quyen WHERE ma_vai_tro IN ('BAN_GIAM_DOC', 'NHAN_SU', 'KE_TOAN', 'NHAN_VIEN');

INSERT INTO vai_tro_quyen (ma_vai_tro, ma_quyen) VALUES
    -- Nhân viên: quyền cá nhân
    ('NHAN_VIEN', 'LEAVE_VIEW'), ('NHAN_VIEN', 'LEAVE_CREATE'), ('NHAN_VIEN', 'PAYROLL_VIEW'),

    -- Ban Giám đốc
    ('BAN_GIAM_DOC', 'LEAVE_VIEW'), ('BAN_GIAM_DOC', 'LEAVE_CREATE'), ('BAN_GIAM_DOC', 'PAYROLL_VIEW'),
    ('BAN_GIAM_DOC', 'EMPLOYEE_VIEW'), ('BAN_GIAM_DOC', 'LEAVE_APPROVE'),
    ('BAN_GIAM_DOC', 'PAYROLL_APPROVE'), ('BAN_GIAM_DOC', 'REPORT_VIEW'),

    -- Phòng Nhân sự
    ('NHAN_SU', 'LEAVE_VIEW'), ('NHAN_SU', 'LEAVE_CREATE'), ('NHAN_SU', 'PAYROLL_VIEW'),
    ('NHAN_SU', 'EMPLOYEE_VIEW'), ('NHAN_SU', 'EMPLOYEE_CREATE'), ('NHAN_SU', 'EMPLOYEE_UPDATE'),
    ('NHAN_SU', 'EMPLOYEE_DELETE'), ('NHAN_SU', 'CONTRACT_MANAGE'), ('NHAN_SU', 'ORG_MANAGE'),
    ('NHAN_SU', 'ATTENDANCE_MANAGE'), ('NHAN_SU', 'ATTENDANCE_LOCK'), ('NHAN_SU', 'LEAVE_APPROVE'),
    ('NHAN_SU', 'REPORT_VIEW'),

    -- Phòng Kế toán
    ('KE_TOAN', 'LEAVE_VIEW'), ('KE_TOAN', 'LEAVE_CREATE'), ('KE_TOAN', 'PAYROLL_VIEW'),
    ('KE_TOAN', 'EMPLOYEE_VIEW'), ('KE_TOAN', 'PAYROLL_MANAGE');

-- ---------------------------------------------------------------------------------
-- 3. Gán vai trò cho tài khoản
-- ---------------------------------------------------------------------------------
-- Kế toán viên NV11 cần tài khoản để lập bảng lương (mật khẩu mẫu '1', tự băm ở lần đăng nhập đầu)
INSERT IGNORE INTO tai_khoan (ma_nv, mat_khau, ma_vai_tro, trang_thai)
VALUES ('NV11', '1', 'KE_TOAN', 'HOAT_DONG');

UPDATE tai_khoan SET ma_vai_tro = 'BAN_GIAM_DOC' WHERE ma_nv = 'NV01';
UPDATE tai_khoan SET ma_vai_tro = 'NHAN_SU'      WHERE ma_nv IN ('NV02', 'NV08');
UPDATE tai_khoan SET ma_vai_tro = 'KE_TOAN'      WHERE ma_nv IN ('NV03', 'NV11');

-- Trưởng phòng / trưởng nhóm các bộ phận khác (và mọi tài khoản còn mang vai trò cũ) thành Nhân viên
UPDATE tai_khoan SET ma_vai_tro = 'NHAN_VIEN' WHERE ma_vai_tro IN ('QUAN_LY', 'TRUONG_NHOM');

-- ---------------------------------------------------------------------------------
-- 4. Thu hồi quyền cấp riêng trước đây (nay đã nằm trong vai trò, hoặc không còn đúng nghiệp vụ)
-- ---------------------------------------------------------------------------------
DELETE tkq FROM tai_khoan_quyen tkq
JOIN tai_khoan tk ON tk.ma_tk = tkq.ma_tk
WHERE (tk.ma_nv = 'NV01' AND tkq.ma_quyen IN ('PAYROLL_MANAGE', 'ORG_MANAGE', 'CONTRACT_MANAGE'))
   OR (tk.ma_nv IN ('NV02', 'NV08') AND tkq.ma_quyen IN ('ATTENDANCE_LOCK', 'ORG_MANAGE', 'CONTRACT_MANAGE'))
   OR (tk.ma_nv = 'NV03' AND tkq.ma_quyen = 'PAYROLL_MANAGE')
   OR (tk.ma_nv = 'NV09' AND tkq.ma_quyen = 'EMPLOYEE_CREATE');

-- Quyền cấp riêng trùng với quyền mặc định của vai trò thì không cần lưu riêng nữa
DELETE tkq FROM tai_khoan_quyen tkq
JOIN tai_khoan tk ON tk.ma_tk = tkq.ma_tk
JOIN vai_tro_quyen vtq ON vtq.ma_vai_tro = tk.ma_vai_tro AND vtq.ma_quyen = tkq.ma_quyen
WHERE tkq.duoc_cap = 1;

-- Kế toán trưởng NV03 duyệt bảng lương của Ban Giám đốc (Tổng Giám đốc không tự duyệt lương mình)
INSERT INTO tai_khoan_quyen (ma_tk, ma_quyen, duoc_cap)
SELECT ma_tk, 'PAYROLL_APPROVE', 1 FROM tai_khoan WHERE ma_nv = 'NV03'
ON DUPLICATE KEY UPDATE duoc_cap = 1;

-- ---------------------------------------------------------------------------------
-- 5. Bỏ vai trò cũ (vai_tro_quyen tự xóa theo ON DELETE CASCADE)
-- ---------------------------------------------------------------------------------
DELETE FROM vai_tro WHERE ma_vai_tro IN ('QUAN_LY', 'TRUONG_NHOM');

-- ---------------------------------------------------------------------------------
-- 6. Thu gọn cơ cấu: chuyển nhân sự 4 phòng về Phòng Nhân sự rồi ngừng 4 phòng
-- ---------------------------------------------------------------------------------
UPDATE nhan_vien
SET ma_pb = 'PB02',
    ma_nql = 'NV02'
WHERE ma_pb IN ('PB04', 'PB05', 'PB07', 'PB08');

UPDATE phong_ban
SET trang_thai = 0,
    ma_truong_pb = NULL
WHERE ma_pb IN ('PB04', 'PB05', 'PB07', 'PB08');

COMMIT;
