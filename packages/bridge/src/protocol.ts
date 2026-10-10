import { BRIDGE_VERSION, parseBridgeMessage } from "./messages";
import type { AuthState, NativeEnvelope, NativeToWebMessage } from "./messages";

const MAX_PENDING = 200;

export const createNativeChannel = (
  deliver: (message: NativeEnvelope) => void,
  sessionId: string,
) => {
  let seq = 0;
  let connected = false;
  const pending = new Map<number, NativeEnvelope>();
  const envelope = (message: NativeToWebMessage, number: number): NativeEnvelope => ({
    ...message,
    v: BRIDGE_VERSION,
    seq: number,
    sessionId,
  });
  const replay = (after = 0) => {
    for (const message of pending.values()) {
      if (message.seq > after) deliver(message);
    }
  };
  const send = (message: NativeToWebMessage) => {
    const next = envelope(message, ++seq);
    if (pending.size >= MAX_PENDING) {
      const oldest = pending.keys().next().value;
      if (oldest !== undefined) pending.delete(oldest);
    }
    pending.set(next.seq, next);
    if (connected) deliver(next);
  };
  const updateAuth = (state: AuthState) => {
    for (const [number, message] of pending) {
      if (message.type === "auth.changed") pending.set(number, { ...message, payload: state });
      if (message.type === "auth.state")
        pending.set(number, { ...message, payload: { ...message.payload, authState: state } });
      if (state.status === "signedOut" && message.type === "auth.reauth.result") {
        pending.set(number, { ...message, payload: { ...message.payload, token: null } });
      }
      if (state.status === "signedOut" && message.type === "auth.appCode.result") {
        pending.set(number, { ...message, payload: { ...message.payload, code: null } });
      }
    }
    send({ type: "auth.changed", payload: state });
  };
  const receive = (raw: string, state: AuthState) => {
    const message = parseBridgeMessage(raw);
    if (!message) return null;
    if (message.type === "hello") {
      connected = message.payload.versions.includes(BRIDGE_VERSION);
      if (!connected) {
        deliver(envelope({ type: "hello.reject", payload: { versions: [BRIDGE_VERSION] } }, 0));
        return null;
      }
      deliver(
        envelope(
          {
            type: "hello.ack",
            payload: {
              version: BRIDGE_VERSION,
              sessionId,
              clientId: message.payload.clientId,
              authState: state,
            },
          },
          0,
        ),
      );
      replay();
      return null;
    }
    if (!connected) return null;
    if (message.type === "ack") {
      if (message.payload.sessionId === sessionId) pending.delete(message.payload.seq);
      return null;
    }
    if (message.type === "replay") {
      if (message.payload.sessionId === sessionId) replay(message.payload.after);
      return null;
    }
    if (message.type === "auth.getState") {
      send({ type: "auth.state", payload: { requestSeq: message.seq, authState: state } });
      return null;
    }
    return message;
  };
  return {
    send,
    receive,
    updateAuth,
    disconnect: () => {
      connected = false;
    },
  };
};

export type NativeChannel = ReturnType<typeof createNativeChannel>;
