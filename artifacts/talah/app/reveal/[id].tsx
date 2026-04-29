import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusPill } from "@/components/StatusPill";
import { useApp } from "@/contexts/AppContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";

const COFFEE_IMG = require("../../assets/images/coffee-meetup.png");
const DINNER_IMG = require("../../assets/images/dinner-meetup.png");

const TRAIT_LABEL: Record<string, string> = {};

export default function RevealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, language } = useApp();
  const { groups, users } = useData();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const group = groups.find((g) => g.id === id);
  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t("reveal_title")} />
      </View>
    );
  }

  const isRevealable =
    group.status === "revealed" ||
    group.status === "matched" ||
    group.status === "completed";

  const members = group.memberIds
    .map((mid) => users.find((u) => u.id === mid))
    .filter((u): u is NonNullable<typeof u> => !!u);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t("reveal_title")} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, webBottomPad) + 24,
          gap: 16,
        }}
      >
        <Card padded={false} elevated style={{ overflow: "hidden" }}>
          <Image
            source={group.meetupType === "coffee" ? COFFEE_IMG : DINNER_IMG}
            style={{ width: "100%", height: 180 }}
            contentFit="cover"
          />
          <View style={{ padding: 18, gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <AppText variant="h3" weight="bold">
                {group.meetupType === "coffee" ? t("meet_coffee") : t("meet_dinner")}
              </AppText>
              <StatusPill status={group.status} />
            </View>
            {group.meetupAt ? (
              <DetailRow
                icon="clock"
                label={t("reveal_meetup_at")}
                value={new Date(group.meetupAt).toLocaleString(
                  language === "ar" ? "ar-SA" : "en-US",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "numeric",
                    minute: "2-digit",
                  },
                )}
              />
            ) : null}
            {group.venue ? (
              <DetailRow
                icon="map-pin"
                label={t("reveal_venue")}
                value={group.venue}
              />
            ) : null}
            <DetailRow
              icon="users"
              label={t("members_count")}
              value={String(members.length)}
            />
          </View>
        </Card>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            padding: 14,
            borderRadius: 14,
            backgroundColor: colors.muted,
          }}
        >
          <Feather name="shield" size={16} color={colors.primary} style={{ marginTop: 2 }} />
          <AppText variant="bodySmall" color={colors.mutedForeground} style={{ flex: 1 }}>
            {t("privacy_note")}
          </AppText>
        </View>

        {!isRevealable ? (
          <Card>
            <View style={{ alignItems: "center", gap: 10, padding: 18 }}>
              <Feather name="lock" size={28} color={colors.mutedForeground} />
              <AppText variant="body" align="center" color={colors.mutedForeground}>
                {t("reveal_locked")}
              </AppText>
            </View>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            <AppText variant="title" weight="semibold">
              {t("reveal_title")}
            </AppText>
            {members.map((m) => (
              <Card key={m.id}>
                <View style={{ gap: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colors.accent + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AppText variant="title" weight="bold" color={colors.accent}>
                        {m.nickname.charAt(0)}
                      </AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="title" weight="semibold">
                        {m.nickname}
                        {m.id === currentUser?.id ? "  ·  " + t("home_greeting") : ""}
                      </AppText>
                      {m.verified ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 2,
                          }}
                        >
                          <Feather name="check-circle" size={12} color={colors.primary} />
                          <AppText variant="caption" color={colors.primary} weight="semibold">
                            {t("verified_badge")}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <AppText variant="caption" color={colors.mutedForeground}>
                    {t("traits")}
                  </AppText>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                  >
                    <Chip label={t(`pers_${m.personality}`)} size="sm" />
                    <Chip label={t(`ls_${m.lifestyle}`)} size="sm" />
                    <Chip label={m.ageRange} size="sm" />
                  </View>

                  {m.funFact ? (
                    <View
                      style={{
                        marginTop: 4,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: colors.muted,
                      }}
                    >
                      <AppText variant="caption" color={colors.mutedForeground}>
                        {t("fun_fact")}
                      </AppText>
                      <AppText variant="body" style={{ marginTop: 4 }}>
                        “{m.funFact}”
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        )}

        {group.status === "completed" || group.status === "revealed" ? (
          <Button
            label={t("give_feedback")}
            onPress={() => router.push(`/feedback/${group.id}`)}
            size="lg"
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={14} color={colors.foreground} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" color={colors.mutedForeground}>
          {label}
        </AppText>
        <AppText variant="body" weight="medium">
          {value}
        </AppText>
      </View>
    </View>
  );
}
