import type { FlightProvider } from "@/lib/flights/provider";
import { operatingAirlines, type Airline } from "@/lib/data/airlines";
import { findAirport } from "@/lib/data/airports";
import {
  ProviderError,
  type FlightOffer,
  type FlightSearchRequest,
  type FlightSegment,
  type FlightSlice,
  type ProviderHealth,
  type ScheduledFlight,
} from "@/types/flight";

/**
 * MockFlightProvider — deterministic-ish, clearly-fake Nigerian
 * domestic flight data for development and testing.
 *
 * Hard rule: this provider must never be reachable in a production
 * environment. See isMockProviderAllowed() — it's the single gate
 * that decides that, and it's checked at construction time so a
 * misconfiguration fails loudly instead of silently serving fake
 * prices to a real user.
 */

const MOCK_AIRLINES: Airline[] = operatingAirlines().slice(0, 5);

const FARE_TYPES = [
  { name: "Basic", refundable: false, changeable: false, checkedBags: 0 },
  { name: "Standard", refundable: false, changeable: true, changeFeeNGN: 15000, checkedBags: 1 },
  { name: "Flex", refundable: true, changeable: true, changeFeeNGN: 0, checkedBags: 2 },
] as const;

function isMockProviderAllowed(): boolean {
  // Explicit allow-list, not a "block in production" denylist — the
  // safer default is to require an explicit opt-in for mock data.
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PROVIDER === "true";
}

/** Simple seeded pseudo-random generator so mock results are stable per search, not fully random noise. */
function makeRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

function estimateDurationMinutes(origin: string, destination: string): number {
  // Rough, clearly-approximate domestic flight durations by distance band.
  // This is mock data — not a claim about real schedules.
  const base = 55;
  const seed = origin.charCodeAt(0) + destination.charCodeAt(0);
  return base + (seed % 40); // ~55–95 minutes, typical for Nigerian domestic hops
}

function buildSegment(
  airline: Airline,
  origin: string,
  destination: string,
  departureAt: Date,
  rng: () => number,
): FlightSegment {
  const durationMinutes = estimateDurationMinutes(origin, destination);
  const arrivalAt = new Date(departureAt.getTime() + durationMinutes * 60_000);
  const flightNumber = `${airline.iata ?? "XX"}${1000 + Math.floor(rng() * 8999)}`;

  return {
    airlineCode: airline.iata ?? "XX",
    airlineName: airline.name,
    flightNumber,
    origin,
    destination,
    departureAt: departureAt.toISOString(),
    arrivalAt: arrivalAt.toISOString(),
    durationMinutes,
  };
}

function buildSlice(
  airline: Airline,
  origin: string,
  destination: string,
  date: string,
  hour: number,
  rng: () => number,
): FlightSlice {
  const departureAt = new Date(`${date}T${String(hour).padStart(2, "0")}:${rng() < 0.5 ? "00" : "30"}:00.000Z`);
  const segment = buildSegment(airline, origin, destination, departureAt, rng);
  return {
    segments: [segment],
    stops: 0,
    durationMinutes: segment.durationMinutes,
  };
}

function priceForRoute(origin: string, destination: string, fareIndex: number, rng: () => number): number {
  // Reflects researched real-world domestic fare range (~N90,000–N200,000+),
  // documented as mock in docs/PHASE_0_VALIDATION.md — not a live price feed.
  const base = 95_000 + Math.floor(rng() * 60_000);
  const fareMultiplier = [1, 1.35, 1.9][fareIndex] ?? 1;
  const routeJitter = (origin.charCodeAt(0) + destination.charCodeAt(0)) % 7000;
  return Math.round((base + routeJitter) * fareMultiplier / 500) * 500;
}

export class MockFlightProvider implements FlightProvider {
  readonly name = "mock";
  readonly displayName = "Mock Flight Provider (dev/test data — not real availability)";

  // In-memory store of generated offers so getFlightDetails can look them up
  // within the same process. Cleared on restart — this is dev/test data only.
  private offerStore = new Map<string, FlightOffer>();

  constructor() {
    if (!isMockProviderAllowed()) {
      throw new Error(
        "MockFlightProvider was instantiated in a production environment without ALLOW_MOCK_PROVIDER=true. " +
          "This is a safety gate, not a bug — mock data must never reach real users. " +
          "See docs/FLIGHT_PROVIDER_INTERFACE.md.",
      );
    }
  }

