#!/usr/bin/env sh
# Phục hồi CSDL HRM từ file .sql.gz hoặc .sql do backup.sh tạo ra. GHI ĐÈ dữ liệu hiện tại.
# Dùng: sh database/backup/restore.sh database/backup/files/hrm_trungnguyen_hrm_lite_20261028_230000.sql.gz
set -eu

CONTAINER="${CONTAINER:-trungnguyen_hrm_lite}"
FILE="${1:?Thiếu đường dẫn file sao lưu}"
[ -f "$FILE" ] || { echo "Không tìm thấy file: $FILE" >&2; exit 1; }

printf 'Thao tác này GHI ĐÈ toàn bộ dữ liệu hiện tại. Gõ PHUC HOI để tiếp tục: '
read -r ANSWER
[ "$ANSWER" = "PHUC HOI" ] || { echo "Đã hủy."; exit 1; }

echo "[0/2] Sao lưu an toàn dữ liệu hiện tại..."
sh "$(dirname "$0")/backup.sh" 3650

echo "[1/2] Đang phục hồi từ $FILE ..."
case "$FILE" in
    *.gz) gunzip -c "$FILE" ;;
    *) cat "$FILE" ;;
esac | docker exec -i "$CONTAINER" sh -c "mariadb -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --default-character-set=utf8mb4"

echo "[2/2] Số bản ghi sau phục hồi:"
docker exec "$CONTAINER" sh -c "mariadb -uroot -p\"\$MYSQL_ROOT_PASSWORD\" -N -e \"SELECT 'nhan_vien', COUNT(*) FROM trungnguyen_hrm_lite.nhan_vien UNION ALL SELECT 'bang_luong', COUNT(*) FROM trungnguyen_hrm_lite.bang_luong\""
echo "Phục hồi hoàn tất."
