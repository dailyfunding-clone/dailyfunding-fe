import { isLocalPath } from "@dailyfunding/bridge";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import ky from "ky";
import { Platform } from "react-native";

import { WEB_BASE_URL } from "./config";
import { STORAGE_KEYS } from "./constants";

const DEFAULT_CHANNEL_ID = "default";

export const configureNotifications = () => {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    return;
  }
};

export const registerPushToken = async () => {
  try {
    if (!Device.isDevice) return;
    const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
        name: "기본 알림",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    const status =
      current.status === "granted"
        ? current.status
        : (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined))
      .data;
    const res = await ky.post(`${WEB_BASE_URL}/api/devices`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      json: {
        expo_push_token: token,
        platform: Platform.OS === "ios" ? "ios" : "android",
      },
      throwHttpErrors: false,
    });
    if (res.ok) {
      await SecureStore.setItemAsync(STORAGE_KEYS.expoPushToken, token);
    }
  } catch {
    return;
  }
};

export const unregisterPushToken = async () => {
  try {
    const [token, accessToken] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.expoPushToken),
      SecureStore.getItemAsync(STORAGE_KEYS.accessToken),
    ]);
    if (!token) return;
    await SecureStore.deleteItemAsync(STORAGE_KEYS.expoPushToken);
    if (!accessToken) return;
    await ky.delete(`${WEB_BASE_URL}/api/devices`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      json: { expo_push_token: token },
      throwHttpErrors: false,
    });
  } catch {
    return;
  }
};

export const notificationTargetPath = (data: unknown): string | null => {
  if (!data || typeof data !== "object") return null;
  const { path, url } = data as { path?: unknown; url?: unknown };
  const raw = typeof path === "string" ? path : typeof url === "string" ? url : "";
  if (isLocalPath(raw)) return raw;
  try {
    const parsed = new URL(raw);
    const target = `${parsed.pathname}${parsed.search}`;
    return isLocalPath(target) ? target : null;
  } catch {
    return null;
  }
};
