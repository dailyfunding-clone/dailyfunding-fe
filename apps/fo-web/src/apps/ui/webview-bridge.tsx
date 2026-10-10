"use client";

import { bridge, isInWebView } from "@dailyfunding/bridge";
import { useEffect } from "react";

const WebViewBridge = () => {
  useEffect(() => {
    if (isInWebView()) {
      document.body.classList.add("in-app");
      bridge.ready();
    }
  }, []);

  return null;
}

export default WebViewBridge;
