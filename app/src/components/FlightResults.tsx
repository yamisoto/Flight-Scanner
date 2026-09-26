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
  { value: "airline", label: "Airline" },
  { value: "price", label: "Price" },
  { value: "departure_time", label: "Departure time" },
];

export function FlightResults({ status, offers, errorMessage, sortBy, onSortChange }: FlightResultsProps) {
  if (status === "idle" || status === "loading") return null;

  if (status === "error") {
    return (
      <div className="mt-10 border-t border-line pt-6">
        <p className="text-sm text-ink">Something went wrong</p>
        <p className="mt-1 text-sm text-ink-muted">
          {errorMessage ?? "We couldn't complete that search. Please try again."}
        </p>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="mt-10 border-t border-line pt-10 text-center">
        <p className="text-sm text-ink">No flights found for this search</p>
        <p className="mt-1 text-sm text-ink-muted">Try a different date or route.</p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <p className="text-sm text-ink-muted">
          {offers.length} flight{offers.length > 1 ? "s" : ""}
        </p>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          Sort
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as FlightSortKey)}
            className="bg-transparent text-ink outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="divide-y divide-line">
        {offers.map((offer) => (
          <FlightCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
