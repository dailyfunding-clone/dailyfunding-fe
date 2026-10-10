import { BRIDGE_VERSION, parseNativeMessage } from "./messages";
import type { AuthState, BridgeEnvelope, WebToNativeMessage } from "./messages";

type AuthListener = (state: AuthState) => void | Promise<void>;
const REQUEST_TIMEOUT_MS = 15_000;
const HELLO_RETRY_MS = 1_000;

export const createWebBridge = (
  deliver: (raw: string) => void,
  listen: (receive: (raw: string) => void) => () => void,
) => {
  const clientId = `${Date.now()}-${Math.random()}`;
  let seq = 0;
  let sessionId: string | null = null;
  let started = false;
  let disposed = false;
  let retry: ReturnType<typeof setInterval> | undefined;
  let reauth: Promise<string | null> | null = null;
  let receiving = Promise.resolve();
  const queued: BridgeEnvelope[] = [];
  const received = new Set<number>();
  const listeners = new Set<AuthListener>();
  const requests = new Map<
    number,
    { resolve: (value: AuthState | string | null) => void; reject: (error: Error) => void }
  >();
  const emit = (message: BridgeEnvelope) => deliver(JSON.stringify(message));
  const hello = () =>
    emit({
      v: BRIDGE_VERSION,
      seq: 0,
      type: "hello",
      payload: { versions: [BRIDGE_VERSION], clientId },
    });
  const publish = async (state: AuthState) => {
    for (const listener of listeners) await listener(state);
  };
  const unlisten = listen((raw) => {
    receiving = receiving
      .then(async () => {
        if (disposed) return;
        const message = parseNativeMessage(raw);
        if (!message) return;
        if (message.type === "hello.reject") {
          clearInterval(retry);
          for (const request of requests.values())
            request.reject(new Error("Unsupported bridge version"));
          queued.length = 0;
          return;
        }
        if (message.type === "hello.ack") {
          if (message.payload.clientId !== clientId) return;
          await publish(message.payload.authState);
          if (sessionId !== message.sessionId) received.clear();
          sessionId = message.sessionId;
          clearInterval(retry);
          queued.splice(0).forEach(emit);
          return;
        }
        if (message.sessionId !== sessionId) return;
        if (!received.has(message.seq)) {
          if (message.type === "auth.changed") await publish(message.payload);
          if (message.type === "auth.state")
            requests.get(message.payload.requestSeq)?.resolve(message.payload.authState);
          if (message.type === "auth.reauth.result")
            requests.get(message.payload.requestSeq)?.resolve(message.payload.token);
          received.add(message.seq);
        }
        emit({
          v: BRIDGE_VERSION,
          seq: ++seq,
          type: "ack",
          payload: { seq: message.seq, sessionId },
        });
      })
      .catch(() => undefined);
  });
  const start = () => {
    if (started) return;
    started = true;
    retry = setInterval(hello, HELLO_RETRY_MS);
    hello();
  };
  const post = (message: WebToNativeMessage) => {
    if (disposed) throw new Error("Bridge disposed");
    const envelope: BridgeEnvelope = { ...message, v: BRIDGE_VERSION, seq: ++seq };
    if (sessionId) emit(envelope);
    else {
      queued.push(envelope);
      start();
    }
    return envelope.seq;
  };
  const request = (type: "auth.getState" | "auth.reauth") =>
    new Promise<AuthState | string | null>((resolve, reject) => {
      const number = seq + 1;
      const finish = () => {
        clearTimeout(timeout);
        requests.delete(number);
      };
      const timeout = setTimeout(() => {
        finish();
        const index = queued.findIndex((message) => message.seq === number);
        if (index >= 0) queued.splice(index, 1);
        reject(new Error("Bridge request timed out"));
      }, REQUEST_TIMEOUT_MS);
      requests.set(number, {
        resolve: (value) => {
          finish();
          resolve(value);
        },
        reject: (error) => {
          finish();
          reject(error);
        },
      });
      post({ type });
    });
  return {
    post,
    getAuthState: () => request("auth.getState") as Promise<AuthState>,
    subscribeAuthState: (listener: AuthListener) => {
      listeners.add(listener);
      start();
      return () => {
        listeners.delete(listener);
      };
    },
    requestReauth: () => {
      reauth ??= (request("auth.reauth") as Promise<string | null>)
        .catch(() => null)
        .finally(() => {
          reauth = null;
        });
      return reauth;
    },
    replay: () => {
      if (sessionId) post({ type: "replay", payload: { after: 0, sessionId } });
    },
    dispose: () => {
      disposed = true;
      clearInterval(retry);
      unlisten();
      for (const request of requests.values()) request.reject(new Error("Bridge disposed"));
      listeners.clear();
      queued.length = 0;
    },
  };
};

type ReactNativeWebViewHost = { ReactNativeWebView?: { postMessage: (data: string) => void } };
export const isInWebView = () =>
  typeof (globalThis as ReactNativeWebViewHost).ReactNativeWebView?.postMessage === "function";
let client: ReturnType<typeof createWebBridge> | undefined;
const getClient = () => {
  if (!isInWebView()) return undefined;
  client ??= createWebBridge(
    (raw) => (globalThis as ReactNativeWebViewHost).ReactNativeWebView?.postMessage(raw),
    (receive) => {
      const listener = (event: MessageEvent) => {
        if (typeof event.data === "string") receive(event.data);
      };
      window.addEventListener("message", listener);
      document.addEventListener("message", listener as EventListener);
      return () => {
        window.removeEventListener("message", listener);
        document.removeEventListener("message", listener as EventListener);
      };
    },
  );
  return client;
};

export const postToNative = (message: WebToNativeMessage): void => {
  getClient()?.post(message);
};
export const requestReauth = (): Promise<string | null> =>
  getClient()?.requestReauth() ?? Promise.resolve(null);
export const getAuthState = (): Promise<AuthState> =>
  getClient()?.getAuthState() ?? Promise.resolve({ status: "signedOut", accessToken: null });
export const subscribeAuthState = (listener: AuthListener) =>
  getClient()?.subscribeAuthState(listener) ?? (() => {});

export const bridge = {
  push: (path: string, title?: string) =>
    postToNative({ type: "nav.push", payload: { path, title } }),
  replace: (path: string, title?: string) =>
    postToNative({ type: "nav.replace", payload: { path, title } }),
  back: () => postToNative({ type: "nav.back" }),
  native: (route: string) => postToNative({ type: "nav.native", payload: { route } }),
  setTitle: (title: string) => postToNative({ type: "title.set", payload: { title } }),
  exchangeAuthCode: (code: string, next?: string) =>
    postToNative({ type: "auth.exchange", payload: { code, next } }),
  signOut: () => postToNative({ type: "auth.signOut" }),
  ready: () => postToNative({ type: "app.ready" }),
  getAuthState,
  subscribeAuthState,
  replay: () => getClient()?.replay(),
};
