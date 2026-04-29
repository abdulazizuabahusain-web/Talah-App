import React from "react";
import { View, ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { AppText } from "@/components/AppText";
import { useColors } from "@/hooks/useColors";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  style?: ViewStyle;
}

export function Logo({ size = 56, showWordmark = false, style }: LogoProps) {
  const colors = useColors();
  return (
    <View style={[{ alignItems: "center", gap: 12 }, style]}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Circle cx={32} cy={32} r={30} fill={colors.card} stroke={colors.accent} strokeWidth={1.5} />
        <Path
          d="M22 18 a14 14 0 1 0 0 28 a10 10 0 1 1 0 -28 z"
          fill={colors.accent}
          opacity={0.95}
        />
        <Path
          d="M40 22 a12 12 0 1 0 0 20 a8 8 0 1 1 0 -20 z"
          fill={colors.primary}
          opacity={0.95}
        />
      </Svg>
      {showWordmark ? (
        <View style={{ alignItems: "center", gap: 2 }}>
          <AppText variant="h1" weight="bold" align="center">
            طلعة
          </AppText>
          <AppText variant="label" color={colors.mutedForeground} align="center">
            Tal'ah
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
