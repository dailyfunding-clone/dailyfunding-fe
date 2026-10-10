import { tokens } from "@dailyfunding/design-system";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { WEB_ORIGIN, resolveWebUrl } from "../url";

import type { ComponentProps } from "react";
import type { WebViewMessageEvent, WebViewNavigation } from "react-native-webview";

const MAX_CRASH_RETRIES = 2;
const EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "tel:", "mailto:", "intent:"]);

type Props = {
  path: string;
  onMessage?: (event: WebViewMessageEvent) => void;
  onNavigationStateChange?: (navState: WebViewNavigation) => void;
  onScroll?: ComponentProps<typeof WebView>["onScroll"];
  onLoadEnd?: () => void;
};

const AppWebView = forwardRef<WebView, Props>(
  ({ path, onMessage, onNavigationStateChange, onScroll, onLoadEnd }, ref) => {
    const innerRef = useRef<WebView>(null);
    const crashRetries = useRef(0);
    const [crashed, setCrashed] = useState(false);
    const [instance, setInstance] = useState(0);
    useImperativeHandle(ref, () => innerRef.current as WebView);
    const reload = () => {
      crashRetries.current = 0;
      setCrashed(false);
      setInstance((i) => i + 1);
    };

    const handleCrash = () => {
      if (crashRetries.current >= MAX_CRASH_RETRIES) {
        setCrashed(true);
        return;
      }
      crashRetries.current += 1;
      if (Platform.OS === "android") {
        setInstance((i) => i + 1);
        return;
      }
      innerRef.current?.reload();
    };

    const onShouldStartLoadWithRequest = (req: { url: string }) => {
      const { url } = req;
      if (url.startsWith("about:")) return true;
      try {
        const parsed = new URL(url);
        if (parsed.origin === WEB_ORIGIN) return true;
        if (EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
          void Linking.openURL(url).catch(() => {});
        }
      } catch {
        return false;
      }
      return false;
    };

    const handleLoadEnd = () => {
      crashRetries.current = 0;
      onLoadEnd?.();
    };

    const renderErrorView = () => (
      <View style={styles.error}>
        <Text style={styles.errorTitle}>페이지를 불러오지 못했어요</Text>
        <Text style={styles.errorDesc}>네트워크 상태를 확인해 주세요</Text>
        <Pressable style={styles.retry} onPress={reload} hitSlop={8}>
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    );

    if (crashed) {
      return <View style={styles.container}>{renderErrorView()}</View>;
    }

    return (
      <View style={styles.container}>
        <WebView
          key={instance}
          ref={innerRef}
          source={{ uri: resolveWebUrl(path) }}
          style={styles.webview}
          originWhitelist={[WEB_ORIGIN, "about:*"]}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          injectedJavaScriptBeforeContentLoaded="document.documentElement.classList.add('in-app');true;"
          onMessage={onMessage}
          onNavigationStateChange={onNavigationStateChange}
          onScroll={onScroll}
          onLoadEnd={handleLoadEnd}
          onContentProcessDidTerminate={handleCrash}
          onRenderProcessGone={handleCrash}
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
});

export default AppWebView;
