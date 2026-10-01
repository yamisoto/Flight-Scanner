# Skyfare: Phase 1 Plan (Nigeria Domestic MVP)

Status: **Draft for review.** Nothing in this document has been built yet beyond what already exists in Phase 1A (see "Starting point").

## 1. Goal of Phase 1

A working web MVP where anyone can search any Nigerian domestic route, see **every** flight option on that route, and compare them by **Time**, **Price** and **Reliability**, with one flight clearly highlighted as Skyfare's recommendation. The web app is architected so Phase 2 (mobile app) reuses the same API, data model and design tokens. Phase 3+ expands to Africa.

Out of scope for Phase 1: booking/payment/ticketing (we redirect to the seller), user accounts, price alerts, non-Nigerian routes.

## 2. Starting point (what already exists)

The repo already contains a Phase 1A foundation that should be kept, not rewritten:

| Area | State |
|---|---|
| Stack | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Vitest |
| Search flow | `POST /api/search` -> validation -> provider-agnostic search engine -> `MockFlightProvider` |
| Provider abstraction | `FlightProvider` interface + registry; adding a real source is one adapter file |
| UI | Search form, results list, flight card, details modal, filters panel, animated "Skyfare" wordmark |
| Dark mode | Working toggle (class on `<html>`, CSS variables, persisted in localStorage) |
| Tests | Unit tests for validation, search engine, mock provider, API route |
| DB | Prisma schema defined (Airport, Airline, FlightSearch), not migrated |

Gaps against this brief: no reliability score, no recommended flight, palette is white/near-black/blue (no silver), sort supports price/duration/departure only, no real data. Also: `README.md` references `PRD.md`, `PHASE_0_5_VALIDATION.md`, `PARTNER_OUTREACH_PLAN.md`, `PROVIDER_SCORECARD.md` and `TESTING.md`, none of which are in the repo. Either upload them or we remove the references.

## 3. Market research

### Competitors (direct)

| Site | Why it matters |
|---|---|
| **Wakanow** (given) | Largest Nigerian OTA. Strong domestic inventory, Naira payments, flash sales. Weakness: booking-first, not comparison-first; no reliability signal. |
| **Travelstart Nigeria** (new) | Pan-African OTA, strong on comparison UX and price alerts. Runs an affiliate program (via Impact) with iframe/XML feed tooling, which makes it both a competitor and a likely **data partner**. Domestic affiliate commission is 2% of base fare. |
| **Tbils** (new) | Fast-growing Nigeria-specific comparison/booking site that positions itself on "compare all Nigerian airlines at once". Closest positioning to Skyfare, so it is the one to watch. |

Honourable mention: Travelbeta (IATA-accredited OTA, more package/visa focused).

None of these surface on-time reliability. That is Skyfare's wedge, and the timing is good: NCAA data shows ~60% of domestic flights were delayed in August 2026, with Air Peace and United Nigeria above 70%.

### Inspiration (beyond Skyscanner)

| Site | What to steal |
|---|---|
| **Google Flights** | The "Best" tab logic (a blended ranking, not just cheapest), price-context labels ("prices are low for this route"), extremely calm results layout. Model for our recommended-flight UX. |
| **Flighty** | Best-in-class flight reliability presentation: on-time history per flight, delay predictions, clean data-dense cards. Model for how the Reliability score is explained. It is also a native-app-first product, which is a useful reference for Phase 2. |

Runner-up: Kayak (price forecast "buy/wait" advice, flexible-date grid).

## 4. Data strategy (the hardest problem)

"Show all flight options for a route" means two separate things, and we should treat them separately:

1. **Schedule completeness**: every flight that operates on the route that day (airline, flight number, times).
2. **Price completeness**: a live bookable price for each of those flights.

No single source gives both for Nigerian domestic carriers. Previous research already found Duffel/Amadeus coverage of Nigerian domestic carriers is weak. Proposed layered approach:

| Layer | Source | Gives us | Notes |
|---|---|---|---|
| 1. Schedules | AeroDataBox (cheap) or Cirium/OAG (enterprise) airport departure boards for LOS, ABV, PHC, KAN, etc. | The full list of operating flights per route | Becomes the "source of truth" list. Also feeds reliability (actual vs scheduled times). |
| 2. Aggregated prices | Travelstart affiliate (iframe/XML/API via Impact) and Wakanow affiliate/API, whichever signs first | Prices for most carriers, plus commission | Primary revenue path. Outreach is already in progress per `DECISIONS.md`. |
| 3. Direct airline prices | Air Peace runs Hitit Crane PSS (NDC-capable); other carriers use Crane or Videcom IBEs | Prices for carriers aggregators miss | Requires per-airline agreements. Start with the top 4 by volume. |
| 4. Fallback | Deep link to the airline's own booking page | Flight still shown, marked "Check price on airline site" | Guarantees no flight is hidden just because we lack a price. |

Scraping airline/OTA sites is technically possible but is a ToS and stability risk; only consider it with legal sign-off and never as the primary source.

