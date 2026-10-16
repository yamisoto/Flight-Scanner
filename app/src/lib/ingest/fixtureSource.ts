import type { FlightStatusRecord, FlightStatusSource } from "@/lib/ingest/types";

/**
 * A FlightStatusSource backed by a fixed list of records, for tests and local
 * development. The records are synthetic and must never reach production
 * scoring; they exist only so the collection pipeline can run end to end
 * before a real source is connected.
 */
export class FixtureFlightStatusSource implements FlightStatusSource {
  readonly name = "fixture";

  constructor(private readonly records: FlightStatusRecord[]) {}

  async fetchDepartures(airportIata: string, fromUtc: Date, toUtc: Date): Promise<FlightStatusRecord[]> {
    const from = fromUtc.getTime();
    const to = toUtc.getTime();
    return this.records.filter((r) => {
      const t = Date.parse(r.scheduledDepartureUtc);
      return r.origin === airportIata && t >= from && t < to;
    });
  }
}
