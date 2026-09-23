import { FlightCard } from "@/components/FlightCard";
import type { FlightOffer, FlightSortKey } from "@/types/flight";

export type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

interface FlightResultsProps {
  status: SearchStatus;
  offers: FlightOffer[];
  errorMessage: string | null;
  sortBy: FlightSortKey;
  onSortChange: (sort: FlightSortKey) => void;
}

const SORT_OPTIONS: { value: FlightSortKey; label: string }[] = [
  { value: "price", label: "Price" },
  { value: "duration", label: "Duration" },
  { value: "departure_time", label: "Departure time" },
];

export function FlightResults({ status, offers, errorMessage, sortBy, onSortChange }: FlightResultsProps) {
  if (status === "idle") return null;

  if (status === "loading") {
    return (
      <div className="mt-8 space-y-3" aria-live="polite" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border border-line bg-surface" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-5">
        <p className="font-display text-sm text-red-900">Something went wrong</p>
        <p className="mt-1 text-sm text-red-800">
          {errorMessage ?? "We couldn't complete that search. Please try again."}
        </p>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="mt-8 rounded-lg border border-line bg-surface p-8 text-center">
        <p className="font-display text-base">No flights found for this search</p>
        <p className="mt-1 text-sm text-ink-muted">Try a different date or route.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {offers.length} flight{offers.length > 1 ? "s" : ""} found
        </p>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          Sort by
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as FlightSortKey)}
            className="rounded-md border border-line bg-surface px-2 py-1 text-sm text-ink outline-none focus:border-accent"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="space-y-3">
        {offers.map((offer) => (
          <FlightCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
