import { tokens } from "@dailyfunding/design-system";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const shuffle = (arr: string[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const PinKeypad = ({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) => {
  const [keys, setKeys] = useState(() =>
    shuffle(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]),
  );
  const press = (key: string) => {
    if (disabled) return;
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (!key || value.length >= 6) return;
    onChange(value + key);
  };

  return (
    <View style={[styles.wrap, disabled && styles.disabled]}>
      <View style={styles.dots}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotOn]} />
        ))}
      </View>
      <View style={styles.grid}>
        {keys.slice(0, 9).map((key, i) => (
          <Pressable key={i} style={styles.key} onPress={() => press(key)} hitSlop={8}>
            <Text style={styles.keyText}>{key}</Text>
          </Pressable>
        ))}
        <Pressable
          style={styles.key}
          onPress={() => setKeys(shuffle(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]))}
          hitSlop={8}
        >
          <Text style={styles.keyText}>↺</Text>
        </Pressable>
        <Pressable style={styles.key} onPress={() => press(keys[9])} hitSlop={8}>
          <Text style={styles.keyText}>{keys[9]}</Text>
        </Pressable>
        <Pressable style={styles.key} onPress={() => press("back")} hitSlop={8}>
          <Text style={styles.keyText}>⌫</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  disabled: { opacity: 0.4 },
  dots: { flexDirection: "row", gap: 16, marginBottom: 40 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: tokens.semantic.color.strokeDefault,
    backgroundColor: "transparent",
  },
  dotOn: {
    backgroundColor: tokens.semantic.color.fgPrimary,
    borderColor: tokens.semantic.color.fgPrimary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 280,
    justifyContent: "center",
  },
  key: {
    width: 88,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontSize: 24,
    fontWeight: "500",
    color: tokens.semantic.color.fgPrimary,
  },
});

export default PinKeypad;
