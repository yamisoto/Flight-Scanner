import { isKnownAirport } from "@/lib/data/airports";
import type { CabinClass, FlightSearchRequest } from "@/types/flight";

/**
 * Search <-> URL query string, so a search can be shared (e.g. on WhatsApp)
 * and reopened. Short, readable keys:
 *   /v2?from=LOS&to=ABV&depart=2026-10-10&return=2026-10-14&adults=2&cabin=economy
 * Anything invalid in an incoming URL returns null and the page simply
 * shows the empty search form.
 */

const CABINS: CabinClass[] = ["economy", "premium_economy", "business", "first"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ADULTS = 9;

const isIsoDate = (s: string) => ISO_DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

export function searchToQuery(req: FlightSearchRequest): string {
  const p = new URLSearchParams({ from: req.origin, to: req.destination, depart: req.departureDate });
  if (req.tripType === "return" && req.returnDate) p.set("return", req.returnDate);
  if (req.passengers.adults !== 1) p.set("adults", String(req.passengers.adults));
  if (req.cabinClass !== "economy") p.set("cabin", req.cabinClass);
  return p.toString();
}

/** Parses a shared URL. `today` (YYYY-MM-DD) rejects past departure dates. */
export function queryToSearch(params: URLSearchParams, today: string): FlightSearchRequest | null {
  const origin = params.get("from")?.toUpperCase() ?? "";
  const destination = params.get("to")?.toUpperCase() ?? "";
  const departureDate = params.get("depart") ?? "";
  const returnDate = params.get("return") ?? undefined;
  const adults = Number(params.get("adults") ?? "1");
  const cabin = (params.get("cabin") ?? "economy") as CabinClass;

  if (!isKnownAirport(origin) || !isKnownAirport(destination) || origin === destination) return null;
  if (!isIsoDate(departureDate) || departureDate < today) return null;
  if (returnDate !== undefined && (!isIsoDate(returnDate) || returnDate < departureDate)) return null;
  if (!Number.isInteger(adults) || adults < 1 || adults > MAX_ADULTS) return null;
  if (!CABINS.includes(cabin)) return null;

  return {
    origin,
    destination,
    departureDate,
    returnDate,
    tripType: returnDate ? "return" : "one_way",
    passengers: { adults, children: 0, infants: 0 },
    cabinClass: cabin,
  };
}
