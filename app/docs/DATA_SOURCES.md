# Flight Data Sources and API Selection

Last reviewed: 3 October 2026. This doc covers where Skyfare gets schedules, prices and on-time data, why scraping airline websites was ruled out, and the current plan. It supersedes the provider notes in earlier docs.

## The problem in two parts

"Show every flight on a route" needs two different things:

1. **Schedule completeness:** every flight that actually operates that day (airline, flight number, times). Also the raw material for reliability scores.
2. **Price completeness:** a live, bookable price for each of those flights.

No single source gives both for Nigerian domestic carriers, so Skyfare layers them. Flights we can't price are still shown, marked "Check price on airline site", with a coverage line ("9 of 12 flights priced").

## Decision: no scraping of airline or OTA websites

Scraping each airline's booking site per search was considered and **rejected as a data source**.

| Reason | Detail |
|---|---|
| Legal | Airline terms of use generally prohibit automated extraction. The EU's top court ruled in *Ryanair v PR Aviation* (CJEU, C-30/14, 2015) that a website can ban scraping through its terms even when the data itself has no database or copyright protection. Nigerian law has no clear safe harbour either. |
| Technical | Nigerian carriers' booking engines (Air Peace runs Hitit Crane; others use Crane or Videcom) use sessions and bot protection. Scraping 6 to 10 airlines live on every user search means slow results, blocked IP addresses and breakage whenever a site changes. |
| Commercial | These airlines are the future partners for direct connections and commission. Being caught scraping them damages that relationship before it starts. |

**Allowed exception:** a small internal spot-check (a handful of prices a day, compared against partner data for quality assurance), only after reading each airline's terms. Never per user search and never as a source of displayed prices.

## Options reviewed

| Source | Type | What it gives | Coverage of Nigerian domestic carriers | Cost / access | Verdict |
|---|---|---|---|---|---|
| **AeroDataBox** | Flight data API | Airport departure and arrival boards (FIDS), live and historical flight status, delays, cancellations | Airport-based, so it covers every carrier at LOS, ABV etc. Coverage per airport to be confirmed with their coverage checker | Direct from $19/month; also via API.Market and RapidAPI | **Use now** for schedules and reliability history. No partnership needed. |
| **Tiqwa** | Nigerian flight booking API | Search, pricing and booking; built on Amadeus Enterprise plus a global consolidator, with African local airlines | Claims African local airline content; exact carrier list to confirm | Sandbox available; commercial terms on application | **First price source to try** |
| **Wakanow API** | OTA partner API | Search, pricing and booking | Strong: partner API includes Air Peace, Azman, Aero Contractors, United Nigeria, Dana and Arik (used by Alternative Airlines) | B2B agreement | **Strong backup.** It is a direct competitor, so weigh dependency risk |
| **Travelstart affiliate** | Affiliate program (Impact) | Embeddable search, XML feeds, deep links | Good for major carriers | Free to join; 2% of base fare on domestic | **Easiest to start**; less control over data |
| **Direct airline connections** | NDC / PSS APIs (e.g. Hitit Crane for Air Peace) | Best prices, richest fare data | One carrier each | Separate commercial agreement per airline; several carriers have no public API | **Later**, for the top 3 or 4 carriers once there is traffic to show them |
| Cirium / OAG | Enterprise flight data | Schedules and on-time performance | Global | Enterprise pricing | Revisit at Africa expansion |
| NCAA monthly reports | Regulator data | Airline-level delay and cancellation rates | All domestic carriers | Free, public | **Use** as the airline-level baseline for reliability until our own history builds up |
| ~~Amadeus Self-Service~~ | Flight API | Was the default for startups | Weak for Nigerian domestic | **Shut down on 17 July 2026**; new keys stopped in spring 2026. Enterprise APIs only | Ruled out |
| Duffel | Self-serve flight API | Search and booking | No confirmed Nigerian domestic coverage | Self-serve | Not suitable for Phase 1 |
| Travelpayouts (Aviasales) | Affiliate search API | Flight search for affiliates | Unconfirmed for Nigerian domestic | Affiliate network | Not suitable for Phase 1 |

