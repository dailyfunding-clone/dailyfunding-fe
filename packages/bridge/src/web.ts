import { BRIDGE_VERSION, type WebToNativeMessage } from "./messages";

type ReactNativeWebViewHost = {
  ReactNativeWebView?: { postMessage: (data: string) => void };
};

export function isInWebView(): boolean {
  const host = (globalThis as ReactNativeWebViewHost).ReactNativeWebView;
  return typeof host?.postMessage === "function";
}

export function postToNative(message: WebToNativeMessage): void {
  const host = (globalThis as ReactNativeWebViewHost).ReactNativeWebView;
  if (typeof host?.postMessage !== "function") return;
  host.postMessage(JSON.stringify({ v: BRIDGE_VERSION, ...message }));
}

type ReauthWindow = { __resolveReauth?: (token: string | null) => void };

export function requestReauth(): Promise<string | null> {
  if (!isInWebView()) return Promise.resolve(null);
  return new Promise((resolve) => {
    (globalThis as ReauthWindow).__resolveReauth = resolve;
    postToNative({ type: "auth.reauth" });
  });
}

export const bridge = {
  push: (path: string, title?: string) =>
    postToNative({ type: "nav.push", payload: { path, title } }),
  replace: (path: string, title?: string) =>
    postToNative({ type: "nav.replace", payload: { path, title } }),
  back: () => postToNative({ type: "nav.back" }),
  native: (route: string) =>
    postToNative({ type: "nav.native", payload: { route } }),
  setTitle: (title: string) => postToNative({ type: "title.set", payload: { title } }),
  exchangeAuthCode: (code: string, next?: string) =>
    postToNative({ type: "auth.exchange", payload: { code, next } }),
  signOut: () => postToNative({ type: "auth.signOut" }),
  ready: () => postToNative({ type: "app.ready" }),
};
