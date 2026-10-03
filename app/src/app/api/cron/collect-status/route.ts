import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db/client";
import { AeroDataBoxStatusSource } from "@/lib/ingest/aeroDataBoxSource";
import { runStatusCollection } from "@/lib/ingest/collectStatus";
import { collectionAirports, previousLagosDay } from "@/lib/ingest/collectionSettings";
import { PrismaFlightStatusStore } from "@/lib/ingest/prismaStore";

function isAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/cron/collect-status
 *
 * Daily flight-status collection, triggered by Vercel Cron. Vercel sends
 * `Authorization: Bearer <CRON_SECRET>`; anything else is rejected, and with
 * no CRON_SECRET configured every request is rejected (fail closed).
 *
 * Collects the previous Lagos day's departures from STATUS_AIRPORTS via
 * AeroDataBox into the database. AeroDataBox currently returns scheduled
 * times only for Nigerian domestic flights, so this builds the "every
 * flight on this route" schedule; it is not yet a source of on-time data
 * (see docs/DATA_SOURCES.md). Returns `skipped` until the API key and the
 * database are both configured.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.AERODATABOX_API_KEY;
  const missing = [!apiKey && "flight-status source (AERODATABOX_API_KEY)", !process.env.DATABASE_URL && "database (DATABASE_URL)"].filter(Boolean);
  if (!apiKey || missing.length) {
    return NextResponse.json({ status: "skipped", reason: `Not configured: ${missing.join(", ")}.` });
  }

  const summary = await runStatusCollection({
    source: new AeroDataBoxStatusSource(apiKey),
    store: new PrismaFlightStatusStore(getPrisma()),
    airports: collectionAirports(),
    ...previousLagosDay(),
  });
  const failedAll = summary.airportsSucceeded.length === 0 && summary.airportsFailed.length > 0;
  return NextResponse.json({ status: failedAll ? "failed" : "ok", summary }, { status: failedAll ? 502 : 200 });
}

// Two airports x two 12-hour windows, with retries, fits comfortably; allow headroom.
export const maxDuration = 60;
