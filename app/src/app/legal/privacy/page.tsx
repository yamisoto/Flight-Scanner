import type { Metadata } from "next";
import { Fill, List, Section } from "@/components/legal/LegalText";
import { LEGAL_ROBOTS, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy notice | Skyfare",
  description: "How Skyfare handles personal data under the Nigeria Data Protection Act 2023.",
  alternates: { canonical: "/legal/privacy" },
  robots: LEGAL_ROBOTS,
};

const SECTIONS = [
  { id: "what-we-collect", title: "1. What we collect" },
  { id: "why-we-use-it", title: "2. Why we use it, and our lawful basis" },
  { id: "who-we-share-it-with", title: "3. Who we share it with" },
  { id: "data-outside-nigeria", title: "4. Data outside Nigeria" },
  { id: "how-long-we-keep-it", title: "5. How long we keep it" },
  { id: "your-rights", title: "6. Your rights" },
  { id: "security", title: "7. Security and breaches" },
  { id: "children", title: "8. Children" },
  { id: "contact", title: "9. Contact and changes" },
];

export default function PrivacyPage() {
  return (
    <LegalShell current="/legal/privacy" title="Privacy notice" intro="What we collect, why, and your rights." sections={SECTIONS}>
      <p className="text-[15px] leading-relaxed text-ink">
          This notice explains how we handle personal data under the Nigeria Data Protection Act 2023 (NDPA) and the Nigeria Data Protection
          Commission&apos;s General Application and Implementation Directive 2025. <Fill>company name</Fill> is the data controller.
        </p>

      <Section id="what-we-collect" title="1. What we collect">
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
      </Section>

      <Section id="why-we-use-it" title="2. Why we use it, and our lawful basis">
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
      </Section>

      <Section id="who-we-share-it-with" title="3. Who we share it with">
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
      </Section>

      <Section id="data-outside-nigeria" title="4. Data outside Nigeria">
          <p>
            Our servers are in the United Kingdom, and our providers may process data in other countries. Where data leaves Nigeria, we rely
            on the safeguards the NDPA allows, such as contractual protections with our providers, so it stays adequately protected.
          </p>
      </Section>

      <Section id="how-long-we-keep-it" title="5. How long we keep it">
          <List>
            <li>IP addresses used for rate limiting: about one minute, in memory only.</li>
            <li>Server logs held by our hosting provider: <Fill>retention period, e.g. up to 30 days</Fill>.</li>
            <li>Usage statistics: kept in aggregate form that doesn&apos;t identify you.</li>
            <li>Messages to us: as long as needed to deal with them, then <Fill>retention period</Fill>.</li>
          </List>
      </Section>

      <Section id="your-rights" title="6. Your rights">
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
      </Section>

      <Section id="security" title="7. Security and breaches">
          <p>
            We protect data with encryption in transit, access controls and by collecting as little as we can. If a breach is likely to put
            your rights at risk, we will tell the NDPC within 72 hours of becoming aware of it, and tell you without undue delay where the
            risk is high.
          </p>
      </Section>

      <Section id="children" title="8. Children">
          <p>
            Skyfare is not aimed at children, and we don&apos;t knowingly collect children&apos;s personal data. Anyone under 18 should use
            Skyfare with a parent or guardian.
          </p>
      </Section>

      <Section id="contact" title="9. Contact and changes">
          <p>
            Data protection contact: <Fill>Data Protection Officer name and email</Fill>. We&apos;ll update this notice when our practices
            change and show the new date at the top of the page.
          </p>
      </Section>
    </LegalShell>
  );
}