## Is an API per airline the best route?

Not as a starting point. That means around 10 separate contracts, and several Nigerian carriers don't offer a public API. The faster path is one flight-data API for schedules and status plus one aggregator for prices, then direct deals with the biggest carriers once Skyfare has traffic.

## Recommended plan (awaiting owner confirmation)

| Layer | Source | Phase 1 status |
|---|---|---|
| Schedules (every operating flight) | AeroDataBox airport departure boards for all Nigerian airports | Next to build once confirmed. **Needs an API key.** |
| Reliability history | AeroDataBox daily flight status, stored in our database; NCAA monthly reports as the airline baseline | Next to build. Start immediately: real scores need 60 days of history |
| Prices (primary) | Tiqwa | Apply for sandbox access |
| Prices (backup) | Wakanow API or Travelstart affiliate | Outreach in parallel |
| Prices (later) | Direct connections with the top 3 or 4 carriers | After launch |
| Fallback | Deep link to the airline's own site | Built into the results UI design |

Each source plugs in as a `FlightProvider` adapter (see `FLIGHT_PROVIDER_INTERFACE.md`); the search engine and UI don't change.

## Actions needed from the owner

1. Confirm the recommended plan above.
2. Create an AeroDataBox account, choose a plan and add the API key as an environment variable on Vercel and in the development environment. Check Lagos and Abuja on their data-coverage page.
3. Apply for Tiqwa sandbox access.
4. Continue Wakanow and Travelstart outreach as backups.

Note: AeroDataBox's documentation site is blocked from the environment used to build this, so the adapter will be checked against live responses once the key is available, not built against assumed response shapes.

## Regulatory note

The NCAA restricted services to several carriers in May 2026 (including Air Peace, Ibom Air and ValueJet) over unpaid debts. Flight-status data will show suspended operations; the results page should also show a route-level notice when this happens.

## Sources

- [AeroDataBox pricing](https://aerodatabox.com/pricing) and [API overview](https://aerodatabox.com/api)
- [Amadeus self-service shutdown (PhocusWire)](https://www.phocuswire.com/amadeus-shut-down-self-service-apis-portal-developers) and [migration guide](https://ignav.com/docs/amadeus-self-service-shutdown)
- [Tiqwa developer API](https://www.tiqwa.com/developers)
- [Alternative Airlines partners with Wakanow](https://www.alternativeairlines.com/media-centre/alternative-airlines-partners-with-wakanow)
- [Wakanow Lufthansa NDC integration (TechCabal)](https://techcabal.com/2026/09/04/wakanow-becomes-africas-first-travel-company-to-offer-lufthansa-group-ndc-content-through-a-direct-api-integration/)
- [Travelstart affiliate program](https://www.travelstart.com.ng/lp/become-an-affiliate)
- [Ryanair v PR Aviation (Pinsent Masons)](https://www.pinsentmasons.com/out-law/news/website-operators-can-prohibit-screen-scraping-of-unprotected-data-via-terms-and-conditions-says-eu-court-in-ryanair-case)
- [Air Peace on Hitit Crane PSS](https://hitit.com/news-updates/nigerias-largest-private-airline-empowered-its-technology-hitit)
- [Travelpayouts flight search API](https://support.travelpayouts.com/hc/en-us/articles/30565016140434-Aviasales-Flights-Search-API-real-time-and-multi-city-search)
- [NCAA restricts services to carriers (Sahara Reporters, May 2026)](https://saharareporters.com/2026/05/24/nigerias-aviation-regulator-blacklists-air-peace-ibom-air-nine-others-over-debts-orders)
- [NCAA delay data, August 2026 (The Traveler)](https://www.thetraveler.org/nearly-60-of-nigerias-domestic-flights-delayed-in-august-ncaa-data-shows-2/)
