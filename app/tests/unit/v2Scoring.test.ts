import { describe, expect, it } from "vitest";
import {
  PICK_MIN_RELIABILITY,
  pickRecommended,
  previewReliability,
  scoreOffers,
  sortScored,
  type Reliability,
} from "@/lib/v2/scoring";
import type { FlightOffer } from "@/types/flight";

function offer(id: string, price: number, minutes: number, hour: number, airlineCode = "P4"): FlightOffer {
  const dep = new Date(Date.UTC(2026, 10, 2, hour, 0));
  return {
    id,
    provider: "mock",
    cabinClass: "economy",
    price: { amount: price, currency: "NGN" },
    slices: [
      {
        stops: 0,
        durationMinutes: minutes,
        segments: [
          {
            airlineCode,
            airlineName: `Airline ${airlineCode}`,
            flightNumber: `${airlineCode}100`,
            origin: "LOS",
            destination: "ABV",
            departureAt: dep.toISOString(),
            arrivalAt: new Date(dep.getTime() + minutes * 60_000).toISOString(),
            durationMinutes: minutes,
          },
        ],
      },
    ],
  };
}

const fixed = (scores: Record<string, number>) => (o: FlightOffer): Reliability => ({
  score: scores[o.id],
  label: "Good",
  reason: "",
  preview: true,
});

describe("previewReliability", () => {
  it("is deterministic and within 1-10", () => {
    const a = previewReliability(offer("a", 100_000, 70, 8));
    const b = previewReliability(offer("a", 100_000, 70, 8));
    expect(a).toEqual(b);
    expect(a.score).toBeGreaterThanOrEqual(1);
    expect(a.score).toBeLessThanOrEqual(10);
    expect(a.preview).toBe(true);
  });

  it("scores early departures above evening ones for the same airline", () => {
    expect(previewReliability(offer("a", 1, 70, 7)).score).toBeGreaterThan(previewReliability(offer("b", 1, 70, 19)).score);
  });
});

describe("sortScored", () => {
  const offers = [offer("cheap", 90_000, 90, 12), offer("fast", 150_000, 55, 12), offer("solid", 110_000, 70, 12)];
  const scored = scoreOffers(offers, fixed({ cheap: 4.5, fast: 6, solid: 9 }));

  it("sorts by price, duration and reliability", () => {
    expect(sortScored(scored, "cheapest")[0].offer.id).toBe("cheap");
    expect(sortScored(scored, "fastest")[0].offer.id).toBe("fast");
    expect(sortScored(scored, "reliable")[0].offer.id).toBe("solid");
  });

  it("ranks the balanced option first for best", () => {
    expect(sortScored(scored, "best")[0].offer.id).toBe("solid");
  });
});

describe("pickRecommended", () => {
  it("never picks a flight below the reliability floor, even if it is cheapest and fastest", () => {
    const offers = [offer("risky", 80_000, 50, 10), offer("ok", 120_000, 80, 10)];
    const pick = pickRecommended(scoreOffers(offers, fixed({ risky: PICK_MIN_RELIABILITY - 0.1, ok: 6 })));
    expect(pick?.offer.id).toBe("ok");
  });

  it("returns null when nothing clears the floor", () => {
    const pick = pickRecommended(scoreOffers([offer("x", 1, 60, 10)], fixed({ x: 2 })));
    expect(pick).toBeNull();
  });
});
