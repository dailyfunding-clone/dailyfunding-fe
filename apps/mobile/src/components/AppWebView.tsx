import { forwardRef } from "react";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { WEB_BASE_URL } from "../constants/config";

type Props = {
  path: string;
  onMessage?: (event: WebViewMessageEvent) => void;
  onNavigationStateChange?: (navState: WebViewNavigation) => void;
  onLoadEnd?: () => void;
};

export const AppWebView = forwardRef<WebView, Props>(function AppWebView(
  { path, onMessage, onNavigationStateChange, onLoadEnd },
  ref,
) {
  return (
    <WebView
      ref={ref}
      source={{ uri: `${WEB_BASE_URL}${path}` }}
      style={{ flex: 1 }}
      allowsBackForwardNavigationGestures
      onMessage={onMessage}
      onNavigationStateChange={onNavigationStateChange}
      onLoadEnd={onLoadEnd}
    />
  );
});
