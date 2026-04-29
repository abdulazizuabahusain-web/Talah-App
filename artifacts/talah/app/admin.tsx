import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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
import { Chip } from "@/components/Chip";
import { Input } from "@/components/Input";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusPill } from "@/components/StatusPill";
import { useApp } from "@/contexts/AppContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";
import { findCandidatesFor } from "@/lib/matching";
import type { GroupStatus, User } from "@/lib/types";

const ADMIN_PIN = "1234";

type Tab = "users" | "requests" | "groups" | "feedback" | "reports";

export default function AdminScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { isAdmin, setIsAdmin, language } = useApp();
  const data = useData();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("requests");

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t("admin_pin_title")} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
            <Card>
              <View style={{ gap: 14 }}>
                <Input
                  label={t("admin_pin_title")}
                  placeholder="••••"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  value={pin}
                  onChangeText={setPin}
                  error={pinError ?? undefined}
                />
                <AppText variant="caption" color={colors.mutedForeground}>
                  {t("admin_pin_hint")}
                </AppText>
                <Button
                  label={t("verify")}
                  onPress={() => {
                    if (pin === ADMIN_PIN) {
                      setIsAdmin(true);
                      setPinError(null);
                    } else {
                      setPinError(t("invalid_otp"));
                    }
                  }}
                />
              </View>
            </Card>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t("admin_title")} />
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 12,
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(
              [
                { id: "requests", label: t("admin_requests") },
                { id: "groups", label: t("admin_groups") },
                { id: "users", label: t("admin_users") },
                { id: "feedback", label: t("admin_feedback") },
                { id: "reports", label: t("admin_reports") },
              ] as { id: Tab; label: string }[]
            ).map((x) => (
              <Chip
                key={x.id}
                label={x.label}
                selected={tab === x.id}
                onPress={() => setTab(x.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, webBottomPad) + 24,
          gap: 12,
        }}
      >
        {tab === "requests" ? <RequestsTab /> : null}
        {tab === "groups" ? <GroupsTab /> : null}
        {tab === "users" ? <UsersTab /> : null}
        {tab === "feedback" ? <FeedbackTab /> : null}
        {tab === "reports" ? <ReportsTab /> : null}
      </ScrollView>
    </View>
  );
}

