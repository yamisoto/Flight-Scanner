import { beforeEach, describe, expect, it } from "vitest";
import { MockFlightProvider } from "@/lib/flights/providers/mockProvider";
import { ProviderError, type FlightSearchRequest } from "@/types/flight";

const oneWayRequest: FlightSearchRequest = {
  origin: "LOS",
  destination: "ABV",
  departureDate: "2027-06-01",
  tripType: "one_way",
  passengers: { adults: 1, children: 0, infants: 0 },
  cabinClass: "economy",
};

const returnRequest: FlightSearchRequest = {
  ...oneWayRequest,
  tripType: "return",
  returnDate: "2027-06-08",
};

describe("MockFlightProvider", () => {
  let provider: MockFlightProvider;

  beforeEach(() => {
    provider = new MockFlightProvider();
  });

  it("has name 'mock'", () => {
    expect(provider.name).toBe("mock");
  });

  it("returns a non-empty list of offers for a valid one-way search", async () => {
    const offers = await provider.searchFlights(oneWayRequest);
    expect(offers.length).toBeGreaterThan(0);
  });

  it("tags every offer with provider 'mock'", async () => {
    const offers = await provider.searchFlights(oneWayRequest);
    expect(offers.every((o) => o.provider === "mock")).toBe(true);
  });

  it("returns offers with a single slice for a one-way search", async () => {
    const offers = await provider.searchFlights(oneWayRequest);
    expect(offers.every((o) => o.slices.length === 1)).toBe(true);
  });

  it("returns offers with two slices for a return search", async () => {
    const offers = await provider.searchFlights(returnRequest);
    expect(offers.every((o) => o.slices.length === 2)).toBe(true);
  });

  it("prices return offers higher than a comparable one-way (both slices priced)", async () => {
    const oneWay = await provider.searchFlights(oneWayRequest);
    const roundTrip = await provider.searchFlights(returnRequest);
    const minOneWay = Math.min(...oneWay.map((o) => o.price.amount));
    const minReturn = Math.min(...roundTrip.map((o) => o.price.amount));
    expect(minReturn).toBeGreaterThan(minOneWay);
  });

  it("throws a ProviderError with INVALID_REQUEST for an unknown airport", async () => {
    await expect(
      provider.searchFlights({ ...oneWayRequest, origin: "ZZZ" }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it("produces prices in NGN", async () => {
    const offers = await provider.searchFlights(oneWayRequest);
    expect(offers.every((o) => o.price.currency === "NGN")).toBe(true);
  });

  it("returns varied prices across offers (comparison has something to compare)", async () => {
    const offers = await provider.searchFlights(oneWayRequest);
    const uniquePrices = new Set(offers.map((o) => o.price.amount));
    expect(uniquePrices.size).toBeGreaterThan(1);
  });

  it("getFlightDetails returns a previously-returned offer by id", async () => {
    const offers = await provider.searchFlights(oneWayRequest);
    const found = await provider.getFlightDetails(offers[0].id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(offers[0].id);
  });

  it("getFlightDetails returns null for an unknown id", async () => {
    const found = await provider.getFlightDetails("does-not-exist");
    expect(found).toBeNull();
  });

  it("healthCheck reports healthy", async () => {
    const health = await provider.healthCheck();
    expect(health.healthy).toBe(true);
    expect(health.provider).toBe("mock");
  });

  it("sets an offerExpiresAt in the near future", async () => {
    const offers = await provider.searchFlights(oneWayRequest);
    const expiry = new Date(offers[0].offerExpiresAt!).getTime();
    expect(expiry).toBeGreaterThan(Date.now());
    expect(expiry).toBeLessThan(Date.now() + 60 * 60_000);
  });
});
