"use client";

import { useEffect, useState } from "react";

/** "On this page" links that highlight the section being read. */
export function LegalToc({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // A section counts as current once its top passes the upper third of the screen.
      { rootMargin: "0px 0px -66% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <ol className="space-y-0.5 text-sm">
      {sections.map((s) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            aria-current={active === s.id ? "location" : undefined}
            className={`block rounded-lg px-2 py-1.5 transition hover:bg-surface-2 hover:text-ink ${
              active === s.id ? "bg-surface-2 font-medium text-ink" : "text-ink-muted"
            }`}
          >
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Floating "back to top" button on phones, shown once the reader is well down the page. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 1200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-4 right-4 z-40 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-lg lg:hidden"
    >
      ↑ Top
    </button>
  );
}
