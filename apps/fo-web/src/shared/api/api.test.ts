import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

const headerOf = (call: unknown[], name: string) =>
  call[0] instanceof Request
    ? call[0].headers.get(name)
    : new Request(call[0] as RequestInfo | URL, call[1] as RequestInit | undefined).headers.get(
        name,
      );

describe("apiFetch", () => {
  it("sends Idempotency-Key on multipart submits", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const body = new FormData();
    body.set("amount", "1000");
    await apiFetch("http://test.local/api/loans/applications", {
      method: "POST",
      body,
      idempotencyKey: "draft-key",
    });
    expect(headerOf(fetchMock.mock.calls[0], "Idempotency-Key")).toBe("draft-key");
  });

  it("keeps caller headers alongside the key", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("http://test.local/api/me/grade-request", {
      method: "POST",
      headers: { "X-Reauth-Token": "token" },
      body: new FormData(),
      idempotencyKey: "k",
    });
    const call = fetchMock.mock.calls[0];
    expect(headerOf(call, "Idempotency-Key")).toBe("k");
    expect(headerOf(call, "X-Reauth-Token")).toBe("token");
  });

  it("omits the header when no key is provided", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("http://test.local/api/me/limit-assessment", {
      method: "POST",
      body: new FormData(),
    });
    expect(headerOf(fetchMock.mock.calls[0], "Idempotency-Key")).toBeNull();
  });

  it("sends X-CSRF-Token from the csrf cookie on mutations", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    document.cookie = "csrf=tok123";
    await apiFetch("http://test.local/api/me/grade-request", {
      method: "POST",
      body: new FormData(),
    });
    expect(headerOf(fetchMock.mock.calls[0], "X-CSRF-Token")).toBe("tok123");
    document.cookie = "csrf=; max-age=0";
  });

  it("does not send X-CSRF-Token on GET", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    document.cookie = "csrf=tok123";
    await apiFetch("http://test.local/api/notifications");
    expect(headerOf(fetchMock.mock.calls[0], "X-CSRF-Token")).toBeNull();
    document.cookie = "csrf=; max-age=0";
  });
});
