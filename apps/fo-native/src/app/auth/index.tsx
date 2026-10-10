import { tokens } from "@dailyfunding/design-system";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AuthStartScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.hero}>
        <Text style={styles.badge}>온라인투자연계금융</Text>
        <Text style={styles.title}>데일리펀딩</Text>
        <Text style={styles.desc}>투자부터 상환까지, 매일 쌓이는 수익</Text>
      </View>
      <View style={styles.actions}>
        <Link
          href={{ pathname: "/webview", params: { path: "/auth/signin", title: "로그인" } }}
          asChild
        >
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>로그인</Text>
          </Pressable>
        </Link>
        <Link
          href={{ pathname: "/webview", params: { path: "/auth/signup", title: "가입하기" } }}
          asChild
        >
          <Pressable style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>가입하기</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: tokens.scale.spacing.xl,
    paddingVertical: tokens.scale.spacing["3xl"],
    backgroundColor: tokens.semantic.color.bgDefault,
  },
  hero: {
    marginTop: tokens.scale.spacing["3xl"],
  },
  badge: {
    fontSize: tokens.scale.fontSize.sm,
    fontWeight: tokens.scale.fontWeight.semibold,
    color: tokens.semantic.color.accentPrimary,
    marginBottom: tokens.scale.spacing.sm,
  },
  title: {
    fontSize: tokens.scale.fontSize["3xl"],
    fontWeight: tokens.scale.fontWeight.extrabold,
    letterSpacing: -0.5,
    color: tokens.semantic.color.fgPrimary,
  },
  desc: {
    marginTop: tokens.scale.spacing.sm,
    fontSize: tokens.scale.fontSize.base,
    color: tokens.semantic.color.fgTertiary,
  },
  actions: {
    gap: tokens.scale.spacing.md,
  },
  primaryBtn: {
    height: 52,
    borderRadius: tokens.scale.radius.md,
    backgroundColor: tokens.semantic.color.accentPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: tokens.scale.fontSize.lg,
    fontWeight: tokens.scale.fontWeight.semibold,
    color: tokens.semantic.color.bgDefault,
  },
  outlineBtn: {
    height: 52,
    borderRadius: tokens.scale.radius.md,
    borderWidth: 1,
    borderColor: tokens.semantic.color.strokeDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: {
    fontSize: tokens.scale.fontSize.lg,
    fontWeight: tokens.scale.fontWeight.semibold,
    color: tokens.semantic.color.fgPrimary,
  },
});

export default AuthStartScreen;
