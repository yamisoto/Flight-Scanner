"use client";

import { useEffect, useMemo, useState } from "react";
import { Filters, EMPTY_FILTERS, activeFilterCount, applyV2Filters, type V2Filters } from "@/components/v2/Filters";
import { ResultCard, ResultCardSkeleton } from "@/components/v2/ResultCard";
import { SortTabs } from "@/components/v2/SortTabs";
import { CloseIcon, FilterIcon } from "@/components/v2/icons";
import { pickReason, pickRecommended, sortScored, type ScoredOffer, type V2SortKey } from "@/lib/v2/scoring";

export type V2Status = "loading" | "success" | "empty" | "error";

interface ResultsViewProps {
  status: V2Status;
  scored: ScoredOffer[];
  errorMessage: string | null;
  onRetry: () => void;
}

export function ResultsView({ status, scored, errorMessage, onRetry }: ResultsViewProps) {
  const [sortKey, setSortKey] = useState<V2SortKey>("best");
  const [filters, setFilters] = useState<V2Filters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [prevScored, setPrevScored] = useState(scored);

  // A new search resets filters and sort (adjusting state from props during render, not in an effect).
  if (scored !== prevScored) {
    setPrevScored(scored);
    setFilters(EMPTY_FILTERS);
    setSortKey("best");
  }

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const filtered = useMemo(() => applyV2Filters(scored, filters), [scored, filters]);
  const sorted = useMemo(() => sortScored(filtered, sortKey), [filtered, sortKey]);
  // The Pick is chosen from the full result set so it doesn't jump around as filters change,
  // and is only pinned on the Best tab where it is also the top-ranked flight.
  const pick = useMemo(() => pickRecommended(scored), [scored]);
  const pickVisible = pick && sortKey === "best" && filtered.some((s) => s.offer.id === pick.offer.id);
  const rest = pickVisible ? sorted.filter((s) => s.offer.id !== pick.offer.id) : sorted;
  const filterCount = activeFilterCount(filters);

  if (status === "error") {
    return (
      <div className="v2-card mx-auto max-w-lg p-8 text-center">
        <p className="text-base font-semibold text-ink">We couldn&apos;t complete that search</p>
        <p className="mt-1.5 text-sm text-ink-muted">{errorMessage ?? "Please try again."}</p>
        <button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink hover:bg-primary-hover">
          Try again
        </button>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="v2-card mx-auto max-w-lg p-8 text-center">
        <p className="text-base font-semibold text-ink">No flights on this route that day</p>
        <p className="mt-1.5 text-sm text-ink-muted">Try another date, or a nearby airport.</p>
      </div>
    );
  }

  const loading = status === "loading";

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="v2-card sticky top-4 p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Filters</h2>
            {filterCount > 0 && (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs font-medium text-primary hover:underline">
                Clear all
              </button>
            )}
          </div>
          {loading ? <FilterSkeleton /> : <Filters all={scored} value={filters} onChange={setFilters} />}
        </div>
      </aside>

      <section aria-label="Flight results" aria-busy={loading} className="min-w-0 space-y-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="v2-skeleton h-[76px] rounded-xl" />
            ))}
          </div>
        ) : (
          <SortTabs scored={filtered} value={sortKey} onChange={setSortKey} />
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-muted" aria-live="polite">
            {loading ? "Searching every airline…" : `${filtered.length} of ${scored.length} flights`}
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm text-ink-muted">
              <span className="hidden sm:inline">Sort</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as V2SortKey)}
                className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm font-medium text-ink outline-none"
              >
                <option value="best">Best</option>
                <option value="cheapest">Cheapest</option>
                <option value="fastest">Fastest</option>
                <option value="reliable">Most reliable</option>
                <option value="departure">Departure time</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink lg:hidden"
            >
              <FilterIcon size={15} />
              Filters{filterCount ? ` (${filterCount})` : ""}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="v2-card p-8 text-center">
            <p className="font-semibold text-ink">No flights match these filters</p>
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="mt-3 text-sm font-medium text-primary hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {pickVisible && <ResultCard item={pick} isPick pickReason={pickReason(pick, scored)} />}
            {rest.map((item) => (
              <ResultCard key={item.offer.id} item={item} />
            ))}
          </div>
        )}

        {!loading && (
          <p className="pt-2 text-xs leading-relaxed text-ink-muted">
            Reliability scores are a preview. They become live once on-time data from airlines and the NCAA is connected. Prices are demonstration
            data, not live fares.
          </p>
        )}
      </section>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" onClick={() => setSheetOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold text-ink">Filters</h2>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink">
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">
              <Filters all={scored} value={filters} onChange={setFilters} />
            </div>
            <div className="flex gap-3 border-t border-line px-5 py-4">
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="flex-1 rounded-xl border border-line py-3 text-sm font-semibold text-ink">
                Clear
              </button>
              <button type="button" onClick={() => setSheetOpen(false)} className="flex-[2] rounded-xl bg-primary py-3 text-sm font-semibold text-primary-ink">
                Show {filtered.length} flight{filtered.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="v2-skeleton h-3 w-20" />
          <div className="v2-skeleton h-8 w-full" />
        </div>
      ))}
    </div>
  );
}
