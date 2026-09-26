"use client";

import { useState } from "react";
import type { FlightOffer, FlightSearchFilters } from "@/types/flight";

interface FiltersPanelProps {
  /** The unfiltered result set for the current search — used to derive
   * the airline checkbox list so it stays stable while filters are applied. */
  baseOffers: FlightOffer[];
  filters: FlightSearchFilters;
  onApply: (filters: FlightSearchFilters) => void;
}

type TimeBucket = NonNullable<FlightSearchFilters["departureTimeOfDay"]>[number];

const TIME_BUCKETS: { value: TimeBucket; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

function countActive(f: FlightSearchFilters): number {
  let n = 0;
  if (f.airlineCodes?.length) n += 1;
  if (f.maxStops !== undefined) n += 1;
  if (f.minPriceNGN !== undefined || f.maxPriceNGN !== undefined) n += 1;
  if (f.departureTimeOfDay?.length) n += 1;
  return n;
}

export function FiltersPanel({ baseOffers, filters, onApply }: FiltersPanelProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FlightSearchFilters>(filters);
  const [prevFilters, setPrevFilters] = useState(filters);

  // Keep the draft in sync when filters are reset elsewhere (e.g. a new
  // search resets filters to {}). Computed during render rather than in
  // an effect, per React's guidance on adjusting state from props.
  if (filters !== prevFilters) {
    setPrevFilters(filters);
    setDraft(filters);
  }

  const airlineOptions = Array.from(
    new Map(
      baseOffers.map((o) => {
        const seg = o.slices[0].segments[0];
        return [seg.airlineCode, seg.airlineName] as const;
      }),
    ).entries(),
  );

  function toggleAirline(code: string) {
    setDraft((d) => {
      const current = d.airlineCodes ?? [];
      const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
      return { ...d, airlineCodes: next.length ? next : undefined };
    });
  }

  function toggleTimeOfDay(bucket: TimeBucket) {
    setDraft((d) => {
      const current = d.departureTimeOfDay ?? [];
      const next = current.includes(bucket) ? current.filter((b) => b !== bucket) : [...current, bucket];
      return { ...d, departureTimeOfDay: next.length ? next : undefined };
    });
  }

  const activeCount = countActive(filters);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-sm text-ink-muted hover:text-ink"
      >
        Filters{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>

      {open && (
        <div className="mt-3 space-y-4 border-t border-line pt-4 text-sm">
          {airlineOptions.length > 0 && (
            <div>
              <p className="text-xs text-ink-muted">Airline</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {airlineOptions.map(([code, name]) => (
                  <label key={code} className="flex items-center gap-1.5 text-ink">
                    <input type="checkbox" checked={draft.airlineCodes?.includes(code) ?? false} onChange={() => toggleAirline(code)} />
                    {name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center gap-1.5 text-ink">
              <input
                type="checkbox"
                checked={draft.maxStops === 0}
                onChange={(e) => setDraft((d) => ({ ...d, maxStops: e.target.checked ? 0 : undefined }))}
              />
              Nonstop only
            </label>
          </div>

          <div>
            <p className="text-xs text-ink-muted">Price range (₦)</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={draft.minPriceNGN ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, minPriceNGN: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-24 border-b border-line bg-transparent text-ink outline-none"
              />
              <span className="text-ink-muted">–</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={draft.maxPriceNGN ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, maxPriceNGN: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-24 border-b border-line bg-transparent text-ink outline-none"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-ink-muted">Time of day</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {TIME_BUCKETS.map((b) => (
                <label key={b.value} className="flex items-center gap-1.5 text-ink">
                  <input
                    type="checkbox"
                    checked={draft.departureTimeOfDay?.includes(b.value) ?? false}
                    onChange={() => toggleTimeOfDay(b.value)}
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5 pt-1">
            <button type="button" onClick={() => onApply(draft)} className="text-accent hover:underline">
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft({});
                onApply({});
              }}
              className="text-ink-muted hover:text-ink"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
