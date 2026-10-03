import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skyfare: compare every flight across Nigeria",
  description: "Compare price, journey time and on-time reliability for every Nigerian domestic flight.",
};

// Runs before hydration so a returning visitor who chose dark mode
// never sees a flash of light mode first.
const NO_FLASH_SCRIPT = `
try {
  if (localStorage.getItem('skyfare-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        {/* Page views and Core Web Vitals. No cookies; only records once enabled in the Vercel dashboard. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
