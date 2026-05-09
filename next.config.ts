import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose server-only secrets via serverRuntimeConfig
  serverRuntimeConfig: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
