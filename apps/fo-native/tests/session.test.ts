import { expect, it, vi } from "vitest";

const storage = vi.hoisted(() => new Map<string, string>());
const gate = vi.hoisted(() => ({ current: null as Promise<void> | null }));
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
    await gate.current;
    return value;
  },
  setItemAsync: async (key: string, value: string) => {
    await gate.current;
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
vi.mock("@/shared", () => ({ WEB_BASE_URL: "https://example.test" }));

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
