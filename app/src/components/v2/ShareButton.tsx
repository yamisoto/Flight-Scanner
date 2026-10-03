"use client";

import { useEffect, useState } from "react";
import { findAirport } from "@/lib/data/airports";
import { formatShortDate } from "@/lib/v2/format";
import { searchToQuery } from "@/lib/v2/searchUrl";
import type { FlightSearchRequest } from "@/types/flight";

/** Shares a link that reopens this search: the native share sheet on phones (WhatsApp etc.), copy-to-clipboard elsewhere. */
export function ShareButton({ request }: { request: FlightSearchRequest }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function share() {
    const url = `${window.location.origin}/?${searchToQuery(request)}`;
    const title = `Flights ${findAirport(request.origin)?.city ?? request.origin} to ${findAirport(request.destination)?.city ?? request.destination}, ${formatShortDate(request.departureDate)}`;
    // Only phones get the share sheet; on desktop it's an awkward extra step versus a copied link.
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, text: `${title} on Skyfare`, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return; // user closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-primary hover:underline"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
        <path d="m16 6-4-4-4 4" />
        <path d="M12 2v13" />
      </svg>
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
