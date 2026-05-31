import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";

type GroupFit = "very_suitable" | "somewhat" | "not_suitable";
type YMN = "yes" | "maybe" | "no";

function StarRow({
  value,
  onChange,
  color,
}: {
  value: number;
  onChange: (n: number) => void;
  color: string;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Feather name="star" size={36} color={n <= value ? color : "#D4C9BA"} />
        </Pressable>
      ))}
    </View>
  );
}

function ChipRow({
  options,
  labels,
  value,
  onChange,
  activeColor,
}: {
  options: string[];
  labels: string[];
  value: string | null;
  onChange: (v: string) => void;
  activeColor: string;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt, i) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              flex: 1,
              minWidth: 80,
              paddingVertical: 10,
              paddingHorizontal: 4,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: active ? activeColor : "#D4C9BA",
              backgroundColor: active ? activeColor + "18" : "transparent",
              alignItems: "center",
            }}
          >
            <AppText
              variant="label"
              weight="semibold"
              color={active ? activeColor : undefined}
            >
              {labels[i] ?? opt}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser } = useApp();
  const { groups, users, submitFeedback, submitReport } = useData();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const group = groups.find((g) => g.id === id);
  const others =
    group && currentUser
      ? group.memberIds
          .filter((mid) => mid !== currentUser.id)
          .map((mid) => users.find((u) => u.id === mid))
          .filter((u): u is NonNullable<typeof u> => !!u)
      : [];

  // ── Already-submitted guard ────────────────────────────────────────────────
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (!id) {
      setCheckingStatus(false);
      return;
    }
    api
      .getFeedbackStatus(id)
      .then((s) => setAlreadySubmitted(s.submitted))
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, [id]);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [comfortRating, setComfortRating] = useState(0);
  const [groupFit, setGroupFit] = useState<GroupFit | null>(null);
  const [wouldJoinAgain, setWouldJoinAgain] = useState<YMN | null>(null);
  const [venueRating, setVenueRating] = useState(0);
  const [venueSuitable, setVenueSuitable] = useState<YMN | null>(null);
  const [safetyConcern, setSafetyConcern] = useState<boolean | null>(null);
  const [safetyConcernDetails, setSafetyConcernDetails] = useState("");
  const [verdicts, setVerdicts] = useState<Record<string, "connect" | "pass">>({});
  const [comment, setComment] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [blockAlso, setBlockAlso] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Loading / guard screens ────────────────────────────────────────────────
  if (checkingStatus) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t("feedback_title")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (alreadySubmitted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t("feedback_title")} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
            gap: 20,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary + "18",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="check-circle" size={40} color={colors.primary} />
          </View>
          <AppText
            variant="title"
            weight="semibold"
            style={{ textAlign: "center", lineHeight: 28 }}
          >
            {t("feedback_already_submitted")}
          </AppText>
          <Button
            label={t("done")}
            onPress={() => router.replace("/(tabs)")}
            style={{ marginTop: 12, width: "100%" }}
          />
        </View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t("feedback_title")} />
      </View>
    );
  }

  const canSubmit =
    comfortRating > 0 &&
    groupFit !== null &&
    wouldJoinAgain !== null &&
    venueRating > 0 &&
    venueSuitable !== null &&
    safetyConcern !== null;

  const handleSubmit = async () => {
    if (!currentUser || !canSubmit) return;
    setSubmitting(true);
    try {
      const connections = Object.entries(verdicts).map(([userId, verdict]) => ({
        userId,
        verdict,
      }));
      await submitFeedback({
        groupId: group.id,
        comfortRating,
        groupFit: groupFit!,
        wouldJoinAgain: wouldJoinAgain!,
        venueRating,
        venueSuitable: venueSuitable!,
        safetyConcern: safetyConcern!,
        safetyConcernDetails: safetyConcernDetails.trim() || undefined,
        comment: comment.trim() || undefined,
        connections: connections.length > 0 ? connections : undefined,
      });

      setAlreadySubmitted(true);

      let mutualNames: string[] = [];
      try {
        const res = await api.getMutualConnects(group.id);
        mutualNames = res.mutualConnects
          .map((m) => m.nickname ?? t("anonymous"))
          .filter(Boolean);
      } catch {
        // non-fatal
      }

      if (mutualNames.length > 0) {
        const nameList = mutualNames.join("، ");
        Alert.alert(
          t("celebrate_title"),
          `${t("celebrate_body")} ${nameList}.\n\n${t("celebrate_body_suffix")}`,
          [
            {
              text: t("celebrate_ok"),
              onPress: () => router.replace("/(tabs)/connections"),
            },
          ],
        );
      } else {
        Alert.alert(t("feedback_thanks"), undefined, [
          { text: t("done"), onPress: () => router.replace("/(tabs)") },
        ]);
      }
    } catch (e) {
      Alert.alert(t("error_title"), (e as Error).message || t("error_generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!currentUser || !reportTarget || !reportReason.trim()) return;
    try {
      await submitReport({
        reporterId: currentUser.id,
        targetUserId: reportTarget,
        groupId: group.id,
        reason: reportReason.trim(),
      });
      if (blockAlso) {
        await api.blockUser(reportTarget).catch(() => {});
      }
      setReportTarget(null);
      setReportReason("");
      setBlockAlso(false);
      Alert.alert(t("report_submitted"));
    } catch (e) {
      Alert.alert(t("error_title"), (e as Error).message || t("error_generic"));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t("feedback_title")} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 24,
            gap: 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1 — Comfort rating */}
          <Card>
            <View style={{ gap: 14, alignItems: "center" }}>
              <AppText variant="title" weight="semibold" style={{ textAlign: "center" }}>
                {t("comfort_rating_q")}
              </AppText>
              <StarRow
                value={comfortRating}
                onChange={setComfortRating}
                color={colors.accent}
              />
            </View>
          </Card>

          {/* 2 — Group fit */}
          <Card>
            <View style={{ gap: 12 }}>
              <AppText variant="title" weight="semibold">
                {t("group_fit_q")}
              </AppText>
              <ChipRow
                options={["very_suitable", "somewhat", "not_suitable"]}
                labels={[t("group_fit_very"), t("group_fit_somewhat"), t("group_fit_not")]}
                value={groupFit}
                onChange={(v) => setGroupFit(v as GroupFit)}
                activeColor={colors.primary}
              />
            </View>
          </Card>

          {/* 3 — Would join again */}
          <Card>
            <View style={{ gap: 12 }}>
              <AppText variant="title" weight="semibold">
                {t("would_join_again_q")}
              </AppText>
              <ChipRow
                options={["yes", "maybe", "no"]}
                labels={[t("wma_yes"), t("wma_maybe"), t("wma_no")]}
                value={wouldJoinAgain}
                onChange={(v) => setWouldJoinAgain(v as YMN)}
                activeColor={colors.primary}
              />
            </View>
          </Card>

          {/* 4 — Venue rating */}
          <Card>
            <View style={{ gap: 14, alignItems: "center" }}>
              <AppText variant="title" weight="semibold" style={{ textAlign: "center" }}>
                {t("venue_rating_q")}
              </AppText>
              <StarRow
                value={venueRating}
                onChange={setVenueRating}
                color={colors.accent}
              />
            </View>
          </Card>

          {/* 5 — Venue suitable */}
          <Card>
            <View style={{ gap: 12 }}>
              <AppText variant="title" weight="semibold">
                {t("venue_suitable_q")}
              </AppText>
              <ChipRow
                options={["yes", "maybe", "no"]}
                labels={[
                  t("venue_suitable_yes"),
                  t("venue_suitable_maybe"),
                  t("venue_suitable_no"),
                ]}
                value={venueSuitable}
                onChange={(v) => setVenueSuitable(v as YMN)}
                activeColor={colors.primary}
              />
            </View>
          </Card>

          {/* 6 — Safety concern */}
          <Card
            style={
              safetyConcern === true
                ? { borderColor: colors.destructive + "80", borderWidth: 1.5 }
                : undefined
            }
          >
            <View style={{ gap: 12 }}>
              <AppText variant="title" weight="semibold">
                {t("safety_concern_q")}
              </AppText>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {([false, true] as const).map((val) => {
                  const active = safetyConcern === val;
                  const col = val ? colors.destructive : colors.primary;
                  return (
                    <Pressable
                      key={String(val)}
                      onPress={() => setSafetyConcern(val)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 999,
                        borderWidth: 1.5,
                        borderColor: active ? col : "#D4C9BA",
                        backgroundColor: active ? col + "18" : "transparent",
                        alignItems: "center",
                      }}
                    >
                      <AppText
                        variant="label"
                        weight="semibold"
                        color={active ? col : undefined}
                      >
                        {val ? t("safety_concern_yes") : t("safety_concern_no")}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
              {safetyConcern === true && (
                <Input
                  placeholder={t("safety_concern_details_placeholder")}
                  value={safetyConcernDetails}
                  onChangeText={setSafetyConcernDetails}
                  multiline
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />
              )}
            </View>
          </Card>

          {/* 7 — Optional comment */}
          <Card>
            <View style={{ gap: 10 }}>
              <AppText variant="title" weight="semibold">
                {t("optional_comment")}
              </AppText>
              <Input
                placeholder={t("comment_placeholder")}
                value={comment}
                onChangeText={setComment}
                multiline
                style={{ minHeight: 90, textAlignVertical: "top" }}
              />
            </View>
          </Card>

          {/* 8 — Connect or pass */}
          {others.length > 0 && (
            <Card>
              <View style={{ gap: 14 }}>
                <AppText variant="title" weight="semibold">
                  {t("connect_or_pass")}
                </AppText>
                {others.map((o) => (
                  <View
                    key={o.id}
                    style={{
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      gap: 10,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: colors.accent + "20",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AppText variant="title" weight="bold" color={colors.accent}>
                          {o.nickname.charAt(0)}
                        </AppText>
                      </View>
                      <AppText variant="body" weight="semibold" style={{ flex: 1 }}>
                        {o.nickname}
                      </AppText>
                      <Pressable onPress={() => setReportTarget(o.id)} hitSlop={8}>
                        <Feather name="flag" size={16} color={colors.destructive} />
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        onPress={() => setVerdicts({ ...verdicts, [o.id]: "connect" })}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor:
                            verdicts[o.id] === "connect" ? colors.primary : colors.border,
                          backgroundColor:
                            verdicts[o.id] === "connect" ? colors.primary : "transparent",
                          alignItems: "center",
                        }}
                      >
                        <AppText
                          variant="label"
                          weight="semibold"
                          color={
                            verdicts[o.id] === "connect"
                              ? colors.primaryForeground
                              : colors.foreground
                          }
                        >
                          {t("connect")}
                        </AppText>
                      </Pressable>
                      <Pressable
                        onPress={() => setVerdicts({ ...verdicts, [o.id]: "pass" })}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor:
                            verdicts[o.id] === "pass"
                              ? colors.mutedForeground
                              : colors.border,
                          backgroundColor:
                            verdicts[o.id] === "pass" ? colors.muted : "transparent",
                          alignItems: "center",
                        }}
                      >
                        <AppText variant="label" weight="semibold">
                          {t("pass")}
                        </AppText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Report modal */}
          {reportTarget ? (
            <Card style={{ borderColor: colors.destructive }}>
              <View style={{ gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <AppText variant="title" weight="semibold" color={colors.destructive}>
                    {t("report_title")}
                  </AppText>
                  <Pressable onPress={() => setReportTarget(null)} hitSlop={8}>
                    <Feather name="x" size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                <Input
                  label={t("report_reason")}
                  placeholder={t("report_placeholder")}
                  value={reportReason}
                  onChangeText={setReportReason}
                  multiline
                  style={{ minHeight: 90, textAlignVertical: "top" }}
                />
                <Pressable
                  onPress={() => setBlockAlso(!blockAlso)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 4,
                  }}
                  hitSlop={8}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: blockAlso ? colors.destructive : colors.border,
                      backgroundColor: blockAlso ? colors.destructive + "20" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {blockAlso ? (
                      <Feather name="check" size={13} color={colors.destructive} />
                    ) : null}
                  </View>
                  <AppText
                    variant="bodySmall"
                    color={colors.mutedForeground}
                    style={{ flex: 1 }}
                  >
                    {t("block_also")}
                  </AppText>
                </Pressable>
                <Button
                  label={t("report_submit")}
                  variant="destructive"
                  onPress={handleReport}
                  disabled={!reportReason.trim()}
                />
              </View>
            </Card>
          ) : null}

          <Button
            label={t("submit")}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
            size="lg"
            style={{ marginBottom: Math.max(insets.bottom, webBottomPad) }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
