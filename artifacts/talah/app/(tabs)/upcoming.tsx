import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { StatusPill } from "@/components/StatusPill";
import { useApp } from "@/contexts/AppContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";

export default function UpcomingScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, language } = useApp();
  const { groups, requests } = useData();
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const myGroups = currentUser
    ? groups
        .filter((g) => g.memberIds.includes(currentUser.id))
        .sort((a, b) => (b.meetupAt ?? 0) - (a.meetupAt ?? 0))
    : [];
  const myRequests = currentUser
    ? requests
        .filter((r) => r.userId === currentUser.id)
        .sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const empty = myGroups.length === 0 && myRequests.length === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, webTopPad) + 12,
        paddingBottom: 100,
        paddingHorizontal: 20,
        gap: 16,
      }}
    >
      <AppText variant="h1" weight="bold">
        {t("upcoming_title")}
      </AppText>

      {empty ? (
        <View style={{ paddingTop: 60, alignItems: "center", gap: 12 }}>
          <Feather name="calendar" size={32} color={colors.mutedForeground} />
          <AppText
            variant="body"
            color={colors.mutedForeground}
            align="center"
          >
            {t("empty_upcoming")}
          </AppText>
        </View>
      ) : null}

      {myGroups.map((g) => (
        <Card
          key={g.id}
          onPress={() => router.push(`/reveal/${g.id}`)}
          elevated
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
                {g.meetupType === "coffee" ? t("meet_coffee") : t("meet_dinner")}{" "}
                · {g.area}
              </AppText>
              <StatusPill status={g.status} />
            </View>
            {g.meetupAt ? (
              <View
                style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
              >
                <Feather name="clock" size={14} color={colors.mutedForeground} />
                <AppText variant="bodySmall" color={colors.mutedForeground}>
                  {new Date(g.meetupAt).toLocaleString(
                    language === "ar" ? "ar-SA" : "en-US",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}
                </AppText>
              </View>
            ) : null}
            {g.venue ? (
              <View
                style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
              >
                <Feather name="map-pin" size={14} color={colors.accent} />
                <AppText variant="bodySmall" color={colors.mutedForeground}>
                  {g.venue}
                </AppText>
              </View>
            ) : null}
            <AppText variant="caption" color={colors.mutedForeground}>
              {g.memberIds.length} {t("members_count")}
            </AppText>
          </View>
        </Card>
      ))}

      {myRequests
        .filter((r) => !groups.some((g) => g.requestIds?.includes(r.id)))
        .map((r) => (
          <Card key={r.id}>
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <AppText variant="title" weight="semibold">
                  {r.meetupType === "coffee"
                    ? t("meet_coffee")
                    : t("meet_dinner")}{" "}
                  · {r.area}
                </AppText>
                <StatusPill status={r.status} />
              </View>
              <AppText variant="bodySmall" color={colors.mutedForeground}>
                {r.preferredDate} · {t(`time_${r.preferredTime}`)}
              </AppText>
              <AppText variant="caption" color={colors.mutedForeground}>
                {t("reveal_hint")}
              </AppText>
            </View>
          </Card>
        ))}
    </ScrollView>
  );
}
