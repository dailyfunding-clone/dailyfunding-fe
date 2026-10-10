import { BroadcastChannel } from "node:worker_threads";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError, api } from "@/shared/api";

import { ATTEMPT_STALE_MS, claimAttempt } from "./lib/order-attempt-store";
import { useInvestOrder } from "./use-invest-order";

import type { ReactNode } from "react";

const orderResult = {
  investment_id: 42,
  amount: 100000,
  points_used: 0,
  expected_net_return: 5000,
  status: "active",
  schedule: [],
};
const input = { amount: 100000, use_points: 0 };
const setup = (ensure = async (): Promise<string | null> => "reauth-token", accountId = 1) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const reauth = { ensure, reset: vi.fn() };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...renderHook(() => useInvestOrder({ accountId, productId: 7, reauth }), { wrapper }),
    client,
    reauth,
  };
};

beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("BroadcastChannel", BroadcastChannel);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useInvestOrder", () => {
  it("locks before reauth, submits once, confirms with GET, and invalidates real investment queries", async () => {
    const gate = Promise.withResolvers<string | null>();
    const submitted = Promise.withResolvers<typeof orderResult>();
    const confirmed = Promise.withResolvers<typeof orderResult>();
    const request = vi
      .spyOn(api, "request")
      .mockImplementation(async (method) =>
        method === "post" ? submitted.promise : confirmed.promise,
      );
    const { result, client } = setup(() => gate.promise);
    client.setQueryData(["me-investments", "", ""], { results: [], total: 0, page: 1 });
    expect(result.current.state.status).toBe("idle");
    let running: Promise<void>;
    act(() => {
      running = result.current.submit(input);
      void result.current.submit(input);
    });
    await waitFor(() => expect(result.current.state.status).toBe("reauth"));
    await act(async () => {
      gate.resolve("token");
    });
    await waitFor(() => expect(result.current.state.status).toBe("submitting"));
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      "post",
      "/api/investments",
      { product_id: 7, ...input, confirm: "네" },
      { idempotencyKey: expect.any(String), reauthToken: "token" },
    );
    await act(async () => {
      submitted.resolve(orderResult);
    });
    await waitFor(() => expect(result.current.state.status).toBe("confirming"));
    expect(request).toHaveBeenLastCalledWith("get", "/api/investments/42");
    await act(async () => {
      confirmed.resolve(orderResult);
      await running;
    });
    expect(result.current.state).toMatchObject({ status: "done", result: { investment_id: 42 } });
    expect(client.getQueryState(["me-investments", "", ""])?.isInvalidated).toBe(true);
  });

  it("retries a transport failure once with the same key", async () => {
    const request = vi
      .spyOn(api, "request")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue(orderResult);
    const { result } = setup();
    await act(() => result.current.submit(input));
    const posts = request.mock.calls.filter(([method]) => method === "post");
    expect(posts).toHaveLength(2);
    expect(posts[0][3]?.idempotencyKey).toBeTruthy();
    expect(posts[1][3]?.idempotencyKey).toBe(posts[0][3]?.idempotencyKey);
    expect(result.current.state.status).toBe("done");
  });

  it("retains an ambiguous attempt across remount and rejects changing its amount", async () => {
    const request = vi.spyOn(api, "request").mockRejectedValue(new TypeError("Failed to fetch"));
    const first = setup();
    await act(() => first.result.current.submit(input));
    expect(first.result.current.state).toMatchObject({ status: "failed", recoverable: true });
    expect(request).toHaveBeenCalledTimes(2);
    const key = request.mock.calls[0][3]?.idempotencyKey;
    first.unmount();
    const second = setup();
    await waitFor(() => expect(second.result.current.state.status).toBe("failed"));
    request.mockResolvedValue(orderResult);
    await act(() => second.result.current.submit({ amount: 200000, use_points: 3000 }));
    expect(request.mock.calls[2]).toEqual([
      "post",
      "/api/investments",
      { product_id: 7, ...input, confirm: "네" },
      { idempotencyKey: key, reauthToken: "reauth-token" },
    ]);
    expect(second.result.current.state.status).toBe("done");
  });

  it.each([409, 428])("does not automatically resubmit HTTP %s", async (status) => {
    const request = vi.spyOn(api, "request").mockRejectedValue(
      new ApiRequestError({
        status,
        code: status === 428 ? "REAUTH_REQUIRED" : "INSUFFICIENT_REMAINING",
        details: { remaining: 1000 },
      }),
    );
    const { result, reauth } = setup();
    await act(() => result.current.submit(input));
    expect(result.current.state).toMatchObject({ status: "failed", recoverable: false });
    expect(request).toHaveBeenCalledTimes(1);
    if (status === 428) expect(reauth.reset).toHaveBeenCalledOnce();
  });

  it("cancelled reauthentication sends no order and releases the attempt", async () => {
    const request = vi.spyOn(api, "request");
    const { result } = setup(async () => null);
    await act(() => result.current.submit(input));
    expect(result.current.state).toMatchObject({ status: "failed", recoverable: false });
    expect(request).not.toHaveBeenCalled();
  });

  it("allows one simultaneous owner across tabs and confirms the follower from the server", async () => {
    const submitted = Promise.withResolvers<typeof orderResult>();
    const request = vi
      .spyOn(api, "request")
      .mockImplementation(async (method) => (method === "post" ? submitted.promise : orderResult));
    const first = setup();
    const second = setup();
    let running: Promise<void[]>;
    act(() => {
      running = Promise.all([
        first.result.current.submit(input),
        second.result.current.submit(input),
      ]);
    });
    await waitFor(() =>
      expect(request.mock.calls.filter(([method]) => method === "post")).toHaveLength(1),
    );
    await act(async () => {
      submitted.resolve(orderResult);
      await running;
    });
    await waitFor(() => expect(first.result.current.state.status).toBe("done"));
    await waitFor(() => expect(second.result.current.state.status).toBe("done"));
    expect(request.mock.calls.filter(([method]) => method === "post")).toHaveLength(1);
    expect(
      request.mock.calls.filter(
        ([method, url]) => method === "get" && url === "/api/investments/42",
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("posts once when a second hook resubmits while the owner's post is pending", async () => {
    const submitted = Promise.withResolvers<typeof orderResult>();
    const request = vi
      .spyOn(api, "request")
      .mockImplementation(async (method) => (method === "post" ? submitted.promise : orderResult));
    const first = setup();
    const second = setup();
    let followed: Promise<void>;
    act(() => {
      void first.result.current.submit(input);
    });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    await act(async () => {
      followed = second.result.current.submit(input);
    });
    expect(request.mock.calls.filter(([method]) => method === "post")).toHaveLength(1);
    await act(async () => {
      submitted.resolve(orderResult);
      await followed;
    });
    await waitFor(() => expect(second.result.current.state.status).toBe("done"));
    expect(request.mock.calls.filter(([method]) => method === "post")).toHaveLength(1);
  });

  it("treats a 5xx submit failure as ambiguous and recoverable", async () => {
    const request = vi
      .spyOn(api, "request")
      .mockRejectedValue(new ApiRequestError({ status: 500, code: "INTERNAL", details: {} }));
    const { result } = setup();
    await act(() => result.current.submit(input));
    expect(result.current.state).toMatchObject({ status: "failed", recoverable: true });
    const posts = request.mock.calls.filter(([method]) => method === "post");
    expect(posts).toHaveLength(2);
    expect(posts[1][3]?.idempotencyKey).toBe(posts[0][3]?.idempotencyKey);
  });

  it("keeps a failed confirm ambiguous and resumes without reposting", async () => {
    const request = vi
      .spyOn(api, "request")
      .mockResolvedValueOnce(orderResult)
      .mockRejectedValueOnce(new ApiRequestError({ status: 500, code: "INTERNAL", details: {} }));
    const { result } = setup();
    await act(() => result.current.submit(input));
    expect(result.current.state).toMatchObject({ status: "failed", recoverable: true });
    request.mockResolvedValue(orderResult);
    await act(() => result.current.submit(input));
    expect(result.current.state.status).toBe("done");
    expect(request.mock.calls.filter(([method]) => method === "post")).toHaveLength(1);
  });

  it("treats a 404 confirm as a definitive failure", async () => {
    const request = vi
      .spyOn(api, "request")
      .mockResolvedValueOnce(orderResult)
      .mockRejectedValueOnce(new ApiRequestError({ status: 404, code: "NOT_FOUND", details: {} }));
    const { result } = setup();
    await act(() => result.current.submit(input));
    expect(result.current.state).toMatchObject({ status: "failed", recoverable: false });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("adopts an abandoned attempt past its staleness window", async () => {
    await claimAttempt("1:7", {
      tabId: "dead-tab",
      idempotencyKey: "stale-key",
      input: { product_id: 7, amount: 100000, use_points: 0, confirm: "네" },
      phase: "open",
    });
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + ATTEMPT_STALE_MS + 1_000);
    const request = vi.spyOn(api, "request").mockResolvedValue(orderResult);
    const { result } = setup();
    await waitFor(() =>
      expect(result.current.state).toMatchObject({ status: "failed", recoverable: true }),
    );
    await act(() => result.current.submit(input));
    const posts = request.mock.calls.filter(([method]) => method === "post");
    expect(posts).toHaveLength(1);
    expect(posts[0][3]?.idempotencyKey).toBe("stale-key");
    expect(result.current.state.status).toBe("done");
  });

  it("confirmation failure never posts the confirmed order again", async () => {
    const request = vi
      .spyOn(api, "request")
      .mockResolvedValueOnce(orderResult)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { result } = setup();
    await act(() => result.current.submit(input));
    expect(result.current.state).toMatchObject({ status: "failed", recoverable: true });
    request.mockResolvedValue(orderResult);
    await act(() => result.current.submit(input));
    expect(result.current.state.status).toBe("done");
    expect(request.mock.calls.filter(([method]) => method === "post")).toHaveLength(1);
  });
});
