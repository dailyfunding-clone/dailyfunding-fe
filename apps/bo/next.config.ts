import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  rewrites: async () => [
    { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
  ],
};

export default nextConfig;
