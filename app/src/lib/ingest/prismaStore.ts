import type { PrismaClient } from "@prisma/client";
import type { FlightStatusRecord, FlightStatusStore } from "@/lib/ingest/types";

/** The scheduled departure's UTC calendar date, as stored in serviceDate. */
const serviceDate = (r: FlightStatusRecord) => new Date(`${r.scheduledDepartureUtc.slice(0, 10)}T00:00:00.000Z`);

/**
 * FlightStatusStore on the Postgres database. Upserts on the same key as
 * recordKey() (flight number, origin, service date), so re-fetching a
 * flight later in the day updates its status and actual departure time.
 */
export class PrismaFlightStatusStore implements FlightStatusStore {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(records: FlightStatusRecord[]): Promise<number> {
    if (records.length === 0) return 0;
    const ops = records.map((r) => {
      const data = {
        airlineIata: r.airlineIata,
        destination: r.destination,
        scheduledDepartureUtc: new Date(r.scheduledDepartureUtc),
        actualDepartureUtc: r.actualDepartureUtc ? new Date(r.actualDepartureUtc) : null,
        status: r.status,
        source: r.source,
        fetchedAtUtc: new Date(r.fetchedAtUtc),
      };
      return this.prisma.flightStatusObservation.upsert({
        where: { flightNumber_origin_serviceDate: { flightNumber: r.flightNumber, origin: r.origin, serviceDate: serviceDate(r) } },
        create: { flightNumber: r.flightNumber, origin: r.origin, serviceDate: serviceDate(r), ...data },
        update: data,
      });
    });
    await this.prisma.$transaction(ops);
    return records.length;
  }
}
