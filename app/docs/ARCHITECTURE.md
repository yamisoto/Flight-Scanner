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
- **`src/components/`** — V1 UI (`SearchForm`, `FlightResults`, `FlightCard`, `FiltersPanel`, `FlightDetailsModal`): presentation only. `FlightDetailsModal` is shared with V2.

## V2 (current design, `/v2`)

```
src/app/v2/layout.tsx      scopes the V2 design tokens (.v2 in globals.css) to this route
src/app/v2/page.tsx        landing + results page; POST /api/search and /api/search/calendar per search;
                           reads a shared search from the URL on load and writes each search back to it
src/components/v2/         Header, SearchPanel, AirportCombobox, TravellersPicker, SortTabs, DateStrip,
                           ResultsView, ResultCard, AlsoFlying, ReliabilityBadge (+ explainer), ShareButton,
                           Filters, LandingSections, icons
src/lib/v2/scoring.ts      reliability, Skyfare Pick, Best/Cheapest/Fastest/Most reliable ordering
src/lib/v2/searchUrl.ts    search <-> URL query string, with validation of incoming links
src/lib/v2/format.ts       time, duration, price and date formatting
```

V2 fetches the unsorted, unfiltered offers once and does scoring, sorting and filtering in the browser, so switching tabs or filters is instant and makes no extra API calls. `scoring.ts` is pure and unit tested (`tests/unit/v2Scoring.test.ts`) so it can move into a shared package for the Phase 2 mobile app. Reliability comes from the NCAA airline baseline (`src/lib/reliability/score.ts`), with the labelled `previewReliability()` placeholder only for airlines without NCAA figures. See `docs/V2_DESIGN.md`.

### Every flight, nearby dates

`/api/search` returns `{ offers, provider, schedule }`. `schedule` is a `ScheduleCoverage` built by `src/lib/flights/schedule.ts`: the flights known to operate that day, matched against the priced offers (same flight number, or same airline within 15 minutes), with the unmatched ones returned as `unpriced`. The schedule comes from `getScheduleSource()` (`src/lib/flights/scheduleSource.ts`): the price provider's own `getScheduledFlights()` if it has one (the mock does), otherwise the collected flight-status observations in the database projected onto the same weekday (`projectSchedule`, last 21 days), otherwise none. The lookup is best effort: a failure logs `schedule_lookup_failed` and the search still returns its offers.

`POST /api/search/calendar` takes the same body and returns the cheapest price for the chosen date and three days either side (`src/lib/flights/priceCalendar.ts`), skipping past dates and shifting the return date with the departure. Results are cached in memory for 10 minutes per search. Both search endpoints share one per-client rate limit (`src/lib/searchRateLimit.ts`, 30 a minute by default, `SEARCH_RATE_LIMIT_PER_MINUTE`). The strip costs up to 7 provider searches per uncached request; revisit when a paid price API is connected.

## Reliability and flight-status collection

```
src/lib/reliability/ncaaData.ts   NCAA airline-level monthly operations data (the current baseline)
src/lib/reliability/score.ts      reliability score, label, confidence and plain-English reason
src/lib/ingest/types.ts           FlightStatusRecord, FlightStatusSource, FlightStatusStore
src/lib/ingest/collectStatus.ts   runStatusCollection(): per-airport fetch with retry/backoff,
                                  de-duplication, structured logs, summary; never stops on one failure
src/lib/ingest/aeroDataBoxSource.ts  FlightStatusSource for AeroDataBox, tested against recorded live responses
src/lib/ingest/collectionSettings.ts airports (STATUS_AIRPORTS, default LOS,ABV) and the daily window
src/lib/ingest/prismaStore.ts     FlightStatusStore on Postgres
src/lib/ingest/fixtureSource.ts   synthetic source for tests and local runs only
src/app/api/cron/collect-status   daily trigger for Vercel Cron (Bearer CRON_SECRET, fails closed)
```

The cron route collects the previous Lagos day's departures from `STATUS_AIRPORTS` through AeroDataBox into `flight_status_observations`, and returns `skipped` until both `AERODATABOX_API_KEY` and `DATABASE_URL` are set. AeroDataBox returns scheduled times only for Nigerian domestic flights (see `docs/DATA_SOURCES.md`), so today these rows feed the "every flight" schedule, not reliability scores. Cost: each airport is two 12-hour calls (4 API units) a day; the default two hubs use about 240 of the free plan's 400 units a month. To switch it on once the database exists: set `CRON_SECRET` and add the schedule to `vercel.json`.

## Error handling

The API route distinguishes three outcomes, not two: success with results, success with zero results (`{ offers: [], message: ... }`, HTTP 200 — this is a valid search outcome, not a failure), and an actual failure (HTTP 400 for bad input, 502 for a provider failure, 500 for anything unexpected). This is deliberate — collapsing "no flights on this route today" and "the provider is down" into the same empty-list response is exactly what `docs/PRD.md` flags as unacceptable.

## What's intentionally not here yet

No database wiring at runtime (schema exists, not connected — see `docs/DEVELOPMENT.md`). No caching layer. No analytics/error-monitoring wiring. No booking/payment flow. No Wakanow/Travelstart/airline adapters. All of these are Phase 1B+ per `docs/DECISIONS.md` and the original roadmap — building them now would be building against requirements that aren't confirmed yet.
