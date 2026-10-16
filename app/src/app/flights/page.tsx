import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/v2/PageHero";
import { SiteFooter } from "@/components/v2/SiteFooter";
import { findAirport } from "@/lib/data/airports";
import { ROUTES } from "@/lib/data/routes";

export const metadata: Metadata = {
  title: "Popular domestic flight routes in Nigeria | Skyfare",
  description: "Compare flights on Nigeria's busiest domestic routes, from Lagos to Abuja, Port Harcourt, Kano and more.",
  alternates: { canonical: "/flights" },
};

export default function RoutesIndexPage() {
  const origins = [...new Set(ROUTES.map((r) => r.origin))];
  return (
    <>
      <PageHero eyebrow="Routes" title="Popular domestic routes">
        Nigeria&apos;s busiest domestic routes. Pick one to see who flies it and how reliable they are.
      </PageHero>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        {origins.map((o) => (
          <section key={o} aria-labelledby={`from-${o}`}>
            <h2 id={`from-${o}`} className="text-lg font-semibold tracking-tight text-ink">
              From {findAirport(o)!.city}
            </h2>
            <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {ROUTES.filter((r) => r.origin === o).map((r) => (
                <li key={r.slug}>
                  <Link href={`/flights/${r.slug}`} className="v2-card block px-4 py-3.5 transition hover:border-primary">
                    <span className="block text-sm font-semibold text-ink">
                      {findAirport(r.origin)!.city} → {findAirport(r.destination)!.city}
                    </span>
                    <span className="text-xs font-medium tracking-wide text-ink-muted">
                      {r.origin} · {r.destination}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
