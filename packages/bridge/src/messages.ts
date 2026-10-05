export const BRIDGE_VERSION = 1;

export type WebToNativeMessage =
  | { type: "nav.push"; payload: { path: string; title?: string } }
  | { type: "nav.replace"; payload: { path: string; title?: string } }
  | { type: "nav.back" }
  | { type: "title.set"; payload: { title: string } }
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
