#!/usr/bin/env bash
# Full logical backup of the database in Postgres's portable custom format.
# Restores into any Postgres host (Neon, Supabase, RDS...) with db-restore.sh.
#   DATABASE_URL_UNPOOLED=... scripts/db-backup.sh [output-file]
set -euo pipefail
: "${DATABASE_URL_UNPOOLED:?Set DATABASE_URL_UNPOOLED to the direct (unpooled) connection string}"
out="${1:-skyfare-$(date -u +%Y%m%dT%H%M%SZ).dump}"
pg_dump --format=custom --no-owner --no-privileges --dbname="$DATABASE_URL_UNPOOLED" --file="$out"
echo "Backup written to $out"
