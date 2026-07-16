import React from "react";
import { Linking, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const SUPPORT_EMAIL = "Info@talahapp.com";

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const isAr = language === "ar";
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={isAr ? "الدعم والتواصل" : "Support"} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, webBottomPad) + 24,
        }}
      >
        <Card>
          <AppText variant="body" style={{ lineHeight: 24, marginBottom: 16 }}>
            {isAr
              ? "لأي استفسار أو مشكلة تتعلق بتطبيق طلعة، يسعدنا مساعدتك. راسلنا عبر البريد الإلكتروني وسنرد في أقرب وقت ممكن."
              : "For any question or issue related to the Tal'ah app, we're happy to help. Reach out by email and we'll get back to you as soon as possible."}
          </AppText>
          <AppText
            variant="body"
            style={{
              fontWeight: "600",
              color: colors.primary,
              lineHeight: 24,
            }}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            {SUPPORT_EMAIL}
          </AppText>
        </Card>
      </ScrollView>
    </View>
  );
}
