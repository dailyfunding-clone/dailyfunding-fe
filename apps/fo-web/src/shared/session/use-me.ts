"use client";

import { bridge, isInWebView } from "@dailyfunding/bridge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { api, ApiRequestError, hasSessionHint, markSession } from "@/shared/api";

export type Me = {
  id: number;
  email: string;
  name: string;
  role: string;
  grade: string;
  is_staff: boolean;
  member_type: string;
  pin_registered: boolean;
  identity_verified: boolean;
};

export const useMe = () =>
  useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: () => {
      if (!hasSessionHint()) {
        return null;
      }
      return api
        .request<Me>("get", "/api/me")
        .then((m) => {
          markSession(true);
          return m;
        })
        .catch((e: unknown) => {
          if (e instanceof ApiRequestError && e.status === 401) {
            markSession(false);
          }
          return null;
        });
    },
    staleTime: 60_000,
  });

export const useSignOut = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return async () => {
    await api.post("/api/auth/logout").catch(() => undefined);
    markSession(false);
    queryClient.clear();
    if (isInWebView()) {
      bridge.signOut();
    } else {
      router.push("/auth/signin");
    }
  };
};
