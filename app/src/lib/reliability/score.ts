import { NCAA_AIRLINE_MONTHS, NCAA_INDUSTRY_TOTALS, type NcaaAirlineMonth } from "@/lib/reliability/ncaaData";

/**
 * Reliability score (1-10) for one flight.
 *
 * The full formula in docs/PHASE_1_PLAN.md (section 5) needs route-level
 * history we don't have yet. Until it exists, scores come from the NCAA
 * airline-level baseline below, with a Low confidence label:
 *
 *   raw   = 0.70 * D + 0.20 * A + 0.10 * T
 *   score = 1 + 9 * raw                    (one decimal)
 *
 *   D  share of the airline's flights that left on time (1 - delay rate)
 *   A  cancellation subscore: 1 - cancellation rate / 2%, floored at 0
 *      (no Nigerian airline came close to 2% in Aug 2026; the industry rate was 0.45%)
 *   T  time of day: before 09:00 = 1, 09:00-16:59 = 0.6, 17:00 or later = 0.3,
 *      because delays build up through the day
 *
 * Delay rate carries most of the weight because it is the problem Nigerian
 * flyers actually face: 60% of domestic flights were delayed in August 2026,
 * while fewer than 1 in 200 were cancelled.
 */

export type ReliabilityLabel = "High" | "Good" | "Fair" | "Low";
export type ReliabilitySource = "ncaa-airline-baseline" | "preview";
export type Confidence = "High" | "Medium" | "Low";

export interface Reliability {
  score: number; // 1.0 - 10.0
  label: ReliabilityLabel;
  reason: string;
  source: ReliabilitySource;
  confidence: Confidence;
}

export const BASELINE_WEIGHTS = { delay: 0.7, cancellation: 0.2, timeOfDay: 0.1 } as const;
const CANCELLATION_RATE_FLOOR = 0.02;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function reliabilityLabel(score: number): ReliabilityLabel {
  if (score >= 8) return "High";
  if (score >= 6.5) return "Good";
  if (score >= 5) return "Fair";
  return "Low";
}

export function timeOfDayFactor(hour: number): number {
  if (hour < 9) return 1;
  if (hour >= 17) return 0.3;
  return 0.6;
}

function timeOfDayNote(hour: number): string {
  if (hour < 9) return "Early departures tend to leave on time.";
  if (hour >= 17) return "Evening departures pick up delays from earlier flights.";
  return "";
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (ym: string) => `${MONTH_NAMES[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

/** The most recent NCAA month on record for an airline, if any. */
export function latestNcaaMonth(airlineIata: string, data: NcaaAirlineMonth[] = NCAA_AIRLINE_MONTHS): NcaaAirlineMonth | undefined {
  return data
    .filter((r) => r.airlineIata === airlineIata.toUpperCase())
    .sort((a, b) => b.month.localeCompare(a.month))[0];
}

export function ncaaBaselineReliability(
  airlineIata: string,
  departureHour: number,
  data: NcaaAirlineMonth[] = NCAA_AIRLINE_MONTHS,
): Reliability | null {
  const row = latestNcaaMonth(airlineIata, data);
  if (!row || row.flightsOperated <= 0) return null;

  const delayRate = row.flightsDelayed / row.flightsOperated;
  const industry = NCAA_INDUSTRY_TOTALS[row.month];
  const cancelRate =
    row.flightsCancelled !== null
      ? row.flightsCancelled / row.flightsOperated
      : industry
        ? industry.flightsCancelled / industry.flightsOperated
        : 0;

  const D = 1 - delayRate;
  const A = clamp(1 - cancelRate / CANCELLATION_RATE_FLOOR, 0, 1);
  const T = timeOfDayFactor(departureHour);
  const raw = BASELINE_WEIGHTS.delay * D + BASELINE_WEIGHTS.cancellation * A + BASELINE_WEIGHTS.timeOfDay * T;
  const score = Math.round(clamp(1 + 9 * raw, 1, 10) * 10) / 10;

  const pct = Math.round(delayRate * 100);
  const industryCancelRate = industry ? industry.flightsCancelled / industry.flightsOperated : 0;
  // Call out cancellations when they're well above the industry rate, so the score is explainable.
  const cancelNote =
    row.flightsCancelled !== null && industryCancelRate > 0 && cancelRate >= 2 * industryCancelRate
      ? `It also cancelled ${(cancelRate * 100).toFixed(1)}% of flights, against ${(industryCancelRate * 100).toFixed(2)}% industry-wide.`
      : "";
  const reason = [
    `${row.airlineName} delayed ${pct}% of its domestic flights in ${monthName(row.month)} (NCAA).`,
    cancelNote,
    timeOfDayNote(departureHour),
    "Airline-wide figure; route-level history coming soon.",
  ]
    .filter(Boolean)
    .join(" ");

  return { score, label: reliabilityLabel(score), reason, source: "ncaa-airline-baseline", confidence: "Low" };
}
