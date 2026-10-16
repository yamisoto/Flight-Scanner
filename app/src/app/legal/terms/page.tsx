import type { Metadata } from "next";
import Link from "next/link";
import { Fill, List, Section, Sub } from "@/components/legal/LegalText";
import { LEGAL_ROBOTS, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms of use | Skyfare",
  description: "The terms for using Skyfare, how we make money and rank results, and how to complain.",
  alternates: { canonical: "/legal/terms" },
  robots: LEGAL_ROBOTS,
};

const SECTIONS = [
  { id: "about", title: "1. About Skyfare" },
  { id: "terms", title: "2. Using Skyfare" },
  { id: "money", title: "3. How we make money and rank results" },
  { id: "complaints", title: "4. Complaints and contact" },
];

export default function TermsPage() {
  return (
    <LegalShell current="/legal/terms" title="Terms of use" intro="The rules for using Skyfare and how we make money." sections={SECTIONS}>
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

      <Section id="terms" title="2. Using Skyfare">
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

      <Section id="complaints" title="4. Complaints and contact">
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
    </LegalShell>
  );
}
