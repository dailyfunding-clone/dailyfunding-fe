import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

export default function AuthStartScreen() {
  return (
    <View style={styles.container}>
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
          href={{ pathname: "/webview", params: { path: "/auth/signup", title: "회원가입" } }}
          asChild
        >
          <Pressable style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>회원가입</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 48,
    backgroundColor: "#fff",
  },
  hero: {
    marginTop: 48,
  },
  badge: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0033A4",
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#1A1A1A",
  },
  desc: {
    marginTop: 8,
    fontSize: 15,
    color: "#8A8F98",
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#0033A4",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  outlineBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7DAE0",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
});
