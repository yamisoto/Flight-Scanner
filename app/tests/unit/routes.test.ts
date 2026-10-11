import { describe, expect, it } from "vitest";
import { isKnownAirport } from "@/lib/data/airports";
import { findRoute, findRouteBySlug, ROUTES, routeSlug, routesFrom } from "@/lib/data/routes";
import { summariseRoute } from "@/lib/flights/routeStats";

describe("route pages", () => {
  it("covers both directions with unique, readable slugs for known airports", () => {
    expect(ROUTES).toHaveLength(20);
    expect(new Set(ROUTES.map((r) => r.slug)).size).toBe(ROUTES.length);
    for (const r of ROUTES) {
      expect(isKnownAirport(r.origin) && isKnownAirport(r.destination)).toBe(true);
      expect(r.slug).toMatch(/^[a-z]+(-[a-z]+)*-to-[a-z]+(-[a-z]+)*$/);
      expect(findRoute(r.destination, r.origin)).toBeDefined();
    }
  });

  it("builds slugs from city names", () => {
    expect(routeSlug("LOS", "PHC")).toBe("lagos-to-port-harcourt");
    expect(findRouteBySlug("abuja-to-lagos")).toMatchObject({ origin: "ABV", destination: "LOS" });
    expect(findRouteBySlug("lagos-to-nowhere")).toBeUndefined();
    expect(routesFrom("ABV").map((r) => r.destination).sort()).toEqual(["KAN", "LOS", "PHC"]);
  });
});

describe("summariseRoute", () => {
  const at = (iso: string) => new Date(iso);
  it("averages daily flights per airline and reports Lagos-time first and last departures", () => {
    const summary = summariseRoute([
      // Two days of P4 (2 flights a day), one of VK.
      { flightNumber: "P4 7120", airlineIata: "P4", scheduledDepartureUtc: at("2026-10-01T05:30:00Z") },
      { flightNumber: "P4 7124", airlineIata: "P4", scheduledDepartureUtc: at("2026-10-01T16:00:00Z") },
      { flightNumber: "P47120", airlineIata: "P4", scheduledDepartureUtc: at("2026-10-02T05:30:00Z") },
      { flightNumber: "P47124", airlineIata: "P4", scheduledDepartureUtc: at("2026-10-02T16:00:00Z") },
      { flightNumber: "VK200", airlineIata: "VK", scheduledDepartureUtc: at("2026-10-02T05:45:00Z") },
    ]);
    expect(summary).toEqual({
      daysObserved: 2,
      flightsPerDay: 2.5,
      airlines: [
        { airlineCode: "P4", airlineName: "Air Peace", flightsPerDay: 2, firstDeparture: "06:30", lastDeparture: "17:00" },
        { airlineCode: "VK", airlineName: "ValueJet", flightsPerDay: 0.5, firstDeparture: "06:45", lastDeparture: "06:45" },
      ],
    });
  });

  it("counts days in Lagos time and returns null with no data", () => {
    // 23:30 UTC is 00:30 the next day in Lagos.
    const s = summariseRoute([
      { flightNumber: "P41", airlineIata: "P4", scheduledDepartureUtc: at("2026-10-01T23:30:00Z") },
      { flightNumber: "P41", airlineIata: "P4", scheduledDepartureUtc: at("2026-10-02T23:30:00Z") },
    ]);
    expect(s?.daysObserved).toBe(2);
    expect(s?.airlines[0].firstDeparture).toBe("00:30");
    expect(summariseRoute([])).toBeNull();
  });
});

describe("summariseRoute airline names", () => {
  it("labels codes missing from the airline table as unconfirmed", () => {
    const s = summariseRoute([{ flightNumber: "W1 3536", airlineIata: "W1", scheduledDepartureUtc: new Date("2026-10-02T10:40:00Z") }]);
    expect(s?.airlines[0].airlineName).toBe("Unconfirmed airline (W1)");
  });
});
