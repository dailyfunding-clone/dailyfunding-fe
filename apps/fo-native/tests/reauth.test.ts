import { expect, it, vi } from "vitest";
import {
  beginReauth,
  cacheReauth,
  clearReauth,
  takeFreshReauth,
} from "../src/features/auth/reauth";

it("binds cached reauth tokens to the session generation", () => {
  clearReauth();
  cacheReauth("token-1", 300, 1);
  expect(takeFreshReauth(2)).toBeNull();
  cacheReauth("token-1", 300, 1);
  expect(takeFreshReauth(1)).toBe("token-1");
  expect(takeFreshReauth(1)).toBeNull();
});

it("drops the cached token on clearReauth", () => {
  clearReauth();
  cacheReauth("token-2", 300, 1);
  clearReauth();
  expect(takeFreshReauth(1)).toBeNull();
});

it("unlatches beginReauth on clear and resolves on timeout", async () => {
  vi.useFakeTimers();
  try {
    clearReauth();
    const pending = beginReauth();
    clearReauth();
    await expect(pending).resolves.toBeNull();
    const timed = beginReauth();
    await vi.advanceTimersByTimeAsync(60_000);
    await expect(timed).resolves.toBeNull();
  } finally {
    vi.useRealTimers();
  }
});
