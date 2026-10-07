import { tokens } from "@dailyfunding/design-system";
import { useIsFocused, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { handleBridgeMessage } from "../bridge";
import AppWebView from "./app-webview";

import type { WebView, WebViewMessageEvent } from "react-native-webview";


type Props = {
  path: string;
};

const TabWebView = ({ path }: Props) => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    void SecureStore.getItemAsync("refresh_token").then((token) => {
      if (mounted.current) setRefreshToken(token);
    });
  }, []);

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

  const handleMessage = (event: WebViewMessageEvent) =>
    handleBridgeMessage(event, {
      router,
      goBack,
      setTitle: () => {},
      onReady: () => {
        if (mounted.current) setReady(true);
      },
      webViewRef,
    });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppWebView
        ref={webViewRef}
        path={path}
        refreshToken={refreshToken}
        onMessage={handleMessage}
        onLoadEnd={() => {
          if (mounted.current) setReady(true);
        }}
        onNavigationStateChange={(navState) => {
          canGoBackRef.current = navState.canGoBack;
        }}
      />
      {!ready && (
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
