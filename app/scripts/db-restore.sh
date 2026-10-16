#!/usr/bin/env bash
# Restores a db-backup.sh dump into an EMPTY database (e.g. when moving host).
#   TARGET_DATABASE_URL=... scripts/db-restore.sh skyfare-YYYYMMDDTHHMMSSZ.dump
set -euo pipefail
: "${TARGET_DATABASE_URL:?Set TARGET_DATABASE_URL to the destination database (direct connection)}"
dump="${1:?Pass the dump file to restore}"
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$TARGET_DATABASE_URL" "$dump"
echo "Restored $dump"
