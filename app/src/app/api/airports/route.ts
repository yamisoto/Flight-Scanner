import { NextRequest, NextResponse } from "next/server";
import { AIRPORTS } from "@/lib/data/airports";

/** GET /api/airports?query=lag — simple substring match against name/city/IATA code. */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim().toLowerCase() ?? "";

  const results = query
    ? AIRPORTS.filter(
        (a) =>
          a.iata.toLowerCase().includes(query) ||
          a.city.toLowerCase().includes(query) ||
          a.name.toLowerCase().includes(query),
      )
    : AIRPORTS;

  return NextResponse.json({ airports: results });
}
