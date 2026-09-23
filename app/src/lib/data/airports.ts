/**
 * Nigerian commercial airport reference data.
 *
 * `verified` means the IATA code was confirmed against a public source
 * during this build (see docs/DATABASE.md for sourcing notes). Where
 * verified is false, the code should be double-checked before this
 * dataset is relied on for anything user-facing beyond the mock
 * provider's dev/test data.
 *
 * No airport or code in this file was invented — anything not
 * confidently sourced was left out rather than guessed.
 */

export interface Airport {
  iata: string;
  icao: string | null;
  name: string;
  city: string;
  state: string;
  verified: boolean;
}

export const AIRPORTS: Airport[] = [
  { iata: "LOS", icao: "DNMM", name: "Murtala Muhammed International Airport", city: "Lagos", state: "Lagos", verified: true },
  { iata: "ABV", icao: "DNAA", name: "Nnamdi Azikiwe International Airport", city: "Abuja", state: "FCT", verified: true },
  { iata: "PHC", icao: "DNPO", name: "Port Harcourt International Airport", city: "Port Harcourt", state: "Rivers", verified: true },
  { iata: "KAN", icao: "DNKN", name: "Mallam Aminu Kano International Airport", city: "Kano", state: "Kano", verified: true },
  { iata: "ENU", icao: "DNEN", name: "Akanu Ibiam International Airport", city: "Enugu", state: "Enugu", verified: true },
  { iata: "QOW", icao: "DNIM", name: "Sam Mbakwe International Cargo Airport", city: "Owerri", state: "Imo", verified: true },
  { iata: "BNI", icao: "DNBE", name: "Benin Airport", city: "Benin City", state: "Edo", verified: true },
  { iata: "ILR", icao: "DNIL", name: "Ilorin International Airport", city: "Ilorin", state: "Kwara", verified: true },
  { iata: "CBQ", icao: "DNCA", name: "Margaret Ekpo International Airport", city: "Calabar", state: "Cross River", verified: true },
  { iata: "JOS", icao: "DNJO", name: "Yakubu Gowon Airport", city: "Jos", state: "Plateau", verified: true },
  { iata: "QUO", icao: null, name: "Victor Attah International Airport (Akwa Ibom International)", city: "Uyo", state: "Akwa Ibom", verified: true },
  { iata: "MIU", icao: "DNMA", name: "Maiduguri International Airport", city: "Maiduguri", state: "Borno", verified: false },
  { iata: "SKO", icao: "DNSO", name: "Sadiq Abubakar III International Airport", city: "Sokoto", state: "Sokoto", verified: false },
  { iata: "YOL", icao: "DNYO", name: "Yola Airport", city: "Yola", state: "Adamawa", verified: false },
  { iata: "AKR", icao: "DNAK", name: "Akure Airport", city: "Akure", state: "Ondo", verified: false },
  { iata: "KAD", icao: "DNKA", name: "Kaduna Airport", city: "Kaduna", state: "Kaduna", verified: false },
];

/**
 * The routes named in the product brief, expressed as origin/destination
 * IATA pairs against the airports above. This is the MVP route list —
 * see docs/MVP_SCOPE.md for the note that it's unvalidated against
 * real per-route demand data.
 */
export const MVP_ROUTES: Array<{ origin: string; destination: string }> = [
  { origin: "LOS", destination: "ABV" },
  { origin: "ABV", destination: "LOS" },
  { origin: "LOS", destination: "PHC" },
  { origin: "PHC", destination: "LOS" },
  { origin: "LOS", destination: "ENU" },
  { origin: "LOS", destination: "BNI" },
  { origin: "LOS", destination: "QOW" },
  { origin: "LOS", destination: "KAN" },
  { origin: "ABV", destination: "PHC" },
  { origin: "ABV", destination: "KAN" },
  { origin: "ABV", destination: "ENU" },
  { origin: "LOS", destination: "ILR" },
];

export function findAirport(iata: string): Airport | undefined {
  return AIRPORTS.find((a) => a.iata === iata.toUpperCase());
}

export function isKnownAirport(iata: string): boolean {
  return findAirport(iata) !== undefined;
}
