import { tokens } from "@dailyfunding/design-system";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useEffect } from "react";

import { subscribeSession } from "@/features/auth";
import { registerPushToken, unregisterPushToken } from "@/shared";

const TabsLayout = () => {
  useEffect(() => {
    void registerPushToken();
    return subscribeSession((state) => {
      if (state.status === "signedIn") {
        void registerPushToken();
      } else {
        void unregisterPushToken();
      }
    });
  }, []);

  return (
    <NativeTabs
      tintColor={tokens.semantic.color.accentPrimary}
      labelStyle={{ color: tokens.semantic.color.fgTertiary }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="investment">
        <NativeTabs.Trigger.Label>투자</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: "chart.line.uptrend.xyaxis",
            selected: "chart.line.uptrend.xyaxis",
          }}
          md="trending_up"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mypage">
        <NativeTabs.Trigger.Label>마이</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabsLayout;
