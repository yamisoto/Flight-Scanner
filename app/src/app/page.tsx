"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { FlightResults, type SearchStatus } from "@/components/FlightResults";
import type { FlightOffer, FlightSearchRequest, FlightSortKey } from "@/types/flight";

export default function Home() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<FlightSortKey>("price");

  async function runSearch(request: FlightSearchRequest, sort: FlightSortKey = sortBy) {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, sortBy: sort, sortDirection: "asc" }),
      });

      const data = await res.json();

      if (res.status === 200 && Array.isArray(data.offers)) {
        if (data.offers.length === 0) {
          setStatus("empty");
          setOffers([]);
        } else {
          setOffers(data.offers);
          setStatus("success");
        }
        return;
      }

      setErrorMessage(data.error ?? "We couldn't complete that search.");
      setStatus("error");
    } catch {
      setErrorMessage("We couldn't reach the search service. Check your connection and try again.");
      setStatus("error");
    }
  }

  const [lastRequest, setLastRequest] = useState<FlightSearchRequest | null>(null);

  function handleSearch(request: FlightSearchRequest) {
    setLastRequest(request);
    runSearch(request, sortBy);
  }

  function handleSortChange(sort: FlightSortKey) {
    setSortBy(sort);
    if (lastRequest) runSearch(lastRequest, sort);
  }

  return (
    <>
      <div className="w-full border-b border-line-strong bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
        Demonstration environment — every result on this page is test data, not a live or bookable flight.
      </div>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-16">
      <header className="mb-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Skyfare NG · Domestic flights</p>
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          Compare Nigerian domestic flights in one search
        </h1>
        <p className="mt-2 text-ink-muted">
          Search once, see every option side by side, and go straight to booking with the provider you pick.
        </p>
      </header>

      <SearchForm onSearch={handleSearch} isSearching={status === "loading"} />

      <FlightResults
        status={status}
        offers={offers}
        errorMessage={errorMessage}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />

      <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-muted">
        Running on mock/test data during development — see the project README for status.
      </footer>
      </main>
    </>
  );
}
