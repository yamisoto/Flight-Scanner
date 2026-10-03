import { describe, expect, it } from "vitest";
import { buildCoverage, normaliseFlightNumber, projectSchedule, type ObservedDeparture } from "@/lib/flights/schedule";
import type { FlightOffer, ScheduledFlight } from "@/types/flight";

const sched = (flightNumber: string, departureAt: string, airlineCode = flightNumber.slice(0, 2)): ScheduledFlight => ({
  airlineCode,
  airlineName: airlineCode,
  flightNumber,
  origin: "LOS",
  destination: "ABV",
  departureAt,
});

const offer = (flightNumber: string, departureAt: string, airlineCode = flightNumber.slice(0, 2)): FlightOffer => ({
  id: flightNumber,
  provider: "test",
  cabinClass: "economy",
  price: { amount: 100_000, currency: "NGN" },
  slices: [{ stops: 0, durationMinutes: 70, segments: [{ airlineCode, airlineName: airlineCode, flightNumber, origin: "LOS", destination: "ABV", departureAt, arrivalAt: departureAt, durationMinutes: 70 }] }],
});

describe("normaliseFlightNumber", () => {
  it("ignores spaces, case, punctuation and leading zeros", () => {
    for (const raw of ["P4 7120", "p47120", "P4-07120", "P4 07120"]) expect(normaliseFlightNumber(raw)).toBe("P47120");
    expect(normaliseFlightNumber("4U 100")).toBe("4U100");
  });
});

describe("buildCoverage", () => {
  it("counts priced flights and lists the rest, in departure order", () => {
    const schedule = [sched("P47120", "2026-10-10T06:00:00.000Z"), sched("QI0310", "2026-10-10T11:30:00.000Z"), sched("UN501", "2026-10-10T09:00:00.000Z")];
    const c = buildCoverage(schedule, [offer("P4 7120", "2026-10-10T06:00:00.000Z")], "test");
    expect(c.totalFlights).toBe(3);
    expect(c.pricedFlights).toBe(1);
    expect(c.unpriced.map((f) => f.flightNumber)).toEqual(["UN501", "QI0310"]);
  });

  it("matches on airline and departure time when flight numbers differ", () => {
    const c = buildCoverage([sched("P47120", "2026-10-10T06:00:00.000Z")], [offer("P49999", "2026-10-10T06:10:00.000Z", "P4")], "test");
    expect(c.unpriced).toHaveLength(0);
  });

  it("doesn't match the same airline at a different time", () => {
    const c = buildCoverage([sched("P47120", "2026-10-10T06:00:00.000Z")], [offer("P49999", "2026-10-10T08:00:00.000Z", "P4")], "test");
    expect(c.unpriced).toHaveLength(1);
  });

  it("counts a flight listed twice once", () => {
    const c = buildCoverage([sched("P47120", "2026-10-10T06:00:00.000Z"), sched("P4 7120", "2026-10-10T06:00:00.000Z")], [], "test");
    expect(c.totalFlights).toBe(1);
  });
});

describe("projectSchedule", () => {
  const obs = (flightNumber: string, utc: string, status = "departed"): ObservedDeparture => ({
    flightNumber,
    airlineIata: flightNumber.slice(0, 2),
    airlineName: flightNumber.slice(0, 2),
    origin: "LOS",
    destination: "ABV",
    scheduledDepartureUtc: new Date(utc),
    status,
  });
  const now = new Date("2026-10-03T12:00:00Z"); // Saturday

  it("projects same-weekday flights onto the requested date in Nigerian local time", () => {
    // 2026-10-10 is a Saturday. 05:00 UTC = 06:00 in Lagos.
    const out = projectSchedule([obs("P47120", "2026-10-03T05:00:00Z"), obs("QI0310", "2026-10-02T10:30:00Z")], "2026-10-10", 21, now);
    expect(out).toEqual([expect.objectContaining({ flightNumber: "P47120", departureAt: "2026-10-10T06:00:00.000Z" })]);
  });

  it("uses the most recent time when a flight was retimed", () => {
    const out = projectSchedule([obs("P47120", "2026-09-26T05:00:00Z"), obs("P47120", "2026-10-03T06:00:00Z")], "2026-10-10", 21, now);
    expect(out[0].departureAt).toBe("2026-10-10T07:00:00.000Z");
  });

  it("ignores observations older than the lookback window, and keeps cancelled flights", () => {
    const out = projectSchedule([obs("W30100", "2026-08-01T05:00:00Z"), obs("UN0501", "2026-10-03T08:00:00Z", "cancelled")], "2026-10-10", 21, now);
    expect(out.map((f) => f.flightNumber)).toEqual(["UN501"]);
  });

  it("uses the local weekday for a flight just before midnight UTC", () => {
    // Friday 23:30 UTC is Saturday 00:30 in Lagos, so it belongs to the Saturday schedule.
    const out = projectSchedule([obs("P40001", "2026-10-02T23:30:00Z")], "2026-10-10", 21, now);
    expect(out[0]?.departureAt).toBe("2026-10-10T00:30:00.000Z");
  });
});
