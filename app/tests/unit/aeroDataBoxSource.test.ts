import { describe, expect, it } from "vitest";
import { AeroDataBoxStatusSource, parseDepartures, splitWindows, type AdbFlight } from "@/lib/ingest/aeroDataBoxSource";
import { RetryableSourceError } from "@/lib/ingest/types";
import recorded from "../fixtures/aerodatabox/los-departures-2026-10-02.json";
import recordedLive from "../fixtures/aerodatabox/los-departures-2026-10-03-live.json";

// Real responses recorded 3 Oct 2026: LOS departures 06:00-18:00 local on 2 Oct, and a live window on 3 Oct.
const FLIGHTS = recorded.departures as AdbFlight[];
const FETCHED = "2026-10-03T12:00:00.000Z";

describe("parseDepartures (recorded AeroDataBox response)", () => {
  const records = parseDepartures("LOS", FLIGHTS, FETCHED);

  it("keeps only domestic flights", () => {
    expect(FLIGHTS).toHaveLength(86);
    expect(records).toHaveLength(58);
    expect(records.every((r) => r.origin === "LOS" && r.destination !== "LOS")).toBe(true);
  });

  it("normalises flight numbers and converts scheduled times to ISO UTC", () => {
    expect(records[0]).toEqual({
      flightNumber: "P47120",
      airlineIata: "P4",
      origin: "LOS",
      destination: "ABV",
      scheduledDepartureUtc: "2026-10-02T05:30:00.000Z",
      actualDepartureUtc: null,
      status: "unknown",
      source: "aerodatabox",
      fetchedAtUtc: FETCHED,
    });
  });

  it("takes the airline code from the flight number, not the mislabelled airline name", () => {
    const valueJet = records.find((r) => r.flightNumber === "VK200");
    expect(valueJet?.airlineIata).toBe("VK"); // the API names this "Anisec"
    expect(records.find((r) => r.flightNumber === "N2117")?.airlineIata).toBe("N2"); // no airline IATA in the response
  });

  it("has no actual times for domestic flights (scheduled data only, as recorded)", () => {
    const live = parseDepartures("LOS", recordedLive.departures as AdbFlight[], FETCHED);
    expect(live.length).toBeGreaterThan(0);
    expect([...records, ...live].every((r) => r.actualDepartureUtc === null && r.status === "unknown")).toBe(true);
  });

  it("maps statuses and actual times when they are present", () => {
    const base = FLIGHTS[0];
    const departed: AdbFlight = {
      ...base,
      status: "Departed",
      departure: { ...base.departure, revisedTime: { utc: "2026-10-02 06:10Z" }, runwayTime: { utc: "2026-10-02 06:18Z" } },
    };
    const delayed: AdbFlight = { ...base, status: "Delayed", departure: { ...base.departure, revisedTime: { utc: "2026-10-02 07:00Z" } } };
    const cancelled: AdbFlight = { ...base, status: "Canceled" };
    const [d, l, c] = parseDepartures("LOS", [departed, delayed, cancelled], FETCHED);
    expect(d).toMatchObject({ status: "departed", actualDepartureUtc: "2026-10-02T06:18:00.000Z" });
    expect(l).toMatchObject({ status: "scheduled", actualDepartureUtc: null }); // a revised estimate isn't a departure
    expect(c).toMatchObject({ status: "cancelled", actualDepartureUtc: null });
  });
});

describe("splitWindows", () => {
  it("splits a day into 12-hour windows", () => {
    const w = splitWindows(new Date("2026-10-02T00:00:00Z"), new Date("2026-10-03T01:00:00Z"));
    expect(w.map(([a, b]) => [a.toISOString(), b.toISOString()])).toEqual([
      ["2026-10-02T00:00:00.000Z", "2026-10-02T12:00:00.000Z"],
      ["2026-10-02T12:00:00.000Z", "2026-10-03T00:00:00.000Z"],
      ["2026-10-03T00:00:00.000Z", "2026-10-03T01:00:00.000Z"],
    ]);
  });
});

describe("AeroDataBoxStatusSource", () => {
  const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

  it("requests local-time windows with the key and filters to [from, to)", async () => {
    const urls: string[] = [];
    const headers: Headers[] = [];
    const fetchFn = (async (url: string, init?: RequestInit) => {
      urls.push(url);
      headers.push(new Headers(init?.headers));
      return ok(recorded);
    }) as typeof fetch;
    const source = new AeroDataBoxStatusSource("test-key", fetchFn, () => new Date(FETCHED));
    // 05:00-17:00 UTC = 06:00-18:00 Lagos time, one window.
    const records = await source.fetchDepartures("LOS", new Date("2026-10-02T05:00:00Z"), new Date("2026-10-02T06:00:00Z"));
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("/flights/airports/iata/LOS/2026-10-02T06:00/2026-10-02T06:59?");
    expect(headers[0].get("X-RapidAPI-Key")).toBe("test-key");
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((r) => r.scheduledDepartureUtc >= "2026-10-02T05:00" && r.scheduledDepartureUtc < "2026-10-02T06:00")).toBe(true);
  });

  it("treats 204 as no flights", async () => {
    const source = new AeroDataBoxStatusSource("k", (async () => new Response(null, { status: 204 })) as typeof fetch);
    expect(await source.fetchDepartures("SKO", new Date("2026-10-02T05:00:00Z"), new Date("2026-10-02T06:00:00Z"))).toEqual([]);
  });

  it.each([429, 503])("marks %i as retryable", async (status) => {
    const source = new AeroDataBoxStatusSource("k", (async () => new Response("", { status })) as typeof fetch);
    await expect(source.fetchDepartures("LOS", new Date("2026-10-02T05:00:00Z"), new Date("2026-10-02T06:00:00Z"))).rejects.toBeInstanceOf(RetryableSourceError);
  });

  it("does not retry auth or quota errors", async () => {
    const source = new AeroDataBoxStatusSource("bad", (async () => new Response("", { status: 403 })) as typeof fetch);
    const err = await source.fetchDepartures("LOS", new Date("2026-10-02T05:00:00Z"), new Date("2026-10-02T06:00:00Z")).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(RetryableSourceError);
  });
});
