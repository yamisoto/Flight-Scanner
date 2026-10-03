import { recordKey, RetryableSourceError, type FlightStatusRecord, type FlightStatusSource, type FlightStatusStore } from "@/lib/ingest/types";

export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  sleep?: (ms: number) => Promise<void>;
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Retries only RetryableSourceError, with exponential backoff (base, 2x base, 4x base...). */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const sleep = opts.sleep ?? realSleep;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof RetryableSourceError) || attempt >= opts.attempts) throw err;
      await sleep(opts.baseDelayMs * 2 ** (attempt - 1));
    }
  }
}

export interface CollectionRun {
  source: FlightStatusSource;
  store: FlightStatusStore;
  airports: string[];
  fromUtc: Date;
  toUtc: Date;
  retry?: RetryOptions;
  log?: (event: Record<string, unknown>) => void;
}

export interface CollectionSummary {
  source: string;
  fromUtc: string;
  toUtc: string;
  airportsSucceeded: string[];
  airportsFailed: { airport: string; error: string }[];
  recordsFetched: number;
  recordsWritten: number;
  durationMs: number;
}

const defaultLog = (event: Record<string, unknown>) => console.log(JSON.stringify(event));

/**
 * Fetches departures for each airport in turn (sequentially, to respect
 * provider rate limits), de-duplicates, and writes them to the store.
 * One airport failing never stops the others; failures are reported in the
 * summary and logged as structured JSON.
 */
export async function runStatusCollection(run: CollectionRun): Promise<CollectionSummary> {
  const started = Date.now();
  const log = run.log ?? defaultLog;
  const retry = run.retry ?? { attempts: 3, baseDelayMs: 2_000 };
  const byKey = new Map<string, FlightStatusRecord>();
  const summary: CollectionSummary = {
    source: run.source.name,
    fromUtc: run.fromUtc.toISOString(),
    toUtc: run.toUtc.toISOString(),
    airportsSucceeded: [],
    airportsFailed: [],
    recordsFetched: 0,
    recordsWritten: 0,
    durationMs: 0,
  };

  for (const airport of run.airports) {
    try {
      const records = await withRetry(() => run.source.fetchDepartures(airport, run.fromUtc, run.toUtc), retry);
      summary.recordsFetched += records.length;
      for (const r of records) byKey.set(recordKey(r), r);
      summary.airportsSucceeded.push(airport);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      summary.airportsFailed.push({ airport, error });
      log({ level: "warn", event: "status_collection_airport_failed", source: run.source.name, airport, error });
    }
  }

  if (byKey.size > 0) summary.recordsWritten = await run.store.upsert([...byKey.values()]);
  summary.durationMs = Date.now() - started;
  log({ level: summary.airportsFailed.length ? "warn" : "info", event: "status_collection_finished", ...summary });
  return summary;
}

/** In-memory store for tests and local runs. Production uses the database store once a provider is chosen. */
export class MemoryFlightStatusStore implements FlightStatusStore {
  readonly records = new Map<string, FlightStatusRecord>();

  async upsert(records: FlightStatusRecord[]): Promise<number> {
    for (const r of records) this.records.set(recordKey(r), r);
    return records.length;
  }
}
