import { Platform } from "react-native";

const DEV_WEB_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

export const WEB_BASE_URL = (process.env.EXPO_PUBLIC_WEB_BASE_URL ?? DEV_WEB_BASE_URL).replace(
  /\/+$/,
  "",
);
