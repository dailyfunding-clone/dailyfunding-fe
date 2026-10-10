import { expect, it, vi } from "vitest";

const storage = vi.hoisted(() => new Map<string, string>());
const refresh = vi.hoisted(() => ({
  response: Promise.resolve({
    ok: true,
    json: async () => ({ access_token: "new", refresh_token: "rotated" }),
  }),
}));
vi.mock("expo-secure-store", () => ({
  getItemAsync: async (key: string) => storage.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    storage.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    storage.delete(key);
  },
}));
vi.mock("ky", () => ({ default: { post: () => refresh.response } }));
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
