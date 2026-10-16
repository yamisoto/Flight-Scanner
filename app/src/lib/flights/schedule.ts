import type { FlightOffer, ScheduleCoverage, ScheduledFlight } from "@/types/flight";

/**
 * "Every flight on this route": compare the flights known to operate
 * (schedule) with the flights a price provider returned (offers). Pure
 * functions; the sources are wired up in scheduleSource.ts.
 */

/** "P4 7120", "p47120" and "P4-07120" all normalise to "P47120". */
export function normaliseFlightNumber(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = s.match(/^([A-Z0-9]{2})0*(\d{1,4})$/);
  return m ? `${m[1]}${m[2]}` : s;
}

const MATCH_WINDOW_MS = 15 * 60_000;

/** A scheduled flight is priced if an offer has the same flight number, or the same airline leaving within 15 minutes. */
export function buildCoverage(schedule: ScheduledFlight[], offers: FlightOffer[], source: string): ScheduleCoverage {
  const outbound = offers.map((o) => o.slices[0].segments[0]);
  const isPriced = (f: ScheduledFlight) =>
    outbound.some(
      (seg) =>
        normaliseFlightNumber(seg.flightNumber) === normaliseFlightNumber(f.flightNumber) ||
        (seg.airlineCode === f.airlineCode && Math.abs(Date.parse(seg.departureAt) - Date.parse(f.departureAt)) <= MATCH_WINDOW_MS),
    );

  // One entry per flight even if the schedule lists it twice.
  const unique = new Map<string, ScheduledFlight>();
  for (const f of schedule) unique.set(normaliseFlightNumber(f.flightNumber), f);
  const flights = [...unique.values()];
  const unpriced = flights.filter((f) => !isPriced(f)).sort((a, b) => a.departureAt.localeCompare(b.departureAt));

  return { source, totalFlights: flights.length, pricedFlights: flights.length - unpriced.length, unpriced };
}

export interface ObservedDeparture {
  flightNumber: string;
  airlineIata: string;
  airlineName: string;
  origin: string;
  destination: string;
  scheduledDepartureUtc: Date;
  status: string;
}

/** Nigeria (West Africa Time) is UTC+1 all year, with no daylight saving. */
const WAT_OFFSET_MS = 60 * 60_000;

/**
 * Expected schedule for a future date from recent history: flights seen on
 * the same route on the same weekday (Nigerian local time), in the last
 * `lookbackDays` days, placed on the requested date at their most recent
 * scheduled local time. Times come back as local time encoded as UTC, the
 * convention FlightSegment uses. Cancelled-only flights still count
 * (they're scheduled; reliability handles the cancellations).
 */
export function projectSchedule(observations: ObservedDeparture[], date: string, lookbackDays = 21, now = new Date()): ScheduledFlight[] {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const since = now.getTime() - lookbackDays * 86_400_000;
  const latest = new Map<string, ObservedDeparture>();
  for (const o of observations) {
    const t = o.scheduledDepartureUtc.getTime();
    if (t < since || new Date(t + WAT_OFFSET_MS).getUTCDay() !== weekday) continue;
    const key = normaliseFlightNumber(o.flightNumber);
    const prev = latest.get(key);
    if (!prev || t > prev.scheduledDepartureUtc.getTime()) latest.set(key, o);
  }
  return [...latest.values()]
    .map((o) => ({
      airlineCode: o.airlineIata,
      airlineName: o.airlineName,
      flightNumber: normaliseFlightNumber(o.flightNumber),
      origin: o.origin,
      destination: o.destination,
      departureAt: `${date}T${new Date(o.scheduledDepartureUtc.getTime() + WAT_OFFSET_MS).toISOString().slice(11)}`,
    }))
    .sort((a, b) => a.departureAt.localeCompare(b.departureAt));
}
