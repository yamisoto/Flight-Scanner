import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/search/month/route";
import type { FlightProvider } from "@/lib/flights/provider";
import { addMonths, buildMonthPrices, monthDays, priceTiers } from "@/lib/flights/monthPrices";
import { FlightSearchEngine } from "@/lib/flights/searchEngine";
import { ProviderError, type FlightOffer } from "@/types/flight";

const offerAt = (amount: number): FlightOffer => ({
  id: String(amount),
  provider: "fake",
  cabinClass: "economy",
  price: { amount, currency: "NGN" },
  slices: [{ stops: 0, durationMinutes: 70, segments: [{ airlineCode: "P4", airlineName: "Air Peace", flightNumber: "P41", origin: "LOS", destination: "ABV", departureAt: "2026-10-10T06:00:00Z", arrivalAt: "2026-10-10T07:10:00Z", durationMinutes: 70 }] }],
});

describe("monthDays / addMonths", () => {
  it("lists every day, including leap years", () => {
    expect(monthDays("2026-10")).toHaveLength(31);
    expect(monthDays("2028-02").at(-1)).toBe("2028-02-29");
    expect(monthDays("2026-13")).toEqual([]);
  });
  it("adds months across year ends", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});

describe("priceTiers", () => {
  const day = (n: number, cheapest: number | null) => ({ date: `2026-11-${String(n).padStart(2, "0")}`, cheapest });

  it("splits priced days into cheapest, middle and dearest thirds", () => {
    const days = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => day(n, n * 10_000));
    const t = priceTiers(days);
    expect([1, 2, 3].map((n) => t.get(day(n, 0).date))).toEqual(["low", "low", "low"]);
    expect([4, 5, 6].map((n) => t.get(day(n, 0).date))).toEqual(["mid", "mid", "mid"]);
    expect([7, 8, 9].map((n) => t.get(day(n, 0).date))).toEqual(["high", "high", "high"]);
  });

  it("leaves unpriced days out and treats identical prices as average", () => {
    const t = priceTiers([day(1, 50_000), day(2, null), day(3, 50_000)]);
    expect(t.get(day(1, 0).date)).toBe("mid");
    expect(t.has(day(2, 0).date)).toBe(false);
    expect(priceTiers([day(1, null)]).size).toBe(0);
  });

  it("gives equal prices the same band", () => {
    const t = priceTiers([day(1, 10), day(2, 10), day(3, 20), day(4, 30), day(5, 30)]);
    expect(t.get(day(1, 0).date)).toBe(t.get(day(2, 0).date));
    expect(t.get(day(4, 0).date)).toBe("high");
    expect(t.get(day(5, 0).date)).toBe("high");
  });
});

describe("buildMonthPrices", () => {
  const fake: FlightProvider = {
    name: "fake",
    displayName: "fake",
    async searchFlights(req) {
      const d = Number(req.departureDate.slice(8));
      if (d === 20) return [];
      if (d === 21) throw new ProviderError("PROVIDER_UNAVAILABLE", "fake", "down");
      return [offerAt(d * 1_000 + 500), offerAt(d * 1_000)];
    },
    async getFlightDetails() {
      return null;
    },
    async healthCheck() {
      return { provider: "fake", healthy: true, checkedAt: "" };
    },
  };

  it("prices each remaining day of the month, skipping past days", async () => {
    const days = await buildMonthPrices(
      new FlightSearchEngine(fake),
      { origin: "LOS", destination: "ABV", month: "2026-10", adults: 1, cabinClass: "economy" },
      "2026-10-16",
    );
    expect(days.map((d) => d.date)).toEqual(monthDays("2026-10").slice(15));
    expect(days[0]).toEqual({ date: "2026-10-16", cheapest: 16_000 });
    expect(days.find((d) => d.date === "2026-10-20")?.cheapest).toBeNull();
    expect(days.find((d) => d.date === "2026-10-21")?.cheapest).toBeNull();
  });
});

describe("POST /api/search/month", () => {
  beforeEach(() => {
    process.env.FLIGHT_PROVIDER = "mock";
  });
  const req = (body: unknown, ip = "203.0.113.50") =>
    new NextRequest("http://localhost/api/search/month", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    });
  const nextMonth = addMonths(new Date(Date.now() + 3_600_000).toISOString().slice(0, 7), 1);

  it("returns a price for every day of a future month", async () => {
    const res = await POST(req({ origin: "LOS", destination: "ABV", month: nextMonth }));
    expect(res.status).toBe(200);
    const { days } = await res.json();
    expect(days).toHaveLength(monthDays(nextMonth).length);
    expect(days.some((d: { cheapest: number | null }) => d.cheapest !== null)).toBe(true);
  });

  it.each([
    ["unknown airport", { origin: "LHR", destination: "ABV", month: nextMonth }],
    ["same airports", { origin: "LOS", destination: "LOS", month: nextMonth }],
    ["past month", { origin: "LOS", destination: "ABV", month: "2020-01" }],
    ["too far ahead", { origin: "LOS", destination: "ABV", month: addMonths(nextMonth, 12) }],
    ["bad cabin", { origin: "LOS", destination: "ABV", month: nextMonth, cabinClass: "gold" }],
  ])("rejects %s", async (_label, body) => {
    expect((await POST(req(body, "203.0.113.51"))).status).toBe(400);
  });
});
