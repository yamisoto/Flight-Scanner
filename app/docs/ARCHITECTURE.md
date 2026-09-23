# Architecture

## Stack (as built)

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4. API routes under `src/app/api/`. Vitest for tests. Prisma schema defined but not yet generated/migrated (see `docs/DEVELOPMENT.md`).

## Request flow

```
Browser (React components)
  -> POST /api/search  (src/app/api/search/route.ts)
    -> validateSearchRequest()      (src/lib/validation/searchValidation.ts)
    -> FlightSearchEngine.search()  (src/lib/flights/searchEngine.ts)
      -> getActiveProvider()        (src/lib/flights/registry.ts)
        -> MockFlightProvider       (src/lib/flights/providers/mockProvider.ts)
      -> applyFilters() / sortOffers()
    <- FlightOffer[] or a typed error (see below)
```

`GET /api/airports?query=` — simple substring search over the static airport dataset, for the search form.

## Layers and their responsibilities

- **`src/types/flight.ts`** — every shared domain type (`FlightSearchRequest`, `FlightOffer`, `FlightSlice`, `FlightSegment`, `ProviderError`, etc). Nothing provider-specific lives here.
- **`src/lib/flights/provider.ts`** — the `FlightProvider` interface every adapter implements. See `docs/FLIGHT_PROVIDER_INTERFACE.md`.
- **`src/lib/flights/providers/mockProvider.ts`** — the only implemented provider in Phase 1A. Generates realistic, clearly-fake Nigerian domestic offers; hard-blocked from production unless `ALLOW_MOCK_PROVIDER=true`.
- **`src/lib/flights/registry.ts`** — the one place that decides which provider is active, via `FLIGHT_PROVIDER` env var.
- **`src/lib/flights/searchEngine.ts`** — provider-independent orchestration: calls the provider, normalises failures into `ProviderError`, applies sort/filter. Contains zero provider-specific logic by design.
- **`src/lib/validation/searchValidation.ts`** — validates untrusted input before it reaches the search engine; reports every issue found, not just the first.
- **`src/lib/data/airports.ts`, `airlines.ts`** — static reference datasets, each entry flagged `verified: true/false` depending on whether a primary source confirmed it during research (see `docs/PHASE_0_5_VALIDATION.md`).
- **`src/components/`** — `SearchForm`, `FlightResults`, `FlightCard`: presentation only, no business logic. They call `/api/search` and render whatever comes back, including distinct loading/empty/error states.

## Error handling

The API route distinguishes three outcomes, not two: success with results, success with zero results (`{ offers: [], message: ... }`, HTTP 200 — this is a valid search outcome, not a failure), and an actual failure (HTTP 400 for bad input, 502 for a provider failure, 500 for anything unexpected). This is deliberate — collapsing "no flights on this route today" and "the provider is down" into the same empty-list response is exactly what `docs/PRD.md` flags as unacceptable.

## What's intentionally not here yet

No database wiring at runtime (schema exists, not connected — see `docs/DEVELOPMENT.md`). No caching layer. No analytics/error-monitoring wiring. No booking/payment flow. No Wakanow/Travelstart/airline adapters. All of these are Phase 1B+ per `docs/DECISIONS.md` and the original roadmap — building them now would be building against requirements that aren't confirmed yet.
