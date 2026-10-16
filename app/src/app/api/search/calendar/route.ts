import { NextRequest, NextResponse } from "next/server";
import { buildPriceCalendar, TtlCache, type CalendarDay } from "@/lib/flights/priceCalendar";
import { getActiveProvider } from "@/lib/flights/registry";
import { FlightSearchEngine } from "@/lib/flights/searchEngine";
import { clientKey } from "@/lib/rateLimit";
import { checkSearchRateLimit } from "@/lib/searchRateLimit";
import { validateSearchRequest } from "@/lib/validation/searchValidation";
import type { FlightSearchRequest } from "@/types/flight";

// Prices change through the day; 10 minutes keeps the strip fresh enough while
// sparing the provider repeat calls as people click between dates.
const cache = new TtlCache<CalendarDay[]>(10 * 60_000);

/** Today's date in Nigeria (UTC+1, no daylight saving). */
const lagosToday = () => new Date(Date.now() + 60 * 60_000).toISOString().slice(0, 10);

/**
 * POST /api/search/calendar
 *
 * Body: the same FlightSearchRequest as /api/search. Returns the cheapest
 * price for the chosen date and three days either side (past dates left
 * out). Counts as one search against the shared per-client rate limit.
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
  const validation = validateSearchRequest(body);
  if (!validation.valid) {
    return NextResponse.json({ error: "Invalid search request.", issues: validation.issues }, { status: 400 });
  }

  const r = body as FlightSearchRequest;
  const request: FlightSearchRequest = {
    origin: r.origin,
    destination: r.destination,
    departureDate: r.departureDate,
    returnDate: r.tripType === "return" ? r.returnDate : undefined,
    tripType: r.tripType,
    passengers: r.passengers,
    cabinClass: r.cabinClass,
  };
  const key = JSON.stringify(request);

  try {
    let days = cache.get(key);
    if (!days) {
      days = await buildPriceCalendar(new FlightSearchEngine(getActiveProvider()), request, lagosToday());
      cache.set(key, days);
    }
    return NextResponse.json({ days });
  } catch (err) {
    console.error("Unexpected error in /api/search/calendar:", err);
    return NextResponse.json({ error: "Couldn't load prices for nearby dates." }, { status: 500 });
  }
}
