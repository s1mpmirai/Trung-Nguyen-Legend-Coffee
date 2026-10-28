-- =================================================================================
-- XÓA MỀM PHÒNG BAN / CHỨC VỤ / HỢP ĐỒNG - chạy được nhiều lần (idempotent)
-- Không xóa bản ghi khỏi CSDL, chỉ đổi trạng thái để giữ lịch sử nhân sự, chấm công, bảng lương.
-- - Phòng ban: phong_ban.trang_thai = 0 (Ngừng hoạt động) - cột đã có sẵn
-- - Chức vụ:   chuc_vu.trang_thai  = 0 (Ngừng sử dụng)
-- - Hợp đồng:  hop_dong_lao_dong.trang_thai = 'DA_HUY' (Đã hủy, không tính vào thâm niên / lương)
-- Với CSDL đang chạy: docker exec -i trungnguyen_hrm_lite sh -c
--     'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/02_xoa_mem_danh_muc.sql
-- =================================================================================

SET NAMES utf8mb4;
USE trungnguyen_hrm_lite;

ALTER TABLE chuc_vu
    ADD COLUMN IF NOT EXISTS trang_thai TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1: Đang sử dụng, 0: Ngừng sử dụng' AFTER mo_ta;

ALTER TABLE hop_dong_lao_dong
    MODIFY trang_thai ENUM('HIEU_LUC', 'HET_HAN', 'DA_THANH_LY', 'TAM_HOAN', 'DA_HUY') DEFAULT 'HIEU_LUC';