Key product rule: results show a **coverage line** ("12 flights operate on this route. 9 priced, 3 check on airline site"). Being honest about coverage is itself a trust feature.

Regulatory risk to track: NCAA has previously restricted services to several carriers (e.g. Air Peace, Ibom Air, ValueJet in May 2026 over debts). Flight status data will catch suspended operations; we should also surface a route-level notice when this happens.

## 5. Reliability score (proprietary, 1 to 10)

### Inputs (from the brief, plus one addition)

| Code | Signal | Window | Source |
|---|---|---|---|
| D | Airline departure delay rate (and severity: 15-60 min, 1-2h, 2h+) | Last 60 days | Flight status data (layer 1) cross-checked with NCAA monthly reports |
| R | Cancellations of **this airline on this route** | Last 60 days | Flight status data |
| A | Airline-wide cancellations and reschedules | Last 60 days | Flight status data + NCAA reports |
| T | Time-of-day effect (suggested addition) | Last 60 days | Derived. Early-morning departures in Nigeria are consistently more punctual because delays cascade through the day. |

### Formula v1 (to tune with real data)

```
subscore_x  = 1 - normalised_badness_x            (0 = worst, 1 = best)
raw         = 0.40*D + 0.30*R + 0.20*A + 0.10*T
score       = round(1 + 9*raw, 1)                 (1.0 to 10.0)
```

Two refinements that matter more than the exact weights:

1. **Small-sample shrinkage.** A route with 6 flights in 60 days and 1 cancellation should not look worse than it is. Each route subscore is blended toward the airline-wide average weighted by sample size (Bayesian average). Without this, thin routes swing wildly.
2. **Delay severity, not just count.** A 20-minute delay and a 4-hour delay are not the same. D uses a severity-weighted delay rate.

Each score ships with a confidence label (High / Medium / Low, based on sample size) and a one-line "why" ("On time 71% of the last 60 days. 1 cancellation on this route.").

Weights and thresholds live in config, not code, so they can be tuned without a deploy. Before launch, backtest: compute scores for weeks 1 to 8 and check they predict delays in week 9.

Data dependency: route-level cancellation history needs flight status collection to **start early** (sub-phase 1.2), because we need 60 days of history before scores are meaningful. Until then, scores fall back to NCAA airline-level data with a Low confidence label.

## 6. Recommended flight logic

```
best = 0.45*price_score + 0.35*reliability_score + 0.20*time_score
```

- `price_score`: cheapest on the route = 1, scaled against the route's price range.
- `reliability_score`: Skyfare score / 10.
- `time_score`: shorter total journey and sensible departure time (not before 05:00 or after 21:00) score higher.
- Hard rule: a flight with reliability below 4.0 can never be the recommendation.
- Ties go to the cheaper flight.

UI: one "Skyfare Pick" card pinned above results with a one-line reason ("Best balance: ₦18k more than cheapest, 2.4 points more reliable"). Sorting tabs: **Best** (default), **Cheapest**, **Fastest**, **Most reliable**, plus departure-time sort.

## 7. Design direction

- **Palette:** blue primary (action, links, Skyfare Pick), silver as the neutral system (borders, secondary surfaces, metallic accent on the wordmark), black/near-black for text in light mode and as the dark-mode canvas. Proposed tokens to be finalised in 1.1:
  - Light: bg `#FFFFFF`, surface `#F3F4F6` (silver), line `#D1D5DB`, ink `#0B0C0E`, primary `#1747E0`
  - Dark: bg `#0B0C0E`, surface `#16181C`, line `#2E3138`, ink `#F3F4F6`, silver `#C0C4CC`, primary `#4A73F0`
- **Landing page:** "Skyfare" wordmark centred, search bar directly below in the middle of the viewport, theme toggle top-right. Nothing else above the fold.
- **App-ready layout rule:** single-column card list, bottom-sheet filters on mobile, no hover-only interactions, 44px minimum tap targets. Every screen should map 1:1 to a mobile screen in Phase 2.
- Dark mode: keep the existing CSS-variable approach. Add `prefers-color-scheme` as the default before the user toggles.

## 8. Sub-phases

Each sub-phase ends with `npm test && npm run typecheck && npm run lint && npm run build` green and a deployed Vercel preview.

### 1.0 Foundation clean-up (2 to 3 days)
Rename package to `skyfare`, fix the missing-doc references, wire Prisma to a real Postgres, set up CI (GitHub Actions running the four checks), connect Vercel previews.
- **Tools:** Vercel MCP (project + env vars + preview deploys), GitHub MCP (PRs/CI), Neon or Supabase Postgres, `session-start-hook` skill so cloud Claude sessions can run tests.

### 1.1 Design system and UX (1 week)
Design tokens (blue/silver/black, light + dark), landing page, results page, flight card, Skyfare Pick card, reliability badge, mobile layouts. Design in Figma first, then code.
- **Tools:** Figma MCP (design + tokens via variables, Code Connect to map components), shadcn/ui on Radix (accessible primitives that also have React Native equivalents), `next-themes` (system-default dark mode without flash), Lucide icons, `artifact-design` skill for quick clickable prototypes to review before Figma polish.

