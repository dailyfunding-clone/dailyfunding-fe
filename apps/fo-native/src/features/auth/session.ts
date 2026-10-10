import * as SecureStore from "expo-secure-store";
import ky from "ky";

import { WEB_BASE_URL } from "@/shared";

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
  const access = await SecureStore.getItemAsync("access_token");
  if (generation !== at) return sessionState();
  current = access ? { status: "signedIn", accessToken: access } : SIGNED_OUT;
  return current;
};

export const isRefreshingSession = () => refreshPromise !== null;

export const storeSessionTokens = async (data: SessionTokens) => {
  const at = generation;
  if (data.refresh_token) {
    await SecureStore.setItemAsync("refresh_token", data.refresh_token);
  }
  if (data.access_token) {
    await SecureStore.setItemAsync("access_token", data.access_token);
  }
  if (generation !== at) {
    if (data.refresh_token) await SecureStore.deleteItemAsync("refresh_token");
    if (data.access_token) await SecureStore.deleteItemAsync("access_token");
    return;
  }
  if (data.access_token) {
    publish({ status: "signedIn", accessToken: data.access_token });
  }
};

export const clearSession = async () => {
  generation += 1;
  await SecureStore.deleteItemAsync("refresh_token");
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("user_email");
  await SecureStore.deleteItemAsync("pin_registered");
  await SecureStore.deleteItemAsync("pin_biometric");
  await SecureStore.deleteItemAsync("biometric_enabled");
  publish(SIGNED_OUT);
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
    await SecureStore.setItemAsync("pin_registered", me.pin_registered ? "true" : "false");
  } catch {
    return;
  }
};

const refreshStoredSession = async (): Promise<StoredSession> => {
  const at = generation;
  const refresh = await SecureStore.getItemAsync("refresh_token");
  if (!refresh || generation !== at) return null;
  try {
    const res = await ky.post(`${WEB_BASE_URL}/api/auth/refresh`, {
      json: { refresh },
      throwHttpErrors: false,
    });
    if (generation !== at) return null;
    if (!res.ok) {
      await clearSession();
      return null;
    }
    const data = (await res.json()) as SessionTokens;
    if (generation !== at) return null;
    await storeSessionTokens(data);
    if (data.access_token && !(await SecureStore.getItemAsync("user_email"))) {
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
