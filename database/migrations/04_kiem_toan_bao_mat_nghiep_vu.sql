-- =================================================================================
-- KHẮC PHỤC SAU KIỂM TOÁN (BẢO MẬT + NGHIỆP VỤ HRM) - chạy được nhiều lần (idempotent)
-- - Docker tự chạy file này sau 00 → 03 khi khởi tạo CSDL mới.
-- - Với CSDL đang chạy: docker exec -i trungnguyen_hrm_lite sh -c
--     'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/04_kiem_toan_bao_mat_nghiep_vu.sql
-- BẮT BUỘC chạy trước khi khởi động backend phiên bản mới (backend đọc các cột/bảng thêm ở đây).
-- =================================================================================

SET NAMES utf8mb4;
USE trungnguyen_hrm_lite;

-- ---------------------------------------------------------------------------------
-- 1. Tài khoản: cờ bắt buộc đổi mật khẩu tạm ở lần đăng nhập đầu
--    (tài khoản Admin cấp mới hoặc được Admin đặt lại mật khẩu)
-- ---------------------------------------------------------------------------------
ALTER TABLE tai_khoan
    ADD COLUMN IF NOT EXISTS phai_doi_mat_khau TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '1 = đang dùng mật khẩu tạm, phải đổi khi đăng nhập' AFTER trang_thai;

-- ---------------------------------------------------------------------------------
-- 2. Nhân viên: lý do thôi việc (ngay_nghi_viec có thể ở tương lai = lịch thôi việc)
-- ---------------------------------------------------------------------------------
ALTER TABLE nhan_vien
    ADD COLUMN IF NOT EXISTS ly_do_nghi_viec VARCHAR(255) NULL
        COMMENT 'Lý do thôi việc / số đơn xin nghỉ việc' AFTER ngay_nghi_viec;

ALTER TABLE nhan_vien DROP CONSTRAINT IF EXISTS ck_nv_so_nguoi_pt;
ALTER TABLE nhan_vien ADD CONSTRAINT ck_nv_so_nguoi_pt CHECK (so_nguoi_pt >= 0);

-- ---------------------------------------------------------------------------------
-- 3. Nhật ký điều chỉnh công: ghi người sửa và toàn bộ trường thay đổi (cũ → mới)
-- ---------------------------------------------------------------------------------
ALTER TABLE lich_su_dieu_chinh_cong
    ADD COLUMN IF NOT EXISTS nguoi_dieu_chinh VARCHAR(10) NULL COMMENT 'Mã NV quản lý thực hiện sửa' AFTER ly_do,
    ADD COLUMN IF NOT EXISTS noi_dung JSON NULL COMMENT 'Các trường thay đổi: {truong: {cu, moi}}' AFTER nguoi_dieu_chinh;

ALTER TABLE lich_su_dieu_chinh_cong
    ADD CONSTRAINT fk_ls_nguoi_dieu_chinh FOREIGN KEY IF NOT EXISTS (nguoi_dieu_chinh)
        REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE SET NULL;

