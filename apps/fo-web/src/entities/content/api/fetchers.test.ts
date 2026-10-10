import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => undefined,
  cacheTag: () => undefined,
}));
vi.mock("@/shared/api", () => ({ API_URL: "http://api.test/api" }));

import { fetchJson } from "./fetchers";

const respond = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns parsed json when ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond(200, { ok: 1 })),
    );
    await expect(fetchJson<{ ok: number }>("/x")).resolves.toEqual({ ok: 1 });
  });

  it("returns null on 404 only", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond(404)),
    );
    await expect(fetchJson("/missing")).resolves.toBeNull();
  });

  it("throws on 5xx instead of returning null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond(500)),
    );
    await expect(fetchJson("/x")).rejects.toThrow("500");
  });

  it("propagates network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(fetchJson("/x")).rejects.toThrow("Failed to fetch");
  });
});