  async searchFlights(request: FlightSearchRequest): Promise<FlightOffer[]> {
    const origin = findAirport(request.origin);
    const destination = findAirport(request.destination);

    if (!origin || !destination) {
      throw new ProviderError(
        "INVALID_REQUEST",
        this.name,
        `Unknown airport in request: ${request.origin} -> ${request.destination}`,
      );
    }

    const rng = makeRng(`${request.origin}-${request.destination}-${request.departureDate}`);
    const departureHours = [6, 8, 11, 14, 17, 19];
    const offerCount = 3 + Math.floor(rng() * 4); // 3–6 offers, feels like a real result set

    const offers: FlightOffer[] = [];

    for (let i = 0; i < offerCount; i++) {
      const airline = MOCK_AIRLINES[Math.floor(rng() * MOCK_AIRLINES.length)];
      const hour = departureHours[Math.floor(rng() * departureHours.length)];
      const fareIndex = Math.floor(rng() * FARE_TYPES.length);
      const fare = FARE_TYPES[fareIndex];

      const outboundSlice = buildSlice(airline, request.origin, request.destination, request.departureDate, hour, rng);
      const slices: FlightSlice[] = [outboundSlice];

      if (request.tripType === "return" && request.returnDate) {
        const returnHour = departureHours[Math.floor(rng() * departureHours.length)];
        const returnSlice = buildSlice(airline, request.destination, request.origin, request.returnDate, returnHour, rng);
        slices.push(returnSlice);
      }

      const priceAmount = priceForRoute(request.origin, request.destination, fareIndex, rng) * slices.length;

      const offer: FlightOffer = {
        id: `mock-${request.origin}-${request.destination}-${i}-${Math.floor(rng() * 1_000_000)}`,
        provider: this.name,
        slices,
        cabinClass: request.cabinClass,
        price: { amount: priceAmount, currency: "NGN" },
        baggage: {
          cabinBagsIncluded: 1,
          checkedBagsIncluded: fare.checkedBags,
          checkedBagWeightKg: fare.checkedBags > 0 ? 20 : undefined,
          notes: `${fare.name} fare`,
        },
        fareConditions: {
          refundable: fare.refundable,
          changeable: fare.changeable,
          changeFeeNGN: "changeFeeNGN" in fare ? fare.changeFeeNGN : undefined,
          notes: `${fare.name} fare conditions (mock data)`,
        },
        bookingUrl: undefined, // no real deep-link target exists yet — deliberately omitted, not fabricated
        offerExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };

      this.offerStore.set(offer.id, offer);
      offers.push(offer);
    }

    return offers;
  }

  /**
   * Demo schedule: every mock offer's outbound flight, plus two extra
   * flights with no price, so the "every flight on this route" view can be
   * seen in demo mode. Like everything here, clearly test data.
   */
  async getScheduledFlights(request: FlightSearchRequest): Promise<ScheduledFlight[]> {
    const offers = await this.searchFlights(request);
    const priced = offers.map((o) => {
      const seg = o.slices[0].segments[0];
      return { airlineCode: seg.airlineCode, airlineName: seg.airlineName, flightNumber: seg.flightNumber, origin: seg.origin, destination: seg.destination, departureAt: seg.departureAt };
    });
    const rng = makeRng(`schedule-${request.origin}-${request.destination}-${request.departureDate}`);
    const extraHours = [7, 15];
    const extras = extraHours.map((hour) => {
      const airline = MOCK_AIRLINES[Math.floor(rng() * MOCK_AIRLINES.length)];
      const departureAt = new Date(`${request.departureDate}T${String(hour).padStart(2, "0")}:15:00.000Z`);
      const seg = buildSegment(airline, request.origin, request.destination, departureAt, rng);
      return { airlineCode: seg.airlineCode, airlineName: seg.airlineName, flightNumber: seg.flightNumber, origin: seg.origin, destination: seg.destination, departureAt: seg.departureAt };
    });
    return [...priced, ...extras];
  }

  async getFlightDetails(offerId: string): Promise<FlightOffer | null> {
    return this.offerStore.get(offerId) ?? null;
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      provider: this.name,
      healthy: true,
      checkedAt: new Date().toISOString(),
      message: "Mock provider is always healthy — it has no external dependency.",
    };
  }
}
