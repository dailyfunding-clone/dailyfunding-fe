import { tokens } from "@dailyfunding/design-system";
import { useNetworkState } from "expo-network";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OfflineBanner = () => {
  const networkState = useNetworkState();
  const insets = useSafeAreaInsets();
  const offline = networkState.isConnected === false || networkState.isInternetReachable === false;

  if (!offline) return null;

  return (
    <View pointerEvents="none" style={[styles.banner, { paddingTop: insets.top }]}>
      <Text style={styles.text}>네트워크에 연결되어 있지 않아요</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: "center",
    paddingBottom: 8,
    backgroundColor: tokens.semantic.color.fgPrimary,
  },
  text: {
    color: tokens.semantic.color.bgDefault,
    fontSize: 13,
    fontWeight: "600",
  },
});

export default OfflineBanner;
