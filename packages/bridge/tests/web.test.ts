import { expect, it, vi } from "vitest";
import { createWebBridge } from "../src/web";
import { createNativeChannel } from "../src/protocol";

it("queries native every time, applies duplicates once, and shares in-flight reauth", async () => {
  const outbound: any[] = [];
  let receive = (_raw: string) => {};
  const client = createWebBridge(
    (raw) => outbound.push(JSON.parse(raw)),
    (listener) => {
      receive = listener;
      return () => {};
    },
  );
  const state = { status: "signedOut", accessToken: null } as const;
  const observed: unknown[] = [];
  client.subscribeAuthState((next) => {
    observed.push(next);
  });
  const first = client.getAuthState();
  const hello = outbound.shift();
  expect(hello).toMatchObject({ v: 2, type: "hello" });
  receive(
    JSON.stringify({
      v: 2,
      seq: 0,
      sessionId: "s",
      type: "hello.ack",
      payload: { version: 2, sessionId: "s", clientId: hello.payload.clientId, authState: state },
    }),
  );
  await vi.waitFor(() => expect(outbound.some((m) => m.type === "auth.getState")).toBe(true));
  const query = outbound.find((m) => m.type === "auth.getState");
  const reply = JSON.stringify({
    v: 2,
    seq: 1,
    sessionId: "s",
    type: "auth.state",
    payload: { requestSeq: query.seq, authState: state },
  });
  receive(reply);
  receive(reply);
  expect(await first).toEqual(state);
  const second = client.getAuthState();
  const queries = outbound.filter((m) => m.type === "auth.getState");
  expect(queries).toHaveLength(2);
  receive(
    JSON.stringify({
      v: 2,
      seq: 2,
      sessionId: "s",
      type: "auth.state",
      payload: { requestSeq: queries[1].seq, authState: state },
    }),
  );
  await second;
  const a = client.requestReauth();
  const b = client.requestReauth();
  expect(a).toBe(b);
  const request = outbound.find((m) => m.type === "auth.reauth");
  receive(
    JSON.stringify({
      v: 2,
      seq: 3,
      sessionId: "s",
      type: "auth.reauth.result",
      payload: { requestSeq: request.seq, token: "reauth" },
    }),
  );
  expect(await a).toBe("reauth");
  const changed = JSON.stringify({
    v: 2,
    seq: 4,
    sessionId: "s",
    type: "auth.changed",
    payload: state,
  });
  receive(changed);
  receive(changed);
  await vi.waitFor(() =>
    expect(outbound.filter((m) => m.type === "ack" && m.payload.seq === 4)).toHaveLength(2),
  );
  expect(observed).toEqual([state, state]);
  client.dispose();
});

it("integrates real channels across a reload and does not acknowledge failed consumers", async () => {
  let receive = (_raw: string) => {};
  const state = { status: "signedOut", accessToken: null } as const;
  const native = createNativeChannel((message) => receive(JSON.stringify(message)), "s");
  const makeClient = () =>
    createWebBridge(
      (raw) => native.receive(raw, state),
      (listener) => {
        receive = listener;
        return () => {};
      },
    );
  let fail = true;
  const first = makeClient();
  first.subscribeAuthState(() => {
    if (fail) throw new Error("consumer failed");
  });
  first.post({ type: "app.ready" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  native.send({ type: "auth.changed", payload: state });
  await new Promise((resolve) => setTimeout(resolve, 0));
  first.dispose();
  native.disconnect();
  fail = false;
  const observed: unknown[] = [];
  const second = makeClient();
  second.subscribeAuthState((next) => {
    observed.push(next);
  });
  second.post({ type: "app.ready" });
  await vi.waitFor(() => expect(observed).toEqual([state, state]));
  second.dispose();
});
