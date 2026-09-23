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

function SliceRow({ slice, label }: { slice: FlightSlice; label: string }) {
  const first = slice.segments[0];
  const last = slice.segments[slice.segments.length - 1];

  return (
    <div className="flex items-center gap-4 py-2">
      <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      <div className="flex flex-1 items-center gap-3">
        <div className="text-right">
          <div className="font-display text-base">{formatTime(first.departureAt)}</div>
          <div className="text-xs text-ink-muted">{first.origin}</div>
        </div>
        <div className="flex flex-1 flex-col items-center">
          <span className="text-[11px] text-ink-muted">{formatDuration(slice.durationMinutes)}</span>
          <div className="h-px w-full bg-line-strong" />
          <span className="text-[11px] text-ink-muted">
            {slice.stops === 0 ? "Nonstop" : `${slice.stops} stop${slice.stops > 1 ? "s" : ""}`}
          </span>
        </div>
        <div>
          <div className="font-display text-base">{formatTime(last.arrivalAt)}</div>
          <div className="text-xs text-ink-muted">{last.destination}</div>
        </div>
      </div>
    </div>
  );
}

export function FlightCard({ offer }: { offer: FlightOffer }) {
  const airline = offer.slices[0].segments[0].airlineName;
  const isMock = offer.provider === "mock";

  return (
    <article className="rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm">{airline}</p>
          {isMock && (
            <span className="mt-1 inline-block rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
              Test data — not a real fare
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="font-display text-xl text-accent-ink">{formatPrice(offer.price.amount)}</p>
          {offer.fareConditions?.notes && <p className="text-xs text-ink-muted">{offer.fareConditions.notes}</p>}
        </div>
      </div>

      <div className="mt-3 divide-y divide-line">
        {offer.slices.map((slice, i) => (
          <SliceRow key={i} slice={slice} label={i === 0 ? "Depart" : "Return"} />
        ))}
      </div>

      {offer.baggage && (
        <p className="mt-2 text-xs text-ink-muted">
          {offer.baggage.checkedBagsIncluded > 0
            ? `${offer.baggage.checkedBagsIncluded} checked bag${offer.baggage.checkedBagsIncluded > 1 ? "s" : ""} included`
            : "No checked bags included"}
        </p>
      )}

      <button
        type="button"
        disabled={!offer.bookingUrl}
        className="mt-4 w-full rounded-md border border-ink px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        title={offer.bookingUrl ? undefined : "No live booking provider connected yet"}
      >
        Continue to book
      </button>
    </article>
  );
}
