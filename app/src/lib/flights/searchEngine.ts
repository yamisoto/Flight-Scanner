import type { FlightProvider } from "@/lib/flights/provider";
import {
  ProviderError,
  type FlightOffer,
  type FlightSearchFilters,
  type FlightSearchOptions,
  type FlightSearchRequest,
} from "@/types/flight";

/**
 * The provider-independent search engine. This is the one place that
 * orchestrates a search across a provider and applies sorting/filtering —
 * it must never contain logic specific to any named provider (mock,
 * Wakanow, Travelstart, or an airline). If a rule only applies to one
 * provider, it belongs inside that provider's adapter, not here.
 */
export class FlightSearchEngine {
  constructor(private readonly provider: FlightProvider) {}

  async search(request: FlightSearchRequest, options: FlightSearchOptions = {}): Promise<FlightOffer[]> {
    let offers: FlightOffer[];

    try {
      offers = await this.provider.searchFlights(request);
    } catch (err) {
      if (err instanceof ProviderError) {
        throw err;
      }
      // Never let a raw, provider-shaped error escape this boundary.
      throw new ProviderError(
        "UNKNOWN_ERROR",
        this.provider.name,
        err instanceof Error ? err.message : "Unknown provider failure",
      );
    }

    if (offers.length === 0) {
      throw new ProviderError("NO_RESULTS", this.provider.name, "No flights found for this search.");
    }

    let results = offers;

    if (options.filters) {
      results = applyFilters(results, options.filters);
    }

    if (options.sortBy) {
      results = sortOffers(results, options.sortBy, options.sortDirection ?? "asc");
    }

    return results;
  }
}

export function applyFilters(offers: FlightOffer[], filters: FlightSearchFilters): FlightOffer[] {
  return offers.filter((offer) => {
    if (filters.airlineCodes && filters.airlineCodes.length > 0) {
      const offerAirlines = offer.slices.flatMap((s) => s.segments.map((seg) => seg.airlineCode));
      if (!offerAirlines.some((code) => filters.airlineCodes!.includes(code))) {
        return false;
      }
    }

    if (filters.maxStops !== undefined) {
      const maxStopsInOffer = Math.max(...offer.slices.map((s) => s.stops));
      if (maxStopsInOffer > filters.maxStops) return false;
    }

    if (filters.minPriceNGN !== undefined && offer.price.amount < filters.minPriceNGN) return false;
    if (filters.maxPriceNGN !== undefined && offer.price.amount > filters.maxPriceNGN) return false;

    if (filters.departureTimeOfDay && filters.departureTimeOfDay.length > 0) {
      const firstDeparture = new Date(offer.slices[0].segments[0].departureAt);
      const hour = firstDeparture.getUTCHours();
      const band = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
      if (!filters.departureTimeOfDay.includes(band)) return false;
    }

    return true;
  });
}

export function sortOffers(
  offers: FlightOffer[],
  sortBy: NonNullable<FlightSearchOptions["sortBy"]>,
  direction: NonNullable<FlightSearchOptions["sortDirection"]>,
): FlightOffer[] {
  const sorted = [...offers].sort((a, b) => {
    let diff = 0;
    if (sortBy === "price") {
      diff = a.price.amount - b.price.amount;
    } else if (sortBy === "duration") {
      const totalA = a.slices.reduce((sum, s) => sum + s.durationMinutes, 0);
      const totalB = b.slices.reduce((sum, s) => sum + s.durationMinutes, 0);
      diff = totalA - totalB;
    } else if (sortBy === "departure_time") {
      const timeA = new Date(a.slices[0].segments[0].departureAt).getTime();
      const timeB = new Date(b.slices[0].segments[0].departureAt).getTime();
      diff = timeA - timeB;
    }
    return direction === "asc" ? diff : -diff;
  });
  return sorted;
}
