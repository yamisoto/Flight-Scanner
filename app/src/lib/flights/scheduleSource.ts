import { findAirlineByIata } from "@/lib/data/airlines";
import { getPrisma } from "@/lib/db/client";
import type { FlightProvider } from "@/lib/flights/provider";
import { projectSchedule } from "@/lib/flights/schedule";
import type { FlightSearchRequest, ScheduledFlight } from "@/types/flight";

export interface ScheduleSource {
  readonly name: string;
  /** Every flight expected to operate on the outbound route and date; null when unknown. */
  getScheduledFlights(request: FlightSearchRequest): Promise<ScheduledFlight[] | null>;
}

/** Expected schedule from the flight-status history the daily job collects (see src/lib/ingest). */
class ObservationScheduleSource implements ScheduleSource {
  readonly name = "flight-status-history";

  async getScheduledFlights(request: FlightSearchRequest): Promise<ScheduledFlight[] | null> {
    const rows = await getPrisma().flightStatusObservation.findMany({
      where: {
        origin: request.origin,
        destination: request.destination,
        scheduledDepartureUtc: { gte: new Date(Date.now() - 22 * 86_400_000) },
      },
      select: { flightNumber: true, airlineIata: true, origin: true, destination: true, scheduledDepartureUtc: true, status: true },
    });
    if (rows.length === 0) return null; // no history for this route yet: don't claim coverage
    return projectSchedule(
      rows.map((r) => ({ ...r, airlineName: findAirlineByIata(r.airlineIata)?.name ?? r.airlineIata })),
      request.departureDate,
    );
  }
}

/**
 * Where the "every flight on this route" schedule comes from: the price
 * provider itself if it can say (the mock provider, in demo mode), otherwise
 * collected flight-status history when a database is connected, otherwise
 * nothing (results then show priced flights only, with no coverage line).
 */
export function getScheduleSource(provider: FlightProvider): ScheduleSource | null {
  if (provider.getScheduledFlights) {
    const fn = provider.getScheduledFlights.bind(provider);
    return { name: provider.name, getScheduledFlights: fn };
  }
  if (process.env.DATABASE_URL) return new ObservationScheduleSource();
  return null;
}
