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

/** Recommended-flight weights (plan section 6). */
export const BEST_WEIGHTS = { price: 0.45, reliability: 0.35, time: 0.2 } as const;

/** A flight below this reliability can never be the Skyfare Pick. */
export const PICK_MIN_RELIABILITY = 4.0;

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

function normaliseInverse(value: number, min: number, max: number) {
  if (max === min) return 1;
  return 1 - (value - min) / (max - min);
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

  const prices = offers.map((o) => o.price.amount);
  const durations = offers.map(totalMinutes);
  const [minP, maxP] = [Math.min(...prices), Math.max(...prices)];
  const [minD, maxD] = [Math.min(...durations), Math.max(...durations)];

  return offers.map((offer) => {
    const reliability = reliabilityFn(offer);
    const minutes = totalMinutes(offer);
    const departureHour = new Date(offer.slices[0].segments[0].departureAt).getUTCHours();

    const priceScore = normaliseInverse(offer.price.amount, minP, maxP);
    const timeScore = 0.7 * normaliseInverse(minutes, minD, maxD) + 0.3 * sociableHourScore(departureHour);
    const bestScore =
      BEST_WEIGHTS.price * priceScore + BEST_WEIGHTS.reliability * (reliability.score / 10) + BEST_WEIGHTS.time * timeScore;

    return { offer, reliability, totalMinutes: minutes, departureHour, bestScore };
  });
}

function departureMs(s: ScoredOffer) {
  return new Date(s.offer.slices[0].segments[0].departureAt).getTime();
}

export function sortScored(scored: ScoredOffer[], key: V2SortKey): ScoredOffer[] {
  const byPrice = (a: ScoredOffer, b: ScoredOffer) => a.offer.price.amount - b.offer.price.amount;
  const compare: Record<V2SortKey, (a: ScoredOffer, b: ScoredOffer) => number> = {
    best: (a, b) => b.bestScore - a.bestScore || byPrice(a, b),
    cheapest: (a, b) => byPrice(a, b) || a.totalMinutes - b.totalMinutes,
    fastest: (a, b) => a.totalMinutes - b.totalMinutes || byPrice(a, b),
    reliable: (a, b) => b.reliability.score - a.reliability.score || byPrice(a, b),
    departure: (a, b) => departureMs(a) - departureMs(b),
  };
  return [...scored].sort(compare[key]);
}

/** The Skyfare Pick: best blended score among offers above the reliability floor. Ties go to the cheaper flight. */
export function pickRecommended(scored: ScoredOffer[]): ScoredOffer | null {
  const eligible = scored.filter((s) => s.reliability.score >= PICK_MIN_RELIABILITY);
  return sortScored(eligible, "best")[0] ?? null;
}

/** One-line reason shown on the Skyfare Pick card, relative to the cheapest option. */
export function pickReason(pick: ScoredOffer, all: ScoredOffer[]): string {
  const cheapest = sortScored(all, "cheapest")[0];
  if (!cheapest || cheapest.offer.id === pick.offer.id) {
    return "Cheapest flight on this route, with a solid reliability score.";
  }
  const extra = pick.offer.price.amount - cheapest.offer.price.amount;
  const gain = Math.round((pick.reliability.score - cheapest.reliability.score) * 10) / 10;
  const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(extra);
  if (gain > 0) return `Best balance: ${money} more than the cheapest, ${gain} points more reliable.`;
  return `Best balance of price, journey time and reliability.`;
}
