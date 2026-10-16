"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/v2/format";
import type { CalendarDay } from "@/lib/flights/priceCalendar";
import type { FlightSearchRequest } from "@/types/flight";

interface DateStripProps {
  request: FlightSearchRequest;
  onPick: (date: string) => void;
}

const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return {
    weekday: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
    day: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
  };
};

/** Cheapest fare for the chosen date and three days either side. Tap a day to search it. */
export function DateStrip({ request, onPick }: DateStripProps) {
  const key = JSON.stringify(request);
  // Loading is derived from which search the stored days belong to, so the effect only sets state once the fetch settles.
  const [result, setResult] = useState<{ key: string; days: CalendarDay[] | null }>({ key: "", days: null });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/search/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: key,
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setResult({ key, days: Array.isArray(data?.days) ? data.days : null }))
      .catch((err) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) setResult({ key, days: null });
      });
    return () => controller.abort();
  }, [key]);

  const loading = result.key !== key;
  // Nothing useful to show if the lookup failed or only the chosen day came back.
  if (!loading && (!result.days || result.days.length < 2)) return null;

  const days = loading ? null : result.days!;
  const priced = days?.flatMap((d) => (d.cheapest === null ? [] : [d.cheapest])) ?? [];
  const lowest = priced.length ? Math.min(...priced) : null;

  return (
    <nav aria-label="Prices on nearby dates" className="mb-6">
      <ol className="flex gap-2 overflow-x-auto pb-1">
        {loading
          ? Array.from({ length: 7 }, (_, i) => (
              <li key={i} className="v2-skeleton h-[68px] min-w-[84px] flex-1 rounded-xl" aria-hidden="true" />
            ))
          : days!.map((d) => {
              const selected = d.date === request.departureDate;
              const cheapest = d.cheapest !== null && d.cheapest === lowest;
              const { weekday, day } = dayLabel(d.date);
              return (
                <li key={d.date} className="min-w-[84px] flex-1">
                  <button
                    type="button"
                    onClick={() => !selected && onPick(d.date)}
                    aria-current={selected ? "date" : undefined}
                    className={`flex h-full w-full flex-col items-center rounded-xl border px-2 py-2.5 text-center transition ${
                      selected ? "border-primary bg-primary text-primary-ink" : "border-line bg-surface text-ink hover:border-primary"
                    }`}
                  >
                    <span className={`text-xs ${selected ? "opacity-85" : "text-ink-muted"}`}>
                      {weekday} {day}
                    </span>
                    <span className={`v2-num mt-0.5 text-sm font-semibold ${!selected && cheapest ? "text-good" : ""}`}>
                      {d.cheapest === null ? "–" : formatPrice(d.cheapest)}
                    </span>
                    {cheapest && <span className={`text-[10px] font-semibold uppercase tracking-wide ${selected ? "" : "text-good"}`}>Lowest</span>}
                  </button>
                </li>
              );
            })}
      </ol>
    </nav>
  );
}
