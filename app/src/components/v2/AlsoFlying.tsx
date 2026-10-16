"use client";

import { useId, useState } from "react";
import { ReliabilityBadge, ReliabilityExplainer } from "@/components/v2/ReliabilityBadge";
import { AirlineMark } from "@/components/v2/ResultCard";
import { findAirlineByIata } from "@/lib/data/airlines";
import { ncaaBaselineReliability } from "@/lib/reliability/score";
import { formatTime } from "@/lib/v2/format";
import type { ScheduleCoverage, ScheduledFlight } from "@/types/flight";

/** "8 flights operate this route that day: 6 priced here, 2 to check on the airline's site." */
export function CoverageLine({ coverage }: { coverage: ScheduleCoverage | null }) {
  if (!coverage || coverage.totalFlights === 0) return null;
  const { totalFlights, pricedFlights, unpriced } = coverage;
  const s = (n: number) => (n === 1 ? "" : "s");
  return (
    <p className="text-sm text-ink-muted">
      <span className="font-medium text-ink">
        {totalFlights} flight{s(totalFlights)} operate{totalFlights === 1 ? "s" : ""} this route that day
      </span>
      {unpriced.length === 0 ? ", all priced here." : `: ${pricedFlights} priced here, ${unpriced.length} to check with the airline.`}
    </p>
  );
}

/** Flights known to operate (from the schedule) that no price provider returned. */
export function AlsoFlying({ coverage }: { coverage: ScheduleCoverage | null }) {
  if (!coverage || coverage.unpriced.length === 0) return null;
  return (
    <section aria-labelledby="also-flying" className="space-y-3 pt-4">
      <div>
        <h3 id="also-flying" className="text-base font-semibold text-ink">
          Also flying this route
        </h3>
        <p className="text-sm text-ink-muted">We know these flights operate but don&apos;t have a price for them yet.</p>
      </div>
      {coverage.unpriced.map((f) => (
        <UnpricedRow key={f.flightNumber} flight={f} />
      ))}
    </section>
  );
}

function UnpricedRow({ flight }: { flight: ScheduledFlight }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const whyId = useId();
  const reliability = ncaaBaselineReliability(flight.airlineCode, new Date(flight.departureAt).getUTCHours());
  const website = findAirlineByIata(flight.airlineCode)?.website;

  return (
    <article className="v2-card space-y-3 p-4 sm:px-5" aria-label={`${flight.airlineName} ${flight.flightNumber}, no price yet`}>
      <div className="flex flex-wrap items-center gap-3">
        <AirlineMark code={flight.airlineCode} name={flight.airlineName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{flight.airlineName}</p>
          <p className="text-xs text-ink-muted">
            <span className="v2-num font-medium text-ink">{formatTime(flight.departureAt)}</span> · {flight.flightNumber} · {flight.origin} → {flight.destination}
          </p>
        </div>
        {reliability ? (
          <ReliabilityBadge reliability={reliability} compact panelId={whyId} expanded={whyOpen} onToggle={() => setWhyOpen((v) => !v)} />
        ) : (
          <span className="text-xs text-ink-muted">No on-time data yet</span>
        )}
        <div className="w-full sm:w-auto">
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary sm:w-auto"
            >
              Check price on airline site
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className="text-sm text-ink-muted">Price not available yet</span>
          )}
        </div>
      </div>
      {whyOpen && reliability && <ReliabilityExplainer id={whyId} reliability={reliability} />}
    </article>
  );
}
