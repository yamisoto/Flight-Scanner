"use client";

import { useEffect, useRef } from "react";
import type { FlightOffer, FlightSlice } from "@/types/flight";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

interface FlightDetailsModalProps {
  offer: FlightOffer;
  onClose: () => void;
}

export function FlightDetailsModal({ offer, onClose }: FlightDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus into the modal as soon as it opens — the close button is
  // currently the only focusable element inside it.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Minimal focus trap: the close button is the only focusable element
      // in the modal right now, so Tab/Shift+Tab just keeps focus on it
      // rather than escaping to the page underneath.
      if (e.key === "Tab") {
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const airline = offer.slices[0].segments[0].airlineName;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Flight and baggage details for ${airline}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-xl border border-line bg-bg p-6 sm:rounded-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-ink-muted">{airline}</p>
            <p className="text-lg text-ink">{formatPrice(offer.price.amount)}</p>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-ink-muted transition hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {offer.slices.map((slice, i) => (
            <SliceDetail key={i} slice={slice} label={offer.slices.length > 1 ? (i === 0 ? "Outbound" : "Return") : "Flight"} />
          ))}
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="text-sm text-ink">Baggage allowance</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Carry-on bags</dt>
              <dd className="text-ink">{offer.baggage?.cabinBagsIncluded ?? 0}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Checked bags</dt>
              <dd className="text-ink">
                {offer.baggage?.checkedBagsIncluded ?? 0}
                {offer.baggage?.checkedBagsIncluded && offer.baggage.checkedBagWeightKg
                  ? ` (up to ${offer.baggage.checkedBagWeightKg}kg each)`
                  : ""}
              </dd>
            </div>
          </dl>
          {offer.baggage?.notes && <p className="mt-3 text-xs text-ink-muted">{offer.baggage.notes}</p>}
        </div>

        {offer.fareConditions && (
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm text-ink">Fare conditions</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">Refundable</dt>
                <dd className="text-ink">{offer.fareConditions.refundable ? "Yes" : "No"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">Changeable</dt>
                <dd className="text-ink">
                  {offer.fareConditions.changeable
                    ? offer.fareConditions.changeFeeNGN
                      ? `Yes, ${formatPrice(offer.fareConditions.changeFeeNGN)} fee`
                      : "Yes, no fee"
                    : "No"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

function SliceDetail({ slice, label }: { slice: FlightSlice; label: string }) {
  const first = slice.segments[0];
  const last = slice.segments[slice.segments.length - 1];

  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <div className="mt-1 flex items-center gap-4">
        <div>
          <p className="text-base text-ink">{formatTime(first.departureAt)}</p>
          <p className="text-xs text-ink-muted">
            {first.origin} · {formatDate(first.departureAt)}
          </p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs text-ink-muted">{formatDuration(slice.durationMinutes)}</span>
          <div className="h-px w-full bg-line" />
          <span className="text-xs text-ink-muted">
            {slice.stops === 0 ? "Nonstop" : `${slice.stops} stop${slice.stops > 1 ? "s" : ""}`}
          </span>
        </div>
        <div>
          <p className="text-base text-ink">{formatTime(last.arrivalAt)}</p>
          <p className="text-xs text-ink-muted">
            {last.destination} · {formatDate(last.arrivalAt)}
          </p>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        {first.airlineName} {first.flightNumber}
      </p>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
