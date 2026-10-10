import { ApiRequestError, createClient } from "@dailyfunding/api-client";
import { NetworkError, TimeoutError } from "ky";
import { describe, expect, it } from "vitest";

import { mapError } from "./map-error";

describe("mapError", () => {
  it.each([
    ["GRADE_LIMIT_EXCEEDED", { remaining_limit: 12000 }, "투자 가능 한도 12,000원"],
    ["BORROWER_LIMIT_EXCEEDED", { remaining_limit: 23000 }, "잔여 한도 23,000원"],
    ["INSUFFICIENT_DEPOSIT", { available: 34000 }, "사용 가능 금액 34,000원"],
    ["INSUFFICIENT_REMAINING", { remaining: 45000 }, "남은 금액 45,000원"],
    ["PRODUCT_CLOSED", {}, "모집이 마감"],
    ["REAUTH_REQUIRED", {}, "비밀번호"],
    ["SUITABILITY_REQUIRED", {}, "투자적합성"],
  ])("maps %s without enabling retry", (code, details, text) => {
    expect(mapError(new ApiRequestError({ status: 409, code, details }))).toMatchObject({
      code,
      kind: "rejected",
      text: expect.stringContaining(text),
    });
  });

  it.each([
    new NetworkError(new Request("https://example.test")),
    new TimeoutError(new Request("https://example.test")),
    new TypeError("Failed to fetch"),
  ])("identifies transport errors", (error) => {
    expect(mapError(error).kind).toBe("network");
  });

  it("does not retry programmer errors or 5xx automatically", () => {
    expect(mapError(new Error("bug")).kind).toBe("unknown");
    expect(mapError(new ApiRequestError({ status: 500, code: "INTERNAL", details: {} })).kind).toBe(
      "unknown",
    );
  });

  it("preserves the API error through the actual client", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ code: "INSUFFICIENT_REMAINING", details: { remaining: 1000 } }),
        { status: 409 },
      );
    try {
      await createClient({ baseUrl: "https://example.test" })
        .request("post", "/api/investments")
        .catch((error: unknown) => {
          expect(mapError(error)).toMatchObject({
            code: "INSUFFICIENT_REMAINING",
            kind: "rejected",
          });
        });
    } finally {
      globalThis.fetch = original;
    }
  });
});
