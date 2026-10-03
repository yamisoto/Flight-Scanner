#!/usr/bin/env bash
# Vercel build: apply pending database migrations and refresh the reference
# data, then build the app. Database steps only run when one is connected.
# Preview and production share one Neon database (no per-preview branches),
# so migrations must stay backwards compatible with the deployed app.
set -euo pipefail

if [[ -n "${DATABASE_URL_UNPOOLED:-}" ]]; then
  echo "Applying database migrations..."
  npx prisma migrate deploy
  # Airports and airlines from src/lib/data; upserts by IATA code, safe to re-run.
  echo "Seeding reference data..."
  npx prisma db seed
else
  echo "No database connected (DATABASE_URL_UNPOOLED unset); skipping migrations."
fi

npx next build
