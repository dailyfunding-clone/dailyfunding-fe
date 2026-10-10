import { expect, it, vi } from "vitest";
import { createNativeChannel } from "@dailyfunding/bridge";

const auth = vi.hoisted(() => ({
  generation: 0,
  listeners: new Set<(state: unknown) => void>(),
  sessionState: { status: "signedIn", accessToken: "a" },
  reauthResolve: null as ((token: string | null) => void) | null,
  validations: 0,
  onValidate: null as (() => void) | null,
}));
const kyPost = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth", () => ({
  beginReauth: () =>
    new Promise<string | null>((resolve) => {
      auth.reauthResolve = resolve;
    }),
  clearSession: async () => {},
  getSessionState: async () => auth.sessionState,
  pinGate: { open: false, setOpen() {}, wait: async () => {} },
  resolveReauth: (token: string | null) => {
    auth.reauthResolve?.(token);
    auth.reauthResolve = null;
  },
  sessionGeneration: () => auth.generation,
  sessionState: () => auth.sessionState,
  storeSessionTokens: async () => {},
  storeUserProfile: async () => {},
  subscribeSession: (listener: (state: unknown) => void) => {
    auth.listeners.add(listener);
    return () => auth.listeners.delete(listener);
  },
  takeFreshReauth: () => null,
  validateStoredSession: async () => {
    auth.validations += 1;
    auth.onValidate?.();
  },
}));
vi.mock("@/shared", () => ({ WEB_BASE_URL: "https://example.test" }));
vi.mock("expo-secure-store", () => ({
  getItemAsync: async () => "true",
  setItemAsync: async () => {},
  deleteItemAsync: async () => {},
}));
vi.mock("ky", () => ({ default: { post: kyPost, get: vi.fn() } }));
vi.mock("react-native", () => ({
  InteractionManager: { runAfterInteractions: (fn: () => void) => fn() },
}));

const signedOut = { status: "signedOut", accessToken: null } as const;
const publish = (state: unknown) => {
  for (const listener of auth.listeners) listener(state);
};
const hello = () =>
  JSON.stringify({
    v: 2,
    seq: 0,
    type: "hello",
    payload: { versions: [2], clientId: "page" },
  });
const message = (data: unknown) => ({ nativeEvent: { data: JSON.stringify(data) } }) as any;
const makeRouter = () => ({
  push: vi.fn(),
  navigate: vi.fn(),
  replace: vi.fn(),
  dismissAll: vi.fn(),
});

it("drains pending reauth waiters with a null result on signout", async () => {
  const bridge = await import("../src/features/webview/bridge");
  bridge.createBridgeChannel({ current: null } as any, "wired");
  const sent: any[] = [];
  const channel = createNativeChannel((envelope) => sent.push(envelope), "tab-1");
  const router = makeRouter();
  const deps = {
    router: router as any,
    channel,
    goBack: () => {},
    setTitle: () => {},
    onReady: () => {},
  };
  bridge.handleBridgeMessage({ nativeEvent: { data: hello() } } as any, deps);
  bridge.handleBridgeMessage(message({ v: 2, seq: 1, type: "auth.reauth" }), deps);
  await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/auth/pin-reauth"));
  auth.generation += 1;
  publish(signedOut);
  await vi.waitFor(() =>
    expect(sent.some((m) => m.type === "auth.reauth.result" && m.payload.token === null)).toBe(
      true,
    ),
  );
});

it("unlatches reauth after a silent signout and accepts the next request", async () => {
  const bridge = await import("../src/features/webview/bridge");
  bridge.createBridgeChannel({ current: null } as any, "wired-2");
  const channel = createNativeChannel(() => {}, "tab-unlatch");
  const router = makeRouter();
  const deps = {
    router: router as any,
    channel,
    goBack: () => {},
    setTitle: () => {},
    onReady: () => {},
  };
  bridge.handleBridgeMessage({ nativeEvent: { data: hello() } } as any, deps);
  bridge.handleBridgeMessage(message({ v: 2, seq: 1, type: "auth.reauth" }), deps);
  await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/auth/pin-reauth"));
  publish(signedOut);
  await vi.waitFor(() => expect(auth.reauthResolve).toBeNull());
  await new Promise((resolve) => setTimeout(resolve, 0));
  bridge.handleBridgeMessage(message({ v: 2, seq: 2, type: "auth.reauth" }), deps);
  await vi.waitFor(() => expect(router.push).toHaveBeenCalledTimes(2));
});

it("refreshes the access token once and retries app code on 401", async () => {
  const bridge = await import("../src/features/webview/bridge");
  const sent: any[] = [];
  const channel = createNativeChannel((envelope) => sent.push(envelope), "tab-retry");
  const router = makeRouter();
  const deps = {
    router: router as any,
    channel,
    goBack: () => {},
    setTitle: () => {},
    onReady: () => {},
  };
  bridge.handleBridgeMessage({ nativeEvent: { data: hello() } } as any, deps);
  auth.sessionState = { status: "signedIn", accessToken: "stale" };
  auth.validations = 0;
  auth.onValidate = () => {
    auth.sessionState = { status: "signedIn", accessToken: "refreshed" };
  };
  kyPost.mockReset();
  kyPost
    .mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ code: "fresh-code" }) });
  bridge.handleBridgeMessage(message({ v: 2, seq: 1, type: "auth.appCode" }), deps);
  await vi.waitFor(() => expect(kyPost).toHaveBeenCalledTimes(2));
  auth.onValidate = null;
  await vi.waitFor(() =>
    expect(
      sent.some((m) => m.type === "auth.appCode.result" && m.payload.code === "fresh-code"),
    ).toBe(true),
  );
  expect(kyPost.mock.calls[1][1]?.headers?.Authorization).toBe("Bearer refreshed");
});

it("returns a null app code when signout lands mid-request", async () => {
  const bridge = await import("../src/features/webview/bridge");
  let release!: (value: unknown) => void;
  kyPost.mockImplementationOnce(
    () =>
      new Promise((done) => {
        release = done;
      }) as any,
  );
  const sent: any[] = [];
  const channel = createNativeChannel((envelope) => sent.push(envelope), "tab-2");
  const router = makeRouter();
  const deps = {
    router: router as any,
    channel,
    goBack: () => {},
    setTitle: () => {},
    onReady: () => {},
  };
  bridge.handleBridgeMessage({ nativeEvent: { data: hello() } } as any, deps);
  bridge.handleBridgeMessage(message({ v: 2, seq: 1, type: "auth.appCode" }), deps);
  await vi.waitFor(() => expect(kyPost).toHaveBeenCalled());
  auth.generation += 1;
  release({ ok: true, json: async () => ({ code: "minted-code" }) });
  await vi.waitFor(() =>
    expect(sent.some((m) => m.type === "auth.appCode.result" && m.payload.code === null)).toBe(
      true,
    ),
  );
});
