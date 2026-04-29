import React from "react";
import { Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const TEXT_AR = `سياسة الخصوصية - مسودة تجريبية

نولي خصوصيتك أهمية قصوى. لا نعرض ملفك للتصفح العام، ولا نسمح بالاتصال المباشر قبل الكشف.

ما نجمعه:
• الاسم المستعار، المدينة، الفئة العمرية، والاهتمامات.
• تفضيلات اللقاء فقط لاستخدامها في عملية المطابقة.

كيف نستخدمه:
• ترتيب لقاءات صغيرة آمنة.
• تحسين جودة المطابقة.

ما لا نفعله:
• لا نبيع بياناتك.
• لا نعرض صورك أو ملفك الكامل.
• لا نسمح بتصفّح المستخدمين.

يمكنك حذف حسابك في أي وقت من الإعدادات.`;

const TEXT_EN = `Privacy Policy — Draft

Your privacy is our top priority. Your profile is not browseable and direct contact before reveal is not allowed.

What we collect:
• Nickname, city, age range, and interests.
• Meetup preferences, used only for matching.

How we use it:
• To plan small, safe gatherings.
• To improve match quality.

What we don't do:
• We don't sell your data.
• We don't show your photo or full profile.
• We don't allow user browsing.

You can delete your account anytime from Settings.`;

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;
  const isAr = language === "ar";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={isAr ? "سياسة الخصوصية" : "Privacy Policy"} />
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
