import { expect, it, vi } from "vitest";

const storage = vi.hoisted(() => new Map<string, string>());
const gate = vi.hoisted(() => ({ current: null as Promise<void> | null }));
const lanes = vi.hoisted(() => ({
  get: [] as Promise<void>[],
  set: [] as Promise<void>[],
}));
const refresh = vi.hoisted(() => ({
  calls: 0,
  response: Promise.resolve({
    ok: true,
    json: async () => ({ access_token: "new", refresh_token: "rotated" }),
  }) as Promise<any>,
}));
vi.mock("expo-secure-store", () => ({
  getItemAsync: async (key: string) => {
    const value = storage.get(key) ?? null;
    await (lanes.get.shift() ?? gate.current);
    return value;
  },
  setItemAsync: async (key: string, value: string) => {
    await (lanes.set.shift() ?? gate.current);
    storage.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    storage.delete(key);
  },
}));
vi.mock("ky", () => ({
  default: {
    post: () => {
      refresh.calls += 1;
      return refresh.response;
    },
    get: () => refresh.response,
  },
}));
vi.mock("@/shared", () => ({
  WEB_BASE_URL: "https://example.test",
  unregisterPushToken: async () => {},
  STORAGE_KEYS: {
    accessToken: "access_token",
    refreshToken: "refresh_token",
    userEmail: "user_email",
    pinRegistered: "pin_registered",
    pinBiometric: "pin_biometric",
    biometricEnabled: "biometric_enabled",
    pinResetPending: "pin_reset_pending",
    expoPushToken: "expo_push_token",
  },
}));

it("broadcasts native state and prevents a pending refresh resurrecting logout", async () => {
  const session = await import("../src/features/auth/session");
  const states: unknown[] = [];
  const unsubscribe = session.subscribeSession((state) => {
    states.push(state);
  });
  await session.storeSessionTokens({ access_token: "access", refresh_token: "refresh" });
  expect(await session.getSessionState()).toEqual({ status: "signedIn", accessToken: "access" });
  let resolve!: (value: any) => void;
  refresh.response = new Promise((done) => {
    resolve = done;
  });
  const pending = session.validateStoredSession();
  await vi.waitFor(() => expect(session.isRefreshingSession()).toBe(true));
  await session.clearSession();
  resolve({
    ok: true,
    json: async () => ({ access_token: "stale", refresh_token: "stale-refresh" }),
  });
  await pending;
  expect(await session.getSessionState()).toEqual({ status: "signedOut", accessToken: null });
  expect(storage.has("access_token")).toBe(false);
  expect(storage.has("refresh_token")).toBe(false);
  expect(states.at(-1)).toEqual({ status: "signedOut", accessToken: null });
  unsubscribe();
});

it("discards session reads that resolve after signout", async () => {
  vi.resetModules();
  storage.clear();
  storage.set("access_token", "access");
  let release!: () => void;
  gate.current = new Promise<void>((done) => {
    release = done;
  });
  const session = await import("../src/features/auth/session");
  const pending = session.getSessionState();
  await session.clearSession();
  release();
  gate.current = null;
  expect(await pending).toEqual({ status: "signedOut", accessToken: null });
  expect(await session.getSessionState()).toEqual({ status: "signedOut", accessToken: null });
  expect(storage.has("access_token")).toBe(false);
});

it("rolls back token writes that finish after signout", async () => {
  vi.resetModules();
  storage.clear();
  let release!: () => void;
  gate.current = new Promise<void>((done) => {
    release = done;
  });
  const session = await import("../src/features/auth/session");
  const pending = session.storeSessionTokens({ access_token: "a", refresh_token: "r" });
  await session.clearSession();
  release();
  gate.current = null;
  await pending;
  expect(storage.has("access_token")).toBe(false);
  expect(storage.has("refresh_token")).toBe(false);
  expect(session.sessionState()).toEqual({ status: "signedOut", accessToken: null });
});

it("shares a single refresh across concurrent validations", async () => {
  vi.resetModules();
  storage.clear();
  storage.set("refresh_token", "stored-refresh");
  refresh.calls = 0;
  refresh.response = Promise.resolve({
    ok: true,
    json: async () => ({ access_token: "a", refresh_token: "r2" }),
  });
  const session = await import("../src/features/auth/session");
  const [a, b] = await Promise.all([
    session.validateStoredSession(),
    session.validateStoredSession(),
  ]);
  expect(refresh.calls).toBe(1);
  expect(a).toEqual(b);
  expect(a).toEqual({ token: "r2" });
});

it("reports an unreachable refresh as unknown, not a valid token", async () => {
  vi.resetModules();
  storage.clear();
  storage.set("refresh_token", "stored-refresh");
  refresh.response = Promise.reject(new Error("network down"));
  const session = await import("../src/features/auth/session");
  expect(await session.validateStoredSession()).toEqual({ token: null });
});

it("keeps the session when refresh fails with a server error", async () => {
  vi.resetModules();
  storage.clear();
  storage.set("refresh_token", "stored-refresh");
  refresh.response = Promise.resolve({ ok: false, status: 500 });
  const session = await import("../src/features/auth/session");
  expect(await session.validateStoredSession()).toEqual({ token: null });
  expect(storage.get("refresh_token")).toBe("stored-refresh");
});

it("clears the session when refresh is rejected with 401 or 403", async () => {
  for (const status of [401, 403]) {
    vi.resetModules();
    storage.clear();
    storage.set("refresh_token", "stored-refresh");
    refresh.response = Promise.resolve({ ok: false, status });
    const session = await import("../src/features/auth/session");
    expect(await session.validateStoredSession()).toBeNull();
    expect(storage.has("refresh_token")).toBe(false);
  }
});

it("keeps newer tokens when a stale write rolls back", async () => {
  vi.resetModules();
  storage.clear();
  lanes.get.length = 0;
  lanes.set.length = 0;
  const session = await import("../src/features/auth/session");
  let releaseFirst!: () => void;
  let releaseSecond!: () => void;
  lanes.set.push(
    new Promise<void>((done) => {
      releaseFirst = done;
    }),
    new Promise<void>((done) => {
      releaseSecond = done;
    }),
  );
  const stale = session.storeSessionTokens({ access_token: "a", refresh_token: "r" });
  await session.clearSession();
  releaseFirst();
  await vi.waitFor(() => expect(storage.get("refresh_token")).toBe("r"));
  await session.storeSessionTokens({ access_token: "b", refresh_token: "r2" });
  releaseSecond();
  await stale;
  expect(storage.get("refresh_token")).toBe("r2");
  expect(storage.has("access_token")).toBe(false);
});

it("does not persist profile data captured before signout", async () => {
  vi.resetModules();
  storage.clear();
  let release!: (value: unknown) => void;
  refresh.response = new Promise((done) => {
    release = done;
  });
  const session = await import("../src/features/auth/session");
  const pending = session.storeUserProfile("access");
  await session.clearSession();
  release({
    ok: true,
    status: 200,
    json: async () => ({ email: "user@example.test", pin_registered: true }),
  });
  await pending;
  expect(storage.has("user_email")).toBe(false);
  expect(storage.has("pin_registered")).toBe(false);
});

it("clears cached reauth tokens on signout", async () => {
  vi.resetModules();
  const session = await import("../src/features/auth/session");
  const reauth = await import("../src/features/auth/reauth");
  reauth.cacheReauth("cached-reauth", 300, session.sessionGeneration());
  await session.clearSession();
  expect(reauth.takeFreshReauth(session.sessionGeneration())).toBeNull();
});
