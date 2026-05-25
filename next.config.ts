import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove X-Powered-By: Next.js from all responses — reduces fingerprinting surface
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.scansolve.co" }],
        destination: "https://scansolve.co/:path*",
        permanent: true,
      },
    ];
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
