# Flight Provider Interface

## Why this exists

Nigerian domestic flight data access is unresolved (see `docs/PHASE_0_5_VALIDATION.md`). The application cannot wait for that to be resolved to start being built, and it cannot be rebuilt every time a candidate provider (Wakanow, Travelstart, a direct airline) turns out to need different treatment. Every provider — including the mock one — speaks through the same interface, defined in `src/lib/flights/provider.ts`:

```ts
interface FlightProvider {
  readonly name: string;
  readonly displayName: string;
  searchFlights(request: FlightSearchRequest): Promise<FlightOffer[]>;
  getFlightDetails(offerId: string): Promise<FlightOffer | null>;
  healthCheck(): Promise<ProviderHealth>;
}
```

## Rules that keep this working

1. **Nothing outside a provider adapter's own file may contain provider-specific logic.** The search engine (`src/lib/flights/searchEngine.ts`) never checks `if (provider.name === 'wakanow')` — if a rule is provider-specific, it lives inside that provider's own adapter file.
2. **Every adapter throws `ProviderError`, never a raw error.** `ProviderError` carries a typed `code` (`PROVIDER_UNAVAILABLE`, `RATE_LIMITED`, `INVALID_REQUEST`, `NO_RESULTS`, `UNKNOWN_ERROR`) so the search engine and API route can react appropriately instead of treating every failure as "no flights."
3. **Every offer returned by any provider must be in the shared `FlightOffer` shape** (`src/types/flight.ts`) — providers translate their own response into this shape; this shape never bends to fit a provider.
4. **The registry (`src/lib/flights/registry.ts`) is the only place that picks a provider**, controlled by the `FLIGHT_PROVIDER` environment variable. No other file should import a concrete provider class directly (aside from the registry itself and that provider's own tests).

## Request/response shapes

`FlightSearchRequest` — origin, destination, departure/return dates, trip type, passenger counts, cabin class. See `src/types/flight.ts` for the exact fields.

`FlightOffer` — normalised bookable option: id, provider name, one or two `FlightSlice`s (outbound/return), cabin class, price (NGN), optional baggage/fare-condition/booking-URL/expiry fields. A `FlightSlice` holds one or more `FlightSegment`s — more than one segment means a connection.

## Adding a real provider later

1. Confirm real API access and terms first (see `docs/PHASE_0_5_VALIDATION.md` / `docs/PARTNER_OUTREACH_PLAN.md`) — do not build an adapter against assumed response shapes.
2. Create `src/lib/flights/providers/<name>Provider.ts` implementing `FlightProvider`.
3. Map that provider's real response fields into `FlightOffer` — this is almost all of the adapter's job.
4. Add it to the `switch` in `src/lib/flights/registry.ts`.
5. Write adapter tests against recorded/representative fixture responses (see `docs/TESTING.md`) — not live calls in CI.

Nothing else in the app changes.