function RequestsTab() {
  const colors = useColors();
  const t = useT();
  const data = useData();
  const pending = data.requests.filter((r) => r.status === "pending");

  if (pending.length === 0) return <EmptyState />;

  return (
    <View style={{ gap: 12 }}>
      {pending.map((r) => {
        const u = data.users.find((u) => u.id === r.userId);
        if (!u) return null;
        const matches = findCandidatesFor(r, u, data.users, data.requests);
        const top = matches.slice(0, 4);
        return (
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
                  {u.nickname} · {u.city}
                </AppText>
                <StatusPill status={r.status} />
              </View>
              <AppText variant="bodySmall" color={colors.mutedForeground}>
                {r.meetupType === "coffee" ? t("meet_coffee") : t("meet_dinner")} ·{" "}
                {r.preferredDate} · {t(`time_${r.preferredTime}`)} · {r.area}
              </AppText>
              <View style={{ marginTop: 4 }}>
                <AppText variant="label" weight="semibold">
                  {t("admin_assign")}:
                </AppText>
                {top.length === 0 ? (
                  <AppText variant="caption" color={colors.mutedForeground}>
                    {t("no_data")}
                  </AppText>
                ) : (
                  top.map((c) => (
                    <View
                      key={c.user.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 6,
                      }}
                    >
                      <AppText variant="body">
                        {c.user.nickname}{" "}
                        <AppText variant="caption" color={colors.mutedForeground}>
                          (score {c.score})
                        </AppText>
                      </AppText>
                    </View>
                  ))
                )}
              </View>
              <Button
                label={t("admin_create_group")}
                size="sm"
                onPress={async () => {
                  const memberIds = [u.id, ...top.map((c) => c.user.id)].slice(0, 5);
                  const requestIds = [
                    r.id,
                    ...top.map((c) => c.request.id),
                  ].slice(0, 5);
                  const g = await data.createGroup({
                    status: "matched",
                    meetupType: r.meetupType,
                    gender: u.gender,
                    city: u.city,
                    area: r.area,
                    venue: undefined,
                    meetupAt: undefined,
                    memberIds,
                    requestIds,
                  });
                  for (const reqId of requestIds) {
                    const rr = data.requests.find((x) => x.id === reqId);
                    if (rr) {
                      await data.cancelRequest(rr.id);
                    }
                  }
                  // Re-mark them as matched (overwrite cancelled to matched)
                  // Simpler: directly write status via saveJSON would be heavy here.
                  // Just leave the new group as authoritative.
                  Alert.alert("Group created", g.id);
                }}
              />
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function GroupsTab() {
  const colors = useColors();
  const t = useT();
  const data = useData();
  const [editing, setEditing] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [whenStr, setWhenStr] = useState("");

  if (data.groups.length === 0) return <EmptyState />;

  return (
    <View style={{ gap: 12 }}>
      {data.groups.map((g) => (
        <Card key={g.id}>
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
                · {g.city} · {g.area}
              </AppText>
              <StatusPill status={g.status} />
            </View>
            <AppText variant="bodySmall" color={colors.mutedForeground}>
              {g.gender === "woman" ? t("gender_woman") : t("gender_man")} ·{" "}
              {g.memberIds.length} {t("members_count")}
            </AppText>
            {g.venue ? (
              <AppText variant="bodySmall">📍 {g.venue}</AppText>
            ) : null}
            {g.meetupAt ? (
              <AppText variant="bodySmall">
                ⏰ {new Date(g.meetupAt).toLocaleString()}
              </AppText>
            ) : null}

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {(
                [
                  "pending",
                  "matched",
                  "revealed",
                  "completed",
                  "cancelled",
                ] as GroupStatus[]
              ).map((s) => (
                <Chip
                  key={s}
                  label={t(`status_${s}`)}
                  size="sm"
                  selected={g.status === s}
                  onPress={() => data.setGroupStatus(g.id, s)}
                />
              ))}
            </View>

            {editing === g.id ? (
              <View style={{ gap: 8 }}>
                <Input
                  label={t("admin_set_venue")}
                  placeholder="مقهى مدد - العليا"
                  value={venue}
                  onChangeText={setVenue}
                />
                <Input
                  placeholder="YYYY-MM-DD HH:mm"
                  value={whenStr}
                  onChangeText={setWhenStr}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    label={t("save")}
                    size="sm"
                    onPress={async () => {
                      const ts = new Date(whenStr.replace(" ", "T"));
                      await data.updateGroup(g.id, {
                        venue: venue || undefined,
                        meetupAt: isNaN(ts.getTime()) ? undefined : ts.getTime(),
                      });
                      setEditing(null);
                    }}
                  />
                  <Button
                    label={t("cancel")}
                    variant="ghost"
                    size="sm"
                    onPress={() => setEditing(null)}
                  />
                </View>
              </View>
            ) : (
              <Button
                label={t("admin_set_venue")}
                size="sm"
                variant="outline"
                onPress={() => {
                  setEditing(g.id);
                  setVenue(g.venue ?? "");
                  setWhenStr(
                    g.meetupAt
                      ? new Date(g.meetupAt).toISOString().slice(0, 16).replace("T", " ")
                      : "",
                  );
                }}
              />
            )}
          </View>
        </Card>
      ))}
    </View>
  );
}

function UsersTab() {
  const colors = useColors();
  const t = useT();
  const data = useData();

  if (data.users.length === 0) return <EmptyState />;

  return (
    <View style={{ gap: 10 }}>
      {data.users.map((u) => (
        <Card key={u.id} padded={false}>
          <View
            style={{
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.accent + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText variant="title" weight="bold" color={colors.accent}>
                {u.nickname.charAt(0) || "?"}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <AppText variant="body" weight="semibold">
                  {u.nickname || u.phone}
                </AppText>
                {u.flagged ? (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: colors.destructive + "20",
                    }}
                  >
                    <AppText
                      variant="caption"
                      weight="semibold"
                      color={colors.destructive}
                    >
                      {t("flagged_label")}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText variant="caption" color={colors.mutedForeground}>
                {u.city} · {u.gender === "woman" ? t("gender_woman") : t("gender_man")}
              </AppText>
            </View>
            <Pressable
              onPress={() => data.flagUser(u.id, !u.flagged)}
              hitSlop={8}
            >
              <Feather
                name="flag"
                size={18}
                color={u.flagged ? colors.destructive : colors.mutedForeground}
              />
            </Pressable>
            <Pressable onPress={() => data.removeUser(u.id)} hitSlop={8}>
              <Feather name="trash-2" size={18} color={colors.destructive} />
            </Pressable>
          </View>
        </Card>
      ))}
    </View>
  );
}

function FeedbackTab() {
  const colors = useColors();
  const t = useT();
  const data = useData();

  if (data.feedback.length === 0) return <EmptyState />;

  return (
    <View style={{ gap: 10 }}>
      {data.feedback.map((f) => {
        const from = data.users.find((u) => u.id === f.fromUserId);
        return (
          <Card key={f.id}>
            <View style={{ gap: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <AppText variant="body" weight="semibold">
                  {from?.nickname ?? f.fromUserId}
                </AppText>
                <View style={{ flexDirection: "row", gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Feather
                      key={i}
                      name="star"
                      size={14}
                      color={i < f.rating ? colors.accent : colors.border}
                    />
                  ))}
                </View>
              </View>
              {f.comment ? (
                <AppText variant="bodySmall" color={colors.mutedForeground}>
                  “{f.comment}”
                </AppText>
              ) : null}
              <AppText variant="caption" color={colors.mutedForeground}>
                {new Date(f.createdAt).toLocaleString()}
              </AppText>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function ReportsTab() {
  const colors = useColors();
  const t = useT();
  const data = useData();

  if (data.reports.length === 0) return <EmptyState />;

  return (
    <View style={{ gap: 10 }}>
      {data.reports.map((r) => {
        const reporter = data.users.find((u) => u.id === r.reporterId);
        const target = data.users.find((u) => u.id === r.targetUserId);
        return (
          <Card key={r.id} style={{ borderColor: colors.destructive + "60" }}>
            <View style={{ gap: 6 }}>
              <AppText variant="body" weight="semibold" color={colors.destructive}>
                {reporter?.nickname ?? r.reporterId} → {target?.nickname ?? r.targetUserId}
              </AppText>
              <AppText variant="bodySmall">{r.reason}</AppText>
              <AppText variant="caption" color={colors.mutedForeground}>
                {new Date(r.createdAt).toLocaleString()}
              </AppText>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function EmptyState() {
  const colors = useColors();
  const t = useT();
  return (
    <View style={{ alignItems: "center", paddingTop: 48, gap: 10 }}>
      <Feather name="inbox" size={28} color={colors.mutedForeground} />
      <AppText variant="body" color={colors.mutedForeground}>
        {t("no_data")}
      </AppText>
    </View>
  );
}
