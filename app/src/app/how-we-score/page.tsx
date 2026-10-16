import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/v2/PageHero";
import { SiteFooter } from "@/components/v2/SiteFooter";
import { NCAA_AIRLINE_MONTHS, NCAA_SOURCES } from "@/lib/reliability/ncaaData";
import { latestNcaaMonth, ncaaBaselineReliability } from "@/lib/reliability/score";

/*
 * Public methodology page. Deliberately explains what the score measures,
 * where the data comes from and how confident we are, but not the recipe:
 * no weights, thresholds, formula or worked example, and no raw inputs
 * beside outputs (which would let the weights be fitted). See DECISIONS.md.
 */

export const metadata: Metadata = {
  title: "How we score reliability | Skyfare",
  description:
    "What Skyfare's 1–10 reliability score measures, where the data comes from, how confident we are, and why scores can't be bought.",
  alternates: { canonical: "/how-we-score" },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

// The airline ranking shows each airline's score for a midday departure.
const TABLE_HOUR = 12;
const TONE = { High: "text-good", Good: "text-primary", Fair: "text-warn", Low: "text-bad" } as const;

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
    .map((code) => ({ name: latestNcaaMonth(code)!.airlineName, month: latestNcaaMonth(code)!.month, score: ncaaBaselineReliability(code, TABLE_HOUR)! }))
    .sort((a, b) => b.score.score - a.score.score || a.name.localeCompare(b.name));
  const dataMonth = monthName(airlines.map((a) => a.month).sort().at(-1)!);

  return (
    <>
      <PageHero eyebrow="Methodology" title="How we score reliability">
        Every flight on Skyfare gets a score from 1 to 10 for how likely it is to leave on time. Here&apos;s what goes into it, where the data
        comes from, and where it falls short today.
      </PageHero>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        <Section id="short" title="What the score means">
          <p>
            The score tells you how well an airline keeps to its timings. It&apos;s based on real operating records, not reviews or opinions.
            Higher is better.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["High", "8.0 – 10", "Usually on time"],
              ["Good", "6.5 – 7.9", "Mostly on time"],
              ["Fair", "5.0 – 6.4", "Delays are common"],
              ["Low", "1.0 – 4.9", "Expect delays"],
            ].map(([label, range, meaning]) => (
              <div key={label} className="v2-card px-4 py-3">
                <p className={`text-sm font-semibold ${TONE[label as keyof typeof TONE]}`}>{label}</p>
                <p className="v2-num text-xs text-ink-muted">{range}</p>
                <p className="mt-1 text-xs text-ink">{meaning}</p>
              </div>
            ))}
          </div>
          <p>
            Tap any score in the search results to see the reasons behind it for that flight. Scores can&apos;t be bought:{" "}
            <a href="#independence" className="font-medium text-primary hover:underline">
              our independence commitment
            </a>
            .
          </p>
        </Section>

        <Section id="inputs" title="What we look at">
          <div className="v2-card divide-y divide-line">
            <div className="p-4">
              <p className="font-semibold">How often flights leave late</p>
              <p className="mt-1 text-sm text-ink-muted">
                The biggest factor, because delays are the problem Nigerian travellers face most. We use the official definition: a flight is
                late if it leaves more than 15 minutes after its scheduled time.
              </p>
            </div>
            <div className="p-4">
              <p className="font-semibold">How often flights are cancelled</p>
              <p className="mt-1 text-sm text-ink-muted">Cancellations are rarer than delays but hurt more, so they lower the score too.</p>
            </div>
            <div className="p-4">
              <p className="font-semibold">When you&apos;re flying</p>
              <p className="mt-1 text-sm text-ink-muted">
                Delays build up through the day as aircraft run late on earlier trips, so early departures score a little higher than evening
                ones on the same airline.
              </p>
            </div>
          </div>
          <p>Every airline is scored the same way, with the same data, updated as new figures are published.</p>
        </Section>

        <Section id="airlines" title={`Airline reliability, ${dataMonth}`}>
          <p className="text-sm text-ink-muted">Ranked by score for a midday departure. Morning flights score a little higher, evening flights lower.</p>
          <div className="v2-card overflow-x-auto">
            <table className="v2-num w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th scope="col" className="w-12 px-4 py-3 font-medium">#</th>
                  <th scope="col" className="px-4 py-3 font-medium">Airline</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {airlines.map((a, i) => (
                  <tr key={a.name}>
                    <td className="px-4 py-2.5 text-ink-muted">{i + 1}</td>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">
                      {a.name}
                    </th>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-semibold ${TONE[a.score.label]}`}>{a.score.score.toFixed(1)}</span>{" "}
                      <span className="text-ink-muted">{a.score.label}</span>
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
              <strong>A score only changes when the data changes</strong>: new figures, or a correction to figures that were wrong. Every
              airline is scored the same way.
            </li>
            <li>
              <strong>Commission doesn&apos;t move the ranking.</strong> Where we earn a commission on a booking, it never affects a score, the
              Skyfare Pick or the &quot;Best&quot; sort.
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
              building route-level on-time history; until then, every flight from the same airline at the same time of day gets the same score.
            </li>
            <li>
              <strong>It&apos;s recent, not long-term.</strong> Scores use the latest monthly figures ({dataMonth}), so one unusually good or
              bad month moves them.
            </li>
            <li>
              <strong>The figures come from reporting of the NCAA release.</strong> We took them from news coverage of the NCAA&apos;s monthly
              figures, cross-checked between outlets, and will confirm them against the NCAA&apos;s own document.
            </li>
          </ul>
          <p>
            Airlines with no published figures get a clearly labelled <strong>preview</strong> score instead, which is a placeholder rather than
            a measurement.
          </p>
        </Section>

        <Section id="pick" title="How the Skyfare Pick is chosen">
          <p>The Pick is the one flight we&apos;d recommend on a route:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Reliable flights come first.</strong> If any flight on the route has a good reliability score, the Pick comes from those,
              however cheap a less reliable flight is. Flights with a very low score are never picked.
            </li>
            <li>
              <strong>Then the best balance</strong> of price, reliability and journey time, so you get a dependable flight at a fair price.
            </li>
          </ul>
          <p>The &quot;Best&quot; sort uses the same ordering, so it always agrees with the Pick.</p>
        </Section>

        <Section id="sources" title="Sources">
          <p className="text-sm text-ink-muted">
            Airline operating figures: Nigerian Civil Aviation Authority (NCAA), {dataMonth} domestic operations, as reported by:
          </p>
          <ul className="space-y-1 text-sm">
            {NCAA_SOURCES.map((url) => (
              <li key={url} className="truncate">
                <a href={url} rel="noopener noreferrer" className="text-primary hover:underline">
                  {new URL(url).hostname.replace(/^www\./, "")}
                </a>
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
