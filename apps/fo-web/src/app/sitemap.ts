import { API_URL } from "@/shared/api";

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailyfunding.example.com";

const STATIC_PATHS = ["", "/investment", "/loan", "/news", "/notice", "/faq", "/disclosure"];

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const staticRoutes = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
  try {
    const res = await fetch(`${API_URL}/products`, { next: { revalidate: 300 } });
    if (!res.ok) return staticRoutes;
    const data = (await res.json()) as { results?: { id: number | string }[] };
    const productRoutes = (data.results ?? []).map((p) => ({
      url: `${SITE_URL}/investment/${p.id}`,
      lastModified: new Date(),
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
};

export default sitemap;
