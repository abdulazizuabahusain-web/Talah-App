import { Feather } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { markConnectsSeen } from "@/lib/connectsStore";
import { useT } from "@/lib/i18n";

// ── types ─────────────────────────────────────────────────────────────────

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
  formedAt: number;
  mutualConnects: MutualMember[];
};

type Exchange = {
  groupId: string;
  theirUserId: string;
  theirNickname: string | null;
  myContactValue: string | null;
  theirContactValue: string | null;
};

type ExchangeStatus =
  | "none"       // neither shared
  | "i_shared"   // only I shared
  | "they_shared"// only they shared (action needed from me)
  | "mutual";    // both shared

function exchangeStatus(ex: Exchange | undefined): ExchangeStatus {
  if (!ex) return "none";
  if (ex.myContactValue && ex.theirContactValue) return "mutual";
  if (ex.myContactValue) return "i_shared";
  if (ex.theirContactValue) return "they_shared";
  return "none";
}

const MEETUP_TYPE_LABEL: Record<string, string> = {
  coffee: "☕",
  lunch: "🍽️",
  walk: "🚶",
  dinner: "🌙",
};

// ── main screen ────────────────────────────────────────────────────────────

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
  const [exchanges, setExchanges] = useState<Exchange[]>([]);

  const load = useCallback(async () => {
    try {
      const [conRes, exRes] = await Promise.all([
        api.getConnections(),
        api.getExchanges(),
      ]);
      setGroups(conRes.connections);
      setExchanges(exRes.exchanges);
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

  const handleShare = async (groupId: string, toUserId: string, contactValue: string) => {
    await api.shareContact({ groupId, toUserId, contactValue });
    await load(); // refresh after sharing
  };

  const totalConnects = groups.reduce((n, g) => n + g.mutualConnects.length, 0);

  const getExchange = (groupId: string, theirUserId: string) =>
    exchanges.find((e) => e.groupId === groupId && e.theirUserId === theirUserId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t("connections_title")} />
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: webTopPad + 4,
              paddingBottom: Math.max(insets.bottom + 24, 40),
              gap: 20,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
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
                      <MutualConnectCard
                        key={m.id}
                        member={m}
                        groupId={g.groupId}
                        exchange={getExchange(g.groupId, m.id)}
                        onShare={handleShare}
                      />
                    ))}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// ── MutualConnectCard ──────────────────────────────────────────────────────

