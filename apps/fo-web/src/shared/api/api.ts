import { createClient, readCsrfToken } from "@dailyfunding/api-client";
import ky from "ky";

import {
  invalidateNativeSession,
  restoreNativeSession,
  subscribeNativeSession,
} from "./native-session";

export { ApiRequestError } from "@dailyfunding/api-client";
export type { ApiError } from "@dailyfunding/api-client";

const AUTH_FLAG = "df_auth";

export const hasSessionHint = () =>
  typeof window !== "undefined" && localStorage.getItem(AUTH_FLAG) === "1";

export const markSession = (on: boolean) => {
  if (typeof window === "undefined") {
    return;
  }
  if (on) {
    localStorage.setItem(AUTH_FLAG, "1");
  } else {
    localStorage.removeItem(AUTH_FLAG);
  }
};

export const csrfHeaders = () => {
  const token = readCsrfToken();
  return token ? { "X-CSRF-Token": token } : {};
};

export const refreshSession = async () => {
  const res = await ky
    .post("/api/auth/refresh", {
      credentials: "include",
      headers: csrfHeaders(),
    })
    .catch(() => null);
  if (res?.ok) {
    markSession(true);
    return true;
  }
  invalidateNativeSession();
  const ok = await restoreNativeSession();
  if (ok) {
    markSession(true);
  }
  return ok;
};

if (typeof window !== "undefined") {
  subscribeNativeSession((state) => {
    if (state.status === "signedOut") {
      markSession(false);
    }
  });
}

const http = ky.create({
  credentials: "include",
  hooks: {
    beforeRequest: [
      async () => {
        await restoreNativeSession();
      },
    ],
    afterResponse: [
      async ({ response, retryCount }) => {
        if (response.status === 401 && retryCount === 0 && (await refreshSession())) {
          return ky.retry();
        }
      },
    ],
  },
});

export const api = createClient({
  onUnauthorized: refreshSession,
});

export const apiFetch = (
  path: string,
  init?: RequestInit & { idempotencyKey?: string },
) => {
  const { idempotencyKey: key, ...rest } = init ?? {};
  const csrf =
    (rest.method ?? "GET").toUpperCase() !== "GET" ? readCsrfToken() : undefined;
  if (!key && !csrf) return http(path, rest);
  const headers = new Headers(rest.headers);
  if (key) headers.set("Idempotency-Key", key);
  if (csrf) headers.set("X-CSRF-Token", csrf);
  return http(path, { ...rest, headers });
};

export const API_URL = `${process.env.API_INTERNAL_URL ?? "http://localhost:8000"}/api`;

export const idempotencyKey = () => crypto.randomUUID();

export const fmtWon = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const fmtPoint = (n: number) => `${n.toLocaleString("ko-KR")}P`;

export const fmtMan = (n: number) =>
  n >= 100_000_000
    ? `${(n / 100_000_000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`
    : `${(n / 10_000).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}만원`;
