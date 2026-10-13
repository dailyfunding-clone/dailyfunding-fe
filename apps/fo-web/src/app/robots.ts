import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailyfunding.example.com";

const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/mypage/", "/api/"],
    },
  ],
  sitemap: `${SITE_URL}/sitemap.xml`,
});

export default robots;
