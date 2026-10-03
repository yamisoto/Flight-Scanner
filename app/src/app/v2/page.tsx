"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DateStrip } from "@/components/v2/DateStrip";
import { Header } from "@/components/v2/Header";
import { PopularRoutes, ValueProps } from "@/components/v2/LandingSections";
import { ResultsView, type V2Status } from "@/components/v2/ResultsView";
import { SearchPanel } from "@/components/v2/SearchPanel";
import { ShareButton } from "@/components/v2/ShareButton";
import { findAirport } from "@/lib/data/airports";
import { cabinLabel, formatShortDate } from "@/lib/v2/format";
import { shiftDate } from "@/lib/flights/priceCalendar";
import { scoreOffers } from "@/lib/v2/scoring";
import { queryToSearch, searchToQuery } from "@/lib/v2/searchUrl";
import type { FlightOffer, FlightSearchRequest, ScheduleCoverage } from "@/types/flight";

const SEARCH_TIMEOUT_MS = 15_000;

function inDays(days: number) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function SkyfareV2() {
  const [status, setStatus] = useState<V2Status | "idle">("idle");
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [schedule, setSchedule] = useState<ScheduleCoverage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<FlightSearchRequest | null>(null);
  const [panelKey, setPanelKey] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const scored = useMemo(() => scoreOffers(offers), [offers]);

  async function search(req: FlightSearchRequest) {
    setRequest(req);
    setStatus("loading");
    setError(null);
    setSchedule(null);
    // Keep the address bar shareable: /v2?from=LOS&to=ABV&depart=...
    window.history.replaceState(null, "", `/v2?${searchToQuery(req)}`);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
    try {
      // Sorting, filtering and scoring happen client-side in V2 so tab switches are instant.
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.offers)) {
        setOffers(data.offers);
        setSchedule(data.schedule ?? null);
        setStatus(data.offers.length ? "success" : "empty");
      } else {
        setError(data.error ?? "We couldn't complete that search.");
        setStatus("error");
      }
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? "That took longer than expected."
          : "We couldn't reach the search service. Check your connection.",
      );
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  }

  /** Search and remount the panel so it shows the new route and dates. */
  function openSearch(req: FlightSearchRequest) {
    setPanelKey((k) => k + 1);
    search(req);
  }

  // Open a shared link (/v2?from=LOS&to=ABV&depart=...) straight into its results.
  // Read once on mount; an invalid or expired link just shows the empty form.
  const loadedFromUrl = useRef(false);
  useEffect(() => {
    if (loadedFromUrl.current) return;
    loadedFromUrl.current = true;
    const req = queryToSearch(new URLSearchParams(window.location.search), inDays(0));
    // Syncing from an external source (the URL) once on mount; the server can't see it, so this can't be initial state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (req) openSearch(req);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  function searchDate(date: string) {
    if (!request) return;
    const shift = Math.round((Date.parse(date) - Date.parse(request.departureDate)) / 86_400_000);
    openSearch({ ...request, departureDate: date, returnDate: request.returnDate ? shiftDate(request.returnDate, shift) : undefined });
  }

  function quickSearch(origin: string, destination: string) {
    const req: FlightSearchRequest = {
      origin,
      destination,
      tripType: "one_way",
      departureDate: inDays(7),
      passengers: { adults: 1, children: 0, infants: 0 },
      cabinClass: "economy",
    };
    setPanelKey((k) => k + 1); // remount the panel so it shows the chosen route
    search(req);
  }

  const hasSearched = status !== "idle";

  return (
    <>
      <div className="v2-hero">
        <Header />
        <div
          className={`mx-auto flex w-full max-w-6xl flex-col items-center px-4 transition-all sm:px-6 ${
            hasSearched ? "pb-8 pt-4" : "pb-20 pt-14 sm:pb-28 sm:pt-24"
          }`}
        >
          {!hasSearched && (
            <div className="mb-10 text-center">
              <h1 className="v2-wordmark text-5xl font-semibold tracking-tight sm:text-7xl">Skyfare</h1>
              <p className="mx-auto mt-4 max-w-md text-base text-hero-muted sm:text-lg">
                Every flight across Nigeria. Compared on price, time and how often it actually leaves on time.
              </p>
            </div>
          )}
          <div className="w-full">
            <SearchPanel key={panelKey} initial={request} isSearching={status === "loading"} onSearch={search} />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div ref={resultsRef} className="scroll-mt-4" />
        {hasSearched && request ? (
          <>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                {findAirport(request.origin)?.city} → {findAirport(request.destination)?.city}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <p className="text-sm text-ink-muted">
                  {formatShortDate(request.departureDate)}
                  {request.returnDate ? ` – ${formatShortDate(request.returnDate)}` : ", one way"} · {request.passengers.adults} adult
                  {request.passengers.adults > 1 ? "s" : ""} · {cabinLabel(request.cabinClass)}
                </p>
                <ShareButton request={request} />
              </div>
            </div>
            <DateStrip request={request} onPick={searchDate} />
            <ResultsView status={status as V2Status} scored={scored} errorMessage={error} onRetry={() => search(request)} schedule={schedule} />
          </>
        ) : (
          <div className="space-y-12">
            <ValueProps />
            <PopularRoutes onPick={quickSearch} />
          </div>
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© Skyfare. Demonstration data only: no live fares or bookings yet.</p>
          <p>
            Nigeria domestic · Africa coming soon
            <Link href="/" className="font-medium text-primary hover:underline sm:hidden">
              {" "}· View V1
            </Link>
          </p>
        </div>
      </footer>

      <Link
        href="/"
        className="fixed bottom-4 right-4 z-40 hidden items-center sm:flex gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-medium text-ink shadow-lg transition hover:border-primary"
      >
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-ink">V2</span>
        Compare with V1
      </Link>
    </>
  );
}
