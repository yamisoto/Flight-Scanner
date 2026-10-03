/**
 * Airline-level domestic operations data published by the Nigerian Civil
 * Aviation Authority (NCAA). This is the reliability baseline until a
 * route-level on-time source is found (AeroDataBox has schedules only for
 * Nigerian domestic flights; see docs/DATA_SOURCES.md).
 *
 * Provenance: the NCAA's own site was not reachable from the build
 * environment, so these figures were taken from press reports of the NCAA's
 * August 2026 release (published 14-16 Sep 2026), cross-checked across
 * outlets. Totals reconcile: the 12 airlines below account for 7,501 of the
 * 7,961 flights and 4,691 of the 4,765 delays; the rest belong to small
 * operators not named in the reports. Verify against the NCAA document
 * before launch. A "delay" is the NCAA's definition (departure more than
 * 15 minutes after schedule).
 *
 * To add a month: append rows with the new `month`. Scores use the most
 * recent month available per airline (see score.ts).
 */

export interface NcaaAirlineMonth {
  month: string; // YYYY-MM
  airlineIata: string;
  airlineName: string;
  flightsOperated: number;
  flightsDelayed: number;
  /** null where the reports didn't give a figure. */
  flightsCancelled: number | null;
}

export const NCAA_SOURCES = [
  "https://businessday.ng/aviation/article/60-of-domestic-flights-delayed-in-august-as-ncaa-tracks-operational-disruption/",
  "https://leadership.ng/domestic-airlines-delay-60-of-august-flights-ncaa/",
  "https://allafrica.com/stories/202609150026.html",
  "https://atqnews.com/africa-air-peace-records-highest-number-of-delayed-flights-in-nigerias-aviation-sector-with-1330-7-cancellations-from-1864-flights-in-august-ncaa-data/",
  "https://economypost.ng/business/aviation/ncaa-air-peace-united-nigeria-lead-august-flight-delays/2026/09/14/",
];

/** Industry totals for the month, used where an airline's cancellation count is missing. */
export const NCAA_INDUSTRY_TOTALS: Record<string, { flightsOperated: number; flightsDelayed: number; flightsCancelled: number }> = {
  "2026-08": { flightsOperated: 7961, flightsDelayed: 4765, flightsCancelled: 36 },
};

export const NCAA_AIRLINE_MONTHS: NcaaAirlineMonth[] = [
  { month: "2026-08", airlineIata: "P4", airlineName: "Air Peace", flightsOperated: 1864, flightsDelayed: 1330, flightsCancelled: 7 },
  { month: "2026-08", airlineIata: "UN", airlineName: "United Nigeria Airlines", flightsOperated: 1231, flightsDelayed: 943, flightsCancelled: 8 },
  { month: "2026-08", airlineIata: "EE", airlineName: "Enugu Air", flightsOperated: 878, flightsDelayed: 582, flightsCancelled: 4 },
  { month: "2026-08", airlineIata: "VK", airlineName: "ValueJet", flightsOperated: 767, flightsDelayed: 435, flightsCancelled: 3 },
  { month: "2026-08", airlineIata: "QI", airlineName: "Ibom Air", flightsOperated: 560, flightsDelayed: 254, flightsCancelled: 3 },
  { month: "2026-08", airlineIata: "R4", airlineName: "Rano Air", flightsOperated: 503, flightsDelayed: 216, flightsCancelled: 3 },
  { month: "2026-08", airlineIata: "N2", airlineName: "Aero Contractors", flightsOperated: 469, flightsDelayed: 246, flightsCancelled: 0 },
  { month: "2026-08", airlineIata: "VM", airlineName: "Max Air", flightsOperated: 336, flightsDelayed: 204, flightsCancelled: 3 },
  { month: "2026-08", airlineIata: "W3", airlineName: "Arik Air", flightsOperated: 301, flightsDelayed: 188, flightsCancelled: 1 },
  { month: "2026-08", airlineIata: "OF", airlineName: "Overland Airways", flightsOperated: 239, flightsDelayed: 139, flightsCancelled: null },
  { month: "2026-08", airlineIata: "Q9", airlineName: "Green Africa Airways", flightsOperated: 226, flightsDelayed: 114, flightsCancelled: 3 },
  { month: "2026-08", airlineIata: "4U", airlineName: "XEJet", flightsOperated: 127, flightsDelayed: 40, flightsCancelled: null },
];
