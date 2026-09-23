import type { FlightOffer, FlightSearchRequest, ProviderHealth } from "@/types/flight";

/**
 * The contract every flight data source implements — mock, and
 * eventually Wakanow / Travelstart / direct-airline adapters.
 *
 * Nothing outside a provider adapter's own file should know or care
 * which concrete provider is running. The search engine only ever
 * talks to this interface.
 */
export interface FlightProvider {
  /** Machine-readable provider name, e.g. "mock". Never used for display without a lookup. */
  readonly name: string;

  /** Human-readable name for display/logging, e.g. "Mock Flight Provider (dev/test data)". */
  readonly displayName: string;

  /**
   * Search for flight offers matching the given request.
   * Must throw a ProviderError (see src/types/flight.ts) on failure —
   * never let a provider-specific error shape escape this boundary.
   */
  searchFlights(request: FlightSearchRequest): Promise<FlightOffer[]>;

  /**
   * Fetch full details for a single previously-returned offer, by id.
   * Returns null if the offer id is unknown to this provider or has expired.
   */
  getFlightDetails(offerId: string): Promise<FlightOffer | null>;

  /**
   * Lightweight check that the provider is currently reachable/functional.
   * Used for monitoring and for the search engine to fail fast with a
   * clear PROVIDER_UNAVAILABLE error rather than a slow timeout.
   */
  healthCheck(): Promise<ProviderHealth>;
}
