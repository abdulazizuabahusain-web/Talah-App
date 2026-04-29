import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";

export default function WelcomeScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { ready, currentUser, language, setLanguage } = useApp();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  useEffect(() => {
    if (!ready) return;
    if (currentUser && currentUser.onboarded) {
      router.replace("/(tabs)");
    } else if (currentUser && !currentUser.onboarded) {
      router.replace("/onboarding");
    }
  }, [ready, currentUser]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top, webTopPad) + 12,
          paddingBottom: Math.max(insets.bottom, webBottomPad) + 24,
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          <Pressable
            onPress={() => setLanguage(language === "ar" ? "en" : "ar")}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <AppText variant="label" weight="semibold">
              {language === "ar" ? "EN" : "عربي"}
            </AppText>
          </Pressable>
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 24, paddingTop: 24 }}>
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 32,
              overflow: "hidden",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Image
              source={require("../assets/images/icon.png")}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>

          <View style={{ alignItems: "center", gap: 6 }}>
            <AppText variant="display" weight="bold" align="center">
              طلعة
            </AppText>
            <AppText
              variant="title"
              weight="medium"
              color={colors.mutedForeground}
              align="center"
            >
              Tal'ah
            </AppText>
          </View>

          <View style={{ gap: 12, paddingHorizontal: 8 }}>
            <AppText
              variant="h3"
              weight="medium"
              align="center"
              style={{ maxWidth: 320 }}
            >
              {t("tagline")}
            </AppText>
            <AppText
              variant="body"
              color={colors.mutedForeground}
              align="center"
              style={{ maxWidth: 320 }}
            >
              {t("curated")}
            </AppText>
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 8,
            }}
          >
            <Tag label={t("privacy_first")} />
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Button
            label={t("welcome_get_started")}
            onPress={() => router.push("/login")}
            size="lg"
          />
          <Button
            label={t("welcome_signin")}
            variant="ghost"
            onPress={() => router.push("/login")}
          />
          <AppText
            variant="caption"
            color={colors.mutedForeground}
            align="center"
            style={{ marginTop: 6 }}
          >
            {t("welcome_terms_note")}
          </AppText>
        </View>
      </ScrollView>
      <LinearGradient
        colors={[colors.background + "00", colors.accent + "10"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 200,
          pointerEvents: "none",
        }}
      />
    </View>
  );
}

function Tag({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <AppText variant="caption" weight="medium" color={colors.mutedForeground}>
        {label}
      </AppText>
    </View>
  );
}
