/**
 * The public site address, for canonical links and the sitemap.
 * NEXT_PUBLIC_SITE_URL wins (set it once a custom domain exists); otherwise
 * Vercel's production domain, which Vercel sets at build time.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
