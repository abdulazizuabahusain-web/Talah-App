import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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
import { useT } from "@/lib/i18n";

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser } = useApp();
  const { groups, users, submitFeedback, submitReport } =
    useData();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const group = groups.find((g) => g.id === id);
  const others =
    group && currentUser
      ? group.memberIds
          .filter((mid) => mid !== currentUser.id)
          .map((mid) => users.find((u) => u.id === mid))
          .filter((u): u is NonNullable<typeof u> => !!u)
      : [];

  const [rating, setRating] = useState(0);
  const [verdicts, setVerdicts] = useState<Record<string, "connect" | "pass">>({});
  const [comment, setComment] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t("feedback_title")} />
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!currentUser) return;
    setSubmitting(true);
    await submitFeedback({
      groupId: group.id,
      fromUserId: currentUser.id,
      rating: rating || 5,
      connections: others.map((o) => ({
        userId: o.id,
        verdict: verdicts[o.id] ?? "pass",
      })),
      comment: comment.trim() || undefined,
    });
    setSubmitting(false);
    Alert.alert(t("feedback_thanks"), undefined, [
      { text: t("done"), onPress: () => router.replace("/(tabs)") },
    ]);
  };

  const handleReport = async () => {
    if (!currentUser || !reportTarget || !reportReason.trim()) return;
    await submitReport({
      reporterId: currentUser.id,
      targetUserId: reportTarget,
      groupId: group.id,
      reason: reportReason.trim(),
    });
    setReportTarget(null);
    setReportReason("");
    Alert.alert(t("report_submitted"));
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
          <Card>
            <View style={{ gap: 14, alignItems: "center" }}>
              <AppText variant="title" weight="semibold">
                {t("rate_experience")}
              </AppText>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setRating(n)}
                    hitSlop={6}
                  >
                    <Feather
                      name="star"
                      size={36}
                      color={n <= rating ? colors.accent : colors.border}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>

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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
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
                      onPress={() =>
                        setVerdicts({ ...verdicts, [o.id]: "connect" })
                      }
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor:
                          verdicts[o.id] === "connect"
                            ? colors.primary
                            : colors.border,
                        backgroundColor:
                          verdicts[o.id] === "connect"
                            ? colors.primary
                            : "transparent",
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
                      onPress={() =>
                        setVerdicts({ ...verdicts, [o.id]: "pass" })
                      }
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
            size="lg"
            style={{
              marginBottom: Math.max(insets.bottom, webBottomPad),
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
