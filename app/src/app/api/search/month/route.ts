import { NextRequest, NextResponse } from "next/server";
import { isKnownAirport } from "@/lib/data/airports";
import { addMonths, buildMonthPrices, type MonthPriceQuery } from "@/lib/flights/monthPrices";
import { TtlCache, type CalendarDay } from "@/lib/flights/priceCalendar";
import { getActiveProvider } from "@/lib/flights/registry";
import { FlightSearchEngine } from "@/lib/flights/searchEngine";
import { clientKey } from "@/lib/rateLimit";
import { checkSearchRateLimit } from "@/lib/searchRateLimit";
import type { CabinClass } from "@/types/flight";

// A month is up to 31 provider searches, so cache generously.
const cache = new TtlCache<CalendarDay[]>(30 * 60_000);
const CABINS: CabinClass[] = ["economy", "premium_economy", "business", "first"];
const MONTHS_AHEAD = 11;

/** Today's date in Nigeria (UTC+1, no daylight saving). */
const lagosToday = () => new Date(Date.now() + 60 * 60_000).toISOString().slice(0, 10);

function parse(body: unknown, today: string): MonthPriceQuery | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const origin = String(b.origin ?? "").toUpperCase();
  const destination = String(b.destination ?? "").toUpperCase();
  const month = String(b.month ?? "");
  const adults = Number(b.adults ?? 1);
  const cabinClass = (b.cabinClass ?? "economy") as CabinClass;
  const thisMonth = today.slice(0, 7);
  if (!isKnownAirport(origin) || !isKnownAirport(destination) || origin === destination) return null;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month < thisMonth || month > addMonths(thisMonth, MONTHS_AHEAD)) return null;
  if (!Number.isInteger(adults) || adults < 1 || adults > 9 || !CABINS.includes(cabinClass)) return null;
  return { origin, destination, month, adults, cabinClass };
}

/**
 * POST /api/search/month
 *
 * Body: { origin, destination, month: "YYYY-MM", adults?, cabinClass? }.
 * Returns the cheapest one-way fare for each remaining day of the month,
 * for the colour-coded date picker. Counts as one search against the
 * shared rate limit; cached 30 minutes.
 */
export async function POST(req: NextRequest) {
  const rate = checkSearchRateLimit(clientKey(req.headers));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many searches. Please wait a moment and try again.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const today = lagosToday();
  const query = parse(body, today);
  if (!query) return NextResponse.json({ error: "Invalid month price request." }, { status: 400 });

  const key = JSON.stringify(query);
  try {
    let days = cache.get(key);
    if (!days) {
      days = await buildMonthPrices(new FlightSearchEngine(getActiveProvider()), query, today);
      cache.set(key, days);
    }
    return NextResponse.json({ days });
  } catch (err) {
    console.error("Unexpected error in /api/search/month:", err);
    return NextResponse.json({ error: "Couldn't load prices for this month." }, { status: 500 });
  }
}
