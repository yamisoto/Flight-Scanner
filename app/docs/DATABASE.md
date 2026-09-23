# Database

## Status
Schema defined in `prisma/schema.prisma`. Not generated or migrated in this build — see the Prisma note in `docs/DEVELOPMENT.md`. Nothing in the running app currently reads or writes a database; `MockFlightProvider` is entirely in-memory.

## Models (MVP scope only)

**`Airport`** — static reference data mirroring `src/lib/data/airports.ts` (iata, icao, name, city, state, verified). Not written to by the app at runtime; seeded once.

**`Airline`** — static reference data mirroring `src/lib/data/airlines.ts` (name, iata, icao, operationalStatus, verified). Same seeding pattern.

**`FlightSearch`** — one row per search submitted through `/api/search`, for basic analytics/debugging (origin, destination, dates, trip type, passenger count, cabin class, which provider served it, result count, timestamp). Never stores full offer/provider payloads — offers are ephemeral (~30 min expiry industry-wide) and shouldn't be treated as persisted truth.

## Explicitly deferred (do not build yet)
`Route`, `Flight`, `FlightOffer`, `FlightProvider` (as a DB table — not to be confused with the `FlightProvider` TypeScript interface), `SavedFlight`, `Trip`, `Booking`, `Notification`, `User` — all Phase 2/3 concerns per the roadmap. Adding them now would mean guessing at a shape before the feature that needs them is actually being built.

## Why no live connection yet
Two independent reasons, not one: (1) MVP's mock-data phase doesn't need persistence to function, and (2) this build environment can't reach Prisma's engine-binary host to run `generate`/`migrate`. Once a real dev environment is available, run:
```
npx prisma generate
npx prisma migrate dev --name init
```
against the schema as written, then seed `Airport`/`Airline` from the TypeScript datasets in `src/lib/data/`.
