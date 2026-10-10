import { expect, it, vi } from "vitest";

vi.mock("@/shared", () => ({ WEB_BASE_URL: "https://example.test" }));

it("resolves local paths onto the web origin", async () => {
  const { WEB_ORIGIN, resolveWebUrl } = await import("../src/features/webview/url");
  expect(WEB_ORIGIN).toBe("https://example.test");
  expect(resolveWebUrl("/")).toBe("https://example.test/");
  expect(resolveWebUrl("/investment?tab=1")).toBe("https://example.test/investment?tab=1");
});

it("blocks cross-origin and scheme injection", async () => {
  const { resolveWebUrl } = await import("../src/features/webview/url");
  for (const path of [
    "//evil.test/x",
    "https://evil.test/x",
    "http://evil.test",
    "javascript:alert(1)",
    "data:text/html,<script>1</script>",
    "intent://evil.test",
  ]) {
    expect(resolveWebUrl(path)).toBe("https://example.test/");
  }
});

it("keeps same-origin relative junk inside the web origin", async () => {
  const { resolveWebUrl } = await import("../src/features/webview/url");
  expect(resolveWebUrl("@evil.test")).toBe("https://example.test/@evil.test");
  expect(new URL(resolveWebUrl("@evil.test")).origin).toBe("https://example.test");
});
