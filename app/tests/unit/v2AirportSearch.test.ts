import { describe, expect, it } from "vitest";
import { searchAirports } from "@/components/v2/AirportCombobox";

const codes = (q: string, exclude?: string) => searchAirports(q, exclude).map((a) => a.iata);

describe("searchAirports", () => {
  it("does not match generic words like 'airport'", () => {
    expect(codes("port")).toEqual(["PHC"]);
    expect(codes("airport")).toEqual([]);
  });

  it("ranks an exact IATA code first", () => {
    expect(codes("kan")[0]).toBe("KAN");
    expect(codes("los")[0]).toBe("LOS");
  });

  it("matches city, airport-name words and state", () => {
    expect(codes("lag")).toContain("LOS");
    expect(codes("murtala")).toContain("LOS");
    expect(codes("rivers")).toContain("PHC");
  });

  it("excludes the airport already chosen on the other side", () => {
    expect(codes("", "LOS")).not.toContain("LOS");
  });
});
