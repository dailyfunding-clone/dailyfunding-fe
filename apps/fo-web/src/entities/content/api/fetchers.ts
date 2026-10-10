import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { API_URL } from "@/shared/api";

export const fetchJson = async <T>(
  path: string,
  profile: "content" | "products" = "content",
): Promise<T | null> => {
  "use cache";
  if (profile === "products") cacheLife("products");
  else cacheLife("content");
  cacheTag(profile);
  try {
    const res = await fetch(`${API_URL}${path}`);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
};
