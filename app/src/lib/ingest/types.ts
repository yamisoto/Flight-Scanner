/**
 * Shared shapes for flight-status collection: the raw material for route-level
 * reliability scores. Provider-agnostic, like src/types/flight.ts: a source
 * adapter (e.g. AeroDataBox, once its real responses are confirmed) translates
 * its own format into FlightStatusRecord.
 */

export type FlightStatus = "scheduled" | "departed" | "arrived" | "cancelled" | "diverted" | "unknown";

export interface FlightStatusRecord {
  /** Marketing flight number without spaces, e.g. "P47120". */
  flightNumber: string;
  airlineIata: string;
  origin: string; // IATA
  destination: string; // IATA
  scheduledDepartureUtc: string; // ISO datetime
  /** Actual (or best revised) departure time; null if not departed or unknown. */
  actualDepartureUtc: string | null;
  status: FlightStatus;
  /** Which source produced the record, e.g. "fixture". */
  source: string;
  fetchedAtUtc: string;
}

export interface FlightStatusSource {
  readonly name: string;
  /** Departures from one airport whose scheduled time falls in [fromUtc, toUtc). */
  fetchDepartures(airportIata: string, fromUtc: Date, toUtc: Date): Promise<FlightStatusRecord[]>;
}

export interface FlightStatusStore {
  /** Inserts or updates records; the same flight seen again replaces the earlier version. Returns how many were written. */
  upsert(records: FlightStatusRecord[]): Promise<number>;
}

/** Thrown by a source for failures worth retrying (timeouts, 429, 5xx). Anything else fails the airport immediately. */
export class RetryableSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableSourceError";
  }
}

/** One flight on one day from one origin. Used to de-duplicate overlapping fetch windows. */
export function recordKey(r: Pick<FlightStatusRecord, "flightNumber" | "origin" | "scheduledDepartureUtc">): string {
  return `${r.flightNumber}|${r.origin}|${r.scheduledDepartureUtc.slice(0, 10)}`;
}

/** Departure delay in minutes (negative = early); null if the flight hasn't departed. */
export function departureDelayMinutes(r: FlightStatusRecord): number | null {
  if (!r.actualDepartureUtc) return null;
  return Math.round((Date.parse(r.actualDepartureUtc) - Date.parse(r.scheduledDepartureUtc)) / 60_000);
}
