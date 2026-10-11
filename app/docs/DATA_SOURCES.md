# Flight Data Sources and API Selection

Last reviewed: 11 October 2026 (live fares and on-time sources revisited; see "Live fares: revisited"). This doc covers where Skyfare gets schedules, prices and on-time data, why scraping airline websites was ruled out, and the current plan. It supersedes the provider notes in earlier docs.

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

## Live fares: revisited 11 October 2026

**What changed since 3 October:** Nigerian airlines are moving onto the global booking systems (GDSs). That opens a second route to live fares besides Nigerian OTAs.

### Which channel carries which airline

Confirmed from public announcements; blank means nothing found, not "not available".

| Airline | GDS | Wakanow | Notes |
|---|---|---|---|
| Air Peace | **Travelport+** (multi-year content deal, 27 Jan 2026) | Yes | Biggest carrier (1,864 flights in Aug 2026). Runs Hitit Crane; no public direct API or NDC found |
| United Nigeria | **Amadeus** (live), **Sabre** (agreement signed) | Yes | Second biggest |
| ValueJet | | **Exclusive distribution partner** | Uses Kiu as its reservation system |
| Ibom Air | Targeted a GDS launch for December 2025; **no go-live confirmed** | | |
| Arik Air | | Yes | |
| Aero Contractors | | Yes | |
| Enugu Air, Rano Air, XEJet, Green Africa, Overland, Max Air | | | Unknown. Ask every supplier about these by name |

### Channels, ranked for Skyfare

| # | Channel | Carriers (likely) | Access | Fit |
|---|---|---|---|---|
| 1 | **Wakanow B2B API** | Air Peace, United Nigeria, ValueJet (exclusive), Arik, Aero and others | Partner agreement; no public docs. Already supplies Alternative Airlines, so the API exists and is used by a third party | **Best domestic coverage today.** Wakanow is also a competitor, so expect tough terms and keep a second source |
| 2 | **Tiqwa** (Nigerian flight API on Amadeus Enterprise plus a consolidator) | Amadeus content should include United Nigeria; ask whether Air Peace (Travelport) and the non-GDS carriers are covered | Sandbox on application. Its site was unreachable from our build environment on 11 Oct, so nothing new verified | **Second source.** The carrier list decides it |
| 3 | **Consolidators** (Mystifly, similar) | Mix GDS and low-cost carrier content; Nigerian coverage unconfirmed | Onboarding first; docs and prices shared only after | Backup if 1 and 2 stall |
| 4 | **Travelport directly** | Air Peace now; others as they join | Must become a Travelport customer; JSON APIs in an early-adopter programme; GDS access typically takes 6–14 months | Later, once there's volume |
| 5 | **Travelstart affiliate** | Major carriers | Affiliate deep links; API access negotiated case by case | **Revenue now** for the Select button, but no price feed to compare with |
| 6 | Direct airline deals | One carrier each (Air Peace on Hitit Crane, ValueJet on Kiu) | Per-airline commercial deals; no public NDC found for any Nigerian carrier | After launch, for the top 3 |
| — | Duffel, Kiwi.com Tequila, Travelpayouts | No evidence of Nigerian domestic content. Tequila has been B2B-only since May 2024 | | Not suitable |
| — | Amadeus self-service | Shut down 17 July 2026 | | Ruled out |

### Questions to ask every supplier

1. Which of these 12 airlines can we search and price: Air Peace, United Nigeria, Enugu Air, ValueJet, Ibom Air, Rano Air, Aero Contractors, Max Air, Arik Air, Overland, Green Africa, XEJet?
2. Search limits and look-to-book ratio. Skyfare's ±3-day price strip makes up to 7 searches per user search, and route pages would want cached prices.
3. May we cache prices, and for how long? May we show cached "from" prices on route pages?
4. Booking flow: deep link to your site, white-label checkout, or book through the API? Who handles payment and ticketing?
5. Commercial model: commission per booking, per-search fees, minimums, exclusivity.
6. Sandbox: test data for Nigerian domestic routes, and time to production.

### On-time data (for route-level reliability)

AeroDataBox has no actual departure times for Nigerian domestic flights (see below). Two sources track aircraft by radio (ADS-B) rather than relying on airlines to publish status, so they may have real take-off times:

| Source | Entry price | What to check |
|---|---|---|
| **Flightradar24 API**, Explorer tier | About $9/month (credit-based; check the current price) | Its flight summary endpoint returns an actual take-off time. Test one day of Lagos departures |
| FlightAware AeroAPI, Personal tier | No minimum, $5 of free queries a month; **no historical data** on this tier | Would need live daily polling; coverage in Nigeria unconfirmed |

Recommendation: try Flightradar24 Explorer for one month and compare a day of Lagos departures against AeroDataBox's schedule.

## Is an API per airline the best route?

Not as a starting point. That means around 10 separate contracts, and several Nigerian carriers don't offer a public API. The faster path is one flight-data API for schedules and status plus one aggregator for prices, then direct deals with the biggest carriers once Skyfare has traffic.

