import { readCsrfToken } from "@dailyfunding/api-client";
import { createWebBridge } from "@dailyfunding/bridge";

import type { AuthState } from "@dailyfunding/bridge";

type ReactNativeWebViewApi = { postMessage: (raw: string) => void };

const webViewApi = (): ReactNativeWebViewApi | null =>
  typeof window !== "undefined" && "ReactNativeWebView" in window
    ? (window as { ReactNativeWebView: ReactNativeWebViewApi }).ReactNativeWebView
    : null;

let bridge: ReturnType<typeof createWebBridge> | null = null;
let minted = false;
let inFlight: Promise<boolean> | null = null;
const listeners = new Set<(state: AuthState) => void>();

const getBridge = () => {
  const wv = webViewApi();
  if (!wv) return null;
  bridge ??= (() => {
    const created = createWebBridge(
      (raw) => wv.postMessage(raw),
      (receive) => {
        const onMessage = (event: MessageEvent) => {
          receive(typeof event.data === "string" ? event.data : JSON.stringify(event.data));
        };
        document.addEventListener("message", onMessage as EventListener);
        window.addEventListener("message", onMessage);
        return () => {
          document.removeEventListener("message", onMessage as EventListener);
          window.removeEventListener("message", onMessage);
        };
      },
    );
    created.subscribeAuthState((state) => {
      if (state.status === "signedOut") minted = false;
      for (const listener of listeners) void listener(state);
    });
    return created;
  })();
  return bridge;
};

export const subscribeNativeSession = (listener: (state: AuthState) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const invalidateNativeSession = () => {
  minted = false;
};

export const restoreNativeSession = (): Promise<boolean> => {
  const b = getBridge();
  if (!b) return Promise.resolve(true);
  if (minted) return Promise.resolve(true);
  inFlight ??= (async () => {
    const state = await b.getAuthState();
    if (state.status !== "signedIn") return false;
    const code = await b.requestAppCode();
    if (!code) return false;
    const csrf = readCsrfToken();
    const res = await fetch("/api/auth/app-code/exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ code }),
    }).catch(() => null);
    minted = res?.ok ?? false;
    return minted;
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
};
