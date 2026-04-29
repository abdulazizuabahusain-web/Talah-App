import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  rightSlot,
}: ScreenHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const isAr = language === "ar";
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, webTopPad) + 4,
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 36,
        }}
      >
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather
              name={isAr ? "chevron-right" : "chevron-left"}
              size={20}
              color={colors.foreground}
            />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <View style={{ flex: 1 }} />
        <View style={{ minWidth: 36, alignItems: "flex-end" }}>
          {rightSlot}
        </View>
      </View>
      {title ? (
        <View style={{ marginTop: 14 }}>
          <AppText variant="h1" weight="bold">
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              variant="body"
              color={colors.mutedForeground}
              style={{ marginTop: 6 }}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
