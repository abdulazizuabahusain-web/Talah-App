import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";

type MutualMember = {
  id: string;
  nickname: string | null;
  personalityTraits: string[];
};

type ConnectionGroup = {
  groupId: string;
  meetupType: string | null;
  city: string | null;
  meetupAt: number | null;
  mutualConnects: MutualMember[];
};

const MEETUP_TYPE_LABEL: Record<string, string> = {
  coffee: "☕",
  lunch: "🍽️",
  walk: "🚶",
  dinner: "🌙",
};

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
              onRefresh={() => { setRefreshing(true); load(); }}
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

              {/* Groups */}
              {groups.map((g) => (
                <View key={g.groupId} style={{ gap: 10 }}>
                  {/* Event label */}
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
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

                  {/* Members */}
                  {g.mutualConnects.map((m) => (
                    <Card
                      key={m.id}
                      style={{
                        backgroundColor: colors.primary + "08",
                        borderColor: colors.primary + "25",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        {/* Avatar */}
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: colors.primary + "22",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AppText variant="title" weight="bold" color={colors.primary}>
                            {(m.nickname ?? "?").charAt(0)}
                          </AppText>
                        </View>

                        {/* Info */}
                        <View style={{ flex: 1, gap: 4 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <AppText variant="body" weight="semibold">
                              {m.nickname ?? t("anonymous")}
                            </AppText>
                            <Feather name="check-circle" size={14} color={colors.primary} />
                          </View>
                          {m.personalityTraits.length > 0 && (
                            <AppText variant="bodySmall" color={colors.mutedForeground} numberOfLines={1}>
                              {m.personalityTraits.slice(0, 3).join(" · ")}
                            </AppText>
                          )}
                        </View>
                      </View>
                    </Card>
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
