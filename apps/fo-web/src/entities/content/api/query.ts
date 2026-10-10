import { API_URL } from "@/shared/api";
import { safeHttpUrl } from "@/shared/lib/safe-url";

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
  if (safeHttpUrl(url)) return url;
  if (url.startsWith("/")) {
    return url.startsWith("//") ? "" : `${API_URL.replace(/\/api\/?$/, "")}${url}`;
  }
  return url.includes(":") ? "" : url;
};
