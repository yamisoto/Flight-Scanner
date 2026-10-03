# Database

## Status

**Provider: Neon** (decided 3 Oct 2026; comparison and portability rules in `DATABASE_PROVIDERS.md`). The schema and first migration (`prisma/migrations/`) are ready and tested against Postgres 16. The production database itself is created from Vercel (Storage → Neon, London region), which sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`; every Vercel build then applies pending migrations (`scripts/vercel-build.sh`).

## Setting it up

1. Vercel → Project → Storage → Create → Neon, region London (`eu-west-2`), enable preview branches.
2. Redeploy: the build applies migrations automatically.
3. Seed reference data once: `npm run db:seed` with the production connection strings (re-runnable; upserts by IATA code).

Locally: point `DATABASE_URL` and `DATABASE_URL_UNPOOLED` at any Postgres 16+, run `npx prisma migrate dev`, then `npm run db:seed`. `TEST_DATABASE_URL` enables the integration tests in `tests/integration/` (they wipe `flight_status_observations`, so never point it at production).

Backups: `scripts/db-backup.sh` (portable pg_dump) and `scripts/db-restore.sh`.

## Models (MVP scope only)

**`Airport`** — static reference data mirroring `src/lib/data/airports.ts` (iata, icao, name, city, state, verified). Not written to by the app at runtime; seeded once.

**`Airline`** — static reference data mirroring `src/lib/data/airlines.ts` (name, iata, icao, operationalStatus, verified). Same seeding pattern.

**`FlightStatusObservation`**: one observed departure per flight, origin and service date: scheduled vs actual departure time and status, from the flight-status source. Upserted by the daily collection job (`src/lib/ingest/prismaStore.ts`), so a later fetch updates the same row. The raw material for route-level reliability scores.

**`FlightSearch`** — one row per search submitted through `/api/search`, for basic analytics/debugging (origin, destination, dates, trip type, passenger count, cabin class, which provider served it, result count, timestamp). Never stores full offer/provider payloads — offers are ephemeral (~30 min expiry industry-wide) and shouldn't be treated as persisted truth.

## Explicitly deferred (do not build yet)
`Route`, `Flight`, `FlightOffer`, `FlightProvider` (as a DB table — not to be confused with the `FlightProvider` TypeScript interface), `SavedFlight`, `Trip`, `Booking`, `Notification`, `User` — all Phase 2/3 concerns per the roadmap. Adding them now would mean guessing at a shape before the feature that needs them is actually being built.
