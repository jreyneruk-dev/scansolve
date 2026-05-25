import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scansolve.co";
  return {
    rules: [
      // AI search bots — explicitly allowed to index and cite content
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Amazonbot", allow: "/" },
      // Training-only scrapers — blocked (commercial content)
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "anthropic-ai", disallow: "/" },
      { userAgent: "cohere-ai", disallow: "/" },
      // All other crawlers
      {
        userAgent: "*",
        allow: ["/", "/about", "/privacy"],
        disallow: ["/dashboard", "/onboarding", "/api/", "/scan/", "/commission/", "/auth"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
