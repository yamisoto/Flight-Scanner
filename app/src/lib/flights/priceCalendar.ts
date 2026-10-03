import type { FlightSearchEngine } from "@/lib/flights/searchEngine";
import { ProviderError, type FlightSearchRequest } from "@/types/flight";

export interface CalendarDay {
  date: string; // YYYY-MM-DD departure date
  /** Cheapest price that day in NGN; null when no flights or the lookup failed. */
  cheapest: number | null;
}

const DAY_MS = 86_400_000;
export const shiftDate = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/**
 * Cheapest price for the chosen date and up to `span` days either side.
 * Past dates are left out. For a return trip both dates move together, so
 * the trip length stays the same. Lookups run in parallel; one failing day
 * shows as null rather than failing the whole strip.
 */
export async function buildPriceCalendar(
  engine: FlightSearchEngine,
  request: FlightSearchRequest,
  today: string,
  span = 3,
): Promise<CalendarDay[]> {
  const offsets = Array.from({ length: span * 2 + 1 }, (_, i) => i - span).filter((d) => shiftDate(request.departureDate, d) >= today);

  return Promise.all(
    offsets.map(async (d): Promise<CalendarDay> => {
      const day: FlightSearchRequest = {
        ...request,
        departureDate: shiftDate(request.departureDate, d),
        returnDate: request.returnDate ? shiftDate(request.returnDate, d) : undefined,
      };
      try {
        const offers = await engine.search(day);
        return { date: day.departureDate, cheapest: offers.length ? Math.min(...offers.map((o) => o.price.amount)) : null };
      } catch (err) {
        if (!(err instanceof ProviderError)) throw err;
        return { date: day.departureDate, cheapest: null };
      }
    }),
  );
}

/** Small in-memory cache so flicking between dates doesn't repeat provider calls. Per server instance. */
export class TtlCache<V> {
  private entries = new Map<string, { value: V; expires: number }>();
  constructor(private readonly ttlMs: number, private readonly maxEntries = 500, private readonly now: () => number = Date.now) {}

  get(key: string): V | undefined {
    const e = this.entries.get(key);
    if (!e) return undefined;
    if (e.expires <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, value: V) {
    if (this.entries.size >= this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(key, { value, expires: this.now() + this.ttlMs });
  }
}
