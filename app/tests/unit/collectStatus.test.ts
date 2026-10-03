import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/collect-status/route";
import { MemoryFlightStatusStore, runStatusCollection, withRetry } from "@/lib/ingest/collectStatus";
import { FixtureFlightStatusSource } from "@/lib/ingest/fixtureSource";
import { departureDelayMinutes, recordKey, RetryableSourceError, type FlightStatusRecord, type FlightStatusSource } from "@/lib/ingest/types";

// Synthetic records for pipeline tests only.
const rec = (flightNumber: string, origin: string, scheduled: string, actual: string | null, status: FlightStatusRecord["status"] = "departed"): FlightStatusRecord => ({
  flightNumber,
  airlineIata: flightNumber.slice(0, 2),
  origin,
  destination: origin === "LOS" ? "ABV" : "LOS",
  scheduledDepartureUtc: scheduled,
  actualDepartureUtc: actual,
  status,
  source: "fixture",
  fetchedAtUtc: "2026-10-03T00:00:00.000Z",
});

const FIXTURE = [
  rec("P47120", "LOS", "2026-10-02T06:00:00.000Z", "2026-10-02T06:40:00.000Z"),
  rec("QI0310", "LOS", "2026-10-02T11:30:00.000Z", "2026-10-02T11:35:00.000Z"),
  rec("UN0501", "ABV", "2026-10-02T09:00:00.000Z", null, "cancelled"),
  rec("P47999", "LOS", "2026-10-03T06:00:00.000Z", null, "scheduled"), // outside the window
];
const from = new Date("2026-10-02T00:00:00.000Z");
const to = new Date("2026-10-03T00:00:00.000Z");
const noSleep = { attempts: 3, baseDelayMs: 1, sleep: async () => {} };
const quiet = () => {};

describe("record helpers", () => {
  it("computes departure delay and a stable key", () => {
    expect(departureDelayMinutes(FIXTURE[0])).toBe(40);
    expect(departureDelayMinutes(FIXTURE[2])).toBeNull();
    expect(recordKey(FIXTURE[0])).toBe("P47120|LOS|2026-10-02");
  });
});

describe("withRetry", () => {
  it("retries retryable errors with exponential backoff, then succeeds", async () => {
    const waits: number[] = [];
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) throw new RetryableSourceError("429");
        return "ok";
      },
      { attempts: 3, baseDelayMs: 100, sleep: async (ms) => void waits.push(ms) },
    );
    expect(result).toBe("ok");
    expect(waits).toEqual([100, 200]);
  });

  it("does not retry other errors", async () => {
    let calls = 0;
    await expect(withRetry(async () => { calls++; throw new Error("bad request"); }, noSleep)).rejects.toThrow("bad request");
    expect(calls).toBe(1);
  });
});

describe("runStatusCollection", () => {
  it("collects every airport in the window and stores de-duplicated records", async () => {
    const store = new MemoryFlightStatusStore();
    const summary = await runStatusCollection({
      source: new FixtureFlightStatusSource([...FIXTURE, FIXTURE[0]]), // duplicate on purpose
      store,
      airports: ["LOS", "ABV"],
      fromUtc: from,
      toUtc: to,
      retry: noSleep,
      log: quiet,
    });
    expect(summary.airportsSucceeded).toEqual(["LOS", "ABV"]);
    expect(summary.recordsFetched).toBe(4);
    expect(summary.recordsWritten).toBe(3);
    expect(store.records.size).toBe(3);
  });

  it("keeps going when one airport fails, and reports it", async () => {
    const flaky: FlightStatusSource = {
      name: "flaky",
      async fetchDepartures(airport) {
        if (airport === "ABV") throw new RetryableSourceError("503 from provider");
        return [FIXTURE[0]];
      },
    };
    const events: Record<string, unknown>[] = [];
    const summary = await runStatusCollection({
      source: flaky,
      store: new MemoryFlightStatusStore(),
      airports: ["ABV", "LOS"],
      fromUtc: from,
      toUtc: to,
      retry: noSleep,
      log: (e) => events.push(e),
    });
    expect(summary.airportsSucceeded).toEqual(["LOS"]);
    expect(summary.airportsFailed).toEqual([{ airport: "ABV", error: "503 from provider" }]);
    expect(events.some((e) => e.event === "status_collection_airport_failed")).toBe(true);
  });
});

describe("GET /api/cron/collect-status", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });
  const call = (auth?: string) =>
    GET(new NextRequest("http://localhost/api/cron/collect-status", { headers: auth ? { authorization: auth } : {} }));

  it("rejects everything when no CRON_SECRET is configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("Bearer anything")).status).toBe(401);
  });

  it("rejects a wrong secret and skips when not yet configured", async () => {
    process.env.CRON_SECRET = "s3cret";
    delete process.env.AERODATABOX_API_KEY;
    expect((await call("Bearer nope")).status).toBe(401);
    const ok = await call("Bearer s3cret");
    expect(ok.status).toBe(200);
    expect((await ok.json()).status).toBe("skipped");
  });
});
