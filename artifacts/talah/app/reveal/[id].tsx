import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from "react-native";
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
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";

const COFFEE_IMG = require("../../assets/images/coffee-meetup.png");
const DINNER_IMG = require("../../assets/images/dinner-meetup.png");

// Trait i18n keys — maps personalityTraits values to i18n keys defined in i18n.ts
const TRAIT_KEY: Record<string, string> = {
  calm: "pt_calm",
  social: "pt_social",
  curious: "pt_curious",
  thoughtful: "pt_thoughtful",
  energetic: "pt_energetic",
  funny: "pt_funny",
  organized: "pt_organized",
  creative: "pt_creative",
};

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

  // Only show member details once admin has explicitly set status to "revealed" or beyond.
  // "matched" = group formed but identity still hidden — reveal happens 6–12h before meetup.
  const isRevealable =
    group.status === "revealed" ||
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
        {/* ── Group summary card ── */}
        <Card padded={false} elevated style={{ overflow: "hidden" }}>
          <Image
            source={group.meetupType === "coffee" ? COFFEE_IMG : DINNER_IMG}
            style={{ width: "100%", height: 180 }}
            contentFit="cover"
          />
          <View style={{ padding: 18, gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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
                  { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" },
                )}
              />
            ) : null}
            {group.venue ? (
              <DetailRow icon="map-pin" label={t("reveal_venue")} value={group.venue} />
            ) : null}
            <DetailRow icon="users" label={t("members_count")} value={String(members.length)} />
          </View>
        </Card>

        {/* ── Privacy note ── */}
        <View style={{ flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.muted }}>
          <Feather name="shield" size={16} color={colors.primary} style={{ marginTop: 2 }} />
          <AppText variant="bodySmall" color={colors.mutedForeground} style={{ flex: 1 }}>
            {t("privacy_note")}
          </AppText>
        </View>

        {/* ── Member cards (locked until revealed) ── */}
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
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
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {(m.personalityTraits && m.personalityTraits.length > 0
                      ? m.personalityTraits.slice(0, 3)
                      : [m.personality]
                    ).map((trait) => (
                      <Chip key={trait} label={t(TRAIT_KEY[trait] ?? `pers_${trait}`)} size="sm" tone="accent" />
                    ))}
                    <Chip label={m.ageRange} size="sm" />
                  </View>

                  {m.funFact ? (
                    <View style={{ marginTop: 4, padding: 12, borderRadius: 12, backgroundColor: colors.muted }}>
                      <AppText variant="caption" color={colors.mutedForeground}>{t("fun_fact")}</AppText>
                      <AppText variant="body" style={{ marginTop: 4 }}>"{m.funFact}"</AppText>
                    </View>
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* ── Mutual connects section (completed groups only) ── */}
        {group.status === "completed" && currentUser ? (
          <MutualConnectsSection groupId={group.id} currentUserId={currentUser.id} />
        ) : null}

        {/* ── Feedback / report actions ── */}
        {isRevealable ? (
          <View style={{ gap: 10 }}>
            <Button
              label={t("give_feedback")}
              onPress={() => router.push(`/feedback/${group.id}`)}
              size="lg"
            />
            <Pressable
              onPress={() => router.push(`/feedback/${group.id}`)}
              style={{ alignItems: "center", paddingVertical: 8 }}
            >
              <AppText variant="label" color={colors.mutedForeground}>
                {t("report_member")}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ── Mutual connects section ────────────────────────────────────────────────

type MutualMember = { id: string; nickname: string | null; personalityTraits: string[] };

function MutualConnectsSection({
  groupId,
  currentUserId,
}: {
  groupId: string;
  currentUserId: string;
}) {
  const colors = useColors();
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [mutuals, setMutuals] = useState<MutualMember[]>([]);
  const [hasFeedback, setHasFeedback] = useState(false);

  useEffect(() => {
    api.getMutualConnects(groupId).then((res) => {
      setMutuals(res.mutualConnects);
      setHasFeedback(res.hasFeedback);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [groupId]);

  if (loading) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Don't show if the user hasn't submitted feedback yet
  if (!hasFeedback) return null;

  return (
    <Card style={{ backgroundColor: colors.primary + "0D", borderColor: colors.primary + "30" }}>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="heart" size={18} color={colors.primary} />
          <AppText variant="title" weight="semibold" color={colors.primary}>
            {t("mutual_connects")}
          </AppText>
        </View>

        {mutuals.length === 0 ? (
          <AppText variant="body" color={colors.mutedForeground}>
            {t("no_mutual_connects")}
          </AppText>
        ) : (
          <View style={{ gap: 10 }}>
            <AppText variant="bodySmall" color={colors.mutedForeground}>
              {t("mutual_connects_sub")}
            </AppText>
            {mutuals.map((m) => (
              <View
                key={m.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: colors.primary + "12",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.primary + "25",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppText variant="label" weight="bold" color={colors.primary}>
                    {(m.nickname ?? "?").charAt(0)}
                  </AppText>
                </View>
                <AppText variant="body" weight="semibold">
                  {m.nickname ?? t("anonymous")}
                </AppText>
                <Feather name="check-circle" size={16} color={colors.primary} style={{ marginLeft: "auto" }} />
              </View>
            ))}
          </View>
        )}
      </View>
    </Card>
  );
}

// ── Detail row helper ─────────────────────────────────────────────────────

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
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold">{value}</AppText>
      </View>
    </View>
  );
}
