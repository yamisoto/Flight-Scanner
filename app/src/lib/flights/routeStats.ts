import { findAirlineByIata } from "@/lib/data/airlines";
import { getPrisma } from "@/lib/db/client";
import { normaliseFlightNumber } from "@/lib/flights/schedule";

/** Nigeria (West Africa Time) is UTC+1 all year. */
const WAT_OFFSET_MS = 60 * 60_000;
const LOOKBACK_DAYS = 21;

export interface RouteObservation {
  flightNumber: string;
  airlineIata: string;
  scheduledDepartureUtc: Date;
}

export interface RouteAirlineSummary {
  airlineCode: string;
  airlineName: string;
  /** Average scheduled departures a day over the days observed. */
  flightsPerDay: number;
  /** Earliest and latest scheduled departure, Lagos time ("06:30"). */
  firstDeparture: string;
  lastDeparture: string;
}

export interface RouteSummary {
  daysObserved: number;
  flightsPerDay: number;
  airlines: RouteAirlineSummary[];
}

const localTime = (d: Date) => new Date(d.getTime() + WAT_OFFSET_MS).toISOString().slice(11, 16);
const localDate = (d: Date) => new Date(d.getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Summarises collected schedule observations for one route: which airlines
 * fly it, how often, and their first and last departures of the day. Pure,
 * so it's unit tested; null when there's nothing to summarise.
 */
export function summariseRoute(observations: RouteObservation[]): RouteSummary | null {
  if (observations.length === 0) return null;
  const days = new Set(observations.map((o) => localDate(o.scheduledDepartureUtc)));
  const byAirline = new Map<string, { flights: Set<string>; times: string[] }>();
  for (const o of observations) {
    const entry = byAirline.get(o.airlineIata) ?? { flights: new Set<string>(), times: [] };
    entry.flights.add(`${normaliseFlightNumber(o.flightNumber)}|${localDate(o.scheduledDepartureUtc)}`);
    entry.times.push(localTime(o.scheduledDepartureUtc));
    byAirline.set(o.airlineIata, entry);
  }
  const airlines = [...byAirline.entries()]
    .map(([code, { flights, times }]) => {
      times.sort();
      return {
        airlineCode: code,
        // Codes not in our airline table (e.g. W1, EW in the AeroDataBox data) are shown as unconfirmed, never guessed.
        airlineName: findAirlineByIata(code)?.name ?? `Unconfirmed airline (${code})`,
        flightsPerDay: round1(flights.size / days.size),
        firstDeparture: times[0],
        lastDeparture: times[times.length - 1],
      };
    })
    .sort((a, b) => b.flightsPerDay - a.flightsPerDay || a.airlineName.localeCompare(b.airlineName));
  return {
    daysObserved: days.size,
    flightsPerDay: round1(airlines.reduce((sum, a) => sum + a.flightsPerDay, 0)),
    airlines,
  };
}

/**
 * Route summary from the last three weeks of collected schedules. Returns
 * null with no database, no data yet, or on any database error: route pages
 * must still build and render without it.
 */
export async function getRouteSummary(origin: string, destination: string, now = new Date()): Promise<RouteSummary | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const rows = await getPrisma().flightStatusObservation.findMany({
      where: { origin, destination, scheduledDepartureUtc: { gte: new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000), lt: now } },
      select: { flightNumber: true, airlineIata: true, scheduledDepartureUtc: true },
    });
    return summariseRoute(rows);
  } catch (err) {
    console.error(JSON.stringify({ level: "warn", event: "route_summary_failed", origin, destination, error: String(err) }));
    return null;
  }
}
