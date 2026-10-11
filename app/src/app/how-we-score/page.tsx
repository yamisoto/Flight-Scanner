import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/v2/PageHero";
import { SiteFooter } from "@/components/v2/SiteFooter";
import { NCAA_AIRLINE_MONTHS, NCAA_INDUSTRY_TOTALS, NCAA_SOURCES } from "@/lib/reliability/ncaaData";
import { BASELINE_WEIGHTS, CANCELLATION_RATE_FLOOR, latestNcaaMonth, ncaaBaselineReliability, timeOfDayFactor } from "@/lib/reliability/score";
import { BEST_WEIGHTS, PICK_MIN_RELIABILITY, PICK_PREFERRED_RELIABILITY } from "@/lib/v2/scoring";

export const metadata: Metadata = {
  title: "How we score reliability | Skyfare",
  description:
    "How Skyfare's 1–10 reliability score works: the data behind it, the formula, how confident we are, and how the Skyfare Pick is chosen.",
  alternates: { canonical: "/how-we-score" },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;
const pctOfWeight = (w: number) => `${Math.round(w * 100)}%`;

// Worked example: the busiest airline, on a 07:00 departure.
const EXAMPLE_HOUR = 7;
// The airline table shows each airline's score for a midday departure.
const TABLE_HOUR = 12;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export default function HowWeScorePage() {
  const airlines = [...new Set(NCAA_AIRLINE_MONTHS.map((r) => r.airlineIata))]
    .map((code) => {
      const row = latestNcaaMonth(code)!;
      const industry = NCAA_INDUSTRY_TOTALS[row.month];
      return {
        row,
        delayRate: row.flightsDelayed / row.flightsOperated,
        cancelRate: row.flightsCancelled === null ? null : row.flightsCancelled / row.flightsOperated,
        industryCancelRate: industry ? industry.flightsCancelled / industry.flightsOperated : null,
        score: ncaaBaselineReliability(code, TABLE_HOUR)!,
      };
    })
    .sort((a, b) => b.score.score - a.score.score || a.row.airlineName.localeCompare(b.row.airlineName));

  const busiest = [...airlines].sort((a, b) => b.row.flightsOperated - a.row.flightsOperated)[0];
  const ex = {
    name: busiest.row.airlineName,
    month: monthName(busiest.row.month),
    delayRate: busiest.delayRate,
    cancelRate: busiest.cancelRate ?? busiest.industryCancelRate ?? 0,
    cancelFromIndustry: busiest.cancelRate === null,
    score: ncaaBaselineReliability(busiest.row.airlineIata, EXAMPLE_HOUR)!.score,
  };
  const D = 1 - ex.delayRate;
  const A = Math.min(1, Math.max(0, 1 - ex.cancelRate / CANCELLATION_RATE_FLOOR));
  const T = timeOfDayFactor(EXAMPLE_HOUR);
  const raw = BASELINE_WEIGHTS.delay * D + BASELINE_WEIGHTS.cancellation * A + BASELINE_WEIGHTS.timeOfDay * T;
  const dataMonth = monthName(busiest.row.month);

  return (
    <>
      <PageHero eyebrow="Methodology" title="How we score reliability">
        Every flight on Skyfare gets a score from 1 to 10 for how likely it is to leave on time. Here&apos;s exactly how it&apos;s worked out,
        what it&apos;s based on, and where it falls short today.
      </PageHero>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        <Section id="short" title="The short version">
          <p>
            The score mostly reflects how often an airline&apos;s flights are delayed, using the Nigerian Civil Aviation Authority&apos;s (NCAA)
            published figures. Cancellations and the time of day adjust it. Higher is better.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["High", "8.0 – 10", "text-good"],
              ["Good", "6.5 – 7.9", "text-primary"],
              ["Fair", "5.0 – 6.4", "text-warn"],
              ["Low", "1.0 – 4.9", "text-bad"],
            ].map(([label, range, tone]) => (
              <div key={label} className="v2-card px-4 py-3">
                <p className={`text-sm font-semibold ${tone}`}>{label}</p>
                <p className="v2-num text-xs text-ink-muted">{range}</p>
              </div>
            ))}
          </div>
          <p>
            Tap any score in the search results to see the reasoning for that flight. Scores can&apos;t be bought:{" "}
            <a href="#independence" className="font-medium text-primary hover:underline">
              our independence commitment
            </a>
            .
          </p>
        </Section>

        <Section id="inputs" title="What goes into it">
          <div className="v2-card divide-y divide-line">
            <div className="p-4">
              <p className="font-semibold">Delays · {pctOfWeight(BASELINE_WEIGHTS.delay)} of the score</p>
              <p className="mt-1 text-sm text-ink-muted">
                The share of the airline&apos;s domestic flights that were <em>not</em> delayed in the latest NCAA monthly report. The NCAA counts a
                flight as delayed when it leaves more than 15 minutes after schedule. This carries most of the weight because delays are the
                problem Nigerian travellers actually face.
              </p>
            </div>
            <div className="p-4">
              <p className="font-semibold">Cancellations · {pctOfWeight(BASELINE_WEIGHTS.cancellation)}</p>
              <p className="mt-1 text-sm text-ink-muted">
                No cancellations earns full marks for this part, falling to zero at a {pct(CANCELLATION_RATE_FLOOR)} cancellation rate. Where the
                NCAA report gives no cancellation figure for an airline, we use the industry-wide rate for that month.
              </p>
            </div>
            <div className="p-4">
              <p className="font-semibold">Time of day · {pctOfWeight(BASELINE_WEIGHTS.timeOfDay)}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Delays build up through the day as aircraft run late on earlier trips. Departures before 09:00 get full marks for this part,
                09:00 to 16:59 get {timeOfDayFactor(12)}, and 17:00 or later get {timeOfDayFactor(18)}.
              </p>
            </div>
          </div>
          <p>
            The three parts are combined into a number between 0 and 1, then stretched onto the 1–10 scale:{" "}
            <span className="v2-num whitespace-nowrap font-medium">score = 1 + 9 × combined</span>.
          </p>
        </Section>

        <Section id="example" title="A worked example">
          <p>
            {ex.name}, the busiest domestic airline in {ex.month}, on a {String(EXAMPLE_HOUR).padStart(2, "0")}:00 departure:
          </p>
          <div className="v2-card overflow-x-auto p-4">
            <table className="v2-num w-full min-w-[420px] text-sm">
              <tbody className="divide-y divide-line">
                <tr>
                  <td className="py-2 pr-4">Not delayed</td>
                  <td className="py-2 pr-4 text-ink-muted">1 − {pct(ex.delayRate)} delayed</td>
                  <td className="py-2 text-right">{D.toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Cancellations</td>
                  <td className="py-2 pr-4 text-ink-muted">
                    1 − {pct(ex.cancelRate, 2)} ÷ {pct(CANCELLATION_RATE_FLOOR)}
                    {ex.cancelFromIndustry ? " (industry rate)" : ""}
                  </td>
                  <td className="py-2 text-right">{A.toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Time of day</td>
                  <td className="py-2 pr-4 text-ink-muted">before 09:00</td>
                  <td className="py-2 text-right">{T.toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Combined</td>
                  <td className="py-2 pr-4 text-ink-muted">
                    {BASELINE_WEIGHTS.delay} × {D.toFixed(3)} + {BASELINE_WEIGHTS.cancellation} × {A.toFixed(3)} + {BASELINE_WEIGHTS.timeOfDay} ×{" "}
                    {T.toFixed(3)}
                  </td>
                  <td className="py-2 text-right">{raw.toFixed(3)}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-2 pr-4">Score</td>
                  <td className="py-2 pr-4 font-normal text-ink-muted">1 + 9 × {raw.toFixed(3)}</td>
                  <td className="py-2 text-right">{ex.score.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="airlines" title={`Every airline, ${dataMonth}`}>
          <p className="text-sm text-ink-muted">Scores shown for a midday departure. Morning flights score a little higher, evening flights lower.</p>
          <div className="v2-card overflow-x-auto">
            <table className="v2-num w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th scope="col" className="px-4 py-3 font-medium">Airline</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Flights</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Delayed</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Cancelled</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {airlines.map(({ row, delayRate, cancelRate, score }) => (
                  <tr key={row.airlineIata}>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">
                      {row.airlineName}
                    </th>
                    <td className="px-4 py-2.5 text-right">{row.flightsOperated.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-2.5 text-right">{pct(delayRate)}</td>
                    <td className="px-4 py-2.5 text-right">{cancelRate === null ? "not reported" : pct(cancelRate, 1)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {score.score.toFixed(1)} <span className="font-normal text-ink-muted">{score.label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="independence" title="Scores can't be bought">
          <p>
            The score exists to tell you how well an airline keeps its timings and its commitments to passengers. So it is built only from
            how flights actually operate:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>No airline can pay to change, remove or hide its score</strong>, on any route, by advertising, sponsorship, commission or
              any other arrangement with us.
            </li>
            <li>
              <strong>A score only changes when the data changes</strong>: new monthly figures, or a correction to figures that were wrong. Every
              airline is scored with the same formula.
            </li>
            <li>
              <strong>Commission doesn&apos;t move the ranking.</strong> Where we earn a commission on a booking, it never affects a score, and
              the Skyfare Pick and the &quot;Best&quot; sort use only price, reliability and journey time.
            </li>
          </ul>
        </Section>

        <Section id="confidence" title="How confident we are, and what's missing">
          <p>
            Every score is currently marked <strong>low confidence</strong>, and we show that on each flight. Three reasons:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>It&apos;s airline-wide.</strong> A carrier&apos;s Lagos–Abuja flights may run better or worse than its average. We&apos;re
              working on route-level on-time history; until then, every flight from the same airline at the same time of day gets the same score.
            </li>
            <li>
              <strong>It&apos;s one month.</strong> The score uses the most recent NCAA report ({dataMonth}). A single bad or good month moves it.
            </li>
            <li>
              <strong>The figures are from reporting of the NCAA release.</strong> We took them from news coverage of the NCAA&apos;s monthly
              figures, cross-checked between outlets, and will confirm them against the NCAA&apos;s own document.
            </li>
          </ul>
          <p>
            Airlines with no NCAA figures get a clearly labelled <strong>preview</strong> score instead, which is a placeholder rather than a
            measurement.
          </p>
        </Section>

        <Section id="pick" title="How the Skyfare Pick is chosen">
          <p>The Pick is the one flight we&apos;d recommend on a route. It&apos;s chosen in two steps:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>Reliable flights first.</strong> If any flight scores {PICK_PREFERRED_RELIABILITY} (Good) or higher, the Pick comes from
              those, however cheap a less reliable flight is. A flight below {PICK_MIN_RELIABILITY.toFixed(1)} is never picked.
            </li>
            <li>
              <strong>Then the best balance.</strong> Within that group, flights are ranked {pctOfWeight(BEST_WEIGHTS.price)} on price,{" "}
              {pctOfWeight(BEST_WEIGHTS.reliability)} on reliability and {pctOfWeight(BEST_WEIGHTS.time)} on journey time. Price and time are
              compared to the best on the page, so one unusually cheap fare can&apos;t make every other flight look bad.
            </li>
          </ol>
          <p>The &quot;Best&quot; sort uses the same ordering, so it always agrees with the Pick.</p>
        </Section>

        <Section id="sources" title="Sources">
          <ul className="space-y-1 text-sm">
            {NCAA_SOURCES.map((url) => (
              <li key={url} className="truncate">
                <a href={url} rel="noopener noreferrer" className="text-primary hover:underline">
                  {new URL(url).hostname.replace(/^www\./, "")}
                </a>
                <span className="text-ink-muted"> · NCAA {dataMonth} domestic operations figures</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink-muted">
            <Link href="/" className="font-medium text-primary hover:underline">
              Search flights
            </Link>{" "}
            to see these scores on real routes.
          </p>
        </Section>
      </main>

      <SiteFooter />
    </>
  );
}
