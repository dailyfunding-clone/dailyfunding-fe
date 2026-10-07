import { tokens } from "@dailyfunding/design-system";
import * as Notifications from "expo-notifications";
import { DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { configureNotifications, notificationTargetPath } from "@/shared";

const RootLayout = () => {
  const router = useRouter();

  useEffect(() => {
    configureNotifications();
    let sub: { remove: () => void } | null = null;
    try {
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const target = notificationTargetPath(response.notification.request.content.data);
        if (target) {
          router.push({
            pathname: "/webview",
            params: { path: target },
          });
        }
      });
    } catch {
      return;
    }
    return () => sub?.remove();
  }, [router]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: tokens.semantic.color.bgDefault }}>
        <ThemeProvider
          value={{
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              background: tokens.semantic.color.bgDefault,
            },
          }}
        >
          <Stack
            screenOptions={{
              contentStyle: {
                backgroundColor: tokens.semantic.color.bgDefault,
              },
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
                scrollEdgeEffects: { bottom: "hidden" },
              }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/index" options={{ headerShown: false }} />
            <Stack.Screen
              name="auth/pin"
              options={{
                title: "간편비밀번호",
                headerBackVisible: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="auth/pin-reauth" options={{ headerShown: false }} />
            <Stack.Screen name="webview" options={{ scrollEdgeEffects: { bottom: "hidden" } }} />
          </Stack>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}

export default RootLayout;
