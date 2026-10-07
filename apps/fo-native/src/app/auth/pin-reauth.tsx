import { tokens } from "@dailyfunding/design-system";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import ky from "ky";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinKeypad, resolveReauth } from "@/features/auth";
import { WEB_BASE_URL } from "@/shared";

const PinReauthScreen = () => {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => resolveReauth(null), []);

  const onChange = (next: string) => {
    if (next.length < 6) {
      setValue(next);
      return;
    }
    const submit = async () => {
      const access = await SecureStore.getItemAsync("access_token");
      const res = await ky.post(`${WEB_BASE_URL}/api/auth/reauth`, {
        json: { pin: next },
        headers: access ? { Authorization: `Bearer ${access}` } : undefined,
        throwHttpErrors: false,
      });
      if (res.ok) {
        const data = (await res.json()) as { reauth_token?: string };
        resolveReauth(data.reauth_token ?? null);
        router.back();
        return;
      }
      if (res.status === 401) {
        setError("간편비밀번호가 맞지 않아요");
      } else {
        setError("잠시 후 다시 시도해 주세요");
      }
      setValue("");
    };
    void submit();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Pressable
        style={styles.close}
        onPress={() => {
          resolveReauth(null);
          router.back();
        }}
        hitSlop={8}
      >
        <Text style={styles.closeText}>취소</Text>
      </Pressable>
      <View style={styles.body}>
        <Text style={styles.title}>간편비밀번호 입력</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <PinKeypad value={value} onChange={onChange} />
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
  close: {
    alignSelf: "flex-end",
    padding: 16,
  },
  closeText: {
    fontSize: 15,
    color: tokens.semantic.color.fgSecondary,
  },
  error: {
    fontSize: 14,
    color: tokens.semantic.color.danger,
    marginTop: -24,
    marginBottom: 16,
  },
});

export default PinReauthScreen;
