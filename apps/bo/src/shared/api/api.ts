import { createClient } from "@dailyfunding/api-client";
import ky from "ky";

export { ApiRequestError } from "@dailyfunding/api-client";
export type { ApiError } from "@dailyfunding/api-client";

declare global {
  interface Window {
    __restoreSession?: Promise<void>;
  }
}

export const refreshSession = async () => {
  const res = await ky.post("/api/auth/refresh", { credentials: "include" });
  return res.ok;
};

const http = ky.create({
  credentials: "include",
  hooks: {
    beforeRequest: [
      async () => {
        if (typeof window !== "undefined" && window.__restoreSession) {
          await window.__restoreSession;
        }
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

const waitSessionRestore = async () => {
  if (typeof window !== "undefined" && window.__restoreSession) {
    await window.__restoreSession;
  }
};

export const api = createClient({
  beforeRequest: waitSessionRestore,
  onUnauthorized: refreshSession,
});

export const apiFetch = (path: string, init?: RequestInit) => http(path, init);

export const API_URL =
  process.env.API_INTERNAL_URL ?? "http://localhost:8000/api";

export const idempotencyKey = () => crypto.randomUUID();

export const fmtWon = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const fmtMan = (n: number) =>
  n >= 100_000_000
    ? `${(n / 100_000_000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`
    : `${(n / 10_000).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}만원`;

export const apiPatch = <T = unknown>(path: string, body: unknown): Promise<T> =>
  api.request<T>("patch", path, body);

export const apiDelete = <T = null>(path: string): Promise<T> =>
  api.request<T>("delete", path);
