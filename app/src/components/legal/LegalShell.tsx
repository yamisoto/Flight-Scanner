import Link from "next/link";
import type { ReactNode } from "react";
import { BackToTop, LegalToc } from "@/components/legal/LegalToc";
import { Fill } from "@/components/legal/LegalText";
import { PageHero } from "@/components/v2/PageHero";
import { SiteFooter } from "@/components/v2/SiteFooter";

/*
 * Shared frame for the legal pages. DRAFT: not in force until reviewed by a
 * Nigerian lawyer; every page is noindexed and shows the draft banner.
 * See docs/LEGAL.md for the laws covered, placeholders and what must stay
 * in step with the code.
 */

export const LEGAL_LAST_UPDATED = "11 October 2026";

export const LEGAL_PAGES = [
  { href: "/legal", label: "Overview" },
  { href: "/legal/terms", label: "Terms of use" },
  { href: "/legal/privacy", label: "Privacy notice" },
  { href: "/legal/cookies", label: "Cookies" },
] as const;

export const LEGAL_ROBOTS = { index: false, follow: true };

interface LegalShellProps {
  current: (typeof LEGAL_PAGES)[number]["href"];
  title: string;
  intro: ReactNode;
  sections?: { id: string; title: string }[];
  children: ReactNode;
}

export function LegalShell({ current, title, intro, sections, children }: LegalShellProps) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title}>
        {intro} Last updated {LEGAL_LAST_UPDATED}.
      </PageHero>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div role="note" className="mb-8 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-ink">
          <strong>Draft for legal review.</strong> These pages are not yet in force. Highlighted items in <Fill>brackets</Fill> are details
          still to be supplied.
        </div>

        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <nav aria-label="Legal pages">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Legal</p>
              <ul className="flex flex-wrap gap-1.5 lg:block lg:space-y-0.5">
                {LEGAL_PAGES.map((p) => (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      aria-current={p.href === current ? "page" : undefined}
                      className={`block rounded-lg px-3 py-1.5 text-sm transition lg:px-2 ${
                        p.href === current
                          ? "bg-primary text-primary-ink lg:bg-surface-2 lg:font-semibold lg:text-ink"
                          : "border border-line text-ink-muted hover:text-ink lg:border-0 lg:hover:bg-surface-2"
                      }`}
                    >
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {sections && sections.length > 1 && (
              <nav aria-label="On this page" className="hidden lg:block">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">On this page</p>
                <LegalToc sections={sections} />
              </nav>
            )}
          </aside>

          <main className="min-w-0 max-w-3xl space-y-14">{children}</main>
        </div>
      </div>

      <BackToTop />
      <SiteFooter />
    </>
  );
}
