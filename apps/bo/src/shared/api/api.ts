import { createClient } from "@dailyfunding/api-client";
import ky from "ky";

export { ApiRequestError } from "@dailyfunding/api-client";

let refreshing: Promise<boolean> | null = null;

export const refreshSession = () => {
  refreshing ??= ky
    .post("/api/auth/refresh", {
      credentials: "include",
      throwHttpErrors: false,
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

export const fmtMan = (n: number) =>
  n >= 100_000_000
    ? `${(n / 100_000_000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`
    : `${(n / 10_000).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}만원`;
