import { parseBridgeMessage } from "@dailyfunding/bridge";
import * as SecureStore from "expo-secure-store";
import ky from "ky";

import { beginReauth , clearSession, pinGate, takeFreshReauth , storeSessionTokens, storeUserProfile } from "@/features/auth";
import { WEB_BASE_URL } from "@/shared";

import { TAB_PATHS } from "./constants";

import type { useRouter } from "expo-router";
import type { RefObject } from "react";
import type { WebView, WebViewMessageEvent } from "react-native-webview";


let reauthInFlight = false;

type Router = ReturnType<typeof useRouter>;

type BridgeDeps = {
  router: Router;
  goBack: () => void;
  setTitle: (title: string) => void;
  onReady: () => void;
  webViewRef?: RefObject<WebView | null>;
};

const exchangeAuthCode = async (code: string, next: string | undefined, router: Router) => {
  const res = await ky.post(`${WEB_BASE_URL}/api/auth/app-code/exchange`, {
    json: { code },
    throwHttpErrors: false,
  });
  if (!res.ok) return;
  const data = (await res.json()) as {
    refresh_token?: string;
    access_token?: string;
  };
  if (!data.refresh_token) return;
  await storeSessionTokens(data);
  if (data.access_token) {
    await storeUserProfile(data.access_token);
  }
  router.dismissAll();
  router.replace("/(tabs)");
  if (next) {
    setTimeout(() => router.push(next as never), 100);
  }
};

const signOut = async (router: Router) => {
  await clearSession();
  router.dismissAll();
  router.replace("/auth");
};

export function handleBridgeMessage(event: WebViewMessageEvent, deps: BridgeDeps) {
  const msg = parseBridgeMessage(event.nativeEvent.data);
  if (!msg) return;

  switch (msg.type) {
    case "nav.push":
      if (TAB_PATHS.has(msg.payload.path)) {
        deps.router.navigate(msg.payload.path as never);
        break;
      }
      deps.router.push({
        pathname: "/webview",
        params: { path: msg.payload.path, title: msg.payload.title ?? "" },
      });
      break;
    case "nav.replace":
      if (TAB_PATHS.has(msg.payload.path)) {
        deps.router.navigate(msg.payload.path as never);
        break;
      }
      deps.router.replace({
        pathname: "/webview",
        params: { path: msg.payload.path, title: msg.payload.title ?? "" },
      });
      break;
    case "nav.native":
      deps.router.push(msg.payload.route as never);
      break;
    case "nav.back":
      deps.goBack();
      break;
    case "title.set":
      deps.setTitle(msg.payload.title);
      break;
    case "auth.exchange":
      void exchangeAuthCode(msg.payload.code, msg.payload.next, deps.router);
      break;
    case "auth.reauth":
      if (reauthInFlight) break;
      reauthInFlight = true;
      void (async () => {
        try {
          await pinGate.wait();
          const cached = takeFreshReauth();
          if (cached) {
            deps.webViewRef?.current?.injectJavaScript(
              `window.__resolveReauth(${JSON.stringify(cached)});true;`,
            );
            return;
          }
          const hasPin =
            (await SecureStore.getItemAsync("pin_registered")) === "true";
          if (!hasPin) {
            deps.webViewRef?.current?.injectJavaScript(
              "window.__resolveReauth(null);true;",
            );
            return;
          }
          deps.router.push("/auth/pin-reauth" as never);
          const token = await beginReauth();
          deps.webViewRef?.current?.injectJavaScript(
            `window.__resolveReauth(${JSON.stringify(token)});true;`,
          );
        } finally {
          reauthInFlight = false;
        }
      })();
      break;
    case "auth.signOut":
      void signOut(deps.router);
      break;
    case "app.ready":
      deps.onReady();
      break;
  }
}
