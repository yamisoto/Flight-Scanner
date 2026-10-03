import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runStatusCollection } from "@/lib/ingest/collectStatus";
import { FixtureFlightStatusSource } from "@/lib/ingest/fixtureSource";
import { PrismaFlightStatusStore } from "@/lib/ingest/prismaStore";
import type { FlightStatusRecord } from "@/lib/ingest/types";

// Runs against a real, migrated Postgres database named by TEST_DATABASE_URL
// (CI provides one; see .github/workflows/ci.yml). Never point it at production:
// it deletes every flight_status_observations row.
const url = process.env.TEST_DATABASE_URL;

const rec = (flightNumber: string, actual: string | null, status: FlightStatusRecord["status"]): FlightStatusRecord => ({
  flightNumber,
  airlineIata: flightNumber.slice(0, 2),
  origin: "LOS",
  destination: "ABV",
  scheduledDepartureUtc: "2026-10-02T06:00:00.000Z",
  actualDepartureUtc: actual,
  status,
  source: "fixture",
  fetchedAtUtc: "2026-10-02T07:00:00.000Z",
});

describe.runIf(url)("PrismaFlightStatusStore (Postgres)", () => {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const store = new PrismaFlightStatusStore(prisma);

  beforeAll(async () => {
    if (!/localhost|127\.0\.0\.1|postgres:/.test(url!)) throw new Error("TEST_DATABASE_URL must point at a local or CI database.");
  });
  beforeEach(() => prisma.flightStatusObservation.deleteMany());
  afterAll(() => prisma.$disconnect());

  it("inserts, then updates the same flight on a later fetch instead of duplicating it", async () => {
    await store.upsert([rec("P47120", null, "scheduled")]);
    await store.upsert([rec("P47120", "2026-10-02T06:40:00.000Z", "departed")]);
    const rows = await prisma.flightStatusObservation.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("departed");
    expect(rows[0].actualDepartureUtc?.toISOString()).toBe("2026-10-02T06:40:00.000Z");
    expect(rows[0].serviceDate.toISOString().slice(0, 10)).toBe("2026-10-02");
  });

  it("stores a full collection run end to end", async () => {
    const summary = await runStatusCollection({
      source: new FixtureFlightStatusSource([rec("P47120", "2026-10-02T06:40:00.000Z", "departed"), rec("QI0310", null, "cancelled")]),
      store,
      airports: ["LOS"],
      fromUtc: new Date("2026-10-02T00:00:00.000Z"),
      toUtc: new Date("2026-10-03T00:00:00.000Z"),
      log: () => {},
    });
    expect(summary.recordsWritten).toBe(2);
    expect(await prisma.flightStatusObservation.count({ where: { status: "cancelled" } })).toBe(1);
  });
});
