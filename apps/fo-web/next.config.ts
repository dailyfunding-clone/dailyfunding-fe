import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    instantInsights: { validationLevel: "manual-warning" },
  },
  poweredByHeader: false,
  allowedDevOrigins: ["10.0.2.2"],
  transpilePackages: ["@dailyfunding/bridge", "@dailyfunding/design-system"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  cacheLife: {
    content: {
      stale: 30,
      revalidate: 30,
      expire: 300,
    },
    products: {
      stale: 15,
      revalidate: 15,
      expire: 300,
    },
  },
  rewrites: async () => [
    {
      source: "/api/:path*",
      destination: `${process.env.API_INTERNAL_URL ?? "http://localhost:8000"}/api/:path*`,
    },
  ],
};

export default nextConfig;
