import { ArrowRightIcon, GridIcon, ShieldIcon, SparkIcon } from "@/components/v2/icons";
import { findAirport } from "@/lib/data/airports";

export const POPULAR_ROUTES: [string, string][] = [
  ["LOS", "ABV"],
  ["ABV", "LOS"],
  ["LOS", "PHC"],
  ["LOS", "KAN"],
  ["ABV", "PHC"],
  ["LOS", "ENU"],
  ["LOS", "QUO"],
  ["ABV", "KAN"],
];

export function PopularRoutes({ onPick }: { onPick: (origin: string, destination: string) => void }) {
  return (
    <section aria-labelledby="popular-heading">
      <h2 id="popular-heading" className="text-lg font-semibold tracking-tight text-ink">
        Popular routes
      </h2>
      <p className="mt-1 text-sm text-ink-muted">One tap to compare every airline flying it next week.</p>
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {POPULAR_ROUTES.map(([o, d]) => (
          <button
            key={`${o}-${d}`}
            type="button"
            onClick={() => onPick(o, d)}
            className="v2-card group flex items-center justify-between px-4 py-3.5 text-left transition hover:border-primary"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">
                {findAirport(o)?.city} → {findAirport(d)?.city}
              </span>
              <span className="text-xs font-medium tracking-wide text-ink-muted">
                {o} · {d}
              </span>
            </span>
            <ArrowRightIcon size={16} className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </section>
  );
}

const PROPS = [
  {
    icon: GridIcon,
    title: "Every flight, one list",
    body: "All Nigerian airlines on your route side by side. If we can't price a flight, we still show it.",
  },
  {
    icon: ShieldIcon,
    title: "Reliability, scored 1–10",
    body: "Our on-time score uses each airline's published delay and cancellation rates. Tap any score to see why.",
  },
  {
    icon: SparkIcon,
    title: "The Skyfare Pick",
    body: "One clear recommendation that balances price, journey time and reliability, so you don't have to.",
  },
];

export function ValueProps() {
  return (
    <section aria-label="Why Skyfare" className="grid gap-3 md:grid-cols-3">
      {PROPS.map(({ icon: Icon, title, body }) => (
        <div key={title} className="v2-card p-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon size={18} />
          </span>
          <h3 className="mt-4 text-[15px] font-semibold text-ink">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
        </div>
      ))}
    </section>
  );
}
