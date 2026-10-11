import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© Skyfare. Demonstration prices only: no live fares or bookings yet.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/flights" className="hover:text-ink hover:underline">
            Popular routes
          </Link>
          <Link href="/how-we-score" className="hover:text-ink hover:underline">
            How we score reliability
          </Link>
          <Link href="/legal" className="hover:text-ink hover:underline">
            Terms &amp; privacy
          </Link>
          <span>Nigeria domestic · Africa coming soon</span>
        </nav>
      </div>
    </footer>
  );
}
