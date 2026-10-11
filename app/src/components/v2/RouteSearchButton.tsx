"use client";

import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/v2/icons";
import { searchToQuery } from "@/lib/v2/searchUrl";

const WAT_OFFSET_MS = 60 * 60_000;

/** Opens the search for this route a week from today (Lagos time). The date is worked out on click, so a cached page never searches a past date. */
export function RouteSearchButton({ origin, destination, label }: { origin: string; destination: string; label: string }) {
  const router = useRouter();
  function go() {
    const depart = new Date(Date.now() + WAT_OFFSET_MS + 7 * 86_400_000).toISOString().slice(0, 10);
    router.push(
      `/?${searchToQuery({
        origin,
        destination,
        departureDate: depart,
        tripType: "one_way",
        passengers: { adults: 1, children: 0, infants: 0 },
        cabinClass: "economy",
      })}`,
    );
  }
  return (
    <button
      type="button"
      onClick={go}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-ink transition hover:bg-primary-hover"
    >
      <SearchIcon size={16} />
      {label}
    </button>
  );
}
