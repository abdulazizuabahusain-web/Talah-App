import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusPill } from "@/components/StatusPill";
import { useApp } from "@/contexts/AppContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";
import { computeProfileCompletion } from "@/lib/profileCompletion";

const COFFEE_IMG = require("../../assets/images/coffee-meetup.png");
const DINNER_IMG = require("../../assets/images/dinner-meetup.png");

export default function HomeScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, language, setLanguage } = useApp();
  const { groups, requests, refresh } = useData();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const myGroups = currentUser
    ? groups
        .filter((g) => g.memberIds.includes(currentUser.id))
        .sort((a, b) => (a.meetupAt ?? 0) - (b.meetupAt ?? 0))
    : [];
  const upcoming = myGroups.find(
    (g) => g.status !== "completed" && g.status !== "cancelled",
  );
  const myPendingRequest = currentUser
    ? requests.find(
        (r) => r.userId === currentUser.id && r.status === "pending",
      )
    : null;

  const completion = computeProfileCompletion(currentUser);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, webTopPad) + 8,
        paddingBottom: 100,
        paddingHorizontal: 20,
        gap: 22,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText variant="bodySmall" color={colors.mutedForeground}>
            {t("home_greeting")}
          </AppText>
          <AppText variant="h2" weight="bold">
            {currentUser?.nickname || "—"}
          </AppText>
        </View>
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

      <RequestHero />

      {upcoming || myPendingRequest ? (
        <View style={{ gap: 12 }}>
          <SectionHeader
            title={t("home_upcoming")}
            action={{
              label: t("view_all"),
              onPress: () => router.push("/(tabs)/upcoming"),
            }}
          />
          {upcoming ? (
            <Card
              onPress={() => router.push(`/reveal/${upcoming.id}`)}
              elevated
              padded={false}
              style={{ overflow: "hidden" }}
            >
              <Image
                source={upcoming.meetupType === "coffee" ? COFFEE_IMG : DINNER_IMG}
                style={{ width: "100%", height: 160 }}
                contentFit="cover"
              />
              <View style={{ padding: 18, gap: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <AppText variant="title" weight="semibold">
                    {upcoming.meetupType === "coffee"
                      ? t("meet_coffee")
                      : t("meet_dinner")}{" "}
                    · {upcoming.area}
                  </AppText>
                  <StatusPill status={upcoming.status} />
                </View>
                {upcoming.meetupAt ? (
                  <AppText variant="body" color={colors.mutedForeground}>
                    {formatDate(new Date(upcoming.meetupAt), language)}
                  </AppText>
                ) : null}
                {upcoming.venue ? (
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
                    <Feather name="map-pin" size={14} color={colors.accent} />
                    <AppText variant="bodySmall" color={colors.mutedForeground}>
                      {upcoming.venue}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </Card>
          ) : myPendingRequest ? (
            <Card>
              <View style={{ gap: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <AppText variant="title" weight="semibold">
                    {myPendingRequest.meetupType === "coffee"
                      ? t("meet_coffee")
                      : t("meet_dinner")}{" "}
                    · {myPendingRequest.area}
                  </AppText>
                  <StatusPill status="pending" />
                </View>
                <AppText variant="body" color={colors.mutedForeground}>
                  {myPendingRequest.preferredDate}
                </AppText>
                <AppText variant="bodySmall" color={colors.mutedForeground}>
                  {t("reveal_hint")}
                </AppText>
              </View>
            </Card>
          ) : null}
        </View>
      ) : null}

      {completion < 100 ? (
        <Card
          onPress={() => router.push("/onboarding")}
          style={{ backgroundColor: colors.accent + "10", borderColor: colors.accent + "40" }}
        >
          <View style={{ gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <AppText variant="title" weight="semibold">
                {t("profile_completion")}
              </AppText>
              <AppText variant="title" weight="bold" color={colors.accent}>
                {completion}%
              </AppText>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.muted,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${completion}%`,
                  backgroundColor: colors.accent,
                }}
              />
            </View>
            <AppText variant="bodySmall" color={colors.mutedForeground}>
              {t("complete_profile")}
            </AppText>
          </View>
        </Card>
      ) : null}

      <PrivacyNote />
    </ScrollView>
  );
}

function RequestHero() {
  const colors = useColors();
  const t = useT();
  return (
    <Card
      onPress={() => router.push("/request")}
      elevated
      style={{
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      }}
    >
      <View style={{ gap: 14 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primaryForeground + "1F",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="users" size={20} color={colors.primaryForeground} />
        </View>
        <AppText variant="h2" weight="bold" color={colors.primaryForeground}>
          {t("home_request_cta")}
        </AppText>
        <AppText variant="body" color={colors.primaryForeground} style={{ opacity: 0.85 }}>
          {t("home_request_sub")}
        </AppText>
        <Button
          label={t("home_request_cta")}
          variant="secondary"
          onPress={() => router.push("/request")}
        />
      </View>
    </Card>
  );
}

function PrivacyNote() {
  const colors = useColors();
  const t = useT();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        padding: 14,
        borderRadius: 16,
        backgroundColor: colors.muted,
        alignItems: "flex-start",
      }}
    >
      <Feather name="shield" size={16} color={colors.primary} style={{ marginTop: 2 }} />
      <AppText
        variant="bodySmall"
        color={colors.mutedForeground}
        style={{ flex: 1 }}
      >
        {t("privacy_note")}
      </AppText>
    </View>
  );
}

function formatDate(d: Date, lang: "ar" | "en"): string {
  return d.toLocaleString(lang === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}
