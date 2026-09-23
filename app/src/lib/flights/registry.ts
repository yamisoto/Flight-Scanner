import type { FlightProvider } from "@/lib/flights/provider";
import { MockFlightProvider } from "@/lib/flights/providers/mockProvider";

/**
 * Single point of control for which provider is active. Phase 1A only
 * ever resolves to MockFlightProvider — this function is the seam
 * where WakanowProvider / TravelstartProvider / an airline adapter
 * gets wired in later, controlled by FLIGHT_PROVIDER env var. Nothing
 * else in the app should construct a provider directly.
 */
export function getActiveProvider(): FlightProvider {
  const providerName = process.env.FLIGHT_PROVIDER ?? "mock";

  switch (providerName) {
    case "mock":
      return new MockFlightProvider();
    default:
      throw new Error(
        `Unknown FLIGHT_PROVIDER "${providerName}". Only "mock" is implemented in Phase 1A. ` +
          `See docs/FLIGHT_PROVIDER_INTERFACE.md before adding a new provider.`,
      );
  }
}
