import { describe, expect, it } from "vitest";
import { AIRLINES, operatingAirlines } from "@/lib/data/airlines";
import { AIRPORTS } from "@/lib/data/airports";

describe("airport reference data", () => {
  it("has unique, well-formed codes", () => {
    const iata = AIRPORTS.map((a) => a.iata);
    expect(new Set(iata).size).toBe(iata.length);
    for (const a of AIRPORTS) {
      expect(a.iata).toMatch(/^[A-Z]{3}$/);
      if (a.icao) expect(a.icao).toMatch(/^DN[A-Z]{2}$/); // every Nigerian ICAO code starts with DN
    }
  });
});

describe("airline reference data", () => {
  it("has unique, well-formed codes", () => {
    const iata = AIRLINES.flatMap((a) => (a.iata ? [a.iata] : []));
    expect(new Set(iata).size).toBe(iata.length);
    for (const a of AIRLINES) {
      if (a.iata) expect(a.iata).toMatch(/^[A-Z0-9]{2}$/);
      if (a.icao) expect(a.icao).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("never offers an airline that has stopped flying", () => {
    expect(operatingAirlines().map((a) => a.name)).not.toContain("Dana Air");
  });
});
