import { describe, expect, it } from "vitest";
import { findAirport, isKnownAirport, AIRPORTS, MVP_ROUTES } from "@/lib/data/airports";

describe("airport data", () => {
  it("finds a known airport by IATA code", () => {
    expect(findAirport("LOS")?.city).toBe("Lagos");
  });

  it("finds a known airport case-insensitively", () => {
    expect(findAirport("los")?.city).toBe("Lagos");
  });

  it("returns undefined for an unknown code", () => {
    expect(findAirport("ZZZ")).toBeUndefined();
  });

  it("isKnownAirport agrees with findAirport", () => {
    expect(isKnownAirport("ABV")).toBe(true);
    expect(isKnownAirport("ZZZ")).toBe(false);
  });

  it("has no duplicate IATA codes", () => {
    const codes = AIRPORTS.map((a) => a.iata);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every MVP route references known airports", () => {
    for (const route of MVP_ROUTES) {
      expect(isKnownAirport(route.origin)).toBe(true);
      expect(isKnownAirport(route.destination)).toBe(true);
    }
  });

  it("every MVP route has a different origin and destination", () => {
    for (const route of MVP_ROUTES) {
      expect(route.origin).not.toBe(route.destination);
    }
  });
});
