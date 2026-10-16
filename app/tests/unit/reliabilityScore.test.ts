import { describe, expect, it } from "vitest";
import { NCAA_AIRLINE_MONTHS, NCAA_INDUSTRY_TOTALS } from "@/lib/reliability/ncaaData";
import { latestNcaaMonth, ncaaBaselineReliability, timeOfDayFactor } from "@/lib/reliability/score";
import { reliabilityFor } from "@/lib/v2/scoring";
import type { FlightOffer } from "@/types/flight";

describe("NCAA data", () => {
  it("reconciles with the published monthly totals", () => {
    for (const [month, totals] of Object.entries(NCAA_INDUSTRY_TOTALS)) {
      const rows = NCAA_AIRLINE_MONTHS.filter((r) => r.month === month);
      const flights = rows.reduce((s, r) => s + r.flightsOperated, 0);
      const delayed = rows.reduce((s, r) => s + r.flightsDelayed, 0);
      const cancelled = rows.reduce((s, r) => s + (r.flightsCancelled ?? 0), 0);
      expect(flights).toBeLessThanOrEqual(totals.flightsOperated);
      expect(delayed).toBeLessThanOrEqual(totals.flightsDelayed);
      expect(cancelled).toBeLessThanOrEqual(totals.flightsCancelled);
      for (const r of rows) expect(r.flightsDelayed).toBeLessThanOrEqual(r.flightsOperated);
    }
  });
});

describe("ncaaBaselineReliability", () => {
  it("matches the documented formula (Air Peace, midday)", () => {
    // D = 1 - 1330/1864, A = 1 - (7/1864)/0.02, T = 0.6
    const D = 1 - 1330 / 1864;
    const A = 1 - 7 / 1864 / 0.02;
    const expected = Math.round((1 + 9 * (0.7 * D + 0.2 * A + 0.1 * 0.6)) * 10) / 10;
    const r = ncaaBaselineReliability("P4", 12)!;
    expect(r.score).toBe(expected);
    expect(r.source).toBe("ncaa-airline-baseline");
    expect(r.confidence).toBe("Low");
    expect(r.reason).toContain("71%");
  });

  it("ranks the airline with the lower delay rate higher at the same hour", () => {
    expect(ncaaBaselineReliability("4U", 12)!.score).toBeGreaterThan(ncaaBaselineReliability("UN", 12)!.score);
  });

  it("scores early departures above evening ones", () => {
    expect(ncaaBaselineReliability("QI", 7)!.score).toBeGreaterThan(ncaaBaselineReliability("QI", 19)!.score);
    expect(timeOfDayFactor(8)).toBe(1);
    expect(timeOfDayFactor(17)).toBe(0.3);
  });

  it("falls back to the industry cancellation rate when an airline's count is missing", () => {
    expect(ncaaBaselineReliability("OF", 12)).not.toBeNull();
  });

  it("explains a score dragged down by cancellations", () => {
    expect(ncaaBaselineReliability("Q9", 12)!.reason).toMatch(/cancelled 1\.3% of flights, against 0\.45%/);
    expect(ncaaBaselineReliability("N2", 12)!.reason).not.toMatch(/cancelled/);
  });

  it("returns null for an airline with no NCAA data", () => {
    expect(ncaaBaselineReliability("ZZ", 12)).toBeNull();
    expect(latestNcaaMonth("ZZ")).toBeUndefined();
  });
});

describe("reliabilityFor", () => {
  const offerFor = (airlineCode: string): FlightOffer => ({
    id: "x",
    provider: "mock",
    cabinClass: "economy",
    price: { amount: 100_000, currency: "NGN" },
    slices: [
      {
        stops: 0,
        durationMinutes: 70,
        segments: [
          {
            airlineCode,
            airlineName: "Test",
            flightNumber: `${airlineCode}1`,
            origin: "LOS",
            destination: "ABV",
            departureAt: "2026-11-02T10:00:00.000Z",
            arrivalAt: "2026-11-02T11:10:00.000Z",
            durationMinutes: 70,
          },
        ],
      },
    ],
  });

  it("uses NCAA data when available and the labelled preview otherwise", () => {
    expect(reliabilityFor(offerFor("P4")).source).toBe("ncaa-airline-baseline");
    expect(reliabilityFor(offerFor("ZZ")).source).toBe("preview");
  });
});
