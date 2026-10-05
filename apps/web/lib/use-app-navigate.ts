"use client";

import { useRouter } from "next/navigation";
import { bridge, isInWebView } from "@dailyfunding/bridge";

export function useAppNavigate() {
  const router = useRouter();
  return (path: string, title?: string) => {
    if (isInWebView()) {
      bridge.push(path, title);
    } else {
      router.push(path);
    }
  };
}
