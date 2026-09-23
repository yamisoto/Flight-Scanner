import { describe, expect, it } from "vitest";
import { validateSearchRequest } from "@/lib/validation/searchValidation";

const validBase = {
  origin: "LOS",
  destination: "ABV",
  departureDate: "2027-06-01",
  tripType: "one_way",
  passengers: { adults: 1, children: 0, infants: 0 },
  cabinClass: "economy",
};

describe("validateSearchRequest", () => {
  it("accepts a valid one-way request", () => {
    const result = validateSearchRequest(validBase);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("accepts a valid return request", () => {
    const result = validateSearchRequest({
      ...validBase,
      tripType: "return",
      returnDate: "2027-06-08",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects a non-object body", () => {
    const result = validateSearchRequest("not an object");
    expect(result.valid).toBe(false);
  });

  it("rejects an unknown origin airport", () => {
    const result = validateSearchRequest({ ...validBase, origin: "ZZZ" });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === "origin")).toBe(true);
  });

  it("rejects an unknown destination airport", () => {
    const result = validateSearchRequest({ ...validBase, destination: "ZZZ" });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === "destination")).toBe(true);
  });

  it("rejects identical origin and destination", () => {
    const result = validateSearchRequest({ ...validBase, destination: "LOS" });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("must be different"))).toBe(true);
  });

  it("rejects an invalid date format", () => {
    const result = validateSearchRequest({ ...validBase, departureDate: "06/01/2027" });
    expect(result.valid).toBe(false);
  });

  it("rejects a departure date in the past", () => {
    const result = validateSearchRequest({ ...validBase, departureDate: "2020-01-01" });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("past"))).toBe(true);
  });

  it("requires a return date when tripType is return", () => {
    const result = validateSearchRequest({ ...validBase, tripType: "return" });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === "returnDate")).toBe(true);
  });

  it("rejects a return date before the departure date", () => {
    const result = validateSearchRequest({
      ...validBase,
      tripType: "return",
      returnDate: "2027-05-01",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects missing passengers", () => {
    const rest: Record<string, unknown> = { ...validBase };
    delete rest.passengers;
    const result = validateSearchRequest(rest);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === "passengers")).toBe(true);
  });

  it("rejects zero adult passengers", () => {
    const result = validateSearchRequest({ ...validBase, passengers: { adults: 0, children: 0, infants: 0 } });
    expect(result.valid).toBe(false);
  });

  it("rejects passenger counts above the maximum", () => {
    const result = validateSearchRequest({ ...validBase, passengers: { adults: 9, children: 1, infants: 0 } });
    expect(result.valid).toBe(false);
  });

  it("rejects an invalid cabin class", () => {
    const result = validateSearchRequest({ ...validBase, cabinClass: "super-first" });
    expect(result.valid).toBe(false);
  });

  it("reports multiple issues at once rather than failing fast", () => {
    const result = validateSearchRequest({});
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(1);
  });
});
