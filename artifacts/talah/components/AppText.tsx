import React from "react";
import { Platform, Text, TextProps, TextStyle } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";

type Variant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "title"
  | "body"
  | "bodySmall"
  | "label"
  | "caption";

interface AppTextProps extends TextProps {
  variant?: Variant;
  weight?: "regular" | "medium" | "semibold" | "bold";
  color?: string;
  align?: "auto" | "left" | "center" | "right";
  numberOfLines?: number;
}

const sizes: Record<Variant, { size: number; line: number }> = {
  display: { size: 42, line: 48 },
  h1: { size: 28, line: 36 },
  h2: { size: 22, line: 30 },
  h3: { size: 18, line: 26 },
  title: { size: 16, line: 22 },
  body: { size: 15, line: 22 },
  bodySmall: { size: 13, line: 18 },
  label: { size: 13, line: 18 },
  caption: { size: 11, line: 16 },
};

const fontFor = (weight: AppTextProps["weight"]): string | undefined => {
  if (Platform.OS === "web") return "Tajawal, Inter, system-ui, sans-serif";
  switch (weight) {
    case "bold":
      return "Inter_700Bold";
    case "semibold":
      return "Inter_600SemiBold";
    case "medium":
      return "Inter_500Medium";
    case "regular":
    default:
      return "Inter_400Regular";
  }
};

const fontWeightFallback: Record<
  NonNullable<AppTextProps["weight"]>,
  TextStyle["fontWeight"]
> = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export function AppText({
  variant = "body",
  weight = "regular",
  color,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  const colors = useColors();
  const { language } = useApp();
  const isAr = language === "ar";

  const { size, line } = sizes[variant];

  const computed: TextStyle = {
    fontSize: size,
    lineHeight: line,
    color: color ?? colors.foreground,
    fontFamily: fontFor(weight),
    fontWeight: fontWeightFallback[weight],
    textAlign: align ?? (isAr ? "right" : "left"),
    writingDirection: isAr ? "rtl" : "ltr",
  };

  return (
    <Text style={[computed, style]} {...rest}>
      {children}
    </Text>
  );
}
