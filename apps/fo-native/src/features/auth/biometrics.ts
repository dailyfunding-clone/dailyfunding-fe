import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "pin_biometric";
const ENABLED_KEY = "biometric_enabled";

export const biometricSupported = async () => {
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled;
};

export const biometricLabel = async () => {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  ) {
    return "Face ID";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "지문인식";
  }
  return "생체인증";
};

export const biometricEnabled = async () =>
  (await SecureStore.getItemAsync(ENABLED_KEY)) === "true";

export const enableBiometric = async (pin: string) => {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.setItemAsync(PIN_KEY, pin, {
    requireAuthentication: true,
  });
  await SecureStore.setItemAsync(ENABLED_KEY, "true");
};

export const readBiometricPin = async (promptMessage: string) => {
  try {
    return await SecureStore.getItemAsync(PIN_KEY, {
      requireAuthentication: true,
      authenticationPrompt: promptMessage,
    });
  } catch {
    return null;
  }
};

export const disableBiometric = async () => {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(ENABLED_KEY);
};
