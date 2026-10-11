import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHero } from "@/components/v2/PageHero";
import { SiteFooter } from "@/components/v2/SiteFooter";

/*
 * DRAFT legal page: terms of use, how we make money, privacy notice
 * (Nigeria Data Protection Act 2023 and the NDPC's GAID 2025), cookies,
 * complaints. Structure follows Skyscanner and Google Flights (we are not
 * the seller; prices come from partners; how ranking works).
 *
 * Not in force until reviewed by a Nigerian lawyer: noindexed, kept out of
 * the sitemap, and every company detail still to be supplied is wrapped in
 * <Fill> so it is highlighted on the page. Keep the privacy section in step
 * with what the code actually does (see docs/LEGAL.md).
 */

export const metadata: Metadata = {
  title: "Legal: terms, privacy and cookies | Skyfare",
  description: "Skyfare's terms of use, privacy notice, cookie notice and how we make money.",
  alternates: { canonical: "/legal" },
  robots: { index: false, follow: true },
};

const LAST_UPDATED = "11 October 2026";

const SECTIONS = [
  { id: "about", title: "About Skyfare" },
  { id: "terms", title: "Terms of use" },
  { id: "money", title: "How we make money and rank results" },
  { id: "privacy", title: "Privacy notice" },
  { id: "cookies", title: "Cookies and local storage" },
  { id: "complaints", title: "Complaints and contact" },
];

