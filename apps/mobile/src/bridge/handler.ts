import { parseBridgeMessage } from "@dailyfunding/bridge";
import type { useRouter } from "expo-router";
import type { WebViewMessageEvent } from "react-native-webview";

type Router = ReturnType<typeof useRouter>;

type BridgeDeps = {
  router: Router;
  goBack: () => void;
  setTitle: (title: string) => void;
  onReady: () => void;
};

export function handleBridgeMessage(event: WebViewMessageEvent, deps: BridgeDeps) {
  const msg = parseBridgeMessage(event.nativeEvent.data);
  if (!msg) return;

  switch (msg.type) {
    case "nav.push":
      deps.router.push({
        pathname: "/webview",
        params: { path: msg.payload.path, title: msg.payload.title ?? "" },
      });
      break;
    case "nav.replace":
      deps.router.replace({
        pathname: "/webview",
        params: { path: msg.payload.path, title: msg.payload.title ?? "" },
      });
      break;
    case "nav.back":
      deps.goBack();
      break;
    case "title.set":
      deps.setTitle(msg.payload.title);
      break;
    case "app.ready":
      deps.onReady();
      break;
  }
}
