import * as SecureStore from "expo-secure-store";
import ky from "ky";

import { STORAGE_KEYS, WEB_BASE_URL, unregisterPushToken } from "@/shared";

import { clearReauth } from "./reauth";

import type { AuthState } from "@dailyfunding/bridge";

export type SessionTokens = {
  refresh_token?: string;
  access_token?: string;
};

const SIGNED_OUT: AuthState = { status: "signedOut", accessToken: null };

type StoredSession = { token: string | null } | null;

let current: AuthState | null = null;
let refreshPromise: Promise<StoredSession> | null = null;
let generation = 0;
const listeners = new Set<(state: AuthState) => void>();

const publish = (state: AuthState) => {
  current = state;
  for (const listener of listeners) void listener(state);
};

export const subscribeSession = (listener: (state: AuthState) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const sessionState = (): AuthState => current ?? SIGNED_OUT;

export const sessionGeneration = () => generation;

export const getSessionState = async (): Promise<AuthState> => {
  if (current) return current;
  const at = generation;
  const access = await SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
  if (generation !== at) return sessionState();
  current = access ? { status: "signedIn", accessToken: access } : SIGNED_OUT;
  return current;
};

export const isRefreshingSession = () => refreshPromise !== null;

export const storeSessionTokens = async (data: SessionTokens) => {
  const at = generation;
  if (data.refresh_token) {
    await SecureStore.setItemAsync(STORAGE_KEYS.refreshToken, data.refresh_token);
  }
  if (data.access_token) {
    await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, data.access_token);
  }
  if (generation !== at) {
    if (
      data.refresh_token &&
      (await SecureStore.getItemAsync(STORAGE_KEYS.refreshToken)) === data.refresh_token
    ) {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken);
    }
    if (
      data.access_token &&
      (await SecureStore.getItemAsync(STORAGE_KEYS.accessToken)) === data.access_token
    ) {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
    }
    return;
  }
  if (data.access_token) {
    publish({ status: "signedIn", accessToken: data.access_token });
  }
};

export const clearSession = async () => {
  generation += 1;
  clearReauth();
  await unregisterPushToken();
  await SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.userEmail);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.pinRegistered);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.pinBiometric);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.biometricEnabled);
  publish(SIGNED_OUT);
};

export const storeUserProfile = async (accessToken: string) => {
  const at = generation;
  try {
    const res = await ky.get(`${WEB_BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      throwHttpErrors: false,
    });
    if (!res.ok || generation !== at) return;
    const me = (await res.json()) as { email?: string; pin_registered?: boolean };
    if (generation !== at) return;
    if (me.email) {
      await SecureStore.setItemAsync(STORAGE_KEYS.userEmail, me.email);
    }
    if (generation !== at) return;
    await SecureStore.setItemAsync(
      STORAGE_KEYS.pinRegistered,
      me.pin_registered ? "true" : "false",
    );
  } catch {
    return;
  }
};

export const refreshAccessToken = async () => {
  await validateStoredSession();
  return SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
};

const refreshStoredSession = async (): Promise<StoredSession> => {
  const at = generation;
  const refresh = await SecureStore.getItemAsync(STORAGE_KEYS.refreshToken);
  if (!refresh || generation !== at) return null;
  try {
    const res = await ky.post(`${WEB_BASE_URL}/api/auth/refresh`, {
      json: { refresh },
      throwHttpErrors: false,
    });
    if (generation !== at) return null;
    if (!res.ok) {
      if (res.status !== 401 && res.status !== 403) return { token: null };
      await clearSession();
      return null;
    }
    const data = (await res.json()) as SessionTokens;
    if (generation !== at) return null;
    await storeSessionTokens(data);
    if (data.access_token && !(await SecureStore.getItemAsync(STORAGE_KEYS.userEmail))) {
      await storeUserProfile(data.access_token);
    }
    return { token: data.refresh_token ?? refresh };
  } catch {
    return generation === at ? { token: null } : null;
  }
};

export const validateStoredSession = (): Promise<StoredSession> => {
  refreshPromise ??= refreshStoredSession().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};
