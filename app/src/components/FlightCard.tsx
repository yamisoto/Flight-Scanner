"use client";

import { useRef, useState } from "react";
import { FlightDetailsModal } from "@/components/FlightDetailsModal";
import type { FlightOffer, FlightSlice } from "@/types/flight";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

/**
 * Compares this offer's price to the median of the current search's own
 * results. This is NOT a claim about the route's real historical prices —
 * there's no real historical data behind mock offers, and inventing one
 * would misrepresent what the platform actually knows. It's an honest,
 * clearly-scoped comparison against what came back just now.
 */
function priceComparisonLabel(amount: number, median: number): string | null {
  if (median <= 0) return null;
  const diff = (amount - median) / median;
  if (diff <= -0.05) return "Below average for this search";
  if (diff >= 0.05) return "Above average for this search";
  return "Typical for this search";
}

function SliceRow({ slice }: { slice: FlightSlice }) {
  const first = slice.segments[0];
  const last = slice.segments[slice.segments.length - 1];

  return (
    <div className="flex items-center gap-4">
      <div>
        <span className="text-sm text-ink">{formatTime(first.departureAt)}</span>
        <span className="ml-1 text-xs text-ink-muted">{first.origin}</span>
      </div>
      <div className="flex flex-1 flex-col items-center gap-1">
        <span className="text-xs text-ink-muted">{formatDuration(slice.durationMinutes)}</span>
        <div className="h-px w-full bg-line" />
        <span className="text-xs text-ink-muted">
          {slice.stops === 0 ? "Nonstop" : `${slice.stops} stop${slice.stops > 1 ? "s" : ""}`}
        </span>
      </div>
      <div>
        <span className="text-sm text-ink">{formatTime(last.arrivalAt)}</span>
        <span className="ml-1 text-xs text-ink-muted">{last.destination}</span>
      </div>
    </div>
  );
}

export function FlightCard({ offer, medianPrice }: { offer: FlightOffer; medianPrice: number }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const airline = offer.slices[0].segments[0].airlineName;
  const priceLabel = priceComparisonLabel(offer.price.amount, medianPrice);

  function closeDetails() {
    setDetailsOpen(false);
    // Return focus to whatever opened the modal, rather than dropping it
    // back to the top of the page.
    triggerRef.current?.focus();
  }

  return (
    <article className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="flex-1 space-y-2">
        <button
          type="button"
          ref={triggerRef}
          onClick={() => setDetailsOpen(true)}
          className="inline-flex items-center gap-1 text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          {airline}
          <InfoIcon />
        </button>
        <div className="space-y-2">
          {offer.slices.map((slice, i) => (
            <SliceRow key={i} slice={slice} />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
        <div className="text-right">
          <p className="text-lg text-ink">{formatPrice(offer.price.amount)}</p>
          {priceLabel && <p className="text-xs text-ink-muted">{priceLabel}</p>}
        </div>
        <button
          type="button"
          disabled={!offer.bookingUrl}
          className="text-sm text-accent underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline"
          title={offer.bookingUrl ? undefined : "No live booking provider connected yet"}
        >
          Select
        </button>
      </div>

      {detailsOpen && <FlightDetailsModal offer={offer} onClose={closeDetails} />}
    </article>
  );
}

function InfoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 11v5" />
      <circle cx="12" cy="8" r="0.5" fill="currentColor" />
    </svg>
  );
}
