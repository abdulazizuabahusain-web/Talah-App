import React from "react";
import { Pressable, View, ViewProps, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Card({
  onPress,
  padded = true,
  elevated = false,
  children,
  style,
  ...rest
}: CardProps) {
  const colors = useColors();

  const base: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderColor: colors.border,
    borderWidth: 1,
    padding: padded ? 18 : 0,
    shadowColor: "#4A5D4F",
    shadowOpacity: elevated ? 0.1 : 0.035,
    shadowRadius: elevated ? 18 : 10,
    shadowOffset: { width: 0, height: elevated ? 10 : 4 },
    elevation: elevated ? 2 : 1,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          base,
          { opacity: pressed ? 0.9 : 1 },
          style as ViewStyle,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[base, style]} {...rest}>
      {children}
    </View>
  );
}
