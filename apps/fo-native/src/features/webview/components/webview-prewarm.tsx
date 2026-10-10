import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { sessionState } from "@/features/auth";

import { createBridgeChannel, releaseBridgeChannel } from "../bridge";
import AppWebView from "./app-webview";

import type { NativeChannel } from "@dailyfunding/bridge";
import type { WebView } from "react-native-webview";

const WebViewPrewarm = () => {
  const webViewRef = useRef<WebView>(null);
  const [channel, setChannel] = useState<NativeChannel | null>(null);
  const [warmed, setWarmed] = useState(false);

  useEffect(() => {
    const created = createBridgeChannel(webViewRef, "prewarm");
    setChannel(created);
    return () => releaseBridgeChannel(created);
  }, []);

  useEffect(() => {
    if (warmed && channel) releaseBridgeChannel(channel);
  }, [warmed, channel]);

  if (warmed) return null;

  return (
    <View style={styles.hidden} pointerEvents="none">
      <AppWebView
        ref={webViewRef}
        path="/"
        onMessage={(event) => {
          channel?.receive(event.nativeEvent.data, sessionState());
        }}
        onLoadEnd={() => setWarmed(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hidden: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
});

export default WebViewPrewarm;
