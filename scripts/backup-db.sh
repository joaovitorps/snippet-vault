#!/bin/sh
# Daily cron: backs up the SQLite database, keeps the last 7 copies.
# Run this on the Droplet host (not inside the container).
#
# Cron entry (run `crontab -e` on the Droplet):
#   0 3 * * * /path/to/snippet-vault/scripts/backup-db.sh

DB_PATH="/app/data/snippetvault.db"
BACKUP_DIR="/app/backups"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "[$(date)] DB file not found at $DB_PATH — skipping backup" >&2
  exit 0
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/snippetvault_$TIMESTAMP.db"

sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
echo "[$(date)] Backup created: $BACKUP_FILE"

# Prune: keep only the 7 most recent backups
ls -t "$BACKUP_DIR"/snippetvault_*.db 2>/dev/null \
  | tail -n +8 \
  | while read -r old_backup; do
      rm -f "$old_backup"
      echo "[$(date)] Pruned old backup: $old_backup"
    done
