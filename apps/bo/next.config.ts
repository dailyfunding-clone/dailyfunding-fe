import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  rewrites: async () => [
    {
      source: "/api/:path*",
      destination: `${process.env.API_INTERNAL_URL ?? "http://localhost:8000"}/api/:path*`,
    },
  ],
};

export default nextConfig;
