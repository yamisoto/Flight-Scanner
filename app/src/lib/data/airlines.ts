/**
 * Nigerian domestic airline reference data.
 *
 * `operationalStatus` reflects the most recent evidence found during
 * research for this project (see docs/PHASE_0_5_VALIDATION.md), not
 * a live feed — Nigerian domestic carriers have a documented history
 * of grounding/relaunching, so this needs periodic re-verification,
 * not a one-time entry.
 *
 * `providerAvailability` records which data providers (if any) are
 * confirmed to carry this airline's inventory. An empty array means
 * "no third-party access confirmed" — not "unavailable everywhere."
 */

export type OperationalStatus = "operating" | "grounded" | "unknown";

export interface Airline {
  name: string;
  iata: string | null;
  icao: string | null;
  operationalStatus: OperationalStatus;
  verified: boolean;
  providerAvailability: string[]; // e.g. ["wakanow"] once confirmed — currently none
  notes?: string;
}

export const AIRLINES: Airline[] = [
  {
    name: "Air Peace",
    iata: "P4",
    icao: "APK",
    operationalStatus: "operating",
    verified: true,
    providerAvailability: [],
    notes: "Largest Nigerian domestic carrier by passenger traffic (NCAA 2024 data). Runs own booking engine (Hitit Crane PSS), not a global NDC platform.",
  },
  {
    name: "Arik Air",
    iata: "W3",
    icao: "ARA",
    operationalStatus: "operating",
    verified: true,
    providerAvailability: [],
    notes: "Documented grounding/debt disputes as recently as 2024 — treat as lower launch-time reliability.",
  },
  {
    name: "Ibom Air",
    iata: "QI",
    icao: "IAN",
    operationalStatus: "operating",
    verified: true,
    providerAvailability: [],
  },
  {
    name: "Dana Air",
    iata: null,
    icao: "DAV",
    operationalStatus: "operating",
    verified: false,
    providerAvailability: [],
    notes: "IATA code not confirmed from a primary source during this build — left null rather than guessed.",
  },
  {
    name: "Green Africa Airways",
    iata: "Q9",
    icao: "GWG",
    operationalStatus: "operating",
    verified: true,
    providerAvailability: [],
  },
  {
    name: "Overland Airways",
    iata: "OF",
    icao: "OLA",
    operationalStatus: "operating",
    verified: true,
    providerAvailability: [],
  },
  {
    name: "ValueJet",
    iata: "VK",
    icao: "FVJ",
    operationalStatus: "operating",
    verified: true,
    providerAvailability: ["wakanow"],
    notes: "Confirmed live distribution partnership with Wakanow (2023) — inventory exists digitally, but a comparison-platform access path is unconfirmed. See docs/PHASE_0_5_VALIDATION.md.",
  },
  {
    name: "United Nigeria Airlines",
    iata: "U5",
    icao: "UNA",
    operationalStatus: "operating",
    verified: true,
    providerAvailability: ["wakanow"],
    notes: "Confirmed live distribution partnership with Wakanow — same caveat as ValueJet.",
  },
  {
    name: "NG Eagle",
    iata: null,
    icao: null,
    operationalStatus: "operating",
    verified: false,
    providerAvailability: ["wakanow"],
    notes: "IATA/ICAO codes not found from a primary source. Confirmed live Wakanow integration (July 2026).",
  },
  {
    name: "Aero Contractors",
    iata: "N2",
    icao: "NIG",
    operationalStatus: "operating",
    verified: true,
    providerAvailability: [],
    notes: "History of fleet reduction and multi-month suspensions over several years — treat as lower launch-time reliability.",
  },
  {
    name: "Max Air",
    iata: "VM",
    icao: "NGL",
    operationalStatus: "grounded",
    verified: true,
    providerAvailability: [],
    notes: "Listed as grounded in most recently checked source. Not currently a viable data source.",
  },
];

export function findAirlineByIata(iata: string): Airline | undefined {
  return AIRLINES.find((a) => a.iata === iata.toUpperCase());
}

export function operatingAirlines(): Airline[] {
  return AIRLINES.filter((a) => a.operationalStatus === "operating");
}
