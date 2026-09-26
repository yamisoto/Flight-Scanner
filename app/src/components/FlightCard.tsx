"use client";

import { useState } from "react";
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

export function FlightCard({ offer }: { offer: FlightOffer }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const airline = offer.slices[0].segments[0].airlineName;

  return (
    <article className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="flex-1 space-y-2">
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          {airline}
        </button>
        <div className="space-y-2">
          {offer.slices.map((slice, i) => (
            <SliceRow key={i} slice={slice} />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
        <p className="text-lg text-ink">{formatPrice(offer.price.amount)}</p>
        <button
          type="button"
          disabled={!offer.bookingUrl}
          className="text-sm text-accent underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline"
          title={offer.bookingUrl ? undefined : "No live booking provider connected yet"}
        >
          Select
        </button>
      </div>

      {detailsOpen && <FlightDetailsModal offer={offer} onClose={() => setDetailsOpen(false)} />}
    </article>
  );
}
