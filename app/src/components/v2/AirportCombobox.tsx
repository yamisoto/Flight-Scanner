"use client";

import { useId, useRef, useState } from "react";
import { AIRPORTS, type Airport } from "@/lib/data/airports";

interface AirportComboboxProps {
  label: string;
  value: string; // IATA
  onChange: (iata: string) => void;
  exclude?: string;
  /** Extra left padding on desktop, to clear the swap button that sits on the field boundary. */
  inset?: boolean;
}

// Words in almost every airport name; matching on them would return the whole list.
const GENERIC_WORDS = new Set(["airport", "international", "cargo"]);

/** 0 = best match, higher = weaker, null = no match. Matches word prefixes, not arbitrary substrings. */
export function matchRank(a: Airport, q: string): number | null {
  const query = q.trim().toLowerCase();
  if (!query) return 0;
  if (a.iata.toLowerCase() === query) return 0;
  if (a.city.toLowerCase().startsWith(query)) return 1;
  if (a.iata.toLowerCase().startsWith(query)) return 2;
  const words = `${a.city} ${a.name} ${a.state}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !GENERIC_WORDS.has(w));
  return words.some((w) => w.startsWith(query)) ? 3 : null;
}

export function searchAirports(query: string, exclude?: string): Airport[] {
  return AIRPORTS.filter((a) => a.iata !== exclude)
    .map((a) => ({ a, rank: matchRank(a, query) }))
    .filter((x): x is { a: Airport; rank: number } => x.rank !== null)
    .sort((x, y) => x.rank - y.rank)
    .map((x) => x.a);
}

/** Type-to-search airport picker (city, airport name or IATA code), keyboard accessible. */
export function AirportCombobox({ label, value, onChange, exclude, inset = false }: AirportComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = AIRPORTS.find((a) => a.iata === value);
  const options = searchAirports(query, exclude);

  function choose(a: Airport) {
    onChange(a.iata);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (options[active]) choose(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className={`block px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-ink-muted ${inset ? "lg:pl-8" : ""}`}>
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${listId}-${options[active].iata}` : undefined}
        autoComplete="off"
        value={open ? query : selected ? `${selected.city} (${selected.iata})` : ""}
        placeholder={selected ? `${selected.city} (${selected.iata})` : "City or airport"}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={`w-full truncate bg-transparent px-4 pb-3 ${inset ? "lg:pl-8" : ""} pt-0.5 text-[15px] font-medium text-ink outline-none placeholder:text-ink-muted`}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="v2-card absolute left-0 top-full z-30 mt-2 max-h-72 w-full min-w-[280px] overflow-y-auto p-1.5"
        >
          {options.length === 0 && <li className="px-3 py-2.5 text-sm text-ink-muted">No Nigerian airport matches “{query}”</li>}
          {options.map((a, i) => (
            <li
              key={a.iata}
              id={`${listId}-${a.iata}`}
              role="option"
              aria-selected={a.iata === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(a)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${
                i === active ? "bg-surface-2" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{a.city}</span>
                <span className="block truncate text-xs text-ink-muted">{a.name}</span>
              </span>
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-semibold text-ink-muted">{a.iata}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
