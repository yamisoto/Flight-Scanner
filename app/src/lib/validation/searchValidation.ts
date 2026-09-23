import { isKnownAirport } from "@/lib/data/airports";
import type { FlightSearchRequest } from "@/types/flight";

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PASSENGERS = 9;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime());
}

function isPastDate(value: string): boolean {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const d = new Date(value + "T00:00:00Z");
  return d.getTime() < today.getTime();
}

/**
 * Validates a raw, untrusted search request (e.g. straight from an API
 * request body). Returns every issue found rather than failing fast on
 * the first one, so the caller can report all problems at once.
 */
export function validateSearchRequest(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (typeof input !== "object" || input === null) {
    return { valid: false, issues: [{ field: "root", message: "Request body must be an object." }] };
  }

  const req = input as Partial<FlightSearchRequest>;

  if (!req.origin || typeof req.origin !== "string") {
    issues.push({ field: "origin", message: "Origin airport is required." });
  } else if (!isKnownAirport(req.origin)) {
    issues.push({ field: "origin", message: `Unknown origin airport code: ${req.origin}` });
  }

  if (!req.destination || typeof req.destination !== "string") {
    issues.push({ field: "destination", message: "Destination airport is required." });
  } else if (!isKnownAirport(req.destination)) {
    issues.push({ field: "destination", message: `Unknown destination airport code: ${req.destination}` });
  }

  if (
    req.origin &&
    req.destination &&
    typeof req.origin === "string" &&
    typeof req.destination === "string" &&
    req.origin.toUpperCase() === req.destination.toUpperCase()
  ) {
    issues.push({ field: "destination", message: "Origin and destination must be different airports." });
  }

  if (!req.departureDate || typeof req.departureDate !== "string") {
    issues.push({ field: "departureDate", message: "Departure date is required." });
  } else if (!isValidIsoDate(req.departureDate)) {
    issues.push({ field: "departureDate", message: "Departure date must be a valid YYYY-MM-DD date." });
  } else if (isPastDate(req.departureDate)) {
    issues.push({ field: "departureDate", message: "Departure date cannot be in the past." });
  }

  if (!req.tripType || (req.tripType !== "one_way" && req.tripType !== "return")) {
    issues.push({ field: "tripType", message: "tripType must be 'one_way' or 'return'." });
  }

  if (req.tripType === "return") {
    if (!req.returnDate || typeof req.returnDate !== "string") {
      issues.push({ field: "returnDate", message: "Return date is required for a return trip." });
    } else if (!isValidIsoDate(req.returnDate)) {
      issues.push({ field: "returnDate", message: "Return date must be a valid YYYY-MM-DD date." });
    } else if (
      req.departureDate &&
      isValidIsoDate(req.departureDate) &&
      req.returnDate < req.departureDate
    ) {
      issues.push({ field: "returnDate", message: "Return date cannot be before the departure date." });
    }
  }

  if (!req.passengers || typeof req.passengers !== "object") {
    issues.push({ field: "passengers", message: "Passenger counts are required." });
  } else {
    const { adults, children, infants } = req.passengers;
    if (typeof adults !== "number" || adults < 1) {
      issues.push({ field: "passengers.adults", message: "At least one adult passenger is required." });
    }
    if (children !== undefined && (typeof children !== "number" || children < 0)) {
      issues.push({ field: "passengers.children", message: "Children count must be zero or a positive number." });
    }
    if (infants !== undefined && (typeof infants !== "number" || infants < 0)) {
      issues.push({ field: "passengers.infants", message: "Infants count must be zero or a positive number." });
    }
    const total = (adults || 0) + (children || 0) + (infants || 0);
    if (total > MAX_PASSENGERS) {
      issues.push({ field: "passengers", message: `Total passengers cannot exceed ${MAX_PASSENGERS}.` });
    }
  }

  const validCabinClasses = ["economy", "premium_economy", "business", "first"];
  if (!req.cabinClass || !validCabinClasses.includes(req.cabinClass)) {
    issues.push({ field: "cabinClass", message: `cabinClass must be one of: ${validCabinClasses.join(", ")}.` });
  }

  return { valid: issues.length === 0, issues };
}
