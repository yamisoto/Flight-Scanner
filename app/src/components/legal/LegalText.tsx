import type { ReactNode } from "react";

/** A detail the owner still has to supply; highlighted so nothing ships unfilled. */
export function Fill({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-warn/15 px-1 font-medium text-warn">[{children}]</mark>;
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} data-legal-section className="scroll-mt-6 space-y-4">
      <h2 id={`${id}-h`} className="border-b border-line pb-2 text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}
