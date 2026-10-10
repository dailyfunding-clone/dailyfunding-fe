import { createNativeChannel } from "@dailyfunding/bridge";
import * as SecureStore from "expo-secure-store";
import ky from "ky";
import { InteractionManager } from "react-native";

import {
  beginReauth,
  clearSession,
  getSessionState,
  pinGate,
  sessionGeneration,
  sessionState,
  storeSessionTokens,
  storeUserProfile,
  subscribeSession,
  takeFreshReauth,
} from "@/features/auth";
import { WEB_BASE_URL } from "@/shared";

import { TAB_PATHS } from "./constants";

import type { NativeChannel, NativeEnvelope } from "@dailyfunding/bridge";
import type { Href, useRouter } from "expo-router";
import type { RefObject } from "react";
import type { WebView, WebViewMessageEvent } from "react-native-webview";

type Router = ReturnType<typeof useRouter>;

type BridgeDeps = {
  router: Router;
  channel: NativeChannel;
  goBack: () => void;
  setTitle: (title: string) => void;
  onReady: () => void;
};

const channels = new Set<NativeChannel>();
let sessionBroadcastWired = false;

const wireSessionBroadcast = () => {
  if (sessionBroadcastWired) return;
  sessionBroadcastWired = true;
  subscribeSession((state) => {
    if (state.status === "signedOut") finishReauth(null);
    for (const channel of channels) channel.updateAuth(state);
  });
};

const deliverTo = (webViewRef: RefObject<WebView | null>) => (envelope: NativeEnvelope) => {
  const script = `document.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(envelope))}}));true;`;
  webViewRef.current?.injectJavaScript(script);
};

export const createBridgeChannel = (webViewRef: RefObject<WebView | null>, sessionId: string) => {
  wireSessionBroadcast();
  const channel = createNativeChannel(deliverTo(webViewRef), sessionId);
  channels.add(channel);
  return channel;
};

export const releaseBridgeChannel = (channel: NativeChannel) => {
  channels.delete(channel);
};

const exchangeAuthCode = async (code: string, next: string | undefined, router: Router) => {
  const at = sessionGeneration();
  try {
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
    if (sessionGeneration() !== at) return;
    if (data.access_token) {
      await storeUserProfile(data.access_token);
    }
    if (sessionGeneration() !== at) return;
    router.dismissAll();
    router.replace("/(tabs)");
    if (next) {
      InteractionManager.runAfterInteractions(() => router.push(next as Href));
    }
  } catch {
    return;
  }
};

const signOut = async (router: Router) => {
  try {
    await clearSession();
  } finally {
    router.dismissAll();
    router.replace("/auth");
  }
};

const issueWebSessionCode = async (channel: NativeChannel, requestSeq: number) => {
  const at = sessionGeneration();
  let code: string | null = null;
  try {
    const state = await getSessionState();
    if (state.status === "signedIn" && sessionGeneration() === at) {
      const res = await ky
        .post(`${WEB_BASE_URL}/api/auth/app-code`, {
          headers: { Authorization: `Bearer ${state.accessToken}` },
          throwHttpErrors: false,
        })
        .catch(() => null);
      if (res?.ok) {
        code = ((await res.json()) as { code?: string }).code ?? null;
      }
    }
  } catch {
    code = null;
  }
  channel.send({
    type: "auth.appCode.result",
    payload: { requestSeq, code: sessionGeneration() === at ? code : null },
  });
};

const REAUTH_WAITER_TTL_MS = 60_000;
const MAX_REAUTH_WAITERS = 50;

type ReauthWaiter = {
  channel: NativeChannel;
  requestSeq: number;
  at: number;
  expiresAt: number;
};

const reauthWaiters: ReauthWaiter[] = [];
let reauthInFlight = false;

const sendReauthResult = (waiter: ReauthWaiter, token: string | null) => {
  waiter.channel.send({
    type: "auth.reauth.result",
    payload: { requestSeq: waiter.requestSeq, token },
  });
};

const finishReauth = (token: string | null) => {
  for (const waiter of reauthWaiters.splice(0)) {
    sendReauthResult(waiter, sessionGeneration() === waiter.at ? token : null);
  }
};

const pushReauthWaiter = (channel: NativeChannel, requestSeq: number) => {
  const now = Date.now();
  for (let i = reauthWaiters.length - 1; i >= 0; i--) {
    if (reauthWaiters[i].expiresAt <= now) {
      sendReauthResult(reauthWaiters[i], null);
      reauthWaiters.splice(i, 1);
    }
  }
  if (reauthWaiters.length >= MAX_REAUTH_WAITERS) {
    const oldest = reauthWaiters.shift();
    if (oldest) sendReauthResult(oldest, null);
  }
  reauthWaiters.push({
    channel,
    requestSeq,
    at: sessionGeneration(),
    expiresAt: now + REAUTH_WAITER_TTL_MS,
  });
};

const handleReauth = (channel: NativeChannel, requestSeq: number, router: Router) => {
  pushReauthWaiter(channel, requestSeq);
  if (reauthInFlight) return;
  reauthInFlight = true;
  void (async () => {
    try {
      await pinGate.wait();
      const cached = takeFreshReauth();
      if (cached) {
        finishReauth(cached);
        return;
      }
      const hasPin = (await SecureStore.getItemAsync("pin_registered")) === "true";
      if (!hasPin) {
        finishReauth(null);
        return;
      }
      router.push("/auth/pin-reauth");
      finishReauth(await beginReauth());
    } catch {
      finishReauth(null);
    } finally {
      reauthInFlight = false;
    }
  })();
};

export function handleBridgeMessage(event: WebViewMessageEvent, deps: BridgeDeps) {
  const msg = deps.channel.receive(event.nativeEvent.data, sessionState());
  if (!msg) return;

  switch (msg.type) {
    case "nav.push":
      if (TAB_PATHS.has(msg.payload.path)) {
        // Bridge payloads are runtime strings; isLocalPath already validated them, but they cannot narrow to the literal route union.
        deps.router.navigate(msg.payload.path as Href);
        break;
      }
      deps.router.push({
        pathname: "/webview",
        params: { path: msg.payload.path, title: msg.payload.title ?? "" },
      });
      break;
    case "nav.replace":
      if (TAB_PATHS.has(msg.payload.path)) {
        deps.router.navigate(msg.payload.path as Href);
        break;
      }
      deps.router.replace({
        pathname: "/webview",
        params: { path: msg.payload.path, title: msg.payload.title ?? "" },
      });
      break;
    case "nav.native":
      deps.router.push(msg.payload.route as Href);
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
      handleReauth(deps.channel, msg.seq, deps.router);
      break;
    case "auth.appCode":
      void issueWebSessionCode(deps.channel, msg.seq);
      break;
    case "auth.signOut":
      void signOut(deps.router);
      break;
    case "app.ready":
      deps.onReady();
      break;
  }
}
