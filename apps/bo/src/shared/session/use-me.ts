"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { api } from "@/shared/api";

export type Me = {
  id: number;
  email: string;
  name: string;
  role: string;
  grade: string;
  is_staff: boolean;
  member_type: string;
  identity_verified: boolean;
};

export const useMe = () =>
  useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: () => api.request<Me>("get", "/api/me").catch(() => null),
    staleTime: 60_000,
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
