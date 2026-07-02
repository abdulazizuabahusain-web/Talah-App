import React from "react";
import { Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const TEXT_AR = `سياسة الخصوصية

آخر تحديث: يوليو 2026

تطبيق طلعة مبني على مبدأ واحد: خصوصيتك أولاً. لا يمكن لأي مستخدم تصفّح ملفك الشخصي، ولا يُسمح بالتواصل المباشر بين المستخدمين قبل إتمام عملية الكشف المتبادل بعد اللقاء.

المعلومات التي نجمعها:
• رقم الجوال والبريد الإلكتروني، لإنشاء الحساب وتسجيل الدخول.
• الاسم المستعار، الجنس، المدينة، والفئة العمرية.
• الاهتمامات، الشخصية، وتفضيلات اللقاء (الأيام، الأوقات، نوع اللقاء).
• معلومات التواصل (رقم الجوال، إنستغرام، سناب شات، تويتر/X، تيك توك) — تُحفظ بشكل خاص ولا تُكشف إلا بموافقتك بعد تطابق متبادل.
• رمز الإشعارات (Push Token) لإرسال تنبيهات اللقاءات.

كيف نستخدم بياناتك:
• لترتيب لقاءات صغيرة وآمنة بين أشخاص متوافقين.
• لتحسين جودة المطابقة بمرور الوقت.
• للتواصل معك بخصوص حسابك أو اللقاءات المجدولة.

ما لا نفعله أبداً:
• لا نبيع بياناتك لأي طرف ثالث.
• لا نعرض صورتك أو ملفك الكامل لمستخدمين آخرين.
• لا نسمح بتصفّح المستخدمين أو البحث عنهم.
• لا نكشف معلومات التواصل الخاصة بك دون موافقتك الصريحة.

أمانك:
يمكنك الإبلاغ عن أي مستخدم أو حظره في أي وقت. فريقنا يراجع جميع البلاغات يدوياً.

حقوقك:
يمكنك تعديل بياناتك أو حذف حسابك بالكامل في أي وقت من الإعدادات. عند الحذف، تُزال بياناتك الشخصية من أنظمتنا بشكل نهائي.

التواصل معنا:
لأي استفسار حول الخصوصية، راسلنا عبر البريد الإلكتروني المذكور في صفحة "تواصل معنا" داخل التطبيق.`;

const TEXT_EN = `Privacy Policy

Last updated: July 2026

Tal'ah is built on one principle: your privacy comes first. No user can browse your profile, and direct contact between users is not permitted until both sides mutually reveal after a meetup.

Information we collect:
• Phone number and email, to create and secure your account.
• Nickname, gender, city, and age range.
• Interests, personality traits, and meetup preferences (days, times, meetup type).
• Contact details (phone, Instagram, Snapchat, X/Twitter, TikTok) — stored privately and only shared after a mutual reveal you explicitly approve.
• A push notification token, used to alert you about meetups.

How we use your data:
• To arrange small, safe meetups between compatible people.
• To improve match quality over time.
• To contact you about your account or scheduled meetups.

What we never do:
• We never sell your data to third parties.
• We never show your photo or full profile to other users.
• We never allow browsing or searching for users.
• We never reveal your contact details without your explicit consent.

Your safety:
You can report or block any user at any time. Our team manually reviews every report.

Your rights:
You can update your information or permanently delete your account at any time from Settings. Deletion removes your personal data from our systems.

Contact us:
For any privacy questions, reach us via the email listed on the "Contact Us" page in the app.`;

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
