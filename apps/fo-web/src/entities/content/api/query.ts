import { API_URL } from "@/shared/api";

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
