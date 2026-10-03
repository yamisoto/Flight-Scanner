"use client";

import { formatPrice } from "@/lib/v2/format";
import type { ScoredOffer } from "@/lib/v2/scoring";

export type TimeBucket = "morning" | "afternoon" | "evening" | "night";

export interface V2Filters {
  directOnly: boolean;
  airlines: string[]; // empty = all
  times: TimeBucket[]; // empty = any
  maxPrice: number | null;
  minReliability: number; // 0 = any
}

export const EMPTY_FILTERS: V2Filters = { directOnly: false, airlines: [], times: [], maxPrice: null, minReliability: 0 };

const TIMES: { key: TimeBucket; label: string; range: string }[] = [
  { key: "morning", label: "Morning", range: "06:00–11:59" },
  { key: "afternoon", label: "Afternoon", range: "12:00–17:59" },
  { key: "evening", label: "Evening", range: "18:00–23:59" },
  { key: "night", label: "Night", range: "00:00–05:59" },
];

const RELIABILITY_STEPS = [0, 6, 7, 8];

export function timeBucket(hour: number): TimeBucket {
  return hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

export function applyV2Filters(items: ScoredOffer[], f: V2Filters): ScoredOffer[] {
  return items.filter((s) => {
    if (f.directOnly && s.offer.slices.some((sl) => sl.stops > 0)) return false;
    if (f.airlines.length && !f.airlines.includes(s.offer.slices[0].segments[0].airlineCode)) return false;
    if (f.times.length && !f.times.includes(timeBucket(s.departureHour))) return false;
    if (f.maxPrice !== null && s.offer.price.amount > f.maxPrice) return false;
    if (s.reliability.score < f.minReliability) return false;
    return true;
  });
}

export function activeFilterCount(f: V2Filters) {
  return [f.directOnly, f.airlines.length > 0, f.times.length > 0, f.maxPrice !== null, f.minReliability > 0].filter(Boolean).length;
}

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

interface FiltersProps {
  all: ScoredOffer[];
  value: V2Filters;
  onChange: (f: V2Filters) => void;
}

export function Filters({ all, value, onChange }: FiltersProps) {
  const airlines = Array.from(
    all.reduce((map, s) => {
      const seg = s.offer.slices[0].segments[0];
      const prev = map.get(seg.airlineCode);
      if (!prev || s.offer.price.amount < prev.min) map.set(seg.airlineCode, { name: seg.airlineName, min: s.offer.price.amount });
      return map;
    }, new Map<string, { name: string; min: number }>()),
  ).sort((a, b) => a[1].min - b[1].min);

  const prices = all.map((s) => s.offer.price.amount);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const step = 500;

  return (
    <div className="space-y-6 text-sm">
      <Section title="Stops">
        <Check checked={value.directOnly} onChange={() => onChange({ ...value, directOnly: !value.directOnly })}>
          Direct flights only
        </Check>
      </Section>

      <Section title="Reliability">
        <div className="grid grid-cols-4 gap-1.5">
          {RELIABILITY_STEPS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={value.minReliability === r}
              onClick={() => onChange({ ...value, minReliability: r })}
              className={`rounded-lg border py-1.5 text-xs font-medium transition ${
                value.minReliability === r ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-muted hover:text-ink"
              }`}
            >
              {r === 0 ? "Any" : `${r}+`}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Departure time">
        <div className="grid grid-cols-2 gap-1.5">
          {TIMES.map((t) => {
            const on = value.times.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ ...value, times: toggle(value.times, t.key) })}
                className={`rounded-lg border px-2.5 py-2 text-left transition ${
                  on ? "border-primary bg-primary-soft" : "border-line hover:border-line-strong"
                }`}
              >
                <span className={`block text-xs font-semibold ${on ? "text-primary" : "text-ink"}`}>{t.label}</span>
                <span className="v2-num block text-[11px] text-ink-muted">{t.range}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {maxP > minP && (
        <Section title="Max price">
          <p className="v2-num mb-2 font-semibold text-ink">{formatPrice(value.maxPrice ?? maxP)}</p>
          <input
            type="range"
            min={Math.floor(minP / step) * step}
            max={Math.ceil(maxP / step) * step}
            step={step}
            value={value.maxPrice ?? Math.ceil(maxP / step) * step}
            onChange={(e) => {
              const n = Number(e.target.value);
              onChange({ ...value, maxPrice: n >= maxP ? null : n });
            }}
            aria-label="Maximum price"
            className="w-full accent-[var(--primary)]"
          />
        </Section>
      )}

      <Section title="Airlines">
        <div className="space-y-2.5">
          {airlines.map(([code, { name, min }]) => (
            <Check key={code} checked={value.airlines.includes(code)} onChange={() => onChange({ ...value, airlines: toggle(value.airlines, code) })}>
              <span className="flex w-full items-center justify-between gap-2">
                <span className="truncate">{name}</span>
                <span className="v2-num text-xs text-ink-muted">from {formatPrice(min)}</span>
              </span>
            </Check>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</h3>
      {children}
    </section>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 accent-[var(--primary)]" />
      {children}
    </label>
  );
}
