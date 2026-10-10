import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ATTEMPT_STALE_MS,
  claimAttempt,
  getAttempt,
  putAttempt,
} from "./order-attempt-store";

const claim = (tabId: string, idempotencyKey = crypto.randomUUID()) => ({
  tabId,
  idempotencyKey,
  input: { product_id: 7, amount: 100000, use_points: 0, confirm: "네" },
  phase: "open" as const,
});

beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("claimAttempt", () => {
  it("treats an active record as a follower even when the tabId matches", async () => {
    const first = await claimAttempt("1:7", claim("tab-1"));
    expect(first.role).toBe("owner");
    const second = await claimAttempt("1:7", claim("tab-1"));
    expect(second.role).toBe("follower");
    expect(second.attempt.idempotencyKey).toBe(first.attempt.idempotencyKey);
    const stored = await getAttempt("1:7");
    expect(stored?.idempotencyKey).toBe(first.attempt.idempotencyKey);
  });

  it("adopts a stale active record instead of following it", async () => {
    const first = await claimAttempt("1:7", claim("tab-1"));
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + ATTEMPT_STALE_MS + 1_000);
    const second = await claimAttempt("1:7", claim("tab-2", "new-key"));
    expect(second.role).toBe("owner");
    expect(second.attempt.idempotencyKey).toBe(first.attempt.idempotencyKey);
    expect(second.attempt.input).toEqual(first.attempt.input);
  });

  it("lets a fresh active record keep another tab waiting", async () => {
    const first = await claimAttempt("1:7", claim("tab-1"));
    const second = await claimAttempt("1:7", claim("tab-2"));
    expect(second.role).toBe("follower");
    expect(second.attempt.tabId).toBe(first.attempt.tabId);
  });

  it("lets an ambiguous record be reclaimed with its original key", async () => {
    const first = await claimAttempt("1:7", claim("tab-1"));
    await putAttempt({ ...first.attempt, phase: "ambiguous" });
    const second = await claimAttempt("1:7", claim("tab-1"));
    expect(second.role).toBe("owner");
    expect(second.attempt.idempotencyKey).toBe(first.attempt.idempotencyKey);
  });
});

describe("db", () => {
  it("retries opening the database after an open failure", async () => {
    let calls = 0;
    vi.spyOn(indexedDB, "open").mockImplementation(() => {
      calls += 1;
      const req = { error: new Error("blocked") } as IDBOpenDBRequest;
      queueMicrotask(() => req.onerror?.(new Event("error")));
      return req;
    });
    await expect(getAttempt("1:7")).rejects.toBeTruthy();
    await expect(getAttempt("1:7")).rejects.toBeTruthy();
    expect(calls).toBe(2);
  });
});
