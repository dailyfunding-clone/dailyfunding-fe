import * as Updates from "expo-updates";

import type { UpdateCheckStatus } from "@dailyfunding/bridge";

export const checkAppUpdate = async (): Promise<UpdateCheckStatus> => {
  if (!Updates.isEnabled) return "unavailable";
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return "latest";
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return "updated";
  } catch {
    return "error";
  }
};