/** A detail the owner still has to supply; highlighted so nothing ships unfilled. */
function Fill({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-warn/15 px-1 font-medium text-warn">[{children}]</mark>;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6 space-y-4">
      <h2 id={`${id}-h`} className="border-b border-line pb-2 text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <div className="space-y-2 text-[15px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}

export default function LegalPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms, privacy and cookies">
        The rules for using Skyfare, how we make money, and how we handle your information. Last updated {LAST_UPDATED}.
      </PageHero>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div role="note" className="mb-8 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-ink">
          <strong>Draft for legal review.</strong> This page is not yet in force. Highlighted items in <Fill>brackets</Fill> are details still to
          be supplied.
        </div>

        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav aria-label="On this page" className="lg:sticky lg:top-6 lg:self-start">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">On this page</p>
            <ol className="space-y-1 text-sm">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block rounded-lg px-2 py-1.5 text-ink-muted transition hover:bg-surface-2 hover:text-ink">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <main className="min-w-0 max-w-3xl space-y-14">
            <Section id="about" title="1. About Skyfare">
              <Sub title="Who we are">
                <p>
                  Skyfare is a flight comparison service for domestic flights in Nigeria, operated by <Fill>company name</Fill>, a company
                  registered in Nigeria with the Corporate Affairs Commission under number <Fill>RC number</Fill>, whose address is{" "}
                  <Fill>registered address</Fill> (&quot;Skyfare&quot;, &quot;we&quot;, &quot;us&quot;).
                </p>
                <p>
                  These terms apply whenever you use the Skyfare website (<Fill>domain</Fill>) and any Skyfare app. By using Skyfare you agree to them. If you
                  don&apos;t agree, please don&apos;t use the service.
                </p>
              </Sub>
              <Sub title="We compare flights; we don't sell them">
                <p>
                  Skyfare is not an airline and not a travel agent. We show you flights, prices and reliability information from airlines and
                  booking partners so you can compare them. When you choose a flight, you book it with the airline or travel agent we send you to,
                  not with us.
                </p>
              </Sub>
              <Sub title="Test phase">
                <p>
                  Skyfare is in testing. Until we tell you otherwise on the site, prices shown are <strong>demonstration prices</strong>, not live
                  fares, and flights cannot be booked through Skyfare.
                </p>
              </Sub>
            </Section>

            <Section id="terms" title="2. Terms of use">
              <Sub title="2.1 Prices and availability">
                <p>
                  Prices and seat availability come from our partners and change constantly. We show them as accurately as we can, and we aim to
                  show the full price including taxes and charges that are known in advance. But the price and conditions that apply are the ones
                  the seller shows you before you pay. Always check them, including baggage allowance and fare rules, before you book.
                </p>
                <p>
                  If we find a price on Skyfare is wrong, we will correct it. We are not bound to honour a price shown in error, because we don&apos;t
                  sell the ticket.
                </p>
              </Sub>
              <Sub title="2.2 Flight information and reliability scores">
                <p>
                  Schedules, flight times and reliability scores are for information only. Reliability scores describe how an airline has operated
                  in the past, based on published and collected data, and are explained on{" "}
                  <Link href="/how-we-score" className="font-medium text-primary hover:underline">
                    How we score
                  </Link>
                  . They are not a promise about any particular flight. Airlines change schedules, and flights are delayed or cancelled for reasons
                  outside anyone&apos;s control.
                </p>
              </Sub>
              <Sub title="2.3 Booking with airlines and travel agents">
                <p>Your booking is a contract between you and the airline or travel agent. That seller is responsible for:</p>
                <List>
                  <li>your ticket, payment, changes, cancellations and refunds;</li>
                  <li>the flight itself, including delays, cancellations, denied boarding and baggage;</li>
                  <li>
                    your rights as an air passenger, including care and compensation under the Nigeria Civil Aviation Regulations 2023, Part 19
                    (Consumer Protection), enforced by the Nigerian Civil Aviation Authority (NCAA).
                  </li>
                </List>
                <p>We can&apos;t change, cancel or refund bookings, but we will point you to the right place if you contact us.</p>
              </Sub>
              <Sub title="2.4 Using Skyfare fairly">
                <p>Skyfare is for personal, non-commercial use. You must not:</p>
                <List>
                  <li>copy, scrape, crawl or harvest prices, scores or other content by automated means, or build a database from them;</li>
                  <li>reverse-engineer, copy or reproduce our reliability scores, rankings or methods;</li>
                  <li>get around rate limits or security measures, or put an unreasonable load on the service;</li>
                  <li>use Skyfare for anything unlawful, including any offence under the Cybercrimes (Prohibition, Prevention, etc.) Act;</li>
                  <li>pretend to be Skyfare or suggest we endorse you.</li>
                </List>
                <p>We may block access from anyone who breaks these rules.</p>
              </Sub>
              <Sub title="2.5 Our content">
                <p>
                  The Skyfare name, logo, design, text, reliability scores, rankings and the way we compile our data belong to us or our licensors.
                  Airline names and logos belong to their owners. Linking to our pages is welcome; reproducing our content needs our written
                  permission.
                </p>
              </Sub>
              <Sub title="2.6 Links to other sites">
                <p>
                  We link to airlines, travel agents and other sites we don&apos;t control. Their own terms and privacy policies apply once you
                  leave Skyfare.
                </p>
              </Sub>
              <Sub title="2.7 Our responsibility to you">
                <p>
                  We provide Skyfare with reasonable care and skill. Because we don&apos;t sell flights, we aren&apos;t responsible for a
                  seller&apos;s acts or omissions, or for losses caused by changes to a flight. To the extent the law allows, we are not liable for
                  indirect or consequential losses, or for losses caused by events outside our reasonable control.
                </p>
                <p>
                  Nothing in these terms limits or excludes any right you have that cannot be limited by law, including your rights under the
                  Federal Competition and Consumer Protection Act 2018.
                </p>
              </Sub>
              <Sub title="2.8 Changes, governing law and disputes">
                <p>
                  We may update these terms. We&apos;ll change the &quot;last updated&quot; date above and, for significant changes, show a notice
                  on the site. These terms are governed by the laws of the Federal Republic of Nigeria, and disputes will be heard by the courts of{" "}
                  <Fill>state, e.g. Lagos State</Fill>, without affecting your right to complain to a regulator.
                </p>
              </Sub>
            </Section>

            <Section id="money" title="3. How we make money and rank results">
              <Sub title="How Skyfare is paid">
                <p>
                  Skyfare is free to use. When we start working with booking partners, we may earn a commission or referral fee when you click
                  through or book with them. That never changes the price you pay. While we are in testing, we earn nothing.
                </p>
              </Sub>
              <Sub title="How results are ordered">
                <p>You choose the order of results:</p>
                <List>
                  <li>
                    <strong>Best</strong>, our default, balances price, reliability and journey time, with reliable flights first. The Skyfare Pick
                    is the top flight in this order.
                  </li>
                  <li>
                    <strong>Cheapest</strong>, <strong>Fastest</strong>, <strong>Most reliable</strong> and <strong>Departure time</strong> sort by
                    that one thing.
                  </li>
                </List>
                <p>
                  We also list flights we know operate but can&apos;t price yet, so you see every option, not only the ones a partner pays on.
                </p>
              </Sub>
              <Sub title="Our independence commitment">
                <p>
                  No airline or partner can pay to change, remove or hide a reliability score. Commission never affects a score, the Skyfare Pick
                  or the &quot;Best&quot; order. If we ever show advertising or sponsored listings, they will be clearly labelled as such.
                </p>
              </Sub>
              <Sub title="What we may not show">
                <p>
                  We cover as many domestic airlines and flights as we can, but we may not have every fare or every seller. A flight may be
                  available more cheaply elsewhere.
                </p>
              </Sub>
            </Section>

            <Section id="privacy" title="4. Privacy notice">
              <p className="text-[15px] leading-relaxed text-ink">
                This notice explains how we handle personal data under the Nigeria Data Protection Act 2023 (NDPA) and the Nigeria Data Protection
                Commission&apos;s General Application and Implementation Directive 2025. <Fill>company name</Fill> is the data controller.
              </p>
              <Sub title="4.1 What we collect">
                <p>We keep this to a minimum. Skyfare has no accounts, and we don&apos;t ask for your name, email, phone number or payment details.</p>
                <List>
                  <li>
                    <strong>Your searches</strong>: route, dates, number of travellers and cabin. We use them to find flights and prices, and we
                    don&apos;t store them against you.
                  </li>
                  <li>
                    <strong>Technical data</strong>: your IP address and browser details, which every website receives. We use your IP address for
                    about a minute to stop abuse of our search (rate limiting), then discard it. Our hosting provider keeps short-term server logs
                    for security and troubleshooting.
                  </li>
                  <li>
                    <strong>Usage statistics</strong>: page views and page speed, measured without cookies and without identifying you.
                  </li>
                  <li>
                    <strong>Messages you send us</strong>, if you contact us.
                  </li>
                </List>
              </Sub>
              <Sub title="4.2 Why we use it, and our lawful basis">
                <List>
                  <li>To run the service you ask for, such as showing search results (performance of a service you request).</li>
                  <li>To keep Skyfare secure, prevent abuse and fix problems (our legitimate interests, which do not override your rights).</li>
                  <li>To understand overall use and improve Skyfare, using statistics that don&apos;t identify you (legitimate interests).</li>
                  <li>To meet legal obligations and respond to regulators.</li>
                </List>
                <p>
                  If we ever want to use your data for something that needs your consent, such as marketing emails, we will ask first, and you can
                  withdraw consent at any time.
                </p>
              </Sub>
              <Sub title="4.3 Who we share it with">
                <List>
                  <li>
                    <strong>Service providers</strong> who run Skyfare for us under contract, currently Vercel (hosting and usage statistics) and
                    Neon (database). They may only use data on our instructions.
                  </li>
                  <li>
                    <strong>Airlines and travel agents</strong>, only when you click through to them. They receive what your browser sends and
                    whatever you give them; their privacy policies then apply.
                  </li>
                  <li>
                    <strong>Authorities</strong>, where the law requires it.
                  </li>
                </List>
                <p>We don&apos;t sell personal data.</p>
              </Sub>
              <Sub title="4.4 Data outside Nigeria">
                <p>
                  Our servers are in the United Kingdom, and our providers may process data in other countries. Where data leaves Nigeria, we rely
                  on the safeguards the NDPA allows, such as contractual protections with our providers, so it stays adequately protected.
                </p>
              </Sub>
              <Sub title="4.5 How long we keep it">
                <List>
                  <li>IP addresses used for rate limiting: about one minute, in memory only.</li>
                  <li>Server logs held by our hosting provider: <Fill>retention period, e.g. up to 30 days</Fill>.</li>
                  <li>Usage statistics: kept in aggregate form that doesn&apos;t identify you.</li>
                  <li>Messages to us: as long as needed to deal with them, then <Fill>retention period</Fill>.</li>
                </List>
              </Sub>
              <Sub title="4.6 Your rights">
                <p>Under the NDPA you can ask us to:</p>
                <List>
                  <li>confirm whether we hold your data and give you a copy;</li>
                  <li>correct data that is wrong, or delete it;</li>
                  <li>restrict or stop using it, including objecting to processing based on legitimate interests;</li>
                  <li>give you your data in a portable format, where that applies;</li>
                  <li>withdraw consent you have given.</li>
                </List>
                <p>
                  We don&apos;t make decisions about you based solely on automated processing. Our reliability scores rate airlines, not people.
                </p>
                <p>
                  To use your rights, contact <Fill>privacy email</Fill>. We&apos;ll respond within <Fill>response time</Fill>. You can also
                  complain to the Nigeria Data Protection Commission (NDPC).
                </p>
              </Sub>
              <Sub title="4.7 Security and breaches">
                <p>
                  We protect data with encryption in transit, access controls and by collecting as little as we can. If a breach is likely to put
                  your rights at risk, we will tell the NDPC within 72 hours of becoming aware of it, and tell you without undue delay where the
                  risk is high.
                </p>
              </Sub>
              <Sub title="4.8 Children">
                <p>
                  Skyfare is not aimed at children, and we don&apos;t knowingly collect children&apos;s personal data. Anyone under 18 should use
                  Skyfare with a parent or guardian.
                </p>
              </Sub>
              <Sub title="4.9 Contact and changes">
                <p>
                  Data protection contact: <Fill>Data Protection Officer name and email</Fill>. We&apos;ll update this notice when our practices
                  change and show the new date at the top of the page.
                </p>
              </Sub>
            </Section>

            <Section id="cookies" title="5. Cookies and local storage">
              <div className="space-y-2 text-[15px] leading-relaxed text-ink">
                <p>
                  <strong>Skyfare does not set cookies.</strong> Our usage statistics work without them.
                </p>
                <p>
                  We store one setting on your device, in your browser&apos;s local storage: whether you chose light or dark mode (
                  <code className="rounded bg-surface-2 px-1 text-sm">skyfare-theme</code>). It never leaves your device, and you can clear it in
                  your browser settings.
                </p>
                <p>
                  Airline and travel agent sites you visit from Skyfare set their own cookies under their own policies. If we ever add cookies
                  that aren&apos;t strictly necessary, we will ask for your consent first and let you refuse them as easily as accept them.
                </p>
              </div>
            </Section>

            <Section id="complaints" title="6. Complaints and contact">
              <div className="space-y-2 text-[15px] leading-relaxed text-ink">
                <p>
                  Questions or complaints about Skyfare: <Fill>support email</Fill>. We aim to reply within <Fill>response time</Fill>.
                </p>
                <p>If you&apos;re not satisfied, or your complaint is about someone else, these bodies can help:</p>
                <List>
                  <li>
                    <strong>Your flight</strong> (delays, cancellations, refunds, baggage): the airline first, then the Nigerian Civil Aviation
                    Authority (NCAA) consumer protection directorate.
                  </li>
                  <li>
                    <strong>Consumer issues</strong>: the Federal Competition and Consumer Protection Commission (FCCPC).
                  </li>
                  <li>
                    <strong>Personal data</strong>: the Nigeria Data Protection Commission (NDPC).
                  </li>
                </List>
              </div>
            </Section>
          </main>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
