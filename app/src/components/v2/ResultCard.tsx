"use client";

import { useId, useRef, useState } from "react";
import { FlightDetailsModal } from "@/components/FlightDetailsModal";
import { ReliabilityBadge, ReliabilityExplainer } from "@/components/v2/ReliabilityBadge";
import { SparkIcon } from "@/components/v2/icons";
import { formatDuration, formatPrice, formatTime } from "@/lib/v2/format";
import type { ScoredOffer } from "@/lib/v2/scoring";
import type { FlightSlice } from "@/types/flight";

// Stable, brand-neutral tint per airline so cards are scannable without logos.
const AIRLINE_TINTS = ["#1747e0", "#0b0c0e", "#5a6170", "#2563eb", "#334155", "#1e3a8a", "#475569"];

function airlineTint(code: string) {
  let h = 0;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AIRLINE_TINTS[h % AIRLINE_TINTS.length];
}

export function AirlineMark({ code, name }: { code: string; name: string }) {
  // Some carriers have no confirmed IATA code (the data layer uses "XX"), so fall back to initials.
  const label = code && code !== "XX" ? code : name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span
      aria-hidden="true"
      title={name}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold tracking-wide text-white"
      style={{ background: airlineTint(name) }}
    >
      {label}
    </span>
  );
}

function SliceTimeline({ slice, label }: { slice: FlightSlice; label?: string }) {
  const first = slice.segments[0];
  const last = slice.segments[slice.segments.length - 1];
  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <div className="w-14 shrink-0">
        <p className="v2-num text-lg font-semibold leading-tight text-ink">{formatTime(first.departureAt)}</p>
        <p className="text-xs font-medium text-ink-muted">{first.origin}</p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <span className="v2-num text-xs text-ink-muted">
          {label ? `${label} · ` : ""}
          {formatDuration(slice.durationMinutes)}
        </span>
        <span className="relative my-1 h-px w-full bg-line-strong">
          <span className="absolute -top-[3px] left-0 h-[7px] w-[7px] rounded-full border border-line-strong bg-surface" />
          <span className="absolute -top-[3px] right-0 h-[7px] w-[7px] rounded-full bg-silver" />
        </span>
        <span className={`text-xs font-medium ${slice.stops === 0 ? "text-good" : "text-warn"}`}>
          {slice.stops === 0 ? "Direct" : `${slice.stops} stop${slice.stops > 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="w-14 shrink-0 text-right">
        <p className="v2-num text-lg font-semibold leading-tight text-ink">{formatTime(last.arrivalAt)}</p>
        <p className="text-xs font-medium text-ink-muted">{last.destination}</p>
      </div>
    </div>
  );
}

interface ResultCardProps {
  item: ScoredOffer;
  isPick?: boolean;
  pickReason?: string;
}

export function ResultCard({ item, isPick = false, pickReason }: ResultCardProps) {
  const [open, setOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const whyId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { offer, reliability } = item;
  const seg = offer.slices[0].segments[0];
  const isReturn = offer.slices.length > 1;

  return (
    <article
      className={`v2-card overflow-hidden transition hover:border-line-strong ${isPick ? "border-primary ring-1 ring-primary" : ""}`}
      aria-label={`${seg.airlineName}, ${formatPrice(offer.price.amount)}${isPick ? ", Skyfare Pick" : ""}`}
    >
      {isPick && (
        <div className="flex items-center gap-2 bg-primary px-4 py-2 text-primary-ink sm:px-5">
          <SparkIcon size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">Skyfare Pick</span>
          {pickReason && <span className="hidden truncate text-xs opacity-85 sm:inline">· {pickReason}</span>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <AirlineMark code={seg.airlineCode} name={seg.airlineName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{seg.airlineName}</p>
              <p className="text-xs text-ink-muted">
                {seg.flightNumber.startsWith("XX") ? "Flight no. TBC" : seg.flightNumber}
                {offer.baggage ? ` · ${offer.baggage.checkedBagsIncluded ? `${offer.baggage.checkedBagsIncluded} checked bag` : "Hand luggage only"}` : ""}
              </p>
            </div>
            <ReliabilityBadge reliability={reliability} panelId={whyId} expanded={whyOpen} onToggle={() => setWhyOpen((v) => !v)} />
          </div>

          {whyOpen && <ReliabilityExplainer id={whyId} reliability={reliability} />}

          <div className="space-y-3">
            {offer.slices.map((slice, i) => (
              <SliceTimeline key={i} slice={slice} label={isReturn ? (i === 0 ? "Out" : "Back") : undefined} />
            ))}
          </div>

          {isPick && pickReason && <p className="text-xs text-ink-muted sm:hidden">{pickReason}</p>}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line bg-surface-2/50 p-4 sm:w-48 sm:flex-col sm:items-stretch sm:justify-center sm:border-l sm:border-t-0 sm:p-5">
          <div className="sm:text-right">
            <p className="v2-num text-2xl font-semibold tracking-tight text-ink">{formatPrice(offer.price.amount)}</p>
            <p className="text-xs text-ink-muted">{isReturn ? "Return, per person" : "Per person"}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 sm:items-stretch">
            <button
              type="button"
              disabled={!offer.bookingUrl}
              title={offer.bookingUrl ? undefined : "No live booking partner connected yet"}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-ink disabled:text-bg disabled:opacity-80"
            >
              Select
            </button>
            <button
              type="button"
              ref={triggerRef}
              onClick={() => setOpen(true)}
              className="text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline sm:text-center"
            >
              Flight details
            </button>
          </div>
        </div>
      </div>

      {open && (
        <FlightDetailsModal
          offer={offer}
          onClose={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      )}
    </article>
  );
}

export function ResultCardSkeleton() {
  return (
    <div className="v2-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center" aria-hidden="true">
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="v2-skeleton h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <div className="v2-skeleton h-3.5 w-28" />
            <div className="v2-skeleton h-3 w-20" />
          </div>
        </div>
        <div className="v2-skeleton h-8 w-full" />
      </div>
      <div className="space-y-2 sm:w-40">
        <div className="v2-skeleton h-7 w-28 sm:ml-auto" />
        <div className="v2-skeleton h-10 w-full" />
      </div>
    </div>
  );
}
