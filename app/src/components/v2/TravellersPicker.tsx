"use client";

import { useEffect, useRef, useState } from "react";
import { cabinLabel } from "@/lib/v2/format";
import type { CabinClass } from "@/types/flight";

interface TravellersPickerProps {
  adults: number;
  cabinClass: CabinClass;
  onChange: (next: { adults: number; cabinClass: CabinClass }) => void;
}

const CABINS: CabinClass[] = ["economy", "premium_economy", "business", "first"];
const MAX_ADULTS = 9;

export function TravellersPicker({ adults, cabinClass, onChange }: TravellersPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-full text-left"
      >
        <span className="block px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-ink-muted">Travellers</span>
        <span className="block truncate px-4 pb-3 pt-0.5 text-[15px] font-medium text-ink">
          {adults} adult{adults > 1 ? "s" : ""}, {cabinLabel(cabinClass)}
        </span>
      </button>

      {open && (
        <div role="dialog" aria-label="Travellers and cabin" className="v2-card absolute right-0 top-full z-30 mt-2 w-72 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Adults</p>
              <p className="text-xs text-ink-muted">12+ years</p>
            </div>
            <div className="flex items-center gap-3">
              <Stepper label="Remove adult" disabled={adults <= 1} onClick={() => onChange({ adults: adults - 1, cabinClass })}>
                −
              </Stepper>
              <span className="v2-num w-4 text-center text-sm font-semibold text-ink" aria-live="polite">
                {adults}
              </span>
              <Stepper label="Add adult" disabled={adults >= MAX_ADULTS} onClick={() => onChange({ adults: adults + 1, cabinClass })}>
                +
              </Stepper>
            </div>
          </div>

          <p className="mt-5 text-sm font-medium text-ink">Cabin</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CABINS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ adults, cabinClass: c })}
                aria-pressed={c === cabinClass}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                  c === cabinClass ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {cabinLabel(c)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-ink hover:bg-primary-hover"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function Stepper({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full border border-line-strong text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}
