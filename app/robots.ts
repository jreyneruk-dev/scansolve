import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/auth"],
        disallow: ["/dashboard", "/onboarding", "/api/", "/scan/", "/commission/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
