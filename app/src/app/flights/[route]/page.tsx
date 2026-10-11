import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/v2/PageHero";
import { RouteSearchButton } from "@/components/v2/RouteSearchButton";
import { SiteFooter } from "@/components/v2/SiteFooter";
import { findAirport } from "@/lib/data/airports";
import { findRoute, findRouteBySlug, ROUTES, routesFrom } from "@/lib/data/routes";
import { getRouteSummary } from "@/lib/flights/routeStats";
import { ncaaBaselineReliability } from "@/lib/reliability/score";

// One page per curated route, built at deploy time and refreshed daily as
// new schedule data is collected. Unknown slugs 404.
export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return ROUTES.map((r) => ({ route: r.slug }));
}

type Props = { params: Promise<{ route: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = findRouteBySlug((await params).route);
  if (!route) return {};
  const from = findAirport(route.origin)!.city;
  const to = findAirport(route.destination)!.city;
  return {
    title: `${from} to ${to} flights (${route.origin}–${route.destination}) | Skyfare`,
    description: `Compare every airline flying ${from} to ${to} on price, journey time and on-time reliability. See who flies the route and how often they run late.`,
    alternates: { canonical: `/flights/${route.slug}` },
  };
}

const TONE = { High: "text-good", Good: "text-primary", Fair: "text-warn", Low: "text-bad" } as const;

export default async function RoutePage({ params }: Props) {
  const route = findRouteBySlug((await params).route);
  if (!route) notFound();
  const origin = findAirport(route.origin)!;
  const destination = findAirport(route.destination)!;
  const summary = await getRouteSummary(route.origin, route.destination);
  const reverse = findRoute(route.destination, route.origin);
  const others = routesFrom(route.origin).filter((r) => r.destination !== route.destination);

  return (
    <>
      <PageHero eyebrow={`${route.origin} → ${route.destination}`} title={`Flights from ${origin.city} to ${destination.city}`}>
        Compare every airline on the route by price, journey time and how often it actually leaves on time.
        <div className="mt-6">
          <RouteSearchButton origin={route.origin} destination={route.destination} label={`Search ${origin.city} to ${destination.city}`} />
        </div>
      </PageHero>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        <section aria-labelledby="who-flies" className="space-y-3">
          <h2 id="who-flies" className="text-xl font-semibold tracking-tight text-ink">
            Who flies {origin.city} to {destination.city}
          </h2>
          {summary ? (
            <>
              <p className="text-[15px] text-ink">
                About <strong>{summary.flightsPerDay} flights a day</strong> across {summary.airlines.length} airline
                {summary.airlines.length === 1 ? "" : "s"}, based on scheduled departures over the last {summary.daysObserved} day
                {summary.daysObserved === 1 ? "" : "s"}. Reliability is each airline&apos;s score for a midday departure;{" "}
                <Link href="/how-we-score" className="text-primary hover:underline">
                  how we score
                </Link>
                .
              </p>
              <div className="v2-card overflow-x-auto">
                <table className="v2-num w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                      <th scope="col" className="px-4 py-3 font-medium">Airline</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Flights a day</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">First – last</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Reliability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {summary.airlines.map((a) => {
                      const r = ncaaBaselineReliability(a.airlineCode, 12);
                      return (
                        <tr key={a.airlineCode}>
                          <th scope="row" className="px-4 py-2.5 text-left font-medium">
                            {a.airlineName}
                          </th>
                          <td className="px-4 py-2.5 text-right">{a.flightsPerDay}</td>
                          <td className="px-4 py-2.5 text-right">
                            {a.firstDeparture} – {a.lastDeparture}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {r ? (
                              <span className={`font-semibold ${TONE[r.label]}`}>
                                {r.score.toFixed(1)} <span className="font-normal text-ink-muted">{r.label}</span>
                              </span>
                            ) : (
                              <span className="text-ink-muted">No data yet</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-ink-muted">Times are scheduled departures, Lagos time. Schedules change; check your exact date in search.</p>
            </>
          ) : (
            <p className="text-[15px] text-ink">
              We&apos;re still collecting the schedule for this route. Search a date to see every airline&apos;s flights, prices and reliability
              scores.
            </p>
          )}
        </section>

        <section aria-labelledby="airports" className="space-y-3">
          <h2 id="airports" className="text-xl font-semibold tracking-tight text-ink">
            Airports
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "From", airport: origin },
              { label: "To", airport: destination },
            ].map(({ label, airport }) => (
              <div key={label} className="v2-card p-4">
                <dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
                <dd className="mt-1">
                  <p className="font-semibold text-ink">
                    {airport.city} ({airport.iata})
                  </p>
                  <p className="text-sm text-ink-muted">
                    {airport.name}, {airport.state}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="more-routes" className="space-y-3">
          <h2 id="more-routes" className="text-xl font-semibold tracking-tight text-ink">
            More routes
          </h2>
          <ul className="flex flex-wrap gap-2">
            {[...(reverse ? [reverse] : []), ...others].map((r) => (
              <li key={r.slug}>
                <Link href={`/flights/${r.slug}`} className="v2-card inline-block px-3.5 py-2 text-sm font-medium text-ink transition hover:border-primary">
                  {findAirport(r.origin)!.city} → {findAirport(r.destination)!.city}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/flights" className="inline-block px-3.5 py-2 text-sm font-medium text-primary hover:underline">
                All routes
              </Link>
            </li>
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