### 1.2 Data layer (2 to 3 weeks, partly blocked on partners)
Schedule ingestion from AeroDataBox (or Cirium) for all Nigerian airports, stored in Postgres. Start daily flight-status collection immediately to build reliability history. Build the first real price adapter as soon as a partner signs (Travelstart affiliate is the quickest likely path). Merge schedules and prices into one result set with the coverage line. Redis caching of searches (5 to 15 min TTL).
- **Tools:** Prisma, Upstash Redis, Vercel Cron or Inngest (scheduled ingest jobs with retries), Zod (validate every provider response), recorded fixtures for adapter tests.

### 1.3 Reliability engine (1 to 2 weeks, needs 1.2 history)
NCAA monthly report ingestion as the airline-level baseline, per-flight status history from 1.2, score computation as a nightly job writing to a `ReliabilityScore` table, confidence labels, explanation strings, backtest script.
- **Tools:** Postgres materialised views or a nightly job, Vitest for formula unit tests, `dataviz` skill for the internal backtest dashboard.

### 1.4 Comparison and recommendation (1 week)
Best / Cheapest / Fastest / Most reliable sorting, Skyfare Pick, filters (airline, time of day, stops, min reliability), coverage line, redirect-to-seller with affiliate tracking.
- **Tools:** TanStack Query (client data fetching, reused unchanged in React Native later), URL-synced search state so results are shareable.

### 1.5 Quality, analytics and hardening (1 week)
End-to-end tests of the search journey, Lighthouse/performance pass, accessibility pass (contrast in both themes), SEO for route pages ("Lagos to Abuja flights"), analytics and error monitoring, rate limiting on `/api/search`.
- **Tools:** Playwright (already available in this environment), `code-review` and `security-review` skills before merge, PostHog (analytics + funnels), Sentry (errors), Vercel Analytics/Speed Insights.

### 1.6 Brand guide and assets (3 to 5 days, can overlap 1.5)
Logo, wordmark, icon, colour and type spec, tone of voice, OG images, app icon set ready for Phase 2, launch social creatives.
- **Tools:** Figma MCP (brand guide file + asset export), Higgsfield (launch visuals and short promo video), Claude Docs for the written brand guide.

### 1.7 Launch (2 to 3 days)
Domain, production env vars (mock provider off), affiliate tracking verified end to end, soft launch on top routes (LOS-ABV, LOS-PHC, ABV-PHC, LOS-KAN), feedback loop.
- **Tools:** Vercel MCP (domain + production deploy), PostHog funnels to watch search -> click-out conversion.

### Phase 2 readiness (built in throughout)
API stays separate from UI (`/api/*` is what the mobile app will call). Types and design tokens live where they can move into a shared package. Phase 2 recommendation: Expo (React Native) in a Turborepo monorepo with the web app, sharing types, API client and tokens.

## 9. Open decisions for you

1. Which price partner to push first: Travelstart affiliate (fastest to start, lower control) or Wakanow (bigger domestic inventory, but a direct competitor)?
2. Flight status data budget: AeroDataBox (low cost, good enough to start) vs Cirium (enterprise pricing, better accuracy). Recommendation: AeroDataBox now, revisit at Africa expansion.
3. Are you happy for flights without a live price to appear in results (marked "check on airline site")? Recommendation: yes, it is the only honest way to meet "show all options".
4. Confirm the Recommended-flight weights (45% price / 35% reliability / 20% time) as a starting point.
5. Upload the missing Phase 0.5 docs or approve removing the references.

## Sources

- [Tbils: comparing flight prices in Nigeria (2026)](https://blog.tbils.com/how-to-compare-flight-prices-like-a-pro-in-nigeria-2026-guide/)
- [Wakanow alternatives (Liners)](https://liners.com/wakanow/alternatives)
- [Wakanow vs Travelstart review](https://www.zeegoes.com/wakanow-vs-travelstart-detailed-review/)
- [Travelstart affiliate program](https://www.travelstart.com.ng/lp/become-an-affiliate)
- [NCAA data: ~60% of domestic flights delayed, August 2026](https://www.thetraveler.org/nearly-60-of-nigerias-domestic-flights-delayed-in-august-ncaa-data-shows-2/)
- [NCAA data: Air Peace, United Nigeria top delays](https://www.thetraveler.org/air-peace-united-nigeria-top-august-flight-delays-ncaa-data-shows/)
- [Air Peace on Hitit Crane PSS](https://hitit.com/news-updates/nigerias-largest-private-airline-empowered-its-technology-hitit)
- [NCAA restricts services to Air Peace, Ibom Air, others (May 2026)](https://saharareporters.com/2026/05/24/nigerias-aviation-regulator-blacklists-air-peace-ibom-air-nine-others-over-debts-orders)
- [Best flight data APIs 2026 (Geekflare)](https://geekflare.com/guides/flight-data-api/)
- [AeroDataBox](https://aerodatabox.com/flight-api-2024)
- [Cirium FlightStats APIs](https://developer.cirium.com/apis/flightstats-apis/overview)
