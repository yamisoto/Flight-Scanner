import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ROBOTS, LegalShell } from "@/components/legal/LegalShell";
import { Fill } from "@/components/legal/LegalText";
import { ArrowRightIcon } from "@/components/v2/icons";

export const metadata: Metadata = {
  title: "Legal | Skyfare",
  description: "Skyfare's terms of use, privacy notice and cookie notice, with the key points in plain English.",
  alternates: { canonical: "/legal" },
  robots: LEGAL_ROBOTS,
};

const KEY_POINTS = [
  ["We compare flights; we don't sell them.", "You book with the airline or travel agent, and their price, rules and refund policy apply."],
  ["Prices come from our partners and can change.", "Always check the final price and baggage allowance on the seller's site before you pay."],
  ["Scores can't be bought.", "No airline can pay to change its reliability score, and commission never affects our rankings."],
  ["We collect as little as we can.", "No accounts, no cookies, and we don't store your searches. We never sell personal data."],
  ["You have rights over your data.", "Ask us for a copy, a correction or deletion, or complain to the Nigeria Data Protection Commission."],
  ["Flight problems go to the airline.", "Delays, cancellations and refunds are the airline's responsibility, overseen by the NCAA."],
];

const PAGES = [
  { href: "/legal/terms", title: "Terms of use", body: "The rules for using Skyfare, how we make money and rank results, and how to complain." },
  { href: "/legal/privacy", title: "Privacy notice", body: "What we collect, why, who we share it with, and your rights under the Nigeria Data Protection Act." },
  { href: "/legal/cookies", title: "Cookies", body: "Skyfare sets no cookies. The one setting we store on your device, and why." },
];

export default function LegalOverviewPage() {
  return (
    <LegalShell current="/legal" title="Terms, privacy and cookies" intro="The key points in plain English, and the full documents.">
      <section aria-labelledby="key-points" className="space-y-4">
        <h2 id="key-points" className="text-2xl font-semibold tracking-tight text-ink">
          Key points
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {KEY_POINTS.map(([title, body]) => (
            <li key={title} className="v2-card p-4">
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-muted">
          This summary is for convenience; the full documents below are what apply. Skyfare is operated by <Fill>company name</Fill>.
        </p>
      </section>

      <section aria-labelledby="documents" className="space-y-4">
        <h2 id="documents" className="text-2xl font-semibold tracking-tight text-ink">
          Full documents
        </h2>
        <ul className="grid gap-3">
          {PAGES.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="v2-card group flex items-center justify-between gap-4 p-4 transition hover:border-primary">
                <span>
                  <span className="block font-semibold text-ink">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{p.body}</span>
                </span>
                <ArrowRightIcon size={18} className="shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </LegalShell>
  );
}
