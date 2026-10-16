# V2 Layout Redesign

**V2 is the home page (`/`) since 3 Oct 2026.** V1 has been removed; `/v2` redirects to `/` with its query string, so earlier shared links still work. The table below is kept as the record of what changed.

Screenshots of both versions (taken while they ran side by side) are in `docs/screenshots/`.

## What changed vs V1

| Area | V1 | V2 |
|---|---|---|
| Landing | Small wordmark, title, inline form on white | Full-width black-to-navy hero, large silver "Skyfare" wordmark centred above the search bar, then value props and popular routes |
| Search bar | Native selects | One card: type-to-search airport fields (city, airport name, state or IATA code), swap button, dates, travellers/cabin popover, primary Search button. Stacks on mobile |
| Sorting | Dropdown: airline, price, departure | Skyscanner-style tabs: **Best / Cheapest / Fastest / Most reliable**, each previewing its top price. The dropdown adds departure time |
| Recommendation | None | **Skyfare Pick** card pinned on the Best tab, with a one-line reason |
| Reliability | None | 1–10 score per flight, with a colour band, a 10-step meter and a label (High/Good/Fair/Low). Tap the score to see why: the plain-English reason, the data source and the confidence level |
| Every flight | Priced flights only | A coverage line ("8 flights operate this route that day: 6 priced here, 2 to check with the airline") and an **Also flying this route** list for scheduled flights with no price, each with a "Check price on airline site" link where the airline's site is confirmed |
| Nearby dates | None | ±3-day price strip above the results: cheapest fare per day, lowest day highlighted, tap a day to search it (return trips keep the same trip length) |
| Sharing | None | Every search is in the URL (`/?from=LOS&to=ABV&depart=2026-10-10`), so links open straight into results. **Share** uses the phone share sheet (WhatsApp etc.) or copies the link on desktop |
| Filters | Collapsible panel, Apply button | Live filters: sticky sidebar on desktop, bottom sheet on mobile. Adds min reliability, departure-time tiles, a max-price slider and airline "from" prices |
| Loading | Full-screen wordmark takeover | Skeleton cards in place, so the layout doesn't jump |
| Theme | Toggle top-left | Toggle in header, no hydration flash or mismatch |

## Inspiration mapping

- **Skyscanner:** sort tabs with price previews, the left filter rail, the airline "from" prices.
- **Google Flights:** a single blended "Best" ranking with a featured top result, and a calm card list.
- **Flighty:** the reliability score as a compact meter with a plain-English reason (shown on hover).

## Design tokens

Scoped under `.v2` in `src/app/globals.css`: blue primary (`#1747E0` light, `#4C7DFF` dark), a silver neutral scale, near-black ink and a near-black dark canvas. The hero is dark in both themes as the brand surface. Tailwind's `dark:` variant now follows the `.dark` class set by the toggle.

These tokens match brand direction **01 Instrument**. The final brand is undecided: `docs/BRAND.md` has all three directions with full website mockups. Switching to another direction means swapping these tokens, the fonts and the header logo.

## App-readiness (Phase 2)

Everything is a single-column card list below 1024px, interactions don't rely on hover, tap targets are at least 40px, and filters use a bottom sheet. Scoring lives in `src/lib/v2/scoring.ts` (pure functions, unit tested), so React Native can reuse it unchanged.

## Honest caveats

- **Reliability scores use the NCAA airline baseline** (`src/lib/reliability/`): each airline's published August 2026 delay and cancellation rates plus the time-of-day effect, labelled Low confidence. Airlines with no NCAA figures fall back to a labelled preview placeholder. Route-level history (sub-phase 1.3) replaces both.
- **Select is disabled** because no booking partner is connected yet.
- **Skyfare Pick logic (revised):** the Pick comes from the most reliable tier available. If any flight scores Good (6.5+), only Good flights are considered. Within that tier it's 40% price, 40% reliability, 20% journey time. Price and time are scored as a ratio to the best on the page, so a cheap outlier can't push every other flight to zero. Below 4.0 a flight is never picked. The Best tab uses the same ordering, so it always agrees with the Pick. Constants are in `src/lib/v2/scoring.ts`.
