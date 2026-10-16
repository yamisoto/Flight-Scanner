import type { Metadata } from "next";
import { Section } from "@/components/legal/LegalText";
import { LEGAL_ROBOTS, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Cookies | Skyfare",
  description: "Skyfare sets no cookies. What we store on your device, and why.",
  alternates: { canonical: "/legal/cookies" },
  robots: LEGAL_ROBOTS,
};

export default function CookiesPage() {
  return (
    <LegalShell current="/legal/cookies" title="Cookies and local storage" intro="What Skyfare stores on your device.">
      <Section id="cookies" title="Cookies and local storage">
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
    </LegalShell>
  );
}
