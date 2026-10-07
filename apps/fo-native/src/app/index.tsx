import { tokens } from "@dailyfunding/design-system";
import { Redirect, useRootNavigationState } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { validateStoredSession } from "@/features/auth";


const GateScreen = () => {
  const navState = useRootNavigationState();
  const [session, setSession] = useState<{ token: string } | null | undefined>(
    undefined,
  );

  useEffect(() => {
    void validateStoredSession().then(setSession);
  }, []);

  if (session === undefined || !navState?.key) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tokens.semantic.color.bgDefault,
        }}
      >
        <ActivityIndicator color={tokens.semantic.color.accentPrimary} />
      </View>
    );
  }
  if (!session) return <Redirect href="/auth" />;
  return <Redirect href="/(tabs)" />;
};

export default GateScreen;
