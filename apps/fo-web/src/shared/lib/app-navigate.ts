"use client";

import { bridge, isInWebView } from "@dailyfunding/bridge";
import { useRouter } from "next/navigation";

export const useAppNavigate = () => {
  const router = useRouter();
  return {
    push: (path: string, title?: string) => {
      if (isInWebView()) {
        bridge.push(path, title);
      } else {
        router.push(path);
      }
    },
    replace: (path: string, title?: string) => {
      if (isInWebView()) {
        bridge.replace(path, title);
      } else {
        router.replace(path);
      }
    },
  };
};
