import type { FlightOffer } from "@/types/flight";

/**
 * V2 comparison scoring: a reliability score per offer and the blended
 * "Skyfare Pick" ranking described in docs/PHASE_1_PLAN.md (sections 5-6).
 *
 * IMPORTANT: there is no real on-time data behind reliability yet. Until
 * the reliability engine (sub-phase 1.3) exists, scores come from
 * previewReliability(), a deterministic placeholder derived from the
 * airline code and departure hour. It is labelled as a preview in the UI
 * and must be swapped for real data, not tuned to look plausible.
 */

export type V2SortKey = "best" | "cheapest" | "fastest" | "reliable" | "departure";

export interface Reliability {
  score: number; // 1.0 - 10.0, one decimal
  label: "High" | "Good" | "Fair" | "Low";
  reason: string;
  preview: true;
}

export interface ScoredOffer {
  offer: FlightOffer;
  reliability: Reliability;
  totalMinutes: number;
  departureHour: number;
  bestScore: number; // 0 - 1
}

/** Recommended-flight weights. Price and reliability count equally; journey time breaks close calls. */
export const BEST_WEIGHTS = { price: 0.4, reliability: 0.4, time: 0.2 } as const;

/**
 * Reliability tiers for the Skyfare Pick:
 * - At or above PICK_PREFERRED_RELIABILITY ("Good" or better) a flight is preferred: if any such
 *   flight exists, the Pick comes from that group, however cheap a less reliable flight is.
 * - Below PICK_MIN_RELIABILITY a flight can never be the Pick.
 */
export const PICK_PREFERRED_RELIABILITY = 6.5;
export const PICK_MIN_RELIABILITY = 4.0;

/** 0 = preferred, 1 = acceptable, 2 = never recommended. */
export function reliabilityTier(score: number): 0 | 1 | 2 {
  if (score >= PICK_PREFERRED_RELIABILITY) return 0;
  if (score >= PICK_MIN_RELIABILITY) return 1;
  return 2;
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function reliabilityLabel(score: number): Reliability["label"] {
  if (score >= 8) return "High";
  if (score >= 6.5) return "Good";
  if (score >= 5) return "Fair";
  return "Low";
}

/**
 * Placeholder reliability: a stable per-airline base (4.6 - 8.8) plus the
 * time-of-day effect from the plan (early departures run more on time
 * because delays cascade through the day).
 */
export function previewReliability(offer: FlightOffer): Reliability {
  const first = offer.slices[0].segments[0];
  const base = 4.6 + (hash(first.airlineCode) % 43) / 10;
  const hour = new Date(first.departureAt).getUTCHours();
  const timeAdj = hour < 9 ? 0.6 : hour >= 17 ? -0.7 : 0;
  const score = Math.round(clamp(base + timeAdj, 1, 10) * 10) / 10;

  const timeNote = hour < 9 ? "Early departures tend to leave on time." : hour >= 17 ? "Evening departures pick up delays from earlier flights." : "Midday departure.";

  return {
    score,
    label: reliabilityLabel(score),
    reason: `${first.airlineName} on-time history (preview). ${timeNote}`,
    preview: true,
  };
}

function totalMinutes(offer: FlightOffer) {
  return offer.slices.reduce((sum, s) => sum + s.durationMinutes, 0);
}

/**
 * Ratio to the best value on the page (1 = best). Unlike min-max scaling, a flight 20% dearer
 * than the cheapest scores 0.83, not 0, so one cheap outlier can't zero out every other option.
 */
function ratioToBest(value: number, best: number) {
  return value > 0 ? best / value : 1;
}

/** Penalise departures outside 05:00-21:00, which are rarely anyone's first choice. */
function sociableHourScore(hour: number) {
  return hour < 5 || hour >= 21 ? 0.4 : 1;
}

export function scoreOffers(
  offers: FlightOffer[],
  reliabilityFn: (offer: FlightOffer) => Reliability = previewReliability,
): ScoredOffer[] {
  if (offers.length === 0) return [];

  const minP = Math.min(...offers.map((o) => o.price.amount));
  const minD = Math.min(...offers.map(totalMinutes));

  return offers.map((offer) => {
    const reliability = reliabilityFn(offer);
    const minutes = totalMinutes(offer);
    const departureHour = new Date(offer.slices[0].segments[0].departureAt).getUTCHours();

    const priceScore = ratioToBest(offer.price.amount, minP);
    const reliabilityScore = (reliability.score - 1) / 9; // 1-10 mapped to 0-1
    const timeScore = 0.7 * ratioToBest(minutes, minD) + 0.3 * sociableHourScore(departureHour);
    const bestScore =
      BEST_WEIGHTS.price * priceScore + BEST_WEIGHTS.reliability * reliabilityScore + BEST_WEIGHTS.time * timeScore;

    return { offer, reliability, totalMinutes: minutes, departureHour, bestScore };
  });
}

function departureMs(s: ScoredOffer) {
  return new Date(s.offer.slices[0].segments[0].departureAt).getTime();
}

export function sortScored(scored: ScoredOffer[], key: V2SortKey): ScoredOffer[] {
  const byPrice = (a: ScoredOffer, b: ScoredOffer) => a.offer.price.amount - b.offer.price.amount;
  const compare: Record<V2SortKey, (a: ScoredOffer, b: ScoredOffer) => number> = {
    // Best ranks by reliability tier first, so the Best tab and the Skyfare Pick always agree.
    best: (a, b) =>
      reliabilityTier(a.reliability.score) - reliabilityTier(b.reliability.score) || b.bestScore - a.bestScore || byPrice(a, b),
    cheapest: (a, b) => byPrice(a, b) || a.totalMinutes - b.totalMinutes,
    fastest: (a, b) => a.totalMinutes - b.totalMinutes || byPrice(a, b),
    reliable: (a, b) => b.reliability.score - a.reliability.score || byPrice(a, b),
    departure: (a, b) => departureMs(a) - departureMs(b),
  };
  return [...scored].sort(compare[key]);
}

/**
 * The Skyfare Pick: the best-balanced flight among the most reliable tier available.
 * Ties go to the cheaper flight. Null when every flight is below the reliability floor.
 */
export function pickRecommended(scored: ScoredOffer[]): ScoredOffer | null {
  const top = sortScored(scored, "best")[0];
  return top && reliabilityTier(top.reliability.score) < 2 ? top : null;
}

/** One-line reason shown on the Skyfare Pick card, relative to the cheapest option. */
export function pickReason(pick: ScoredOffer, all: ScoredOffer[]): string {
  const cheapest = sortScored(all, "cheapest")[0];
  if (!cheapest || cheapest.offer.id === pick.offer.id) {
    return pick.reliability.score >= PICK_PREFERRED_RELIABILITY
      ? "Cheapest flight on this route, with good reliability."
      : "Cheapest flight on this route. No higher-reliability option is available.";
  }
  const extra = pick.offer.price.amount - cheapest.offer.price.amount;
  const gain = Math.round((pick.reliability.score - cheapest.reliability.score) * 10) / 10;
  const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(extra);
  if (reliabilityTier(cheapest.reliability.score) > reliabilityTier(pick.reliability.score)) {
    return `${money} more than the cheapest, which rates only ${cheapest.reliability.score.toFixed(1)}/10 for reliability.`;
  }
  if (gain > 0) return `Best balance: ${money} more than the cheapest, ${gain} points more reliable.`;
  return `Best balance of price, journey time and reliability.`;
}
