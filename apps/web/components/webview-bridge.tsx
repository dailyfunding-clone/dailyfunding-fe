"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { bridge, isInWebView } from "@dailyfunding/bridge";

export function WebViewBridge() {
  const pathname = usePathname();

  useEffect(() => {
    if (isInWebView()) bridge.ready();
  }, [pathname]);

  return null;
}
