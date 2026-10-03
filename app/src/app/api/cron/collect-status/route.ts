import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/cron/collect-status
 *
 * Daily flight-status collection, meant to be triggered by Vercel Cron.
 * Vercel sends `Authorization: Bearer <CRON_SECRET>`; anything else is
 * rejected, and with no CRON_SECRET configured every request is rejected
 * (fail closed).
 *
 * Not wired up yet, deliberately: it needs a real source (AeroDataBox
 * adapter, built once its live responses can be checked) and a database
 * store (provider decision pending; see docs/DATABASE.md). Until both
 * exist it returns `skipped`. The pipeline itself lives in
 * src/lib/ingest/collectStatus.ts and is tested with fixture data.
 * Add the cron schedule to vercel.json only when it's ready to run.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const missing = [
    !process.env.AERODATABOX_API_KEY && "flight-status source (AERODATABOX_API_KEY)",
    !process.env.DATABASE_URL && "database (DATABASE_URL)",
  ].filter(Boolean);

  return NextResponse.json({
    status: "skipped",
    reason: missing.length
      ? `Not configured: ${missing.join(", ")}.`
      : "Source adapter not implemented yet; see docs/DATA_SOURCES.md.",
  });
}
