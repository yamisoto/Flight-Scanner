import type { ReactNode } from "react";
import { Header } from "@/components/v2/Header";

/** Dark header band for content pages: site header, then the page title. */
export function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="v2-hero">
      <Header />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-10">
        {eyebrow && <p className="text-sm font-medium text-hero-muted">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-hero-ink sm:text-4xl">{title}</h1>
        {children && <div className="mt-3 max-w-2xl text-base text-hero-muted sm:text-lg">{children}</div>}
      </div>
    </div>
  );
}
