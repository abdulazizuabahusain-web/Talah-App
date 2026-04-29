import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, View, ViewStyle } from "react-native";

import { AppText } from "@/components/AppText";
import { useColors } from "@/hooks/useColors";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  iconLeft?: React.ReactNode;
  size?: "sm" | "md";
  tone?: "neutral" | "accent";
  style?: ViewStyle;
}

export function Chip({
  label,
  selected,
  onPress,
  iconLeft,
  size = "md",
  tone = "neutral",
  style,
}: ChipProps) {
  const colors = useColors();
  const py = size === "sm" ? 7 : 10;
  const px = size === "sm" ? 12 : 16;

  const bg = selected
    ? tone === "accent"
      ? colors.accent
      : colors.primary
    : colors.muted;
  const fg = selected
    ? tone === "accent"
      ? colors.accentForeground
      : colors.primaryForeground
    : colors.foreground;
  const border = selected ? "transparent" : colors.border;

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.selectionAsync().catch(() => {});
        }
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: border,
          paddingVertical: py,
          paddingHorizontal: px,
          opacity: pressed ? 0.8 : 1,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        {iconLeft}
        <AppText
          variant={size === "sm" ? "label" : "body"}
          weight={selected ? "semibold" : "medium"}
          color={fg}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}
