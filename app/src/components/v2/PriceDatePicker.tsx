"use client";

import { useEffect, useRef, useState } from "react";
import { addMonths, monthDays, priceTiers, type PriceTier } from "@/lib/flights/monthPrices";
import type { CalendarDay } from "@/lib/flights/priceCalendar";
import type { CabinClass } from "@/types/flight";

/*
 * Date field with a month calendar colour-coded by price, like Skyscanner's:
 * light blue = the cheapest days this month, grey = average, navy = the most
 * expensive. Colours compare days within the month shown, using the cheapest
 * one-way fare each day (POST /api/search/month).
 */

interface PriceDatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD, or "" before the client knows today's date
  min?: string;
  onChange: (date: string) => void;
  origin: string;
  destination: string;
  adults: number;
  cabinClass: CabinClass;
}

const TIER_CLASS: Record<PriceTier, string> = {
  low: "bg-tier-low text-tier-low-ink",
  mid: "bg-tier-mid text-tier-mid-ink",
  high: "bg-tier-high text-tier-high-ink",
};
const TIER_LABEL: Record<PriceTier, string> = { low: "cheaper", mid: "average price", high: "more expensive" };
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS_AHEAD = 11;

const compactPrice = (n: number) => (n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}m` : `₦${Math.round(n / 1000)}k`);
const monthTitle = (month: string) =>
  month &&
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const fieldDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }) : "Choose date";
/** Monday-first column (0-6) of the 1st of the month. */
const leadingBlanks = (month: string) => (new Date(`${month}-01T00:00:00Z`).getUTCDay() + 6) % 7;

export function PriceDatePicker({ label, value, min, onChange, origin, destination, adults, cabinClass }: PriceDatePickerProps) {
  const [open, setOpen] = useState(false);
  const firstMonth = (min || value).slice(0, 7);
  const [viewChoice, setViewMonth] = useState<string | null>(null);
  const viewMonth = viewChoice ?? (value || min || "").slice(0, 7);
  const rootRef = useRef<HTMLDivElement>(null);

  const canPrice = origin !== destination && viewMonth !== "";
  const key = JSON.stringify({ origin, destination, month: viewMonth, adults, cabinClass });
  // Prices per query; loading is derived from whether this query's result is in yet.
  const [results, setResults] = useState<Record<string, CalendarDay[] | null>>({});
  const days = results[key];
  const loading = open && canPrice && !(key in results);

  useEffect(() => {
    if (!open || !canPrice || key in results) return;
    const controller = new AbortController();
    fetch("/api/search/month", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: key,
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setResults((r) => ({ ...r, [key]: Array.isArray(data?.days) ? data.days : null })))
      .catch((err) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) setResults((r) => ({ ...r, [key]: null }));
      });
    return () => controller.abort();
  }, [open, canPrice, key, results]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tiers = days ? priceTiers(days) : new Map<string, PriceTier>();
  const priceOf = new Map((days ?? []).map((d) => [d.date, d.cheapest]));
  const lastMonth = firstMonth ? addMonths(firstMonth, MONTHS_AHEAD) : "";
  const blanks = viewMonth ? leadingBlanks(viewMonth) : 0;

  function pick(date: string) {
    onChange(date);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="min-w-0 flex-1 lg:relative">
      <button
        type="button"
        onClick={() => {
          setViewMonth(null);
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-full text-left"
      >
        <span className="block px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-ink-muted">{label}</span>
        <span className="block truncate px-4 pb-3 pt-0.5 text-[15px] font-medium text-ink">{fieldDate(value)}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`${label} date`}
          className="v2-card absolute left-0 right-0 top-full z-30 mt-2 p-4 lg:right-auto lg:w-[360px]"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              disabled={viewMonth <= firstMonth}
              aria-label="Previous month"
              className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-surface-2 disabled:opacity-30"
            >
              ‹
            </button>
            <p className="text-sm font-semibold text-ink" aria-live="polite">
              {monthTitle(viewMonth)}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              disabled={viewMonth >= lastMonth}
              aria-label="Next month"
              className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-surface-2 disabled:opacity-30"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-busy={loading}>
            {WEEKDAYS.map((d) => (
              <span key={d} role="columnheader" className="pb-1 text-[11px] font-medium text-ink-muted">
                {d}
              </span>
            ))}
            {Array.from({ length: blanks }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {monthDays(viewMonth).map((date) => {
              const disabled = !!min && date < min;
              const tier = tiers.get(date);
              const price = priceOf.get(date);
              const selected = date === value;
              const label = [
                new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
                price ? `from ${compactPrice(price)}` : null,
                tier ? TIER_LABEL[tier] : null,
              ]
                .filter(Boolean)
                .join(", ");
              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(date)}
                  aria-label={label}
                  aria-pressed={selected}
                  autoFocus={selected}
                  className={`flex h-12 flex-col items-center justify-center rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${
                    disabled ? "text-ink-muted" : tier ? TIER_CLASS[tier] : loading ? "v2-skeleton text-ink" : "text-ink hover:bg-surface-2"
                  } ${selected ? "ring-2 ring-primary ring-offset-2 ring-offset-surface font-semibold" : ""}`}
                >
                  <span className="v2-num leading-none">{Number(date.slice(8))}</span>
                  {!disabled && price ? <span className="v2-num mt-1 text-[10px] leading-none opacity-90">{compactPrice(price)}</span> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted">
            {(["low", "mid", "high"] as PriceTier[]).map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded ${TIER_CLASS[t]}`} aria-hidden="true" />
                {t === "low" ? "Cheaper" : t === "mid" ? "Average" : "More expensive"}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-muted">
            {!canPrice
              ? "Choose your airports to see prices."
              : days === null
                ? "Prices aren't available for this month right now."
                : "Cheapest one-way fare per adult each day, compared within the month."}
          </p>
        </div>
      )}
    </div>
  );
}
