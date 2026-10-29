#!/usr/bin/env sh
# Sao lưu CSDL HRM (MariaDB trong Docker) ra file .sql.gz có dấu thời gian.
# Dùng: sh database/backup/backup.sh [so_ngay_giu_lai]   (mặc định giữ 7 ngày)
# Lập lịch hằng ngày 23:00 (Linux/macOS): crontab -e
#   0 23 * * * cd /duong/dan/du-an && sh database/backup/backup.sh >> database/backup/files/backup.log 2>&1
set -eu

CONTAINER="${CONTAINER:-trungnguyen_hrm_lite}"
DATABASE="${DATABASE:-trungnguyen_hrm_lite}"
KEEP_DAYS="${1:-7}"
OUTPUT_DIR="$(cd "$(dirname "$0")" && pwd)/files"
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="$OUTPUT_DIR/hrm_${DATABASE}_${STAMP}.sql.gz"

if [ "$(docker ps --filter "name=^${CONTAINER}$" --format '{{.Names}}')" != "$CONTAINER" ]; then
    echo "Container '$CONTAINER' chưa chạy. Hãy chạy 'docker compose up -d db' trước." >&2
    exit 1
fi

mkdir -p "$OUTPUT_DIR"
echo "[1/3] Dump CSDL '$DATABASE'..."
docker exec "$CONTAINER" sh -c "mariadb-dump -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --single-transaction --routines --triggers --events --default-character-set=utf8mb4 --databases $DATABASE" | gzip > "$FILE"

if [ "$(wc -c < "$FILE")" -lt 1024 ]; then
    echo "File sao lưu quá nhỏ, có thể dump bị lỗi: $FILE" >&2
    exit 1
fi

echo "[2/3] Xóa bản sao lưu cũ hơn $KEEP_DAYS ngày..."
find "$OUTPUT_DIR" -name 'hrm_*.sql.gz' -mtime +"$KEEP_DAYS" -print -delete

echo "[3/3] Hoàn tất: $FILE"
