"use client";

import { bridge, isInWebView } from "@dailyfunding/bridge";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const WebViewBridge = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (isInWebView()) {
      document.body.classList.add("in-app");
      bridge.ready();
    }
  }, [pathname]);

  return null;
}

export default WebViewBridge;
