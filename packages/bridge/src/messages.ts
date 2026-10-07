export const BRIDGE_VERSION = 1;

export type WebToNativeMessage =
  | { type: "nav.push"; payload: { path: string; title?: string } }
  | { type: "nav.replace"; payload: { path: string; title?: string } }
  | { type: "nav.native"; payload: { route: string } }
  | { type: "nav.back" }
  | { type: "title.set"; payload: { title: string } }
  | { type: "auth.reauth" }
  | { type: "auth.exchange"; payload: { code: string; next?: string } }
  | { type: "auth.signOut" }
  | { type: "app.ready" };

export type BridgeEnvelope = WebToNativeMessage & { v: number };

export function parseBridgeMessage(raw: string): WebToNativeMessage | null {
  try {
    const msg = JSON.parse(raw) as BridgeEnvelope;
    if (msg?.v !== BRIDGE_VERSION || typeof msg.type !== "string") return null;
    return msg;
  } catch {
    return null;
  }
}
