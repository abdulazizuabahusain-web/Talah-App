import React from "react";
import { Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const TEXT_AR = `الشروط والأحكام - مسودة تجريبية

باستخدامك تطبيق طلعة، فإنك توافق على:
• استخدام التطبيق فقط لأغراض اللقاء الاجتماعي المنسّق.
• الالتزام بقواعد المجتمع.
• تحمل مسؤولية تصرفاتك خلال اللقاءات.
• عدم استخدام التطبيق لأي غرض تجاري أو ترويجي.
• حق منصة طلعة بإيقاف أو حذف الحسابات المخالفة دون إشعار.

طلعة منصة لقاءات منسّقة وليست تطبيق مواعدة.`;

const TEXT_EN = `Terms — Draft

By using Tal'ah you agree to:
• Use the app only for curated social gatherings.
• Follow the Code of Conduct.
• Be responsible for your behavior during meetups.
• Not use the app for commercial or promotional purposes.
• Tal'ah may suspend or remove accounts that violate these terms without notice.

Tal'ah is a curated meetup platform — not a dating app.`;

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;
  const isAr = language === "ar";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={isAr ? "الشروط والأحكام" : "Terms"} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, webBottomPad) + 24,
        }}
      >
        <Card>
          <AppText variant="body" style={{ lineHeight: 24 }}>
            {isAr ? TEXT_AR : TEXT_EN}
          </AppText>
        </Card>
      </ScrollView>
    </View>
  );
}
