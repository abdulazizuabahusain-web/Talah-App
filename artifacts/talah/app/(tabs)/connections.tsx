import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import type { ApiMutualConnect } from "@/lib/api";
import { api } from "@/lib/api";
import { markConnectsSeen } from "@/lib/connectsStore";
import { useT } from "@/lib/i18n";

// ── types ─────────────────────────────────────────────────────────────────────

type ConnectionGroup = {
  groupId: string;
  meetupType: string | null;
  city: string | null;
  meetupAt: number | null;
  formedAt: number;
  mutualConnects: ApiMutualConnect[];
};

const MEETUP_TYPE_LABEL: Record<string, string> = {
  coffee: "☕",
  lunch: "🍽️",
  walk: "🚶",
  dinner: "🌙",
};

// ── platform meta ─────────────────────────────────────────────────────────────

type PlatformItem = {
  key: keyof ApiMutualConnect;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  label: string;
  buildUrl?: (handle: string) => string;
};

const PLATFORM_ITEMS: PlatformItem[] = [
  {
    key: "contactPhone",
    icon: "phone",
    color: "#2ECC71",
    label: "WhatsApp / جوال",
    buildUrl: (v) => `https://wa.me/${v.replace(/\D/g, "")}`,
  },
  {
    key: "instagram",
    icon: "camera",
    color: "#E1306C",
    label: "Instagram",
    buildUrl: (v) => `https://instagram.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "snapchat",
    icon: "message-circle",
    color: "#FFFC00",
    label: "Snapchat",
    buildUrl: (v) => `https://snapchat.com/add/${v}`,
  },
  {
    key: "twitter",
    icon: "twitter",
    color: "#1DA1F2",
    label: "X / Twitter",
    buildUrl: (v) => `https://x.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "tiktok",
    icon: "music",
    color: "#010101",
    label: "TikTok",
    buildUrl: (v) => `https://tiktok.com/@${v.replace(/^@/, "")}`,
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function hasAnyContact(m: ApiMutualConnect): boolean {
  return !!(m.contactPhone || m.instagram || m.snapchat || m.twitter || m.tiktok);
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function ConnectionsScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser } = useApp();
  const isWeb = Platform.OS === "web";
  const webTopPad = isWeb ? 67 : 0;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<ConnectionGroup[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await api.getConnections();
      setGroups(res.connections);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) load();
    else setLoading(false);
  }, [currentUser, load]);

  useFocusEffect(
    useCallback(() => {
      markConnectsSeen();
    }, []),
  );

  const totalConnects = groups.reduce((n, g) => n + g.mutualConnects.length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t("connections_title")} />
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: webTopPad + 4,
            paddingBottom: Math.max(insets.bottom + 24, 40),
            gap: 20,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
        >
          {groups.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                paddingTop: 80,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.primary + "15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="heart" size={32} color={colors.primary} />
              </View>
              <AppText variant="title" weight="semibold" style={{ textAlign: "center" }}>
                {t("connections_empty_title")}
              </AppText>
              <AppText
                variant="body"
                color={colors.mutedForeground}
                style={{ textAlign: "center", maxWidth: 280 }}
              >
                {t("connections_empty_sub")}
              </AppText>
            </View>
          ) : (
            <>
              {/* Summary pill */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: colors.primary + "12",
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  alignSelf: "flex-start",
                }}
              >
                <Feather name="heart" size={16} color={colors.primary} />
                <AppText variant="label" weight="semibold" color={colors.primary}>
                  {totalConnects} {t("mutual_connects")}
                </AppText>
              </View>

              {groups.map((g) => (
                <View key={g.groupId} style={{ gap: 10 }}>
                  {/* Event label */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <AppText variant="label" weight="semibold" color={colors.mutedForeground}>
                      {MEETUP_TYPE_LABEL[g.meetupType ?? ""] ?? "🎉"}
                    </AppText>
                    <AppText variant="label" color={colors.mutedForeground}>
                      {t("connections_from")}
                      {g.city ? ` · ${g.city}` : ""}
                      {g.meetupAt
                        ? ` · ${new Date(g.meetupAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}`
                        : ""}
                    </AppText>
                    <Pressable
                      onPress={() => router.push(`/reveal/${g.groupId}`)}
                      hitSlop={8}
                      style={{ marginLeft: "auto" }}
                    >
                      <Feather name="external-link" size={14} color={colors.mutedForeground} />
                    </Pressable>
                  </View>

                  {g.mutualConnects.map((m) => (
                    <MutualConnectCard key={m.id} member={m} />
                  ))}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── MutualConnectCard ─────────────────────────────────────────────────────────

function MutualConnectCard({ member }: { member: ApiMutualConnect }) {
  const colors = useColors();
  const t = useT();
  const { currentUser } = useApp();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isOwnProfile = currentUser?.id === member.id;

  const handleCopy = (val: string, key: string) => {
    Clipboard.setString(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpen = (platform: PlatformItem, val: string) => {
    if (!platform.buildUrl) return;
    const url = platform.buildUrl(val);
    Linking.openURL(url).catch(() => {});
  };

  const filledPlatforms = PLATFORM_ITEMS.filter(
    (p) => member[p.key] && String(member[p.key]).trim().length > 0,
  );

  return (
    <Card style={{ backgroundColor: colors.primary + "06", borderColor: colors.primary + "20" }}>
      <View style={{ gap: 14 }}>
        {/* Member header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: colors.primary + "22",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText variant="title" weight="bold" color={colors.primary}>
              {(member.nickname ?? "?").charAt(0)}
            </AppText>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <AppText variant="body" weight="semibold">
                {member.nickname ?? t("anonymous")}
              </AppText>
              <Feather name="check-circle" size={14} color={colors.primary} />
            </View>
            {member.personalityTraits.length > 0 && (
              <AppText variant="bodySmall" color={colors.mutedForeground} numberOfLines={1}>
                {member.personalityTraits.slice(0, 3).join(" · ")}
              </AppText>
            )}
          </View>
          <Feather name="link" size={15} color={colors.primary} />
        </View>

        {/* Contact cards */}
        {filledPlatforms.length > 0 ? (
          <View style={{ gap: 8 }}>
            {filledPlatforms.map((platform) => {
              const val = String(member[platform.key]);
              const display =
                platform.key === "contactPhone"
                  ? val
                  : `@${val.replace(/^@/, "")}`;
              return (
                <View
                  key={platform.key}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: platform.color + "18",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name={platform.icon} size={16} color={platform.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="caption" color={colors.mutedForeground}>
                      {platform.label}
                    </AppText>
                    <AppText variant="body" weight="semibold" numberOfLines={1}>
                      {display}
                    </AppText>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {platform.buildUrl && (
                      <Pressable
                        onPress={() => handleOpen(platform, val)}
                        hitSlop={8}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: platform.color + "15",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name="external-link" size={14} color={platform.color} />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleCopy(val, platform.key)}
                      hitSlop={8}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: colors.muted,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather
                        name={copiedKey === platform.key ? "check" : "copy"}
                        size={14}
                        color={
                          copiedKey === platform.key
                            ? colors.primary
                            : colors.mutedForeground
                        }
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : isOwnProfile ? null : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.muted,
            }}
          >
            <Feather name="info" size={14} color={colors.mutedForeground} />
            <AppText variant="bodySmall" color={colors.mutedForeground} style={{ flex: 1 }}>
              {t("contact_not_added_yet").replace("{{name}}", member.nickname ?? "…")}
            </AppText>
          </View>
        )}

        {/* Nudge to fill own contact info if viewing own card somehow — shouldn't normally appear */}
        {isOwnProfile && !hasAnyContact(member) && (
          <Pressable
            onPress={() => router.push("/edit-contact")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.accent + "12",
            }}
          >
            <Feather name="plus-circle" size={15} color={colors.accent} />
            <AppText variant="bodySmall" color={colors.accent} style={{ flex: 1 }}>
              {t("contact_add_yours")}
            </AppText>
          </Pressable>
        )}
      </View>
    </Card>
  );
}
