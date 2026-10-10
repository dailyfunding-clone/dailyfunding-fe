import { describe, expect, it } from "vitest";
import { parseBridgeMessage, parseNativeMessage } from "../src/messages";
import { createNativeChannel } from "../src/protocol";

const signedOut = { status: "signedOut", accessToken: null } as const;
const hello = (versions = [2]) => ({
  v: 2,
  seq: 0,
  type: "hello",
  payload: { versions, clientId: "page-1" },
});

describe("bridge v2", () => {
  it("validates envelopes and command payloads at the boundary", () => {
    expect(
      parseBridgeMessage(
        JSON.stringify({ v: 2, seq: 1, type: "nav.push", payload: { path: "/investment" } }),
      ),
    ).not.toBeNull();
    for (const value of [
      null,
      {},
      { v: 1, seq: 1, type: "nav.back" },
      { v: 2, seq: -1, type: "nav.back" },
      { v: 2, seq: 1.5, type: "nav.back" },
      { v: 2, seq: 1, type: "nav.push" },
      { v: 2, seq: 1, type: "nav.push", payload: { path: "//evil.test" } },
      { v: 2, seq: 1, type: "ack", payload: { seq: "1" } },
    ]) {
      expect(parseBridgeMessage(JSON.stringify(value))).toBeNull();
    }
    expect(parseBridgeMessage("{")).toBeNull();
    expect(
      parseNativeMessage(
        JSON.stringify({ v: 2, seq: 1, type: "auth.changed", payload: { status: "signedIn" } }),
      ),
    ).toBeNull();
  });

  it("negotiates a supported version before releasing buffered messages", () => {
    const sent: any[] = [];
    const channel = createNativeChannel((message) => sent.push(message), "session-1");
    channel.send({ type: "auth.changed", payload: signedOut });
    expect(sent).toEqual([]);
    channel.receive(JSON.stringify(hello([1])), signedOut);
    expect(sent.map((m) => m.type)).toEqual(["hello.reject"]);
    sent.length = 0;
    channel.receive(JSON.stringify(hello([1, 2])), signedOut);
    expect(sent[0]).toMatchObject({
      type: "hello.ack",
      payload: { version: 2, sessionId: "session-1", authState: signedOut },
    });
    expect(sent[1]).toMatchObject({ v: 2, seq: 1, type: "auth.changed" });
  });

  it("replays only unacknowledged messages through 100 reloads and ignores foreign acks", () => {
    const sent: any[] = [];
    const channel = createNativeChannel((message) => sent.push(message), "session-1");
    channel.send({ type: "auth.changed", payload: signedOut });
    for (let i = 0; i < 100; i++) {
      channel.disconnect();
      sent.length = 0;
      channel.receive(JSON.stringify(hello()), signedOut);
      expect(sent.filter((m) => m.type === "auth.changed").map((m) => m.seq)).toEqual([1]);
    }
    channel.receive(
      JSON.stringify({ v: 2, seq: 2, type: "ack", payload: { seq: 1, sessionId: "other" } }),
      signedOut,
    );
    channel.disconnect();
    sent.length = 0;
    channel.receive(JSON.stringify(hello()), signedOut);
    expect(sent).toHaveLength(2);
    channel.receive(
      JSON.stringify({ v: 2, seq: 3, type: "ack", payload: { seq: 1, sessionId: "session-1" } }),
      signedOut,
    );
    sent.length = 0;
    channel.receive(
      JSON.stringify({
        v: 2,
        seq: 4,
        type: "replay",
        payload: { after: 0, sessionId: "session-1" },
      }),
      signedOut,
    );
    expect(sent).toEqual([]);
  });

  it("scrubs buffered app codes on signout", () => {
    const sent: any[] = [];
    const channel = createNativeChannel((m) => sent.push(m), "session-1");
    channel.send({
      type: "auth.appCode.result",
      payload: { requestSeq: 7, code: "secret-code" },
    });
    channel.updateAuth(signedOut);
    channel.receive(JSON.stringify(hello()), signedOut);
    expect(JSON.stringify(sent)).not.toContain("secret-code");
    expect(sent.some((m) => m.type === "auth.appCode.result" && m.payload.code === null)).toBe(
      true,
    );
  });

  it("replaces buffered credentials on signout before replaying every WebView", () => {
    for (let tab = 0; tab < 3; tab++) {
      const sent: any[] = [];
      const channel = createNativeChannel((m) => sent.push(m), `tab-${tab}`);
      channel.send({ type: "auth.changed", payload: { status: "signedIn", accessToken: "old" } });
      channel.send({ type: "auth.reauth.result", payload: { requestSeq: 1, token: "secret" } });
      channel.updateAuth(signedOut);
      channel.receive(JSON.stringify(hello()), signedOut);
      expect(JSON.stringify(sent)).not.toContain("old");
      expect(JSON.stringify(sent)).not.toContain("secret");
      expect(sent.at(-1)).toMatchObject({ type: "auth.changed", payload: signedOut });
    }
  });
});