-- ---------------------------------------------------------------------------------
-- 4. Ngày lễ, Tết hưởng nguyên lương (Điều 112 BLLĐ 2019): không tính vào công chuẩn
--    Cập nhật theo thông báo lịch nghỉ hằng năm của Bộ Nội vụ / Bộ LĐ-TB&XH.
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ngay_le (
    ngay DATE PRIMARY KEY,
    ten_ngay_le VARCHAR(150) NOT NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Ngày nghỉ lễ, Tết hưởng nguyên lương';

INSERT IGNORE INTO ngay_le (ngay, ten_ngay_le) VALUES
    ('2026-01-01', 'Tết Dương lịch'),
    ('2026-02-16', 'Tết Nguyên đán Bính Ngọ'),
    ('2026-02-17', 'Tết Nguyên đán Bính Ngọ'),
    ('2026-02-18', 'Tết Nguyên đán Bính Ngọ'),
    ('2026-02-19', 'Tết Nguyên đán Bính Ngọ'),
    ('2026-02-20', 'Tết Nguyên đán Bính Ngọ'),
    ('2026-04-27', 'Giỗ Tổ Hùng Vương (nghỉ bù cho Chủ nhật 26/4)'),
    ('2026-04-30', 'Ngày Chiến thắng'),
    ('2026-05-01', 'Ngày Quốc tế Lao động'),
    ('2026-09-01', 'Quốc khánh'),
    ('2026-09-02', 'Quốc khánh'),
    ('2027-01-01', 'Tết Dương lịch');

-- ---------------------------------------------------------------------------------
-- 5. Ma trận 16 quyền chức năng
-- ---------------------------------------------------------------------------------
INSERT IGNORE INTO quyen (ma_quyen, ten_quyen, nhom_quyen, mo_ta) VALUES
    ('REPORT_VIEW',     'Xem báo cáo nhân sự',          'BAO_CAO',   'Báo cáo biến động tháng và cơ cấu trình độ - lương - thâm niên'),
    ('ATTENDANCE_LOCK', 'Chốt / mở khóa công tháng',    'CHAM_CONG', 'Chốt bảng công trước khi tính lương, mở khóa khi lương chưa duyệt'),
    ('CONTRACT_MANAGE', 'Quản lý hợp đồng lao động',    'NHAN_SU',   'Xem, ký mới, gia hạn, thanh lý hợp đồng lao động'),
    ('ORG_MANAGE',      'Quản lý cơ cấu tổ chức',       'TO_CHUC',   'Thêm, sửa, ngừng phòng ban, chức vụ và thang bậc lương');

-- ADMIN luôn có toàn bộ quyền (hiển thị đủ 16/16 trên ma trận)
INSERT IGNORE INTO vai_tro_quyen (ma_vai_tro, ma_quyen)
SELECT 'ADMIN', ma_quyen FROM quyen;

-- Quản lý nhân sự: xem báo cáo và chốt công. Trưởng nhóm: xem báo cáo (không chốt công).
INSERT IGNORE INTO vai_tro_quyen (ma_vai_tro, ma_quyen) VALUES
    ('QUAN_LY', 'REPORT_VIEW'),
    ('QUAN_LY', 'ATTENDANCE_LOCK'),
    ('TRUONG_NHOM', 'REPORT_VIEW');

-- ---------------------------------------------------------------------------------
-- 6. Không cho xóa cứng nhân sự kéo theo lịch sử công / lương / thuế / hợp đồng
--    (ứng dụng chỉ xóa mềm; RESTRICT chặn cả lệnh DELETE thủ công)
-- ---------------------------------------------------------------------------------
ALTER TABLE bang_cap DROP FOREIGN KEY IF EXISTS fk_bc_nhanvien;
ALTER TABLE bang_cap ADD CONSTRAINT fk_bc_nhanvien FOREIGN KEY (ma_nv)
    REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE hop_dong_lao_dong DROP FOREIGN KEY IF EXISTS fk_hd_nhanvien;
ALTER TABLE hop_dong_lao_dong ADD CONSTRAINT fk_hd_nhanvien FOREIGN KEY (ma_nv)
    REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE don_tu DROP FOREIGN KEY IF EXISTS fk_don_nhanvien;
ALTER TABLE don_tu ADD CONSTRAINT fk_don_nhanvien FOREIGN KEY (ma_nv)
    REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE bang_cham_cong DROP FOREIGN KEY IF EXISTS fk_cc_nhanvien;
ALTER TABLE bang_cham_cong ADD CONSTRAINT fk_cc_nhanvien FOREIGN KEY (ma_nv)
    REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE lich_su_dieu_chinh_cong DROP FOREIGN KEY IF EXISTS fk_ls_cc;
ALTER TABLE lich_su_dieu_chinh_cong ADD CONSTRAINT fk_ls_cc FOREIGN KEY (ma_cc)
    REFERENCES bang_cham_cong(ma_cc) ON DELETE RESTRICT;

ALTER TABLE lich_su_dieu_chinh_cong DROP FOREIGN KEY IF EXISTS fk_ls_nv;
ALTER TABLE lich_su_dieu_chinh_cong ADD CONSTRAINT fk_ls_nv FOREIGN KEY (ma_nv)
    REFERENCES nhan_vien(ma_nv) ON DELETE RESTRICT;

ALTER TABLE yeu_cau_cap_nhat_ho_so DROP FOREIGN KEY IF EXISTS fk_yc_nhanvien;
ALTER TABLE yeu_cau_cap_nhat_ho_so ADD CONSTRAINT fk_yc_nhanvien FOREIGN KEY (ma_nv)
    REFERENCES nhan_vien(ma_nv) ON DELETE RESTRICT;

ALTER TABLE bang_luong DROP FOREIGN KEY IF EXISTS fk_bl_nhanvien;
ALTER TABLE bang_luong ADD CONSTRAINT fk_bl_nhanvien FOREIGN KEY (ma_nv)
    REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE bang_luong
    ADD COLUMN IF NOT EXISTS giam_tru_gia_canh DECIMAL(12,0) DEFAULT 0 AFTER bhtn,
    ADD COLUMN IF NOT EXISTS thu_nhap_tinh_thue DECIMAL(12,0) DEFAULT 0 AFTER giam_tru_gia_canh;

ALTER TABLE tai_khoan DROP FOREIGN KEY IF EXISTS fk_tk_nhanvien;
ALTER TABLE tai_khoan ADD CONSTRAINT fk_tk_nhanvien FOREIGN KEY (ma_nv)
    REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE RESTRICT;

-- Ngừng chức vụ là xóa mềm; không để xóa cứng chức vụ cuốn theo thang lương đang dùng
ALTER TABLE chuc_vu
    ADD COLUMN IF NOT EXISTS trang_thai TINYINT(1) NOT NULL DEFAULT 1
        COMMENT '1=Đang áp dụng, 0=Ngừng sử dụng' AFTER mo_ta;

ALTER TABLE bac_luong DROP FOREIGN KEY IF EXISTS fk_bl_chucvu;
ALTER TABLE bac_luong ADD CONSTRAINT fk_bl_chucvu FOREIGN KEY (ma_cv)
    REFERENCES chuc_vu(ma_cv) ON UPDATE CASCADE ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------------
-- 7. 3NF: bậc lương của nhân sự phải thuộc đúng chức vụ của nhân sự
--    (nhan_vien.ma_cv phụ thuộc bắc cầu qua ma_bac → bac_luong.ma_cv; FK phức hợp giữ hai cột khớp nhau)
-- ---------------------------------------------------------------------------------
ALTER TABLE bac_luong ADD UNIQUE KEY IF NOT EXISTS uq_bac_luong_bac_cv (ma_bac, ma_cv);

ALTER TABLE nhan_vien
    ADD CONSTRAINT fk_nv_bac_thuoc_chuc_vu FOREIGN KEY IF NOT EXISTS (ma_bac, ma_cv)
        REFERENCES bac_luong(ma_bac, ma_cv) ON UPDATE CASCADE ON DELETE RESTRICT;
