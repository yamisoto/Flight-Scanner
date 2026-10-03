import { formatDuration, formatPrice } from "@/lib/v2/format";
import { sortScored, type ScoredOffer, type V2SortKey } from "@/lib/v2/scoring";

const TABS: { key: Exclude<V2SortKey, "departure">; label: string }[] = [
  { key: "best", label: "Best" },
  { key: "cheapest", label: "Cheapest" },
  { key: "fastest", label: "Fastest" },
  { key: "reliable", label: "Most reliable" },
];

interface SortTabsProps {
  scored: ScoredOffer[];
  value: V2SortKey;
  onChange: (key: V2SortKey) => void;
}

/** Skyscanner-style sort cards: each tab previews the top result's price and duration for that ordering. */
export function SortTabs({ scored, value, onChange }: SortTabsProps) {
  return (
    <div role="tablist" aria-label="Sort results" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TABS.map((tab) => {
        const top = sortScored(scored, tab.key)[0];
        const selected = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className={`relative rounded-xl border px-3.5 py-3 text-left transition ${
              selected ? "border-primary bg-surface ring-1 ring-primary" : "border-line bg-surface hover:border-line-strong"
            }`}
          >
            <span className={`block text-xs font-semibold ${selected ? "text-primary" : "text-ink-muted"}`}>{tab.label}</span>
            {top ? (
              <>
                <span className="v2-num mt-1 block text-[17px] font-semibold text-ink">{formatPrice(top.offer.price.amount)}</span>
                <span className="v2-num block text-xs text-ink-muted">
                  {tab.key === "reliable" ? `${top.reliability.score.toFixed(1)}/10 · ` : ""}
                  {formatDuration(top.totalMinutes)}
                </span>
              </>
            ) : (
              <span className="mt-1 block text-sm text-ink-muted">–</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
