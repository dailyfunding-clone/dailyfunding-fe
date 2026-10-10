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
  const res = await fetch(`${API_URL}${path}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`fetchJson ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
};