function MutualConnectCard({
  member,
  groupId,
  exchange,
  onShare,
}: {
  member: MutualMember;
  groupId: string;
  exchange: Exchange | undefined;
  onShare: (groupId: string, toUserId: string, contactValue: string) => Promise<void>;
}) {
  const colors = useColors();
  const t = useT();
  const [showForm, setShowForm] = useState(false);
  const [contactValue, setContactValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const status = exchangeStatus(exchange);
  const theySharedButIHavent = status === "they_shared";

  // Auto-open form if they've shared and we haven't responded
  useEffect(() => {
    if (theySharedButIHavent && !showForm) setShowForm(true);
  }, [theySharedButIHavent]);

  const handleSubmit = async () => {
    const val = contactValue.trim();
    if (!val) return;
    setSubmitting(true);
    try {
      await onShare(groupId, member.id, val);
      setShowForm(false);
      setContactValue("");
    } catch (e) {
      Alert.alert("خطأ", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      style={{
        backgroundColor:
          status === "mutual"
            ? colors.primary + "08"
            : theySharedButIHavent
            ? colors.accent + "08"
            : colors.card,
        borderColor:
          status === "mutual"
            ? colors.primary + "30"
            : theySharedButIHavent
            ? colors.accent + "40"
            : colors.border,
      }}
    >
      <View style={{ gap: 12 }}>
        {/* ── Member row ── */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
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
          {/* Status indicator */}
          {status === "mutual" && (
            <Feather name="link" size={16} color={colors.primary} />
          )}
          {status === "i_shared" && (
            <Feather name="clock" size={16} color={colors.mutedForeground} />
          )}
          {theySharedButIHavent && (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
              }}
            />
          )}
        </View>

        {/* ── State A: neither shared ── */}
        {status === "none" && !showForm && (
          <Pressable
            onPress={() => { setShowForm(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Feather name="share-2" size={15} color={colors.primary} />
            <AppText variant="label" weight="semibold" color={colors.primary}>
              {t("exchange_share_contact")}
            </AppText>
          </Pressable>
        )}

        {/* ── State B: I shared, waiting for them ── */}
        {status === "i_shared" && (
          <View style={{ gap: 6 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: colors.muted,
              }}
            >
              <Feather name="clock" size={14} color={colors.mutedForeground} />
              <AppText variant="bodySmall" color={colors.mutedForeground} style={{ flex: 1 }}>
                {t("exchange_waiting").replace("{{name}}", member.nickname ?? "…")}
              </AppText>
            </View>
            <AppText variant="bodySmall" color={colors.mutedForeground}>
              {t("exchange_your_contact")}: {exchange?.myContactValue}
            </AppText>
          </View>
        )}

        {/* ── State C: they shared, I haven't → prompt shown automatically ── */}
        {theySharedButIHavent && !showForm && (
          <Pressable
            onPress={() => { setShowForm(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: colors.accent,
            }}
          >
            <Feather name="heart" size={15} color="#fff" />
            <AppText variant="label" weight="semibold" color="#fff">
              {t("exchange_share_back")}
            </AppText>
          </Pressable>
        )}

        {/* ── State D: both shared ── */}
        {status === "mutual" && (
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.primary + "10",
              }}
            >
              <Feather name="phone" size={15} color={colors.primary} />
              <AppText variant="body" weight="semibold" style={{ flex: 1 }}>
                {exchange?.theirContactValue}
              </AppText>
              <Pressable onPress={() => handleCopy(exchange?.theirContactValue ?? "")} hitSlop={8}>
                <Feather
                  name={copied ? "check" : "copy"}
                  size={16}
                  color={copied ? colors.primary : colors.mutedForeground}
                />
              </Pressable>
            </View>
            <AppText variant="bodySmall" color={colors.mutedForeground}>
              {t("exchange_your_contact")}: {exchange?.myContactValue}
            </AppText>
          </View>
        )}

        {/* ── Inline share form (states A & C) ── */}
        {showForm && status !== "mutual" && status !== "i_shared" && (
          <View style={{ gap: 10 }}>
            {theySharedButIHavent && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: colors.accent + "10",
                }}
              >
                <Feather name="bell" size={14} color={colors.accent} />
                <AppText variant="bodySmall" color={colors.accent} style={{ flex: 1 }}>
                  {t("exchange_they_shared").replace("{{name}}", member.nickname ?? "…")}
                </AppText>
              </View>
            )}

            <TextInput
              ref={inputRef}
              value={contactValue}
              onChangeText={setContactValue}
              placeholder={t("exchange_placeholder")}
              placeholderTextColor={colors.mutedForeground}
              multiline={false}
              returnKeyType="done"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
            />

            <AppText variant="bodySmall" color={colors.mutedForeground}>
              {t("exchange_privacy_note")}
            </AppText>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => { setShowForm(false); setContactValue(""); }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <AppText variant="label" weight="semibold" color={colors.mutedForeground}>
                  {t("exchange_cancel")}
                </AppText>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!contactValue.trim() || submitting}
                style={{
                  flex: 2,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor:
                    contactValue.trim() && !submitting ? colors.primary : colors.muted,
                  alignItems: "center",
                }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <AppText
                    variant="label"
                    weight="semibold"
                    color={contactValue.trim() ? colors.primaryForeground : colors.mutedForeground}
                  >
                    {t("exchange_submit")}
                  </AppText>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}
