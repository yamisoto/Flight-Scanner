# Nigeria Travel Platform — Flight Comparison

Nigerian domestic flight comparison platform. Phase 1A: technical foundation, running entirely on mock data while live provider access (Wakanow/Travelstart/direct airline) is negotiated separately — see `docs/DECISIONS.md`.

## Status

Phase 1A complete: 48/48 tests passing, typecheck/lint/build all clean. Running entirely on `MockFlightProvider`. No real flight data connected yet — that's intentional, not a gap (see `docs/PHASE_0_5_VALIDATION.md` for why). Search → compare → select → redirect-to-provider is the full user journey; no booking, payment, or ticket issuance in this codebase.

**This staging environment uses MockFlightProvider and does not contain live flight inventory.** Every price and schedule shown is clearly-marked test data — see the banner and per-offer badges in the UI itself. Staging deployment wasn't completed automatically in the session that built this (the Vercel connector returned "No approval received"); see `docs/DEVELOPMENT.md` → "Staging deployment" for the exact manual steps and required environment variables (`FLIGHT_PROVIDER=mock`, `ALLOW_MOCK_PROVIDER=true`).

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 — search a route (e.g. Lagos → Abuja) and you'll get realistic-looking but clearly-marked mock results.

## Scripts
`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test`

## Docs
- `docs/ARCHITECTURE.md` — system design as built
- `docs/DATABASE.md` — schema (defined, not yet connected — see note inside)
- `docs/FLIGHT_PROVIDER_INTERFACE.md` — the provider abstraction contract, read this before touching `src/lib/flights/`
- `docs/DEVELOPMENT.md` — setup, scripts, known environment limitations, working conventions
- `docs/DECISIONS.md` — open decisions and their current status

## Working in this repo (for a future dev or AI agent session)
1. Read `docs/FLIGHT_PROVIDER_INTERFACE.md` first if you're touching flight-data code at all.
2. `MockFlightProvider` is the only provider implemented. It is hard-blocked from production unless `ALLOW_MOCK_PROVIDER=true` is explicitly set — don't weaken that check.
3. No provider-specific logic outside a provider's own adapter file. The search engine stays provider-agnostic.
4. Before considering any change done: `npm test && npm run typecheck && npm run lint && npm run build` — all four, not a subset.
5. Nothing booking/payment/Wakanow/Travelstart-shaped belongs here yet — check `docs/DECISIONS.md` before building ahead of a confirmed requirement.
