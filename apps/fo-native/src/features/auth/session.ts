import * as SecureStore from "expo-secure-store";
import ky from "ky";

import { WEB_BASE_URL } from "@/shared";

export type SessionTokens = {
  refresh_token?: string;
  access_token?: string;
};

export const storeSessionTokens = async (data: SessionTokens) => {
  if (data.refresh_token) {
    await SecureStore.setItemAsync("refresh_token", data.refresh_token);
  }
  if (data.access_token) {
    await SecureStore.setItemAsync("access_token", data.access_token);
  }
};

export const clearSession = async () => {
  await SecureStore.deleteItemAsync("refresh_token");
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("user_email");
  await SecureStore.deleteItemAsync("pin_registered");
  await SecureStore.deleteItemAsync("pin_biometric");
  await SecureStore.deleteItemAsync("biometric_enabled");
};

export const storeUserProfile = async (accessToken: string) => {
  try {
    const res = await ky.get(`${WEB_BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      throwHttpErrors: false,
    });
    if (!res.ok) return;
    const me = (await res.json()) as { email?: string; pin_registered?: boolean };
    if (me.email) {
      await SecureStore.setItemAsync("user_email", me.email);
    }
    await SecureStore.setItemAsync(
      "pin_registered",
      me.pin_registered ? "true" : "false",
    );
  } catch {
    return;
  }
};

export const validateStoredSession = async (): Promise<{ token: string } | null> => {
  const refresh = await SecureStore.getItemAsync("refresh_token");
  if (!refresh) return null;
  try {
    const res = await ky.post(`${WEB_BASE_URL}/api/auth/refresh`, {
      json: { refresh },
      throwHttpErrors: false,
    });
    if (!res.ok) {
      await clearSession();
      return null;
    }
    const data = (await res.json()) as SessionTokens;
    await storeSessionTokens(data);
    if (data.access_token && !(await SecureStore.getItemAsync("user_email"))) {
      await storeUserProfile(data.access_token);
    }
    return { token: data.refresh_token ?? refresh };
  } catch {
    return { token: refresh };
  }
};
