"use client";

import { useState, useSyncExternalStore } from "react";
import { AirportCombobox } from "@/components/v2/AirportCombobox";
import { TravellersPicker } from "@/components/v2/TravellersPicker";
import { SearchIcon, SwapIcon } from "@/components/v2/icons";
import type { CabinClass, FlightSearchRequest, TripType } from "@/types/flight";

interface SearchPanelProps {
  initial?: FlightSearchRequest | null;
  isSearching: boolean;
  onSearch: (request: FlightSearchRequest) => void;
}

function todayIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// The page is prerendered, so "today" must come from the visitor's clock, not
// the build server's. The server snapshot is empty and the client fills it in.
const noopSubscribe = () => () => {};

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function SearchPanel({ initial, isSearching, onSearch }: SearchPanelProps) {
  const today = useSyncExternalStore(noopSubscribe, todayIso, () => "");
  const [tripType, setTripType] = useState<TripType>(initial?.tripType ?? "one_way");
  const [origin, setOrigin] = useState(initial?.origin ?? "LOS");
  const [destination, setDestination] = useState(initial?.destination ?? "ABV");
  const [departureChoice, setDepartureDate] = useState<string | null>(initial?.departureDate ?? null);
  const [returnChoice, setReturnDate] = useState<string | null>(initial?.returnDate ?? null);
  const departureDate = departureChoice ?? (today ? addDays(today, 7) : "");
  const returnDate = returnChoice ?? (today ? addDays(today, 10) : "");
  const [adults, setAdults] = useState(initial?.passengers.adults ?? 1);
  const [cabinClass, setCabinClass] = useState<CabinClass>(initial?.cabinClass ?? "economy");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (origin === destination) return setError("Pick two different airports.");
    if (tripType === "return" && returnDate < departureDate) return setError("Return date must be on or after departure.");
    setError(null);
    onSearch({
      origin,
      destination,
      tripType,
      departureDate,
      returnDate: tripType === "return" ? returnDate : undefined,
      passengers: { adults, children: 0, infants: 0 },
      cabinClass,
    });
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div role="radiogroup" aria-label="Trip type" className="mb-3 inline-flex rounded-full bg-white/10 p-1 text-sm">
        {(["one_way", "return"] as TripType[]).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tripType === t}
            onClick={() => setTripType(t)}
            className={`rounded-full px-4 py-1.5 font-medium transition ${
              tripType === t ? "bg-white text-[#0a0c11]" : "text-hero-muted hover:text-hero-ink"
            }`}
          >
            {t === "one_way" ? "One way" : "Return"}
          </button>
        ))}
      </div>

      <div className="v2-card flex flex-col p-1.5 lg:flex-row lg:items-stretch">
        <div className="relative flex flex-col lg:flex-[2.2] lg:flex-row">
          <AirportCombobox label="From" value={origin} onChange={setOrigin} exclude={destination} />
          <div className="mx-4 h-px bg-line lg:mx-0 lg:my-3 lg:h-auto lg:w-px" />
          <button
            type="button"
            onClick={() => {
              setOrigin(destination);
              setDestination(origin);
            }}
            aria-label="Swap origin and destination"
            className="absolute right-4 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 rotate-90 place-items-center rounded-full border border-line bg-surface text-ink-muted shadow-sm transition hover:border-primary hover:text-primary lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:rotate-0"
          >
            <SwapIcon size={15} className="lg:rotate-90" />
          </button>
          <AirportCombobox label="To" value={destination} onChange={setDestination} exclude={origin} inset />
        </div>

        <div className="mx-4 h-px bg-line lg:mx-0 lg:my-3 lg:h-auto lg:w-px" />

        <div className="flex lg:flex-[1.6]">
          <DateField label="Depart" value={departureDate} min={today || undefined} onChange={setDepartureDate} />
          <div className="my-3 w-px bg-line" />
          {tripType === "return" ? (
            <DateField label="Return" value={returnDate} min={departureDate} onChange={setReturnDate} />
          ) : (
            <button type="button" onClick={() => setTripType("return")} className="min-w-0 flex-1 text-left">
              <span className="block px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-ink-muted">Return</span>
              <span className="block px-4 pb-3 pt-0.5 text-[15px] font-medium text-ink-muted">Add return</span>
            </button>
          )}
        </div>

        <div className="mx-4 h-px bg-line lg:mx-0 lg:my-3 lg:h-auto lg:w-px" />

        <div className="flex lg:flex-1">
          <TravellersPicker
            adults={adults}
            cabinClass={cabinClass}
            onChange={(n) => {
              setAdults(n.adults);
              setCabinClass(n.cabinClass);
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="mt-1.5 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-[15px] font-semibold text-primary-ink transition hover:bg-primary-hover disabled:opacity-60 lg:mt-0 lg:h-auto"
        >
          <SearchIcon size={18} />
          {isSearching ? "Searching" : "Search"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#ff9b92]">
          {error}
        </p>
      )}
    </form>
  );
}

function DateField({ label, value, min, onChange }: { label: string; value: string; min?: string; onChange: (v: string) => void }) {
  return (
    <label className="min-w-0 flex-1">
      <span className="block px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-ink-muted">{label}</span>
      <input
        type="date"
        required
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent px-4 pb-3 pt-0.5 text-[15px] font-medium text-ink outline-none [color-scheme:light] dark:[color-scheme:dark]"
      />
    </label>
  );
}
