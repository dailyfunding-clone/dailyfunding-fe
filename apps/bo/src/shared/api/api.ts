import { createClient, readCsrfToken } from "@dailyfunding/api-client";
import ky from "ky";

export { ApiRequestError } from "@dailyfunding/api-client";

let refreshing: Promise<boolean> | null = null;

export const refreshSession = () => {
  const csrf = readCsrfToken();
  refreshing ??= ky
    .post("/api/auth/refresh", {
      credentials: "include",
      throwHttpErrors: false,
      ...(csrf ? { headers: { "X-CSRF-Token": csrf } } : {}),
    })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

export const api = createClient({ onUnauthorized: refreshSession });

export const fmtWon = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const fmtMan = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 100_000_000)
    return `${(n / 100_000_000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`;
  if (abs >= 10_000)
    return `${(n / 10_000).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}만원`;
  return `${n.toLocaleString("ko-KR")}원`;
};
