import React from "react";
import { Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const RULES_AR = [
  "الاحترام أولاً: احترم خصوصية وحدود الجميع.",
  "لا تشارك بيانات أعضاء المجموعة خارج التطبيق.",
  "التزم بالحضور في الوقت المحدد، وأبلغ مبكرًا إن تعذر الحضور.",
  "ممنوع التسويق التجاري أو طلب التوظيف خلال اللقاء.",
  "ممنوع الاتصال بأعضاء المجموعة قبل الكشف الرسمي.",
  "أبلغ فورًا عن أي سلوك غير مناسب من خلال خيار الإبلاغ.",
];

const RULES_EN = [
  "Respect first: respect everyone's privacy and boundaries.",
  "Do not share group members' details outside the app.",
  "Show up on time. Let us know early if you can't make it.",
  "No commercial pitches or recruiting during the meetup.",
  "Do not contact other members before the official reveal.",
  "Report any inappropriate behavior right away.",
];

export default function CodeOfConductScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const isAr = language === "ar";
  const rules = isAr ? RULES_AR : RULES_EN;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={isAr ? "قواعد المجتمع" : "Code of conduct"} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, webBottomPad) + 24,
          gap: 12,
        }}
      >
        <Card>
          <View style={{ gap: 14 }}>
            {rules.map((r, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.accent + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppText
                    variant="caption"
                    weight="bold"
                    color={colors.accent}
                  >
                    {i + 1}
                  </AppText>
                </View>
                <AppText variant="body" style={{ flex: 1 }}>
                  {r}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
