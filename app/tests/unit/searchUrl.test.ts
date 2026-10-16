import { describe, expect, it } from "vitest";
import { queryToSearch, searchToQuery } from "@/lib/v2/searchUrl";
import type { FlightSearchRequest } from "@/types/flight";

const TODAY = "2026-10-03";
const base: FlightSearchRequest = {
  origin: "LOS",
  destination: "ABV",
  departureDate: "2026-10-10",
  tripType: "one_way",
  passengers: { adults: 1, children: 0, infants: 0 },
  cabinClass: "economy",
};
const parse = (q: string) => queryToSearch(new URLSearchParams(q), TODAY);

describe("searchToQuery / queryToSearch", () => {
  it("keeps a one-way search short and round-trips it", () => {
    const q = searchToQuery(base);
    expect(q).toBe("from=LOS&to=ABV&depart=2026-10-10");
    expect(parse(q)).toEqual({ ...base, returnDate: undefined });
  });

  it("round-trips a return trip with travellers and cabin", () => {
    const req: FlightSearchRequest = { ...base, tripType: "return", returnDate: "2026-10-14", passengers: { adults: 3, children: 0, infants: 0 }, cabinClass: "business" };
    expect(parse(searchToQuery(req))).toEqual(req);
  });

  it("accepts lowercase airport codes", () => {
    expect(parse("from=los&to=abv&depart=2026-10-10")?.origin).toBe("LOS");
  });

  it.each([
    ["unknown airport", "from=LHR&to=ABV&depart=2026-10-10"],
    ["same origin and destination", "from=LOS&to=LOS&depart=2026-10-10"],
    ["past date", "from=LOS&to=ABV&depart=2026-10-01"],
    ["malformed date", "from=LOS&to=ABV&depart=10/10/2026"],
    ["return before departure", "from=LOS&to=ABV&depart=2026-10-10&return=2026-10-09"],
    ["too many adults", "from=LOS&to=ABV&depart=2026-10-10&adults=12"],
    ["fractional adults", "from=LOS&to=ABV&depart=2026-10-10&adults=1.5"],
    ["unknown cabin", "from=LOS&to=ABV&depart=2026-10-10&cabin=gold"],
    ["empty", ""],
  ])("rejects %s", (_label, q) => {
    expect(parse(q)).toBeNull();
  });
});
