import { tokens } from "@dailyfunding/design-system";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AppWebView,
  createBridgeChannel,
  handleBridgeMessage,
  releaseBridgeChannel,
} from "@/features/webview";

import type { NativeChannel } from "@dailyfunding/bridge";
import type { WebView, WebViewMessageEvent } from "react-native-webview";

const WebViewScreen = () => {
  const { path, title } = useLocalSearchParams<{
    path?: string;
    title?: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [channel, setChannel] = useState<NativeChannel | null>(null);
  const [ready, setReady] = useState(false);
  const currentTitle = useRef<string | undefined>(title);

  useEffect(() => {
    const created = createBridgeChannel(webViewRef, `webview-${Date.now()}-${Math.random()}`);
    setChannel(created);
    return () => releaseBridgeChannel(created);
  }, []);

  const goBack = useCallback(() => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    } else {
      navigation.goBack();
    }
  }, [canGoBack, navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: title ?? "",
      headerLeft: () => (
        <Pressable onPress={goBack} hitSlop={12}>
          <Text style={{ fontSize: 28, lineHeight: 32 }}>‹</Text>
        </Pressable>
      ),
    });
  }, [navigation, title, goBack]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const handleMessage = (event: WebViewMessageEvent) => {
    if (!channel) return;
    handleBridgeMessage(event, {
      router,
      channel,
      goBack,
      setTitle: (t) => {
        currentTitle.current = t;
        navigation.setOptions({ title: t });
      },
      onReady: () => setReady(true),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.semantic.color.bgDefault }}>
      <AppWebView
        ref={webViewRef}
        path={path ?? "/"}
        onMessage={handleMessage}
        onLoadEnd={() => setReady(true)}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          if (!title && navState.title) {
            currentTitle.current = navState.title;
            navigation.setOptions({ title: navState.title });
          }
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

export default WebViewScreen;
