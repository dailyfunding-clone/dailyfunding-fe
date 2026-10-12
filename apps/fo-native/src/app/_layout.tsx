import { tokens } from "@dailyfunding/design-system";
import * as Notifications from "expo-notifications";
import { DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OfflineBanner } from "@/features/network";
import { configureNotifications, notificationTargetPath } from "@/shared";

import type { ErrorBoundaryProps } from "expo-router";

const RootLayout = () => {
  const router = useRouter();

  useEffect(() => {
    configureNotifications();
    const openTarget = (data: unknown) => {
      const target = notificationTargetPath(data);
      if (target) {
        router.push({
          pathname: "/webview",
          params: { path: target },
        });
      }
    };
    let sub: { remove: () => void } | null = null;
    try {
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        openTarget(response.notification.request.content.data);
      });
      void Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) openTarget(response.notification.request.content.data);
        })
        .catch(() => {});
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
          <OfflineBanner />
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
};

export const ErrorBoundary = ({ retry }: ErrorBoundaryProps) => (
  <View
    style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      backgroundColor: tokens.semantic.color.bgDefault,
    }}
  >
    <Text style={{ fontSize: 17, fontWeight: "600", color: tokens.semantic.color.fgPrimary }}>
      문제가 발생했어요
    </Text>
    <Text style={{ fontSize: 14, color: tokens.semantic.color.fgSecondary }}>
      앱을 다시 시작해 주세요
    </Text>
    <Pressable
      onPress={retry}
      accessibilityRole="button"
      accessibilityLabel="다시 시도"
      style={{
        marginTop: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: tokens.semantic.color.accentPrimary,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>다시 시도</Text>
    </Pressable>
  </View>
);

export default RootLayout;
