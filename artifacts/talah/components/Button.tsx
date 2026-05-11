import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { AppText } from "@/components/AppText";
import { useColors } from "@/hooks/useColors";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  fullWidth = true,
  iconLeft,
  iconRight,
  style,
}: ButtonProps) {
  const colors = useColors();

  const palette = {
    primary: {
      bg: colors.primary,
      fg: colors.primaryForeground,
      border: "transparent",
    },
    secondary: {
      bg: colors.secondary,
      fg: colors.primary,
      border: "rgba(74,93,79,0.12)",
    },
    ghost: {
      bg: "transparent",
      fg: colors.foreground,
      border: "transparent",
    },
    outline: {
      bg: "rgba(255,255,255,0.36)",
      fg: colors.primary,
      border: colors.border,
    },
    destructive: {
      bg: colors.destructive,
      fg: colors.destructiveForeground,
      border: "transparent",
    },
  }[variant];

  const sizing = {
    sm: { py: 10, px: 14, fs: 13 as const },
    md: { py: 14, px: 18, fs: 15 as const },
    lg: { py: 18, px: 22, fs: 16 as const },
  }[size];

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
        }
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === "outline" || variant === "secondary" ? 1 : 0,
          borderRadius: 999,
          paddingVertical: sizing.py,
          paddingHorizontal: sizing.px,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          shadowColor: colors.primary,
          shadowOpacity: variant === "primary" ? 0.16 : 0,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: variant === "primary" ? 2 : 0,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style as ViewStyle,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={palette.fg} />
        ) : (
          <>
            {iconLeft ? <View style={styles.icon}>{iconLeft}</View> : null}
            <AppText
              variant="title"
              weight="semibold"
              color={palette.fg}
              align="center"
              style={{ fontSize: sizing.fs }}
            >
              {label}
            </AppText>
            {iconRight ? <View style={styles.icon}>{iconRight}</View> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  icon: { alignItems: "center", justifyContent: "center" },
});
