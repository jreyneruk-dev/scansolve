import type { MetadataRoute } from "next";
import { VERTICALS } from "@/lib/verticals";
import { COMPARISONS } from "@/lib/comparisons";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";
  return [
    {
      url: baseUrl,
      lastModified: new Date("2026-05-25"),
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date("2026-07-06"),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-05-25"),
    },
    ...VERTICALS.map((v) => ({
      url: `${baseUrl}/for/${v.slug}`,
      lastModified: new Date("2026-07-06"),
    })),
    ...COMPARISONS.map((c) => ({
      url: `${baseUrl}/compare/${c.slug}`,
      lastModified: new Date("2026-07-07"),
    })),
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2026-08-18"),
    },
    {
      url: `${baseUrl}/dpa`,
      lastModified: new Date("2026-08-18"),
    },
    {
      url: `${baseUrl}/trust`,
      lastModified: new Date("2026-08-18"),
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-01-15"),
    },
  ];
}
