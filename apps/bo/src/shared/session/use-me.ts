"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { api } from "@/shared/api";

import type { components } from "@dailyfunding/api-client";

export type Me = components["schemas"]["User"];

export const useMe = () =>
  useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: () => api.get("/api/me"),
    staleTime: 60_000,
    retry: false,
  });

export const useSignOut = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return async () => {
    await api.post("/api/auth/logout").catch(() => undefined);
    queryClient.clear();
    router.push("/auth/signin");
  };
};
