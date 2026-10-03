# Development

## Setup

```bash
npm install
npm run dev
```

There is no `.env.example` in the repo; the defaults run on mock data. Open http://localhost:3000/v2 for the current design.

The app runs entirely on `MockFlightProvider` by default (`FLIGHT_PROVIDER=mock` in `.env.example`) — no external credentials or database connection are required to run it locally.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build (also runs TypeScript checks) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates Next.js route types (`next typegen`), then `tsc --noEmit`; faster than a full build |
| `npm test` | Runs the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and every push to `main`: `npm ci`, tests, typecheck, lint, build, and `npm audit` (fails on high or critical vulnerabilities in production dependencies).

## Rate limiting, errors and analytics

- `/api/search` allows 30 searches per minute per client IP (`SEARCH_RATE_LIMIT_PER_MINUTE` overrides it) and returns 429 with `Retry-After` beyond that. The counter is in memory, so each server instance counts separately; swap in a shared store (e.g. Redis) through `RateLimitStore` in `src/lib/rateLimit.ts` when one exists.
- `src/instrumentation.ts` logs every uncaught server error as one JSON line (no headers, so no cookies or personal data), searchable in Vercel's runtime logs. Replace or extend it with Sentry once an account exists.
- Vercel Analytics and Speed Insights are in the root layout. They record nothing until enabled in the Vercel dashboard (Project → Analytics / Speed Insights). No cookies.

## Database

Neon Postgres in production (see `docs/DATABASE.md` for setup, `docs/DATABASE_PROVIDERS.md` for why and the portability rules). `npm install` runs `prisma generate`. Vercel builds use `npm run vercel-build` (`scripts/vercel-build.sh`), which applies pending migrations when `DATABASE_URL_UNPOOLED` is set and skips them otherwise. Schema changes: edit `prisma/schema.prisma`, run `npx prisma migrate dev --name <change>` against a local Postgres, commit the generated migration. Seed with `npm run db:seed`. Integration tests in `tests/integration/` run when `TEST_DATABASE_URL` points at a migrated local or CI database.

## Staging deployment (Vercel)

The Vercel MCP connector in this session returned "No approval received" when attempted, so deployment wasn't completed automatically — the steps below are exact and manual.

### Why `ALLOW_MOCK_PROVIDER=true` is required on Vercel specifically

Vercel sets `NODE_ENV=production` for **every** deployment, including preview/staging ones — there's no separate "staging" `NODE_ENV`. `MockFlightProvider`'s safety gate (`src/lib/flights/providers/mockProvider.ts`) reads `NODE_ENV !== "production" || ALLOW_MOCK_PROVIDER === "true"`. Without `ALLOW_MOCK_PROVIDER=true` set as a Vercel environment variable, the app will throw on every search request once deployed — this is the gate working as designed, not a bug, but it does mean staging deploys need that variable explicitly set.

### Required environment variables for staging

| Variable | Value for staging | Scope |
|---|---|---|
| `FLIGHT_PROVIDER` | `mock` | Public-safe (no secret value) |
| `ALLOW_MOCK_PROVIDER` | `true` | Public-safe (no secret value) — required, see above |

Optional, for flight-status collection (`/api/cron/collect-status`); the job returns `skipped` until the key and database are both set:

| Variable | Value | Scope |
|---|---|---|
| `AERODATABOX_API_KEY` | RapidAPI key | **Secret** (set as sensitive in Vercel; never commit) |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Set by the Neon integration | Secret |
| `CRON_SECRET` | Random string | Secret; Vercel Cron sends it as a Bearer token |
| `STATUS_AIRPORTS` | `LOS,ABV` (default) | Each airport uses about 120 AeroDataBox units a month; the free plan has 400 |

Leave anything else in `.env.example` unset; do not fill in placeholder or fake values.

### Manual deployment steps

1. Push this repository to a Git provider (GitHub/GitLab/Bitbucket) — Vercel deploys from a connected repo most reliably.
2. In the Vercel dashboard: **Add New → Project → Import** the repository.
3. Framework preset: Next.js (auto-detected — no override needed).
4. Build command: `npm run build` (default — no override needed).
5. Install command: `npm install` (default — no override needed).
6. Node.js version: 20.x or later (see `package.json` → `engines.node`). Vercel's current default runtime satisfies this; no manual override should be needed, but confirm under Project Settings → General if the build fails on a Node-version-related error.
7. Under Project Settings → Environment Variables, add `FLIGHT_PROVIDER=mock` and `ALLOW_MOCK_PROVIDER=true` for the **Preview** environment (and Production too, only if you intend production to also run on mock data for now — otherwise leave Production unset so it fails loudly instead of silently serving fake prices, per the gate's design).
8. Deploy. Vercel will build and give you a `*.vercel.app` preview URL.
9. Run through the manual check in "Post-deploy verification" below against that URL.

### Post-deploy verification checklist
- Homepage loads
- Search form loads, airport dropdowns populate
- Lagos → Abuja one-way search returns results
- Sort by price/duration/departure time all reorder results
- Return trip search shows two slices (outbound + return) per offer
- A route/date combination still returns mock results (the mock provider always returns 3–6 offers by design — there's no current way to trigger the empty-results UI state through the form; see note below)
- A malformed request (e.g. hitting `/api/search` with bad input directly) returns a 400 with issues, not a crash
- Layout is usable at a phone-width viewport
- The demonstration banner and per-offer "Test data" badges are visible

Note on the empty-results state: `FlightResults`' empty state is implemented and unit-tested (`searchEngine.test.ts` covers the `NO_RESULTS` path), but `MockFlightProvider` always generates 3–6 offers for any known route, so it can't currently be triggered end-to-end through the deployed UI. This isn't a deployment issue — it's a property of the mock provider's design — worth knowing rather than spending time trying to force it.

## Design notes

**V2 (`/v2`) is the current design.** Its tokens live in the `.v2` block of `src/app/globals.css` (blue primary, silver neutrals, near-black ink and dark canvas, with matching dark-mode values) and are scoped to the V2 route so V1 is unaffected. Tailwind's `dark:` variant follows the `.dark` class set by the theme toggle. Fonts are a system stack to avoid a build-time network dependency. The final brand (fonts, palette, logo) is still undecided; see `docs/BRAND.md`. Applying the chosen direction is a token, font and logo swap. Details in `docs/V2_DESIGN.md`.

V1 (`/`) keeps its original white/near-black/blue palette for comparison until V2 becomes the home page.

## Working in this codebase

1. **Read `docs/FLIGHT_PROVIDER_INTERFACE.md` before touching anything in `src/lib/flights/`.** The provider abstraction is the one architectural rule that must not be violated.
2. **`MockFlightProvider` must never run in production without `ALLOW_MOCK_PROVIDER=true` explicitly set.** This is enforced at construction time (`src/lib/flights/providers/mockProvider.ts`) — don't remove or weaken that check.
3. **Every new feature**: define requirements → plan → implement → test → run `npm test && npm run typecheck && npm run lint && npm run build` → update relevant docs → commit. No large uncontrolled diffs across unrelated parts of the codebase in one change.
4. **Don't build ahead of confirmed requirements.** Nothing Wakanow/Travelstart/booking/payment-shaped belongs in this codebase until Phase 0.5's outreach resolves (see `docs/DECISIONS.md`).
