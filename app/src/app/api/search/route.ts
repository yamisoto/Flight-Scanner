import { NextRequest, NextResponse } from "next/server";
import { getActiveProvider } from "@/lib/flights/registry";
import { FlightSearchEngine } from "@/lib/flights/searchEngine";
import { validateSearchRequest } from "@/lib/validation/searchValidation";
import { ProviderError, type FlightSearchOptions, type FlightSearchRequest } from "@/types/flight";

/**
 * POST /api/search
 *
 * Body: FlightSearchRequest, plus optional `sortBy`/`sortDirection`/`filters`.
 * This route validates input, delegates to the search engine, and
 * normalises every outcome (success, no-results, provider failure,
 * validation failure) into a distinct, honest response shape — never
 * an empty array that looks the same whether nothing was found or
 * something broke.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const validation = validateSearchRequest(body);
  if (!validation.valid) {
    return NextResponse.json({ error: "Invalid search request.", issues: validation.issues }, { status: 400 });
  }

  const searchRequest = body as FlightSearchRequest;
  const options: FlightSearchOptions = {
    sortBy: (body as { sortBy?: FlightSearchOptions["sortBy"] }).sortBy,
    sortDirection: (body as { sortDirection?: FlightSearchOptions["sortDirection"] }).sortDirection,
    filters: (body as { filters?: FlightSearchOptions["filters"] }).filters,
  };

  try {
    const provider = getActiveProvider();
    const engine = new FlightSearchEngine(provider);
    const offers = await engine.search(searchRequest, options);
    return NextResponse.json({ offers, provider: provider.name });
  } catch (err) {
    if (err instanceof ProviderError) {
      const status = err.code === "NO_RESULTS" ? 200 : err.code === "INVALID_REQUEST" ? 400 : 502;
      const payload =
        err.code === "NO_RESULTS"
          ? { offers: [], message: "No flights found for this search." }
          : { error: err.message, code: err.code };
      return NextResponse.json(payload, { status });
    }

    console.error("Unexpected error in /api/search:", err);
    return NextResponse.json({ error: "An unexpected error occurred while searching for flights." }, { status: 500 });
  }
}
