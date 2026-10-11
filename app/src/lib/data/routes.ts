import { findAirport } from "@/lib/data/airports";

/**
 * Routes that get their own landing page (/flights/lagos-to-abuja).
 * Curated rather than every airport pair: these are the busiest domestic
 * routes (Lagos and Abuja departures seen in AeroDataBox schedules, 3 Oct
 * 2026), both directions. Thin pages for routes nobody flies would hurt
 * search ranking, so add a route only when it has regular scheduled flights.
 */
const PAIRS: [string, string][] = [
  ["LOS", "ABV"],
  ["LOS", "PHC"],
  ["LOS", "KAN"],
  ["LOS", "ENU"],
  ["LOS", "QUO"],
  ["LOS", "BNI"],
  ["LOS", "QOW"],
  ["LOS", "ABB"],
  ["ABV", "PHC"],
  ["ABV", "KAN"],
];

export interface RouteInfo {
  origin: string;
  destination: string;
  slug: string;
}

const citySlug = (iata: string) =>
  findAirport(iata)!
    .city.toLowerCase()
    .replace(/[^a-z]+/g, "-")
    .replace(/^-|-$/g, "");

export const routeSlug = (origin: string, destination: string) => `${citySlug(origin)}-to-${citySlug(destination)}`;

export const ROUTES: RouteInfo[] = PAIRS.flatMap(([a, b]) => [
  { origin: a, destination: b, slug: routeSlug(a, b) },
  { origin: b, destination: a, slug: routeSlug(b, a) },
]);

export const findRouteBySlug = (slug: string) => ROUTES.find((r) => r.slug === slug);

export const findRoute = (origin: string, destination: string) =>
  ROUTES.find((r) => r.origin === origin && r.destination === destination);

/** Other route pages from the same origin, for internal links. */
export const routesFrom = (origin: string) => ROUTES.filter((r) => r.origin === origin);
