import type { MetadataRoute } from "next";

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
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-01-15"),
    },
  ];
}
