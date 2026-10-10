import { expect, it } from "vitest";
import { webViewPool } from "../src/features/webview/pool";

it("keeps the 3 most recently used keys mounted and remembers scroll snapshots", () => {
  const key = (i: number) => `tab:${i}`;
  for (let i = 0; i < 4; i++) webViewPool.touch(key(i));
  expect(webViewPool.mounted(key(0))).toBe(false);
  expect(webViewPool.mounted(key(3))).toBe(true);
  webViewPool.touch(key(0));
  expect(webViewPool.mounted(key(0))).toBe(true);
  expect(webViewPool.mounted(key(1))).toBe(false);
  webViewPool.saveScroll(key(1), 480);
  expect(webViewPool.snapshot(key(1))).toBe(480);
  webViewPool.release(key(1));
  expect(webViewPool.mounted(key(1))).toBe(false);
  expect(webViewPool.snapshot(key(1))).toBe(480);
});
