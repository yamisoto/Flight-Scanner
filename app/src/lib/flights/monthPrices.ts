import type { CalendarDay } from "@/lib/flights/priceCalendar";
import type { FlightSearchEngine } from "@/lib/flights/searchEngine";
import { ProviderError, type CabinClass, type FlightSearchRequest } from "@/types/flight";

export type PriceTier = "low" | "mid" | "high";

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Every date in a YYYY-MM month, as YYYY-MM-DD. Empty for a malformed month. */
export function monthDays(month: string): string[] {
  const m = month.match(MONTH);
  if (!m) return [];
  const days = new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).getUTCDate();
  return Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

/** "2026-10" + n months. */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/**
 * Colour band for each priced day, relative to the rest of the month: the
 * cheapest third "low", the dearest third "high", the rest "mid". If every
 * priced day costs the same, they're all "mid". Unpriced days get no band.
 */
export function priceTiers(days: CalendarDay[]): Map<string, PriceTier> {
  const priced = days.filter((d): d is { date: string; cheapest: number } => d.cheapest !== null);
  const tiers = new Map<string, PriceTier>();
  if (priced.length === 0) return tiers;
  const sorted = priced.map((d) => d.cheapest).sort((a, b) => a - b);
  const n = sorted.length;
  const lowCut = sorted[Math.floor((n - 1) / 3)];
  const highCut = sorted[Math.ceil((2 * (n - 1)) / 3)];
  const allSame = sorted[0] === sorted[n - 1];
  for (const d of priced) {
    tiers.set(d.date, allSame ? "mid" : d.cheapest <= lowCut ? "low" : d.cheapest >= highCut ? "high" : "mid");
  }
  return tiers;
}

export interface MonthPriceQuery {
  origin: string;
  destination: string;
  month: string; // YYYY-MM
  adults: number;
  cabinClass: CabinClass;
}

const CONCURRENCY = 8;

/**
 * Cheapest one-way fare for each remaining day of a month (days before
 * `today` are left out). Runs a search per day, a few at a time; a day whose
 * lookup fails shows as null rather than failing the month.
 */
export async function buildMonthPrices(engine: FlightSearchEngine, q: MonthPriceQuery, today: string): Promise<CalendarDay[]> {
  const dates = monthDays(q.month).filter((d) => d >= today);
  const out: CalendarDay[] = new Array(dates.length);
  let next = 0;
  async function worker() {
    while (next < dates.length) {
      const i = next++;
      const request: FlightSearchRequest = {
        origin: q.origin,
        destination: q.destination,
        departureDate: dates[i],
        tripType: "one_way",
        passengers: { adults: q.adults, children: 0, infants: 0 },
        cabinClass: q.cabinClass,
      };
      try {
        const offers = await engine.search(request);
        out[i] = { date: dates[i], cheapest: offers.length ? Math.min(...offers.map((o) => o.price.amount)) : null };
      } catch (err) {
        if (!(err instanceof ProviderError)) throw err;
        out[i] = { date: dates[i], cheapest: null };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, dates.length) }, worker));
  return out;
}
