#!/usr/bin/env bash
#
# Tezkor Slide AI — OFF-SERVER backup.
#
# Nega kerak: Contabo (yoki istalgan VPS) puli tugab, akkaunt o'chsa —
# server + undagi barcha backup (Auto Backup ham) yo'qoladi. Shuning uchun
# backupni serverdan TASHQARIGA (Google Drive / Cloudflare R2 / S3) yuboramiz.
# Shunda server o'lsa ham, yangi serverga to'liq tiklab olasiz.
#
# Bir martalik sozlash (serverda root sifatida):
#   1) apt install -y rclone gzip
#   2) rclone config
#        - yangi remote yarating, nomini "backup" qo'ying
#        - Google Drive uchun: type = drive
#        - Cloudflare R2 / S3 uchun: type = s3
#   3) REMOTE_PATH ni o'zingizning remote/papkaga moslang (pastda)
#   4) Kunlik cron:
#        (crontab -l 2>/dev/null; echo "0 3 * * * /var/www/tezkor_slide_ai/scripts/backup-offsite.sh >> /var/log/tezkor-backup.log 2>&1") | crontab -
#
set -euo pipefail

# --- Sozlamalar ---------------------------------------------------------------
APP_DIR="/var/www/tezkor_slide_ai"
PG_CONTAINER="tezkor-postgres"
DB_USER="tezkor"
DB_NAME="tezkor_slide_ai"
REMOTE_PATH="backup:tezkor-backups"   # rclone remote nomi : papka
KEEP_LOCAL_DAYS=3                      # serverda vaqtincha nusxa (yuklab bo'lgach o'chadi)
RETENTION_DAYS=30                      # off-site'da qancha kun saqlash
# -----------------------------------------------------------------------------

DATE="$(date +%Y%m%d_%H%M%S)"
TMP="/root/backups"
mkdir -p "$TMP"

echo "▶ [1/4] PostgreSQL dump..."
docker exec "$PG_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$TMP/db_$DATE.sql.gz"

echo "▶ [2/4] Storage (generatsiya qilingan fayllar) arxivi..."
tar -czf "$TMP/storage_$DATE.tar.gz" -C "$APP_DIR" storage 2>/dev/null || echo "  (storage bo'sh yoki yo'q — o'tkazib yuborildi)"

echo "▶ [3/4] Off-site'ga yuklash ($REMOTE_PATH)..."
rclone copy "$TMP/db_$DATE.sql.gz" "$REMOTE_PATH/db/"
[ -f "$TMP/storage_$DATE.tar.gz" ] && rclone copy "$TMP/storage_$DATE.tar.gz" "$REMOTE_PATH/storage/"

echo "▶ [4/4] Eski nusxalarni tozalash..."
# Serverdagi vaqtinchalik nusxalar
find "$TMP" -name '*.gz' -mtime +$KEEP_LOCAL_DAYS -delete
# Off-site retention (rclone remote'da RETENTION_DAYS dan eskisini o'chiradi)
rclone delete --min-age "${RETENTION_DAYS}d" "$REMOTE_PATH/db/"      || true
rclone delete --min-age "${RETENTION_DAYS}d" "$REMOTE_PATH/storage/" || true

echo "✅ Off-site backup tayyor: $DATE"
