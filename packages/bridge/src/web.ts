import { BRIDGE_VERSION, type WebToNativeMessage } from "./messages";

type ReactNativeWebViewHost = {
  ReactNativeWebView?: { postMessage: (data: string) => void };
};

export function isInWebView(): boolean {
  return !!(globalThis as ReactNativeWebViewHost).ReactNativeWebView;
}

export function postToNative(message: WebToNativeMessage): void {
  (globalThis as ReactNativeWebViewHost).ReactNativeWebView?.postMessage(
    JSON.stringify({ v: BRIDGE_VERSION, ...message }),
  );
}

export const bridge = {
  push: (path: string, title?: string) =>
    postToNative({ type: "nav.push", payload: { path, title } }),
  replace: (path: string, title?: string) =>
    postToNative({ type: "nav.replace", payload: { path, title } }),
  back: () => postToNative({ type: "nav.back" }),
  setTitle: (title: string) => postToNative({ type: "title.set", payload: { title } }),
  ready: () => postToNative({ type: "app.ready" }),
};
