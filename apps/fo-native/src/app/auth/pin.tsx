import { tokens } from "@dailyfunding/design-system";
import { useNavigation, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import ky from "ky";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  PinKeypad,
  biometricEnabled,
  biometricLabel,
  biometricSupported,
  cacheReauth,
  clearSession,
  enableBiometric,
  pinGate,
  readBiometricPin,
} from "@/features/auth";
import { WEB_BASE_URL } from "@/shared";

const PinScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [first, setFirst] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [bioLabel, setBioLabel] = useState("");
  const unlocked = useRef(false);
  const bioTried = useRef(false);

  useEffect(() => {
    pinGate.setOpen(true);
    void (async () => {
      const resetPending =
        (await SecureStore.getItemAsync("pin_reset_pending")) === "true";
      if (resetPending) {
        await SecureStore.deleteItemAsync("pin_reset_pending");
        setRegistered(false);
        return;
      }
      const v = await SecureStore.getItemAsync("pin_registered");
      setRegistered(v === "true");
      if (v === "true" && (await biometricEnabled())) {
        setBioLabel(await biometricLabel());
      }
    })();
    return () => pinGate.setOpen(false);
  }, []);

  useEffect(() => {
    const sub = navigation.addListener("beforeRemove", (e) => {
      if (!unlocked.current) e.preventDefault();
    });
    return sub;
  }, [navigation]);

  const offerBiometric = useCallback(async (pin: string) => {
    if (!(await biometricSupported())) return;
    if (await biometricEnabled()) return;
    const label = await biometricLabel();
    Alert.alert(`${label} 사용`, `다음부터 ${label}로 잠금해제할 수 있어요`, [
      { text: "나중에", style: "cancel" },
      { text: "사용하기", onPress: () => void enableBiometric(pin) },
    ]);
  }, []);

  const verify = useCallback(
    async (pin: string) => {
      const access = await SecureStore.getItemAsync("access_token");
      const res = await ky.post(`${WEB_BASE_URL}/api/auth/reauth`, {
        json: { pin },
        headers: access ? { Authorization: `Bearer ${access}` } : undefined,
        throwHttpErrors: false,
      });
      if (res.ok) {
        const data = (await res.json()) as {
          reauth_token?: string;
          expires_in?: number;
        };
        if (data.reauth_token) {
          cacheReauth(data.reauth_token, data.expires_in ?? 300);
        }
        unlocked.current = true;
        pinGate.justClosed = true;
        void offerBiometric(pin);
        router.back();
        return;
      }
      setError(
        res.status === 401
          ? "간편비밀번호가 맞지 않아요"
          : "잠시 후 다시 시도해 주세요",
      );
      setValue("");
    },
    [router, offerBiometric],
  );

  const register = useCallback(
    async (pin: string) => {
      const access = await SecureStore.getItemAsync("access_token");
      const res = await ky.post(`${WEB_BASE_URL}/api/auth/pin`, {
        json: { pin },
        headers: access ? { Authorization: `Bearer ${access}` } : undefined,
        throwHttpErrors: false,
      });
      if (res.ok) {
        await SecureStore.setItemAsync("pin_registered", "true");
        const ra = await ky.post(`${WEB_BASE_URL}/api/auth/reauth`, {
          json: { pin },
          headers: access ? { Authorization: `Bearer ${access}` } : undefined,
          throwHttpErrors: false,
        });
        if (ra.ok) {
          const data = (await ra.json()) as {
            reauth_token?: string;
            expires_in?: number;
          };
          if (data.reauth_token) {
            cacheReauth(data.reauth_token, data.expires_in ?? 300);
          }
        }
        unlocked.current = true;
        pinGate.justClosed = true;
        void offerBiometric(pin);
        router.back();
        return;
      }
      setError("등록에 실패했어요. 다시 시도해 주세요");
      setFirst("");
      setValue("");
    },
    [router, offerBiometric],
  );

  const tryBiometric = useCallback(async () => {
    if (!(await biometricEnabled())) return;
    const pin = await readBiometricPin(
      "간편비밀번호 대신 생체인증으로 잠금해제해요",
    );
    if (pin) void verify(pin);
  }, [verify]);

  useEffect(() => {
    if (registered !== true || bioTried.current) return;
    bioTried.current = true;
    void tryBiometric();
  }, [registered, tryBiometric]);

  const onChange = (next: string) => {
    if (next.length < 6) {
      setValue(next);
      return;
    }
    if (registered) {
      void verify(next);
      return;
    }
    if (!first) {
      setFirst(next);
      setValue("");
      return;
    }
    if (first !== next) {
      setError("간편비밀번호가 일치하지 않아요");
      setFirst("");
      setValue("");
      return;
    }
    void register(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.body}>
        <Text style={styles.title}>
          {registered === null
            ? "간편비밀번호"
            : registered
              ? "간편비밀번호 입력"
              : first
                ? "한 번 더 입력해 주세요"
                : "간편비밀번호를 등록해 주세요"}
        </Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <PinKeypad value={value} onChange={onChange} />
        {registered === true && !!bioLabel && (
          <Pressable
            style={styles.forgot}
            onPress={() => void tryBiometric()}
            hitSlop={8}
          >
            <Text style={styles.forgotText}>{bioLabel}로 열기</Text>
          </Pressable>
        )}
        {registered === true && (
          <Pressable
            style={styles.forgot}
            onPress={() =>
              Alert.alert(
                "간편비밀번호 찾기",
                "로그아웃 후 다시 로그인하면 간편비밀번호를 새로 등록해요",
                [
                  { text: "취소", style: "cancel" },
                  {
                    text: "확인",
                    onPress: () => {
                      void (async () => {
                        await SecureStore.setItemAsync(
                          "pin_reset_pending",
                          "true",
                        );
                        await clearSession();
                        unlocked.current = true;
                        router.replace("/auth");
                      })();
                    },
                  },
                ],
              )
            }
            hitSlop={8}
          >
            <Text style={styles.forgotText}>간편비밀번호를 잊었어요</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.semantic.color.bgDefault,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: tokens.semantic.color.fgPrimary,
    marginBottom: 40,
  },
  error: {
    fontSize: 14,
    color: tokens.semantic.color.danger,
    marginTop: -24,
    marginBottom: 16,
  },
  forgot: {
    marginTop: 32,
    padding: 8,
  },
  forgotText: {
    fontSize: 14,
    color: tokens.semantic.color.fgTertiary,
    textDecorationLine: "underline",
  },
});

export default PinScreen;
