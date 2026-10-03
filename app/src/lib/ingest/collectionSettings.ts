import { isKnownAirport } from "@/lib/data/airports";

/**
 * Airports to collect, from STATUS_AIRPORTS (comma-separated IATA codes).
 * Defaults to the two hubs. Each airport costs 2 AeroDataBox calls (4 API
 * units) a day, so the default uses about 240 of the free plan's 400 units
 * a month. Add airports only with a bigger plan.
 */
export function collectionAirports(env = process.env.STATUS_AIRPORTS): string[] {
  const codes = (env ?? "LOS,ABV").split(",").map((c) => c.trim().toUpperCase());
  return [...new Set(codes.filter(isKnownAirport))];
}

/** The previous full day in Lagos time (UTC+1): [yesterday 00:00, today 00:00) local, as UTC instants. */
export function previousLagosDay(now = new Date()): { fromUtc: Date; toUtc: Date } {
  const local = new Date(now.getTime() + 60 * 60_000);
  const toUtc = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - 60 * 60_000);
  return { fromUtc: new Date(toUtc.getTime() - 86_400_000), toUtc };
}
