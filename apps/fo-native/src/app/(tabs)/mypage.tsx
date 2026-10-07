import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef } from "react";

import { pinGate } from "@/features/auth";
import { TabWebView } from "@/features/webview";

const MyPageTabScreen = () => {
  const router = useRouter();
  const lastFocusAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusAt.current < 800) return;
      lastFocusAt.current = now;
      if (pinGate.justClosed) {
        pinGate.justClosed = false;
        return;
      }
      router.push("/auth/pin");
    }, [router]),
  );

  return <TabWebView path="/mypage" />;
};

export default MyPageTabScreen;
