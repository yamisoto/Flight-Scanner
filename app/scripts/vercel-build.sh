#!/usr/bin/env bash
# Vercel build: apply pending database migrations, then build the app.
# Migrations only run when a database is connected. With the Neon Vercel
# integration each preview deployment gets its own database branch, so a
# preview never migrates the production database.
set -euo pipefail

if [[ -n "${DATABASE_URL_UNPOOLED:-}" ]]; then
  echo "Applying database migrations..."
  npx prisma migrate deploy
else
  echo "No database connected (DATABASE_URL_UNPOOLED unset); skipping migrations."
fi

npx next build
