import React from "react";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/AppText";
import { useColors } from "@/hooks/useColors";

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <AppText variant="title" weight="semibold">
        {title}
      </AppText>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <AppText variant="label" weight="semibold" color={colors.accent}>
            {action.label}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
