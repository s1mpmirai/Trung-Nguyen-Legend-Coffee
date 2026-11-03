-- =================================================================================
-- XÓA HẲN CÁC PHÒNG BAN ĐÃ NGỪNG HOẠT ĐỘNG
-- - Xóa khỏi CSDL các phòng ban có trang_thai = 0 (Ngừng hoạt động) và KHÔNG còn hồ sơ nhân sự nào
--   (kể cả nhân sự đã nghỉ việc), nên không mất lịch sử nhân sự, chấm công, bảng lương.
-- - Ở thời điểm viết: PB04 Marketing, PB05 Kinh doanh, PB07 Xưởng Sản xuất,
--   PB08 Kinh doanh Miền Bắc (đã ngừng và chuyển hết nhân sự ở 07_vai_tro_theo_phong_ban.sql).
-- - Phòng ban ngừng hoạt động nhưng vẫn còn hồ sơ nhân sự trỏ tới thì được giữ lại (xóa mềm).
-- - Docker tự chạy file này sau 00 → 08 khi khởi tạo CSDL mới.
-- - Với CSDL đang chạy (nên sao lưu trước bằng database/backup/backup.sh): docker exec -i trungnguyen_hrm_lite sh -c
--     'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/09_xoa_phong_ban_ngung_hoat_dong.sql
-- Chạy lại được nhiều lần.
-- =================================================================================

SET NAMES utf8mb4;
USE trungnguyen_hrm_lite;

START TRANSACTION;

DELETE pb FROM phong_ban pb
WHERE pb.trang_thai = 0
  AND NOT EXISTS (SELECT 1 FROM nhan_vien nv WHERE nv.ma_pb = pb.ma_pb);

COMMIT;
