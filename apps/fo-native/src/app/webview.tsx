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
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type { WebView, WebViewMessageEvent } from "react-native-webview";
import { AppWebView } from "../components/AppWebView";
import { handleBridgeMessage } from "../bridge/handler";

export default function WebViewScreen() {
  const { path, title } = useLocalSearchParams<{
    path?: string;
    title?: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [ready, setReady] = useState(false);

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

  const handleMessage = (event: WebViewMessageEvent) =>
    handleBridgeMessage(event, {
      router,
      goBack,
      setTitle: (t) => navigation.setOptions({ title: t }),
      onReady: () => setReady(true),
    });

  return (
    <View style={{ flex: 1 }}>
      <AppWebView
        ref={webViewRef}
        path={path ?? "/"}
        onMessage={handleMessage}
        onLoadEnd={() => setReady(true)}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          if (!title && navState.title) {
            navigation.setOptions({ title: navState.title });
          }
        }}
      />
      {!ready && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#0033A4" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
