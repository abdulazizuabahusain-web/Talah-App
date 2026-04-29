import React from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { AppText } from "@/components/AppText";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...rest
}: InputProps) {
  const colors = useColors();
  const { language } = useApp();
  const isAr = language === "ar";

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <AppText variant="label" weight="medium" color={colors.mutedForeground}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
            color: colors.foreground,
            textAlign: isAr ? "right" : "left",
            writingDirection: isAr ? "rtl" : "ltr",
            fontFamily: Platform.OS === "web" ? undefined : "Inter_400Regular",
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" color={colors.destructive}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
});
