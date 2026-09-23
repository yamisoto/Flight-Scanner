import { describe, expect, it, vi } from "vitest";
import { FlightSearchEngine, applyFilters, sortOffers } from "@/lib/flights/searchEngine";
import type { FlightProvider } from "@/lib/flights/provider";
import { ProviderError, type FlightOffer, type FlightSearchRequest } from "@/types/flight";

const request: FlightSearchRequest = {
  origin: "LOS",
  destination: "ABV",
  departureDate: "2027-06-01",
  tripType: "one_way",
  passengers: { adults: 1, children: 0, infants: 0 },
  cabinClass: "economy",
};

function makeOffer(overrides: { id?: string; price: number; airline: string; hour: number }): FlightOffer {
  return {
    id: overrides.id ?? `offer-${Math.random()}`,
    provider: "test",
    cabinClass: "economy",
    price: { amount: overrides.price, currency: "NGN" },
    slices: [
      {
        stops: 0,
        durationMinutes: 60,
        segments: [
          {
            airlineCode: overrides.airline,
            airlineName: overrides.airline,
            flightNumber: "X1",
            origin: "LOS",
            destination: "ABV",
            departureAt: `2027-06-01T${String(overrides.hour).padStart(2, "0")}:00:00.000Z`,
            arrivalAt: `2027-06-01T${String(overrides.hour + 1).padStart(2, "0")}:00:00.000Z`,
            durationMinutes: 60,
          },
        ],
      },
    ],
  };
}

function fakeProvider(offers: FlightOffer[] | (() => Promise<FlightOffer[]>)): FlightProvider {
  return {
    name: "fake",
    displayName: "Fake",
    searchFlights: vi.fn(async () => (typeof offers === "function" ? offers() : offers)),
    getFlightDetails: vi.fn(async () => null),
    healthCheck: vi.fn(async () => ({ provider: "fake", healthy: true, checkedAt: new Date().toISOString() })),
  };
}

describe("FlightSearchEngine", () => {
  it("returns offers from the provider unmodified when no options are given", async () => {
    const offers = [makeOffer({ price: 100000, airline: "P4", hour: 8 })];
    const engine = new FlightSearchEngine(fakeProvider(offers));
    const result = await engine.search(request);
    expect(result).toEqual(offers);
  });

  it("throws NO_RESULTS ProviderError when the provider returns an empty array", async () => {
    const engine = new FlightSearchEngine(fakeProvider([]));
    await expect(engine.search(request)).rejects.toMatchObject({ code: "NO_RESULTS" });
  });

  it("wraps a non-ProviderError thrown by the provider into UNKNOWN_ERROR", async () => {
    const provider = fakeProvider(() => {
      throw new Error("boom");
    });
    const engine = new FlightSearchEngine(provider);
    await expect(engine.search(request)).rejects.toMatchObject({ code: "UNKNOWN_ERROR" });
  });

  it("re-throws a ProviderError from the provider as-is", async () => {
    const provider = fakeProvider(() => {
      throw new ProviderError("RATE_LIMITED", "fake", "slow down");
    });
    const engine = new FlightSearchEngine(provider);
    await expect(engine.search(request)).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("sorts by price ascending when requested", async () => {
    const offers = [
      makeOffer({ price: 200000, airline: "P4", hour: 8 }),
      makeOffer({ price: 100000, airline: "W3", hour: 9 }),
    ];
    const engine = new FlightSearchEngine(fakeProvider(offers));
    const result = await engine.search(request, { sortBy: "price", sortDirection: "asc" });
    expect(result[0].price.amount).toBe(100000);
  });

  it("filters by airline code", () => {
    const offers = [
      makeOffer({ price: 100000, airline: "P4", hour: 8 }),
      makeOffer({ price: 100000, airline: "W3", hour: 9 }),
    ];
    const filtered = applyFilters(offers, { airlineCodes: ["W3"] });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].slices[0].segments[0].airlineCode).toBe("W3");
  });

  it("filters by max price", () => {
    const offers = [
      makeOffer({ price: 90000, airline: "P4", hour: 8 }),
      makeOffer({ price: 300000, airline: "W3", hour: 9 }),
    ];
    const filtered = applyFilters(offers, { maxPriceNGN: 100000 });
    expect(filtered).toHaveLength(1);
  });

  it("sorts by departure time", () => {
    const offers = [
      makeOffer({ price: 100000, airline: "P4", hour: 19 }),
      makeOffer({ price: 100000, airline: "W3", hour: 6 }),
    ];
    const sorted = sortOffers(offers, "departure_time", "asc");
    expect(sorted[0].slices[0].segments[0].departureAt).toContain("T06:00");
  });
});
