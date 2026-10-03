# V2 Layout Redesign

V2 lives at **`/v2`**. V1 stays at **`/`** unchanged, so the two can be compared side by side. Both call the same `/api/search`, so any difference you see comes from the UI, not the data. A floating "Compare with V1" pill on desktop (and a footer link on mobile) switches between them.

Screenshots of both versions are in `docs/screenshots/`.

## What changed vs V1

| Area | V1 | V2 |
|---|---|---|
| Landing | Small wordmark, title, inline form on white | Full-width black-to-navy hero, large silver "Skyfare" wordmark centred above the search bar, then value props and popular routes |
| Search bar | Native selects | One card: type-to-search airport fields (city, airport name, state or IATA code), swap button, dates, travellers/cabin popover, primary Search button. Stacks on mobile |
| Sorting | Dropdown: airline, price, departure | Skyscanner-style tabs: **Best / Cheapest / Fastest / Most reliable**, each previewing its top price. The dropdown adds departure time |
| Recommendation | None | **Skyfare Pick** card pinned on the Best tab, with a one-line reason |
| Reliability | None | 1–10 score per flight, with a colour band, a 10-step meter and a label (High/Good/Fair/Low) |
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

- **Reliability scores are placeholders** (`previewReliability`): stable per airline, with the time-of-day effect from the plan. They are labelled as a preview in the UI and need replacing with the 1.3 reliability engine.
- **Select is disabled** because no booking partner is connected yet.
- **Skyfare Pick logic (revised):** the Pick comes from the most reliable tier available. If any flight scores Good (6.5+), only Good flights are considered. Within that tier it's 40% price, 40% reliability, 20% journey time. Price and time are scored as a ratio to the best on the page, so a cheap outlier can't push every other flight to zero. Below 4.0 a flight is never picked. The Best tab uses the same ordering, so it always agrees with the Pick. Constants are in `src/lib/v2/scoring.ts`.
