import { normaliseFlightNumber } from "@/lib/flights/schedule";
import { RetryableSourceError, type FlightStatus, type FlightStatusRecord, type FlightStatusSource } from "@/lib/ingest/types";

/**
 * FlightStatusSource for AeroDataBox (via RapidAPI), built against real
 * responses recorded on 3 Oct 2026 (tests/fixtures/aerodatabox/).
 *
 * What those responses showed, and this adapter assumes:
 * - Nigerian domestic flights come back with scheduled times only: status
 *   "Unknown", data quality "Basic", no revised or runway times. So this is a
 *   schedule source for now, not an on-time source; actual times are mapped
 *   if they ever appear.
 * - Airline names are unreliable (VK came back as "Anisec", UN as "Business
 *   Aviation Asia"), and some flights have no airline IATA code. The airline
 *   code is taken from the flight number and names come from our own table.
 * - The airport departures endpoint takes local times and at most 12 hours
 *   per call. Each call costs 2 API units; the free plan has 400 a month.
 */

const HOST = "aerodatabox.p.rapidapi.com";
const MAX_WINDOW_MS = 12 * 60 * 60_000;
/** Every Nigerian airport is on West Africa Time, UTC+1 with no daylight saving. */
const WAT_OFFSET_MS = 60 * 60_000;
const TIMEOUT_MS = 15_000;

interface AdbTime {
  utc?: string; // "2026-10-02 05:30Z"
  local?: string;
}

interface AdbMovement {
  scheduledTime?: AdbTime;
  revisedTime?: AdbTime;
  runwayTime?: AdbTime;
  airport?: { iata?: string; countryCode?: string };
}

export interface AdbFlight {
  number: string; // "P4 7120"
  status: string;
  isCargo?: boolean;
  departure: AdbMovement;
  arrival: AdbMovement;
  airline?: { name?: string; iata?: string };
}

const STATUS: Record<string, FlightStatus> = {
  Expected: "scheduled",
  CheckIn: "scheduled",
  Boarding: "scheduled",
  GateClosed: "scheduled",
  Delayed: "scheduled",
  Departed: "departed",
  EnRoute: "departed",
  Approaching: "departed",
  Arrived: "arrived",
  Canceled: "cancelled",
  CanceledUncertain: "cancelled",
  Diverted: "diverted",
};

/** "2026-10-02 05:30Z" -> "2026-10-02T05:30:00.000Z"; null if missing or unparseable. */
function toIsoUtc(t: AdbTime | undefined): string | null {
  if (!t?.utc) return null;
  const ms = Date.parse(t.utc.replace(" ", "T"));
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/**
 * Translates one airport's departures into FlightStatusRecords: domestic,
 * passenger flights only. Pure, so it's tested directly against the
 * recorded responses.
 */
export function parseDepartures(origin: string, flights: AdbFlight[], fetchedAtUtc: string): FlightStatusRecord[] {
  const records: FlightStatusRecord[] = [];
  for (const f of flights) {
    const destination = f.arrival.airport?.iata;
    const scheduled = toIsoUtc(f.departure.scheduledTime);
    if (f.isCargo || f.arrival.airport?.countryCode?.toLowerCase() !== "ng" || !destination || !scheduled) continue;

    const flightNumber = normaliseFlightNumber(f.number);
    const status = STATUS[f.status] ?? "unknown";
    const left = status === "departed" || status === "arrived" || status === "diverted";
    records.push({
      flightNumber,
      airlineIata: flightNumber.slice(0, 2),
      origin,
      destination,
      scheduledDepartureUtc: scheduled,
      // Runway time is the real wheels-off; the revised time only counts once the flight has actually left.
      actualDepartureUtc: toIsoUtc(f.departure.runwayTime) ?? (left ? toIsoUtc(f.departure.revisedTime) : null),
      status,
      source: "aerodatabox",
      fetchedAtUtc,
    });
  }
  return records;
}

/** Splits [from, to) into windows of at most 12 hours, as the API requires. */
export function splitWindows(fromUtc: Date, toUtc: Date): [Date, Date][] {
  const windows: [Date, Date][] = [];
  for (let start = fromUtc.getTime(); start < toUtc.getTime(); start += MAX_WINDOW_MS) {
    windows.push([new Date(start), new Date(Math.min(start + MAX_WINDOW_MS, toUtc.getTime()))]);
  }
  return windows;
}

/** UTC instant -> the "YYYY-MM-DDTHH:mm" local time the API expects. */
const localParam = (d: Date) => new Date(d.getTime() + WAT_OFFSET_MS).toISOString().slice(0, 16);

export class AeroDataBoxStatusSource implements FlightStatusSource {
  readonly name = "aerodatabox";

  constructor(
    private readonly apiKey: string,
    private readonly fetchFn: typeof fetch = fetch,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async fetchDepartures(airportIata: string, fromUtc: Date, toUtc: Date): Promise<FlightStatusRecord[]> {
    const records: FlightStatusRecord[] = [];
    for (const [start, end] of splitWindows(fromUtc, toUtc)) {
      const flights = await this.request(airportIata, start, end);
      records.push(...parseDepartures(airportIata, flights, this.now().toISOString()));
    }
    // Keep the contract's [from, to) whatever the API does at window edges.
    return records.filter((r) => {
      const t = Date.parse(r.scheduledDepartureUtc);
      return t >= fromUtc.getTime() && t < toUtc.getTime();
    });
  }

  private async request(airport: string, start: Date, end: Date): Promise<AdbFlight[]> {
    // End one minute short so back-to-back windows don't overlap.
    const url =
      `https://${HOST}/flights/airports/iata/${encodeURIComponent(airport)}/${localParam(start)}/${localParam(new Date(end.getTime() - 60_000))}` +
      "?withLeg=true&direction=Departure&withCancelled=true&withCodeshared=false&withCargo=false&withPrivate=false&withLocation=false";

    let res: Response;
    try {
      res = await this.fetchFn(url, {
        headers: { "X-RapidAPI-Key": this.apiKey, "X-RapidAPI-Host": HOST },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new RetryableSourceError(`AeroDataBox request failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (res.status === 204) return []; // no flights in the window
    if (res.status === 429 || res.status >= 500) throw new RetryableSourceError(`AeroDataBox returned ${res.status}`);
    if (!res.ok) throw new Error(`AeroDataBox returned ${res.status} for ${airport}`);

    const body = (await res.json()) as { departures?: AdbFlight[] };
    return Array.isArray(body.departures) ? body.departures : [];
  }
}
