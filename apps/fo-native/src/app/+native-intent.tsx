import { isLocalPath } from "@dailyfunding/bridge";

import { stashPendingPath } from "@/features/deeplink";

const TAB_ROUTES = new Set(["/", "/investment", "/mypage"]);

export const redirectSystemPath = ({ path, initial }: { path: string; initial: boolean }) => {
  try {
    const url = new URL(path);
    const rawPath = url.protocol === "dailyfunding:" ? `/${url.hostname}${url.pathname}` : url.pathname;
    const pathname = decodeURIComponent(rawPath).replace(/\/+$/, "") || "/";
    if (!isLocalPath(pathname)) return "/";
    const target =
      pathname === "/webview" || TAB_ROUTES.has(pathname)
        ? `${pathname}${url.search}`
        : `/webview?path=${encodeURIComponent(`${pathname}${url.search}`)}`;
    if (initial && target !== "/") {
      stashPendingPath(target);
      return "/";
    }
    return target;
  } catch {
    return "/";
  }
};
