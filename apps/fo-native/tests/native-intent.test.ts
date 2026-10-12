import { expect, it } from "vitest";
import { redirectSystemPath } from "../src/app/+native-intent";
import { takePendingPath } from "../src/features/deeplink";

const cold = (path: string) => redirectSystemPath({ path, initial: true });
const warm = (path: string) => redirectSystemPath({ path, initial: false });

it("routes custom scheme links to tab screens", () => {
  expect(warm("dailyfunding://")).toBe("/");
  expect(warm("dailyfunding://investment")).toBe("/investment");
  expect(warm("dailyfunding://mypage")).toBe("/mypage");
});

it("passes webview route params through", () => {
  expect(warm("dailyfunding://webview?path=/notice")).toBe("/webview?path=/notice");
});

it("maps scheme and universal link app paths into a stacked webview", () => {
  expect(warm("dailyfunding://notice/1")).toBe("/webview?path=%2Fnotice%2F1");
  expect(warm("https://dailyfunding.example.com/investment/42?tab=info")).toBe(
    "/webview?path=%2Finvestment%2F42%3Ftab%3Dinfo",
  );
});

it("falls back to home on malformed or non-local input", () => {
  expect(warm("not a url")).toBe("/");
  expect(warm("dailyfunding:////evil.com")).toBe("/");
});

it("stashes cold-start links behind the auth gate and replays once", () => {
  expect(cold("dailyfunding://investment")).toBe("/");
  expect(takePendingPath()).toBe("/investment");
  expect(takePendingPath()).toBe(null);
});

it("lets cold-start home links through without stashing", () => {
  expect(cold("dailyfunding://")).toBe("/");
  expect(takePendingPath()).toBe(null);
});
