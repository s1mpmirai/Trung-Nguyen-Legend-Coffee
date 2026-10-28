-- =================================================================================
-- KHÓA NGOẠI NGƯỜI CHỐT CÔNG - chạy được nhiều lần (idempotent)
-- chot_cong_thang.nguoi_chot lưu mã nhân viên (quản lý) thực hiện chốt/mở khóa công tháng.
-- - Đổi kiểu về VARCHAR(10) cho khớp nhan_vien.ma_nv
-- - Thêm FK tới nhan_vien(ma_nv): xóa nhân viên thì giữ bản ghi chốt công, nguoi_chot = NULL
-- Với CSDL đang chạy: docker exec -i trungnguyen_hrm_lite sh -c
--     'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/03_fk_chot_cong_thang.sql
-- =================================================================================

SET NAMES utf8mb4;
USE trungnguyen_hrm_lite;

-- Dọn các giá trị không phải mã nhân viên hợp lệ (vd: "Quản lý") trước khi thêm FK
UPDATE chot_cong_thang
SET nguoi_chot = NULL
WHERE nguoi_chot IS NOT NULL
  AND nguoi_chot NOT IN (SELECT ma_nv FROM nhan_vien);

ALTER TABLE chot_cong_thang
    MODIFY nguoi_chot VARCHAR(10) NULL COMMENT 'Mã nhân viên thực hiện chốt/mở khóa';

ALTER TABLE chot_cong_thang
    ADD CONSTRAINT fk_chot_nguoichot FOREIGN KEY IF NOT EXISTS (nguoi_chot)
        REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE SET NULL;