## Recommended plan (awaiting owner confirmation)

| Layer | Source | Phase 1 status |
|---|---|---|
| Schedules (every operating flight) | AeroDataBox airport departure boards | **Adapter built** against live responses (3 Oct 2026). Free plan covers the Lagos and Abuja hubs daily |
| Reliability history | NCAA monthly reports as the airline baseline. **Not AeroDataBox** (see findings below) | On-time source for route-level history still to find |
| Prices (primary) | Wakanow B2B API (widest domestic coverage) | Outreach; revised 11 Oct 2026 |
| Prices (second source) | Tiqwa, then consolidators; Travelport directly later | Sandbox application; ask the supplier questions above |
| Revenue meanwhile | Travelstart affiliate deep links | Join the programme |
| Prices (later) | Direct connections with the top 3 or 4 carriers | After launch |
| Fallback | Deep link to the airline's own site | Built into the results UI design |

Each source plugs in as a `FlightProvider` adapter (see `FLIGHT_PROVIDER_INTERFACE.md`); the search engine and UI don't change.

## Actions needed from the owner

1. Confirm the recommended plan above.
2. ~~Create an AeroDataBox account and add the API key.~~ Done 3 Oct 2026 (free plan, key in Vercel as `AERODATABOX_API_KEY`).
3. Contact Wakanow partnerships about B2B API access (primary price source), using the supplier questions above.
4. Apply for Tiqwa sandbox access and ask for its carrier list (second source).
5. Join the Travelstart affiliate programme for deep links in the meantime.
6. Optional: a one-month Flightradar24 API Explorer subscription to test on-time data.

## AeroDataBox: what the live data showed (3 Oct 2026)

Two test calls on the free plan (RapidAPI): Lagos departures for 06:00–18:00 on 2 Oct, and a live window on 3 Oct. Responses are saved in `tests/fixtures/aerodatabox/`.

| Finding | Detail | What it means |
|---|---|---|
| Schedules: good | 58 domestic departures from Lagos in 12 hours, across 12 destinations and 9 airline codes | Usable for "every flight on this route" |
| On-time data: none | Every domestic flight had status "Unknown", data quality "Basic", and no revised or runway time, including flights that had already left. Only a few international flights showed any status | **AeroDataBox can't power route-level reliability for Nigeria.** Reliability stays on the NCAA airline baseline |
| Airline names: unreliable | VK came back as "Anisec", UN as "Business Aviation Asia", R4 as "Real Tonga", and W1 and N2 had no airline code | The adapter takes the airline code from the flight number and uses our own airline names |
| Unknown codes | W1 (7 Lagos departures, e.g. W1 3558 to Port Harcourt) and EW (2 Lagos–Abuja flights, named "Eurowings") don't match any airline in our table | Identify these carriers before showing them by name |
| Quota | Free plan: 400 API units a month; one departures call (up to 12 hours) costs 2 units | Daily collection of Lagos and Abuja (4 calls a day) uses about 240 units a month. All 23 airports would need a paid plan |

Next step for reliability: test a source built on aircraft tracking (ADS-B), such as FlightAware AeroAPI or the Flightradar24 API, which may record actual take-off times even where airlines don't publish status. Check one day of Lagos departures before committing to either.

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
- [Travelport and Air Peace content agreement (BusinessDay)](https://businessday.ng/aviation/article/air-peace-inks-global-distribution-deal-with-travelport/) and [Travelport press release](https://www.travelport.com/press-releases/air-peace-multi-year-agreement)
- [United Nigeria live on Amadeus](https://flyunitednigeria.com/united-nigeria-airlines-now-live-on-amadeus-gds-opening-global-flight-booking-access/), [United Nigeria and Amadeus (CAPA)](https://centreforaviation.com/news/united-nigeria-joins-amadeus-gds-1363255), [United Nigeria Sabre deal (AllAfrica)](https://allafrica.com/stories/202506170405.html)
- [Ibom Air targets December 2025 GDS launch (Nigerian Flight Deck)](https://nigerianflightdeck.com/ibom-air-targets-december-2025-gds-launch-courts-agents/)
- [ValueJet selects Kiu (Kiu)](https://www.kiusys.com/en/blog/valuejet-the-new-nigerian-airline-joins-kiu-community)
- [Travelport JSON API programme details](https://support.travelport.com/webhelp/JSONAPIs/Payv11/Content/GeneralProject/ProgramDetails.htm)
- [Tequila B2B-only since May 2024 (Vervotech)](https://www.vervotech.com/hub/integrations/tequila-api/)
- [FlightAware AeroAPI pricing](https://www.flightaware.com/commercial/aeroapi/) and [Flightradar24 API: getting started](https://www.flightradar24.com/blog/b2b/how-to-get-started-with-the-flightradar24-api/), [flight summary endpoint](https://www.flightradar24.com/blog/b2b/flight-summary-flightradar24-api/)
