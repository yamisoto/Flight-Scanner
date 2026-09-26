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
  const [lastRequest, setLastRequest] = useState<FlightSearchRequest | null>(null);

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
      <div className="border-b border-line px-4 py-2 text-center text-xs text-ink-muted">
        Demonstration data — every result here is for testing, not a live or bookable flight.
      </div>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:py-24">
        <p className="text-center text-sm text-ink-muted">Skyfare</p>
        <h1 className="mt-3 text-center text-3xl text-ink sm:text-4xl">
          Compare flights across Nigeria
        </h1>

        <div className="mt-10">
          <SearchForm onSearch={handleSearch} isSearching={status === "loading"} />
        </div>

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
