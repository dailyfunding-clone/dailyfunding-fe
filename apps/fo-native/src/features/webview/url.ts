import { WEB_BASE_URL } from "@/shared";

export const WEB_ORIGIN = new URL(WEB_BASE_URL).origin;

export const resolveWebUrl = (path: string) => {
  try {
    const parsed = new URL(path, WEB_BASE_URL);
    if (parsed.origin === WEB_ORIGIN) return parsed.toString();
  } catch {
    return `${WEB_ORIGIN}/`;
  }
  return `${WEB_ORIGIN}/`;
};
