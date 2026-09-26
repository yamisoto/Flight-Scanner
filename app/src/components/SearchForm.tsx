"use client";

import { useState } from "react";
import { AIRPORTS } from "@/lib/data/airports";
import type { CabinClass, FlightSearchRequest, TripType } from "@/types/flight";

interface SearchFormProps {
  onSearch: (request: FlightSearchRequest) => void;
  isSearching: boolean;
}

const today = new Date().toISOString().slice(0, 10);

export function SearchForm({ onSearch, isSearching }: SearchFormProps) {
  const [origin, setOrigin] = useState("LOS");
  const [destination, setDestination] = useState("ABV");
  const [tripType, setTripType] = useState<TripType>("one_way");
  const [departureDate, setDepartureDate] = useState(today);
  const [returnDate, setReturnDate] = useState(today);
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [formError, setFormError] = useState<string | null>(null);

  function swap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (origin === destination) {
      setFormError("Origin and destination must be different airports.");
      return;
    }

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
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-5 pb-4 text-sm">
        {(["one_way", "return"] as TripType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTripType(type)}
            className={
              tripType === type
                ? "font-medium text-ink"
                : "text-ink-muted hover:text-ink"
            }
          >
            {type === "one_way" ? "One way" : "Return"}
          </button>
        ))}
        <span className="h-4 w-px bg-line" />
        <select
          value={cabinClass}
          onChange={(e) => setCabinClass(e.target.value as CabinClass)}
          className="bg-transparent text-ink-muted outline-none hover:text-ink"
        >
          <option value="economy">Economy</option>
          <option value="premium_economy">Premium Economy</option>
          <option value="business">Business</option>
          <option value="first">First</option>
        </select>
        <select
          value={adults}
          onChange={(e) => setAdults(Number(e.target.value))}
          className="bg-transparent text-ink-muted outline-none hover:text-ink"
        >
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} adult{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col divide-y divide-line rounded-xl border border-line sm:flex-row sm:divide-x sm:divide-y-0">
        <div className="relative flex flex-1 items-center">
          <Field label="From">
            <AirportSelect value={origin} onChange={setOrigin} exclude={destination} />
          </Field>
          <button
            type="button"
            onClick={swap}
            aria-label="Swap origin and destination"
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 rounded-full border border-line bg-bg p-1.5 text-ink-muted transition hover:text-ink sm:block"
          >
            <SwapIcon />
          </button>
        </div>
        <Field label="To">
          <AirportSelect value={destination} onChange={setDestination} exclude={origin} />
        </Field>
        <Field label="Depart">
          <input
            type="date"
            required
            min={today}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full bg-transparent text-sm text-ink outline-none"
          />
        </Field>
        {tripType === "return" && (
          <Field label="Return">
            <input
              type="date"
              required
              min={departureDate}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </Field>
        )}
        <button
          type="submit"
          disabled={isSearching}
          className="flex items-center justify-center bg-accent px-8 py-4 text-sm font-medium text-accent-ink transition hover:brightness-110 disabled:opacity-60 sm:rounded-r-xl"
        >
          {isSearching ? "Searching…" : "Search"}
        </button>
      </div>

      {formError && <p className="mt-3 text-sm text-red-700">{formError}</p>}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex-1 px-4 py-3">
      <span className="block text-xs text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

function AirportSelect({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-sm text-ink outline-none"
    >
      {AIRPORTS.filter((a) => a.iata !== exclude || a.iata === value).map((a) => (
        <option key={a.iata} value={a.iata}>
          {a.city} ({a.iata})
        </option>
      ))}
    </select>
  );
}

function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 16V4M7 4L3 8M7 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
