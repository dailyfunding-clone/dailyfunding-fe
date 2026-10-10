export const BRIDGE_VERSION = 2;

export type AuthState =
  { status: "signedOut"; accessToken: null } | { status: "signedIn"; accessToken: string };

export type WebToNativeMessage =
  | { type: "hello"; payload: { versions: number[]; clientId: string } }
  | { type: "ack"; payload: { seq: number; sessionId: string } }
  | { type: "replay"; payload: { after: number; sessionId: string } }
  | { type: "auth.getState" }
  | { type: "nav.push"; payload: { path: string; title?: string } }
  | { type: "nav.replace"; payload: { path: string; title?: string } }
  | { type: "nav.native"; payload: { route: string } }
  | { type: "nav.back" }
  | { type: "title.set"; payload: { title: string } }
  | { type: "auth.reauth" }
  | { type: "auth.exchange"; payload: { code: string; next?: string } }
  | { type: "auth.signOut" }
  | { type: "app.ready" };

export type NativeToWebMessage =
  | {
      type: "hello.ack";
      payload: { version: 2; sessionId: string; clientId: string; authState: AuthState };
    }
  | { type: "hello.reject"; payload: { versions: number[] } }
  | { type: "auth.state"; payload: { requestSeq: number; authState: AuthState } }
  | { type: "auth.changed"; payload: AuthState }
  | { type: "auth.reauth.result"; payload: { requestSeq: number; token: string | null } };

export type BridgeEnvelope<T = WebToNativeMessage> = T & { v: 2; seq: number };
export type NativeEnvelope = BridgeEnvelope<NativeToWebMessage> & { sessionId: string };

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const sequence = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
const text = (value: unknown): value is string => typeof value === "string";
const versions = (value: unknown) =>
  Array.isArray(value) && value.length > 0 && value.every(sequence);
export const isLocalPath = (value: unknown): value is string =>
  text(value) &&
  value.startsWith("/") &&
  !value.startsWith("//") &&
  !/[\\\s\u0000-\u001f]/.test(value);
const authState = (value: unknown): value is AuthState =>
  record(value) &&
  ((value.status === "signedOut" && value.accessToken === null) ||
    (value.status === "signedIn" && text(value.accessToken) && value.accessToken.length > 0));

const parseEnvelope = (raw: string) => {
  try {
    const value: unknown = JSON.parse(raw);
    return record(value) && value.v === BRIDGE_VERSION && sequence(value.seq) ? value : null;
  } catch {
    return null;
  }
};

export const parseBridgeMessage = (raw: string): BridgeEnvelope | null => {
  const message = parseEnvelope(raw);
  if (!message) return null;
  const p = record(message.payload) ? message.payload : {};
  let valid = false;
  switch (message.type) {
    case "hello":
      valid = versions(p.versions) && text(p.clientId) && p.clientId.length > 0;
      break;
    case "ack":
      valid = sequence(p.seq) && text(p.sessionId);
      break;
    case "replay":
      valid = sequence(p.after) && text(p.sessionId);
      break;
    case "nav.push":
    case "nav.replace":
      valid = isLocalPath(p.path) && (p.title === undefined || text(p.title));
      break;
    case "nav.native":
      valid = isLocalPath(p.route);
      break;
    case "title.set":
      valid = text(p.title);
      break;
    case "auth.exchange":
      valid = text(p.code) && p.code.length > 0 && (p.next === undefined || isLocalPath(p.next));
      break;
    case "nav.back":
    case "auth.getState":
    case "auth.reauth":
    case "auth.signOut":
    case "app.ready":
      valid = true;
      break;
  }
  return valid ? (message as BridgeEnvelope) : null;
};

export const parseNativeMessage = (raw: string): NativeEnvelope | null => {
  const message = parseEnvelope(raw);
  if (!message || !text(message.sessionId)) return null;
  const p = record(message.payload) ? message.payload : {};
  let valid = false;
  switch (message.type) {
    case "hello.ack":
      valid =
        p.version === BRIDGE_VERSION &&
        p.sessionId === message.sessionId &&
        text(p.clientId) &&
        authState(p.authState);
      break;
    case "hello.reject":
      valid = versions(p.versions);
      break;
    case "auth.state":
      valid = sequence(p.requestSeq) && authState(p.authState);
      break;
    case "auth.changed":
      valid = authState(p);
      break;
    case "auth.reauth.result":
      valid = sequence(p.requestSeq) && (p.token === null || text(p.token));
      break;
  }
  return valid ? (message as NativeEnvelope) : null;
};
