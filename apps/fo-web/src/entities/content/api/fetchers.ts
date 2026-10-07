import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { API_URL } from "@/shared/api";

export const fetchJson = async <T>(path: string): Promise<T | null> => {
  "use cache";
  cacheLife("content");
  cacheTag("content");
  try {
    const res = await fetch(`${API_URL}${path}`);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
};
