import type { MetadataRoute } from "next";
import { ROUTES } from "@/lib/data/routes";
import { siteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/flights`, changeFrequency: "weekly", priority: 0.8 },
    ...ROUTES.map((r) => ({ url: `${base}/flights/${r.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    { url: `${base}/how-we-score`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
