"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { FiltersPanel } from "@/components/FiltersPanel";
import { FlightResults, type SearchStatus } from "@/components/FlightResults";
import { LoadingWordmark } from "@/components/LoadingWordmark";
import { AnimatedWordmark } from "@/components/AnimatedWordmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { FlightOffer, FlightSearchFilters, FlightSearchRequest, FlightSortKey } from "@/types/flight";

const SEARCH_TIMEOUT_MS = 15_000;

export default function Home() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [baseOffers, setBaseOffers] = useState<FlightOffer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<FlightSortKey>("airline");
  const [filters, setFilters] = useState<FlightSearchFilters>({});
  const [lastRequest, setLastRequest] = useState<FlightSearchRequest | null>(null);

  async function runSearch(
    request: FlightSearchRequest,
    sort: FlightSortKey,
    activeFilters: FlightSearchFilters,
    isNewSearch: boolean,
  ) {
    setStatus("loading");
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, sortBy: sort, sortDirection: "asc", filters: activeFilters }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (res.status === 200 && Array.isArray(data.offers)) {
        setOffers(data.offers);
        if (isNewSearch) setBaseOffers(data.offers);
        setStatus(data.offers.length === 0 ? "empty" : "success");
        return;
      }

      setErrorMessage(data.error ?? "We couldn't complete that search.");
      setStatus("error");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setErrorMessage("That's taking longer than expected. Please try again.");
      } else {
        setErrorMessage("We couldn't reach the search service. Check your connection and try again.");
      }
      setStatus("error");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function handleSearch(request: FlightSearchRequest) {
    setLastRequest(request);
    setFilters({});
    runSearch(request, sortBy, {}, true);
  }

  function handleSortChange(sort: FlightSortKey) {
    setSortBy(sort);
    if (lastRequest) runSearch(lastRequest, sort, filters, false);
  }

  function handleFiltersApply(newFilters: FlightSearchFilters) {
    setFilters(newFilters);
    if (lastRequest) runSearch(lastRequest, sortBy, newFilters, false);
  }

  return (
    <>
      <ThemeToggle />
      {status === "loading" && <LoadingWordmark />}

      <Link
        href="/v2"
        className="block bg-[#1747e0] px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-[#1239b8]"
      >
        <span className="mr-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#1747e0]">NEW</span>
        Try the redesigned Skyfare V2 →
      </Link>

      <div className="border-b border-line px-4 py-2 text-center text-xs text-ink-muted">
        Demonstration data — every result here is for testing, not a live or bookable flight.
      </div>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:py-24">
        <p className="text-center text-sm">
          <AnimatedWordmark variant="header" />
        </p>
        <h1 className="mt-3 text-center text-3xl text-ink sm:text-4xl">
          Compare flights across Nigeria
        </h1>

        <div className="mt-10">
          <SearchForm onSearch={handleSearch} isSearching={status === "loading"} />
        </div>

        {status === "success" && (
          <FiltersPanel baseOffers={baseOffers} filters={filters} onApply={handleFiltersApply} />
        )}

        <FlightResults
          status={status}
          offers={offers}
          errorMessage={errorMessage}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />
      </main>
    </>
  );
}
