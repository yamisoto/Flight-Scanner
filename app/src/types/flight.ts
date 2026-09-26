/**
 * Shared domain types for the flight comparison platform.
 *
 * These types are provider-agnostic. Nothing in this file should ever
 * reference Wakanow, Travelstart, a specific airline, or any other
 * external system by name. Provider adapters translate their own
 * response shapes into these types — these types never bend to fit
 * a provider's shape.
 */

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export type TripType = "one_way" | "return";

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

/**
 * The request the frontend sends to the search API, and that the
 * search API passes (after validation) down to the search engine.
 */
export interface FlightSearchRequest {
  origin: string; // IATA code, e.g. "LOS"
  destination: string; // IATA code, e.g. "ABV"
  departureDate: string; // ISO date, YYYY-MM-DD
  returnDate?: string; // ISO date, YYYY-MM-DD — required if tripType is "return"
  tripType: TripType;
  passengers: PassengerCounts;
  cabinClass: CabinClass;
}

export interface BaggageAllowance {
  cabinBagsIncluded: number;
  checkedBagsIncluded: number;
  checkedBagWeightKg?: number;
  notes?: string;
}

export interface FareConditions {
  refundable: boolean;
  changeable: boolean;
  changeFeeNGN?: number;
  notes?: string;
}

export interface Money {
  amount: number;
  currency: "NGN";
}

/**
 * One flight segment (a single takeoff-to-landing leg). A slice
 * (see FlightSlice) is made up of one or more segments — more than
 * one segment means a stop/connection.
 */
export interface FlightSegment {
  airlineCode: string; // IATA airline code, e.g. "P4"
  airlineName: string;
  flightNumber: string; // e.g. "P47201"
  origin: string; // IATA airport code
  destination: string; // IATA airport code
  departureAt: string; // ISO datetime
  arrivalAt: string; // ISO datetime
  durationMinutes: number;
}

/**
 * One direction of travel (outbound, or return). A one-way search
 * produces offers with a single slice; a return search produces
 * offers with two.
 */
export interface FlightSlice {
  segments: FlightSegment[];
  stops: number; // segments.length - 1
  durationMinutes: number; // total slice duration including any ground time
}

/**
 * The normalised internal representation of a bookable flight
 * option. Every provider adapter must return offers in this shape —
 * this is the contract the search engine and frontend are built
 * against, and it must never leak provider-specific fields.
 */
export interface FlightOffer {
  id: string;
  provider: string; // e.g. "mock" — never assume which providers exist
  slices: FlightSlice[]; // 1 slice for one-way, 2 for return
  cabinClass: CabinClass;
  price: Money;
  baggage?: BaggageAllowance;
  fareConditions?: FareConditions;
  bookingUrl?: string; // deep-link to the provider/airline for checkout
  offerExpiresAt?: string; // ISO datetime — offers are time-limited industry-wide
}

export type FlightSortKey = "airline" | "price" | "duration" | "departure_time";
export type SortDirection = "asc" | "desc";

export interface FlightSearchFilters {
  airlineCodes?: string[];
  maxStops?: number;
  minPriceNGN?: number;
  maxPriceNGN?: number;
  departureTimeOfDay?: Array<"morning" | "afternoon" | "evening" | "night">;
}

export interface FlightSearchOptions {
  sortBy?: FlightSortKey;
  sortDirection?: SortDirection;
  filters?: FlightSearchFilters;
}

/**
 * Typed provider failure reasons, so the search engine (and
 * eventually the UI) can react appropriately instead of treating
 * every failure as "no flights found."
 */
export type ProviderErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "RATE_LIMITED"
  | "INVALID_REQUEST"
  | "NO_RESULTS"
  | "UNKNOWN_ERROR";

export class ProviderError extends Error {
  code: ProviderErrorCode;
  provider: string;

  constructor(code: ProviderErrorCode, provider: string, message: string) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.provider = provider;
  }
}

export interface ProviderHealth {
  provider: string;
  healthy: boolean;
  checkedAt: string;
  message?: string;
}
