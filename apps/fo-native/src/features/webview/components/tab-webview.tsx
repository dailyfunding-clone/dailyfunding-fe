import { tokens } from "@dailyfunding/design-system";
import { useIsFocused, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ActivityIndicator, BackHandler, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { subscribeSession } from "@/features/auth";

import { createBridgeChannel, handleBridgeMessage, releaseBridgeChannel } from "../bridge";
import { webViewPool } from "../pool";
import AppWebView from "./app-webview";

import type { NativeChannel } from "@dailyfunding/bridge";
import type { WebView, WebViewMessageEvent } from "react-native-webview";

type Props = {
  path: string;
};

const TabWebView = ({ path }: Props) => {
  const poolKey = `tab:${path}`;
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const [channel, setChannel] = useState<NativeChannel | null>(null);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);
  const pooled = useSyncExternalStore(
    useCallback((callback) => webViewPool.subscribe(callback), []),
    useCallback(() => webViewPool.mounted(poolKey), [poolKey]),
  );

  useEffect(() => {
    const created = createBridgeChannel(webViewRef, `${poolKey}-${Date.now()}`);
    setChannel(created);
    return () => {
      mounted.current = false;
      webViewPool.release(poolKey);
      releaseBridgeChannel(created);
    };
  }, [poolKey]);

  useEffect(() => {
    if (isFocused) webViewPool.touch(poolKey);
  }, [isFocused, poolKey]);

  const [wasPooled, setWasPooled] = useState(pooled);
  if (wasPooled !== pooled) {
    setWasPooled(pooled);
    setReady(false);
  }

  useEffect(() => {
    if (!pooled) return;
    mounted.current = true;
    canGoBackRef.current = false;
  }, [pooled]);

  useEffect(() => {
    return subscribeSession((state) => {
      if (state.status === "signedOut") webViewPool.clearScroll(poolKey);
    });
  }, [poolKey]);

  const goBack = useCallback(() => {
    webViewRef.current?.goBack();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isFocused || !canGoBackRef.current) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, [isFocused]);

  const handleMessage = (event: WebViewMessageEvent) => {
    if (!channel) return;
    handleBridgeMessage(event, {
      router,
      channel,
      goBack,
      setTitle: () => {},
      onReady: () => {
        if (mounted.current) setReady(true);
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {pooled && (
        <AppWebView
          ref={webViewRef}
          path={path}
          onMessage={handleMessage}
          onScroll={(event) => {
            webViewPool.saveScroll(poolKey, event.nativeEvent.contentOffset.y);
          }}
          onLoadEnd={() => {
            if (!mounted.current) return;
            setReady(true);
            const y = webViewPool.snapshot(poolKey);
            if (y > 0) {
              webViewRef.current?.injectJavaScript(`window.scrollTo(0,${y});true;`);
            }
          }}
          onNavigationStateChange={(navState) => {
            canGoBackRef.current = navState.canGoBack;
          }}
        />
      )}
      {pooled && !ready && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={tokens.semantic.color.accentPrimary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.semantic.color.bgDefault,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: tokens.semantic.color.bgDefault,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TabWebView;
