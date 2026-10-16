import { createRateLimiter } from "@/lib/rateLimit";

// One per-client budget shared by every search endpoint (search and the
// price calendar), so splitting a search across endpoints can't double it.
// One person searching normally stays far below this; it exists to stop
// scripted floods from running up provider API costs.
const SEARCHES_PER_MINUTE = Number(process.env.SEARCH_RATE_LIMIT_PER_MINUTE) || 30;

export const checkSearchRateLimit = createRateLimiter({ limit: SEARCHES_PER_MINUTE, windowMs: 60_000 });
