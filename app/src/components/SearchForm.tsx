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
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-line bg-surface p-5 shadow-[0_1px_0_var(--line)] sm:p-6"
    >
      <div className="mb-5 flex gap-2">
        {(["one_way", "return"] as TripType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTripType(type)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tripType === type
                ? "bg-ink text-white"
                : "border border-line text-ink-muted hover:border-line-strong"
            }`}
          >
            {type === "one_way" ? "One way" : "Return"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From">
          <AirportSelect value={origin} onChange={setOrigin} />
        </Field>
        <Field label="To">
          <AirportSelect value={destination} onChange={setDestination} />
        </Field>

        <Field label="Depart">
          <input
            type="date"
            required
            min={today}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>

        {tripType === "return" ? (
          <Field label="Return">
            <input
              type="date"
              required
              min={departureDate}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </Field>
        ) : (
          <Field label="Passengers">
            <PassengerSelect value={adults} onChange={setAdults} />
          </Field>
        )}

        {tripType === "return" && (
          <Field label="Passengers">
            <PassengerSelect value={adults} onChange={setAdults} />
          </Field>
        )}

        <Field label="Cabin">
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value as CabinClass)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium Economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </Field>
      </div>

      {formError && <p className="mt-4 text-sm text-red-700">{formError}</p>}

      <button
        type="submit"
        disabled={isSearching}
        className="mt-6 w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-ink transition hover:brightness-95 disabled:opacity-60 sm:w-auto"
      >
        {isSearching ? "Searching…" : "Search flights"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

function AirportSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
    >
      {AIRPORTS.map((a) => (
        <option key={a.iata} value={a.iata}>
          {a.city} ({a.iata})
        </option>
      ))}
    </select>
  );
}

function PassengerSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
    >
      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>
          {n} adult{n > 1 ? "s" : ""}
        </option>
      ))}
    </select>
  );
}
