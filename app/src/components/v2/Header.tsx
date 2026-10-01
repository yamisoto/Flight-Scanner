"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { MoonIcon, PlaneIcon, SunIcon } from "@/components/v2/icons";

const STORAGE_KEY = "skyfare-theme";

type Theme = "light" | "dark";

// The theme lives on <html class="dark">, set before hydration by the root
// layout's no-flash script. Reading it through useSyncExternalStore lets the
// server render "light" and the client correct itself without a hydration
// mismatch.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const readTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const serverTheme = (): Theme => "light";

export function Header() {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the toggle still works for this visit.
    }
  }

  return (
    <header className="relative z-20">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/v2" className="flex items-center gap-2 text-hero-ink">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-ink">
            <PlaneIcon size={16} />
          </span>
          <span className="text-lg font-semibold tracking-tight">Skyfare</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <span className="hidden rounded-full bg-white/10 px-3 py-1.5 font-medium text-hero-ink sm:inline">Flights</span>
          <span className="hidden px-3 py-1.5 text-hero-muted sm:inline" title="Coming in a later phase">
            Africa <span className="text-xs">(soon)</span>
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-2 grid h-9 w-9 place-items-center rounded-full border border-white/15 text-hero-ink transition hover:bg-white/10"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </div>
    </header>
  );
}
