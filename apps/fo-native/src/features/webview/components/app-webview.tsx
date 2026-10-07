import { tokens } from "@dailyfunding/design-system";
import { useNetworkState } from "expo-network";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { WEB_BASE_URL } from "@/shared";

import type {
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";


type Props = {
  path: string;
  refreshToken?: string | null;
  onMessage?: (event: WebViewMessageEvent) => void;
  onNavigationStateChange?: (navState: WebViewNavigation) => void;
  onLoadEnd?: () => void;
};

const AppWebView = forwardRef<WebView, Props>(
  (
    { path, refreshToken, onMessage, onNavigationStateChange, onLoadEnd },
    ref,
  ) => {
    const innerRef = useRef<WebView>(null);
    useImperativeHandle(ref, () => innerRef.current as WebView);
    const { isConnected } = useNetworkState();
    const offline = isConnected === false;
    const wasOffline = useRef(false);

    useEffect(() => {
      if (wasOffline.current && !offline) innerRef.current?.reload();
      wasOffline.current = offline;
    }, [offline]);
    const reload = () => innerRef.current?.reload();

    const restore = refreshToken
      ? `window.__restoreSession=fetch('/api/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh:${JSON.stringify(refreshToken)}})}).then(()=>{}).catch(()=>{});`
      : "window.__restoreSession=Promise.resolve();";

    const onShouldStartLoadWithRequest = (req: { url: string }) => {
      const { url } = req;
      if (
        url.startsWith(WEB_BASE_URL) ||
        url.startsWith("about:") ||
        url.startsWith("data:")
      ) {
        return true;
      }
      void Linking.openURL(url);
      return false;
    };

    const handleLoadEnd = () => onLoadEnd?.();

    const renderErrorView = () => (
      <View style={styles.error}>
        <Text style={styles.errorTitle}>페이지를 불러오지 못했어요</Text>
        <Text style={styles.errorDesc}>네트워크 상태를 확인해 주세요</Text>
        <Pressable style={styles.retry} onPress={reload} hitSlop={8}>
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    );

    return (
      <View style={styles.container}>
        <WebView
          ref={innerRef}
          source={{ uri: `${WEB_BASE_URL}${path}` }}
          style={styles.webview}
          originWhitelist={[`${WEB_BASE_URL}*`, "about:*", "data:*"]}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          injectedJavaScriptBeforeContentLoaded={`document.documentElement.classList.add('in-app');${restore}true;`}
          onMessage={onMessage}
          onNavigationStateChange={onNavigationStateChange}
          onLoadEnd={handleLoadEnd}
          onContentProcessDidTerminate={reload}
          onRenderProcessGone={reload}
          renderError={renderErrorView}
          pullToRefreshEnabled={Platform.OS === "ios"}
          allowsBackForwardNavigationGestures
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          setBuiltInZoomControls={false}
          setDisplayZoomControls={false}
          scalesPageToFit={false}
          bounces={Platform.OS === "android" ? false : undefined}
          overScrollMode="never"
          decelerationRate={Platform.OS === "ios" ? "normal" : undefined}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          allowsLinkPreview={false}
          textInteractionEnabled={false}
          hideKeyboardAccessoryView
          keyboardDisplayRequiresUserAction={false}
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          cacheEnabled
          webviewDebuggingEnabled={__DEV__}
        />
        {offline && (
          <View style={styles.offline}>
            <Text style={styles.errorTitle}>오프라인이에요</Text>
            <Text style={styles.errorDesc}>
              네트워크 연결 후 자동으로 다시 불러와요
            </Text>
          </View>
        )}
      </View>
    );
  },
);

AppWebView.displayName = "AppWebView";

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: {
    flex: 1,
    backgroundColor: tokens.semantic.color.bgDefault,
  },
  error: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.semantic.color.bgDefault,
    gap: 8,
    padding: 24,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: tokens.semantic.color.fgPrimary,
  },
  errorDesc: {
    fontSize: 14,
    color: tokens.semantic.color.fgSecondary,
  },
  retry: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: tokens.semantic.color.accentPrimary,
  },
  retryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  offline: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tokens.semantic.color.bgDefault,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
});

export default AppWebView;
