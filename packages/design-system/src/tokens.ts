export const scale = {
  color: {
    white: "#FFFFFF",
    brand500: "#0033A4",
    gray050: "#F7F8FA",
    gray100: "#F0F2F5",
    gray300: "#D7DAE0",
    gray500: "#8A8F98",
    gray700: "#4B4F57",
    gray900: "#1A1A1A",
    red500: "#D63F3F",
  },
  radius: {
    sm: 8,
    md: 12,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 48,
  },
  fontSize: {
    xs: 12,
    sm: 13,
    md: 14,
    base: 15,
    lg: 16,
    xl: 17,
    "2xl": 20,
    "3xl": 32,
  },
  fontWeight: {
    regular: "400",
    semibold: "600",
    extrabold: "800",
  },
} as const;

export const semantic = {
  color: {
    bgDefault: "white",
    bgSubtle: "gray050",
    bgInverse: "gray900",
    fgPrimary: "gray900",
    fgSecondary: "gray700",
    fgTertiary: "gray500",
    fgInverse: "white",
    strokeDefault: "gray300",
    strokeSubtle: "gray100",
    accentPrimary: "brand500",
    danger: "red500",
  },
} as const;
