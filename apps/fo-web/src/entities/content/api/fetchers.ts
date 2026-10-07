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

export const firstParam = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export const qs = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const s = search.toString();
  return s ? `?${s}` : "";
};

export const fileUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_URL.replace(/\/api\/?$/, "")}${url}`;
  return url;
};

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("ko-KR") : "";
