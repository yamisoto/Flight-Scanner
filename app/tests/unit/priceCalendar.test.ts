import { describe, expect, it } from "vitest";
import type { FlightProvider } from "@/lib/flights/provider";
import { buildPriceCalendar, shiftDate, TtlCache } from "@/lib/flights/priceCalendar";
import { FlightSearchEngine } from "@/lib/flights/searchEngine";
import { ProviderError, type FlightOffer, type FlightSearchRequest } from "@/types/flight";

const base: FlightSearchRequest = {
  origin: "LOS",
  destination: "ABV",
  departureDate: "2026-10-10",
  tripType: "one_way",
  passengers: { adults: 1, children: 0, infants: 0 },
  cabinClass: "economy",
};

const offerAt = (amount: number): FlightOffer => ({
  id: String(amount),
  provider: "fake",
  cabinClass: "economy",
  price: { amount, currency: "NGN" },
  slices: [{ stops: 0, durationMinutes: 70, segments: [{ airlineCode: "P4", airlineName: "Air Peace", flightNumber: "P41", origin: "LOS", destination: "ABV", departureAt: "2026-10-10T06:00:00Z", arrivalAt: "2026-10-10T07:10:00Z", durationMinutes: 70 }] }],
});

// Prices depend on the day of month; the 12th has no flights; the 13th's lookup fails.
const seen: FlightSearchRequest[] = [];
const fake: FlightProvider = {
  name: "fake",
  displayName: "fake",
  async searchFlights(req) {
    seen.push(req);
    const day = Number(req.departureDate.slice(8));
    if (day === 12) return [];
    if (day === 13) throw new ProviderError("PROVIDER_UNAVAILABLE", "fake", "down");
    return [offerAt(day * 10_000), offerAt(day * 10_000 + 5_000)];
  },
  async getFlightDetails() {
    return null;
  },
  async healthCheck() {
    return { provider: "fake", healthy: true, checkedAt: "" };
  },
};
const engine = new FlightSearchEngine(fake);

describe("shiftDate", () => {
  it("crosses month boundaries", () => {
    expect(shiftDate("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDate("2026-10-01", -1)).toBe("2026-09-30");
  });
});

describe("buildPriceCalendar", () => {
  it("returns the cheapest price for each of the 7 days around the date", async () => {
    const days = await buildPriceCalendar(engine, base, "2026-10-01");
    expect(days.map((d) => d.date)).toEqual(["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13"]);
    expect(days[3].cheapest).toBe(100_000);
  });

  it("shows no-flight and failed days as null instead of failing", async () => {
    const days = await buildPriceCalendar(engine, base, "2026-10-01");
    expect(days.find((d) => d.date === "2026-10-12")?.cheapest).toBeNull();
    expect(days.find((d) => d.date === "2026-10-13")?.cheapest).toBeNull();
  });

  it("leaves out dates before today", async () => {
    const days = await buildPriceCalendar(engine, base, "2026-10-09");
    expect(days[0].date).toBe("2026-10-09");
    expect(days).toHaveLength(5);
  });

  it("moves the return date with the departure date", async () => {
    seen.length = 0;
    await buildPriceCalendar(engine, { ...base, tripType: "return", returnDate: "2026-10-14" }, "2026-10-01", 1);
    expect(seen.map((r) => [r.departureDate, r.returnDate])).toEqual([
      ["2026-10-09", "2026-10-13"],
      ["2026-10-10", "2026-10-14"],
      ["2026-10-11", "2026-10-15"],
    ]);
  });
});

describe("TtlCache", () => {
  it("expires entries and caps its size", () => {
    let t = 0;
    const cache = new TtlCache<number>(1_000, 2, () => t);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3); // evicts "a"
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
    t = 1_000;
    expect(cache.get("c")).toBeUndefined();
  });
});
