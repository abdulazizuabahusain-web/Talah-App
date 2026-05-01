import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { calculateGroupCompatibility, findCandidatesFor } from "@/lib/matching";
import { generateMatchingNotes } from "@/lib/types";
import type { GroupStatus, User } from "@/lib/types";

const ADMIN_PIN = "1234";

type Tab = "requests" | "groups" | "users" | "compatibility" | "feedback" | "reports";

export default function AdminScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { isAdmin, setIsAdmin } = useApp();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("requests");

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t("admin_pin_title")} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
                <AppText variant="caption" color={colors.mutedForeground}>{t("admin_pin_hint")}</AppText>
                <Button
                  label={t("verify")}
                  onPress={() => {
                    if (pin === ADMIN_PIN) { setIsAdmin(true); setPinError(null); }
                    else setPinError(t("invalid_otp"));
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
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(
              [
                { id: "requests", label: t("admin_requests") },
                { id: "groups", label: t("admin_groups") },
                { id: "users", label: t("admin_users") },
                { id: "compatibility", label: t("admin_compatibility") },
                { id: "feedback", label: t("admin_feedback") },
                { id: "reports", label: t("admin_reports") },
              ] as { id: Tab; label: string }[]
            ).map((x) => (
              <Chip key={x.id} label={x.label} selected={tab === x.id} onPress={() => setTab(x.id)} />
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
        {tab === "compatibility" ? <CompatibilityTab /> : null}
        {tab === "feedback" ? <FeedbackTab /> : null}
        {tab === "reports" ? <ReportsTab /> : null}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS TAB
// ─────────────────────────────────────────────────────────────────────────────
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
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <AppText variant="title" weight="semibold">{u.nickname} · {u.city}</AppText>
                <StatusPill status={r.status} />
              </View>
              <AppText variant="bodySmall" color={colors.mutedForeground}>
                {r.meetupType === "coffee" ? t("meet_coffee") : t("meet_dinner")} · {r.preferredDate} · {t(`time_${r.preferredTime}`)} · {r.area}
              </AppText>
              <View style={{ marginTop: 4 }}>
                <AppText variant="label" weight="semibold">{t("admin_assign")}:</AppText>
                {top.length === 0 ? (
                  <AppText variant="caption" color={colors.mutedForeground}>{t("no_data")}</AppText>
                ) : (
                  top.map((c) => (
                    <View key={c.user.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 5 }}>
                      <AppText variant="body">{c.user.nickname}</AppText>
                      <AppText variant="caption" color={colors.mutedForeground}>score {c.score}</AppText>
                    </View>
                  ))
                )}
              </View>
              <Button
                label={t("admin_create_group")}
                size="sm"
                onPress={async () => {
                  const memberIds = [u.id, ...top.map((c) => c.user.id)].slice(0, 5);
                  const requestIds = [r.id, ...top.map((c) => c.request.id)].slice(0, 5);
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
                    await data.cancelRequest(reqId);
                  }
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

// ─────────────────────────────────────────────────────────────────────────────
// GROUPS TAB
// ─────────────────────────────────────────────────────────────────────────────
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <AppText variant="title" weight="semibold">
                {g.meetupType === "coffee" ? t("meet_coffee") : t("meet_dinner")} · {g.city} · {g.area}
              </AppText>
              <StatusPill status={g.status} />
            </View>
            <AppText variant="bodySmall" color={colors.mutedForeground}>
              {g.gender === "woman" ? t("gender_woman") : t("gender_man")} · {g.memberIds.length} {t("members_count")}
            </AppText>
            {g.venue ? <AppText variant="bodySmall">📍 {g.venue}</AppText> : null}
            {g.meetupAt ? <AppText variant="bodySmall">⏰ {new Date(g.meetupAt).toLocaleString()}</AppText> : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {(["pending", "matched", "revealed", "completed", "cancelled"] as GroupStatus[]).map((s) => (
                <Chip key={s} label={t(`status_${s}`)} size="sm" selected={g.status === s} onPress={() => data.setGroupStatus(g.id, s)} />
              ))}
            </View>
            {editing === g.id ? (
              <View style={{ gap: 8 }}>
                <Input label={t("admin_set_venue")} placeholder="مقهى مدد - العليا" value={venue} onChangeText={setVenue} />
                <Input placeholder="YYYY-MM-DD HH:mm" value={whenStr} onChangeText={setWhenStr} />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    label={t("save")} size="sm"
                    onPress={async () => {
                      const ts = new Date(whenStr.replace(" ", "T"));
                      await data.updateGroup(g.id, { venue: venue || undefined, meetupAt: isNaN(ts.getTime()) ? undefined : ts.getTime() });
                      setEditing(null);
                    }}
                  />
                  <Button label={t("cancel")} variant="ghost" size="sm" onPress={() => setEditing(null)} />
                </View>
              </View>
            ) : (
              <Button
                label={t("admin_set_venue")} size="sm" variant="outline"
                onPress={() => { setEditing(g.id); setVenue(g.venue ?? ""); setWhenStr(g.meetupAt ? new Date(g.meetupAt).toISOString().slice(0, 16).replace("T", " ") : ""); }}
              />
            )}
          </View>
        </Card>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS TAB
// ─────────────────────────────────────────────────────────────────────────────
function UsersTab() {
  const data = useData();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <>
      <View style={{ gap: 10 }}>
        {data.users.length === 0 ? <EmptyState /> : data.users.map((u) => (
          <UserCard key={u.id} user={u} onViewDetail={() => setSelectedUser(u)} />
        ))}
      </View>
      {selectedUser ? (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      ) : null}
    </>
  );
}

function UserCard({ user, onViewDetail }: { user: User; onViewDetail: () => void }) {
  const colors = useColors();
  const t = useT();
  const data = useData();
  const completion = computeCompletionPct(user);
  const notes = generateMatchingNotes(user);

  return (
    <Card>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent + "20", alignItems: "center", justifyContent: "center" }}>
            <AppText variant="title" weight="bold" color={colors.accent}>{user.nickname.charAt(0) || "?"}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <AppText variant="body" weight="semibold">{user.nickname || user.phone}</AppText>
              {user.flagged ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.destructive + "20" }}>
                  <AppText variant="caption" weight="semibold" color={colors.destructive}>{t("flagged_label")}</AppText>
                </View>
              ) : null}
              {user.verified ? (
                <Feather name="check-circle" size={14} color={colors.primary} />
              ) : null}
            </View>
            <AppText variant="caption" color={colors.mutedForeground}>
              {user.city} · {user.gender === "woman" ? t("gender_woman") : t("gender_man")} · {user.ageRange} · {t(`ls_${user.lifestyle}`)}
            </AppText>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {user.socialEnergy ? <ScoreBadge label="Energy" value={user.socialEnergyScore ?? 0} /> : null}
          {user.conversationStyle ? <ScoreBadge label="Conv." value={user.conversationDepthScore ?? 0} /> : null}
          {user.meetupAtmosphere ? <ScoreBadge label="Atm." value={user.atmosphereScore ?? 0} /> : null}
          {user.interactionPreference ? <ScoreBadge label="Interact." value={user.interactionScore ?? 0} /> : null}
          {user.opennessLevel ? <ScoreBadge label="Open." value={user.opennessScore ?? 0} /> : null}
          {user.socialBoundary ? <ScoreBadge label="Bound." value={user.boundaryScore ?? 0} /> : null}
        </View>

        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.muted, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${completion}%`, backgroundColor: completion >= 80 ? colors.primary : colors.accent }} />
        </View>
        <AppText variant="caption" color={colors.mutedForeground}>Profile {completion}% complete</AppText>

        {notes.length > 0 ? (
          <View style={{ gap: 4 }}>
            {notes.map((n, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <Feather name="info" size={12} color={colors.accent} />
                <AppText variant="caption" color={colors.accent}>{n}</AppText>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          <Button label="Details" size="sm" variant="outline" onPress={onViewDetail} fullWidth={false} />
          <Button label={user.flagged ? t("admin_unflag") : t("admin_flag")} size="sm" variant="ghost" onPress={() => data.flagUser(user.id, !user.flagged)} fullWidth={false} />
          <Pressable onPress={() => data.removeUser(user.id)} hitSlop={8} style={{ justifyContent: "center", paddingHorizontal: 8 }}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const colors = useColors();
  const color = value > 0 ? colors.primary : value < 0 ? colors.accent : colors.mutedForeground;
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: color + "18", flexDirection: "row", gap: 4, alignItems: "center" }}>
      <AppText variant="caption" weight="semibold" color={color}>{label}</AppText>
      <AppText variant="caption" weight="bold" color={color}>{value > 0 ? `+${value}` : value}</AppText>
    </View>
  );
}

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  const colors = useColors();
  const t = useT();
  const notes = generateMatchingNotes(user);

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <AppText variant="h2" weight="bold">{user.nickname}</AppText>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>

          <Section title="Basic Profile">
            <DetailRow label="City" value={user.city} />
            <DetailRow label="Gender" value={user.gender === "woman" ? t("gender_woman") : t("gender_man")} />
            <DetailRow label="Age" value={user.ageRange} />
            <DetailRow label="Lifestyle" value={t(`ls_${user.lifestyle}`)} />
            <DetailRow label="Preferred Meetup" value={user.preferredMeetup === "coffee" ? t("meet_coffee") : t("meet_dinner")} />
            <DetailRow label="Availability" value={[...(user.preferredDays ?? []), ...(user.preferredTimes ?? [])].join(", ")} />
            <DetailRow label="Interests" value={(user.interests ?? []).join(", ")} />
            {user.funFact ? <DetailRow label="Fun Fact" value={user.funFact} /> : null}
            <DetailRow label="Verified" value={user.verified ? "Yes" : "No"} />
          </Section>

          <Section title="Personality Answers">
            {user.socialEnergy ? <DetailRow label="Social Energy" value={t(`se_${user.socialEnergy}`)} /> : null}
            {user.conversationStyle ? <DetailRow label="Conversation Style" value={t(`cs_${user.conversationStyle}`)} /> : null}
            {user.socialIntent ? <DetailRow label="Social Intent" value={t(`si_${user.socialIntent}`)} /> : null}
            {user.planningPreference ? <DetailRow label="Planning" value={t(`pp_${user.planningPreference}`)} /> : null}
            {user.meetupAtmosphere ? <DetailRow label="Atmosphere" value={t(`ma_${user.meetupAtmosphere}`)} /> : null}
            {user.interactionPreference ? <DetailRow label="Interaction" value={t(`ip_${user.interactionPreference}`)} /> : null}
            {user.opennessLevel ? <DetailRow label="Openness" value={t(`ol_${user.opennessLevel}`)} /> : null}
            {user.socialBoundary ? <DetailRow label="Boundary" value={t(`sb_${user.socialBoundary}`)} /> : null}
            {(user.enjoyedTopics ?? []).length > 0 ? (
              <DetailRow label="Enjoyed Topics" value={(user.enjoyedTopics ?? []).join(", ")} />
            ) : null}
            {(user.personalityTraits ?? []).length > 0 ? (
              <DetailRow label="Personality Traits" value={(user.personalityTraits ?? []).join(", ")} />
            ) : null}
          </Section>

          <Section title="Calculated Scores">
            <ScoreRow label="Social Energy" value={user.socialEnergyScore} />
            <ScoreRow label="Conversation Depth" value={user.conversationDepthScore} />
            <ScoreRow label="Planning" value={user.planningScore} />
            <ScoreRow label="Atmosphere" value={user.atmosphereScore} />
            <ScoreRow label="Interaction" value={user.interactionScore} />
            <ScoreRow label="Openness" value={user.opennessScore} />
            <ScoreRow label="Boundary" value={user.boundaryScore} />
          </Section>

          <Section title="Matching Notes">
            {notes.length === 0 ? (
              <AppText variant="body" color={colors.mutedForeground}>Complete personality profile for notes.</AppText>
            ) : notes.map((n, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
                <Feather name="chevron-right" size={16} color={colors.accent} style={{ marginTop: 2 }} />
                <AppText variant="body" style={{ flex: 1 }}>{n}</AppText>
              </View>
            ))}
          </Section>

          <Section title="Profile Completion">
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.muted, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${computeCompletionPct(user)}%`, backgroundColor: colors.primary }} />
            </View>
            <AppText variant="body" weight="semibold" style={{ marginTop: 6 }}>{computeCompletionPct(user)}%</AppText>
          </Section>

        </ScrollView>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.muted }}>
        <AppText variant="label" weight="semibold" color={colors.mutedForeground}>{title.toUpperCase()}</AppText>
      </View>
      <View style={{ padding: 16, gap: 10 }}>{children}</View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 8, justifyContent: "space-between" }}>
      <AppText variant="bodySmall" color={colors.mutedForeground} style={{ flex: 1 }}>{label}</AppText>
      <AppText variant="bodySmall" weight="medium" style={{ flex: 2, flexWrap: "wrap", textAlign: "right" }}>{value || "—"}</AppText>
    </View>
  );
}

function ScoreRow({ label, value }: { label: string; value?: number }) {
  const colors = useColors();
  if (value === undefined) return null;
  const color = value > 0 ? colors.primary : value < 0 ? colors.accent : colors.foreground;
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <AppText variant="bodySmall" color={colors.mutedForeground}>{label}</AppText>
      <AppText variant="body" weight="bold" color={color}>{value > 0 ? `+${value}` : value}</AppText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPATIBILITY TAB
// ─────────────────────────────────────────────────────────────────────────────
function CompatibilityTab() {
  const colors = useColors();
  const t = useT();
  const data = useData();
  const [selected, setSelected] = useState<string[]>([]);
  const [report, setReport] = useState<ReturnType<typeof calculateGroupCompatibility> | null>(null);

  const toggleUser = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
      setReport(null);
    } else if (selected.length < 5) {
      setSelected([...selected, id]);
      setReport(null);
    }
  };

  const calculate = () => {
    const users = selected.map((id) => data.users.find((u) => u.id === id)).filter((u): u is User => !!u);
    if (users.length < 3) return;
    setReport(calculateGroupCompatibility(users));
  };

  const labelColor = report
    ? { excellent: colors.primary, good: "#4A7C59", moderate: colors.accent, weak: colors.destructive }[report.label]
    : colors.foreground;

  const labelText = report
    ? { excellent: t("compat_excellent"), good: t("compat_good"), moderate: t("compat_moderate"), weak: t("compat_weak") }[report.label]
    : "";

  return (
    <View style={{ gap: 16 }}>
      <Card style={{ backgroundColor: colors.accent + "10", borderColor: colors.accent + "30" }}>
        <AppText variant="body" weight="medium">{t("admin_select_users")}</AppText>
        <AppText variant="caption" color={colors.mutedForeground} style={{ marginTop: 4 }}>
          {selected.length}/5 selected
        </AppText>
      </Card>

      <View style={{ gap: 8 }}>
        {data.users.map((u) => {
          const isSelected = selected.includes(u.id);
          return (
            <Pressable
              key={u.id}
              onPress={() => toggleUser(u.id)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 16,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? colors.accent : colors.border,
                backgroundColor: isSelected ? colors.accent + "10" : colors.card,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: isSelected ? colors.accent : colors.muted, alignItems: "center", justifyContent: "center" }}>
                {isSelected
                  ? <Feather name="check" size={18} color={colors.accentForeground} />
                  : <AppText variant="body" weight="bold" color={colors.mutedForeground}>{u.nickname.charAt(0)}</AppText>
                }
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight="semibold">{u.nickname}</AppText>
                <AppText variant="caption" color={colors.mutedForeground}>{u.city} · {u.gender === "woman" ? "W" : "M"} · {u.ageRange}</AppText>
              </View>
              {u.socialEnergyScore !== undefined ? <ScoreBadge label="E" value={u.socialEnergyScore} /> : null}
            </Pressable>
          );
        })}
      </View>

      {selected.length >= 3 ? (
        <Button label={t("admin_calculate")} onPress={calculate} size="lg" />
      ) : null}

      {report ? (
        <View style={{ gap: 12, marginTop: 8 }}>
          <Card elevated style={{ alignItems: "center", gap: 10 }}>
            <AppText variant="h1" weight="bold" color={labelColor} align="center">
              {report.overallScore}%
            </AppText>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: labelColor + "20" }}>
              <AppText variant="title" weight="semibold" color={labelColor}>{labelText}</AppText>
            </View>
          </Card>

          {report.warnings.length > 0 ? (
            <Card style={{ borderColor: colors.destructive + "60" }}>
              <View style={{ gap: 8 }}>
                {report.warnings.map((w, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                    <Feather name="alert-triangle" size={16} color={colors.destructive} style={{ marginTop: 2 }} />
                    <AppText variant="body" color={colors.destructive} style={{ flex: 1 }}>{w}</AppText>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          <CompatRow
            label={t("compat_hard_filters")}
            ok={report.genderOk && report.cityOk && report.availabilityOk}
            notes={[
              report.genderOk ? "✓ Same gender" : "✗ Mixed gender",
              report.cityOk ? "✓ Same city" : "✗ Different cities",
              report.availabilityOk
                ? `✓ Common days: ${report.commonDays.join(", ")} · times: ${report.commonTimes.join(", ")}`
                : "✗ No availability overlap",
            ]}
          />
          <CompatRow
            label={t("compat_interests")}
            ok={report.interestOverlapPct >= 40}
            notes={[
              `${report.interestOverlapPct}% overlap`,
              report.sharedInterests.length > 0 ? `Shared: ${report.sharedInterests.slice(0, 5).join(", ")}` : "No shared interests found",
            ]}
          />
          <CompatRow
            label={t("compat_lifestyle")}
            ok={report.lifestyleAligned}
            notes={[report.lifestyleNote]}
          />
          <CompatRow
            label={t("compat_energy")}
            ok={report.energyBalance === "balanced"}
            notes={[report.energyNote, `Avg energy score: ${report.avgEnergyScore.toFixed(1)}`]}
          />
          <CompatRow
            label={t("compat_conversation")}
            ok={report.convCompatible}
            notes={[report.convNote]}
          />
          <CompatRow
            label={t("compat_intent_boundary")}
            ok={!report.boundaryNote.startsWith("Caution")}
            notes={[report.intentNote, report.boundaryNote]}
          />
        </View>
      ) : null}
    </View>
  );
}

function CompatRow({ label, ok, notes }: { label: string; ok: boolean; notes: string[] }) {
  const colors = useColors();
  return (
    <Card>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: ok ? colors.primary + "20" : colors.destructive + "15", alignItems: "center", justifyContent: "center" }}>
            <Feather name={ok ? "check" : "x"} size={14} color={ok ? colors.primary : colors.destructive} />
          </View>
          <AppText variant="title" weight="semibold">{label}</AppText>
        </View>
        {notes.map((n, i) => (
          <AppText key={i} variant="bodySmall" color={colors.mutedForeground} style={{ paddingLeft: 38 }}>{n}</AppText>
        ))}
      </View>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK TAB
// ─────────────────────────────────────────────────────────────────────────────
function FeedbackTab() {
  const colors = useColors();
  const data = useData();
  if (data.feedback.length === 0) return <EmptyState />;
  return (
    <View style={{ gap: 10 }}>
      {data.feedback.map((f) => {
        const from = data.users.find((u) => u.id === f.fromUserId);
        return (
          <Card key={f.id}>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <AppText variant="body" weight="semibold">{from?.nickname ?? f.fromUserId}</AppText>
                <View style={{ flexDirection: "row", gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Feather key={i} name="star" size={14} color={i < f.rating ? colors.accent : colors.border} />
                  ))}
                </View>
              </View>
              {f.comment ? <AppText variant="bodySmall" color={colors.mutedForeground}>"{f.comment}"</AppText> : null}
              <AppText variant="caption" color={colors.mutedForeground}>{new Date(f.createdAt).toLocaleString()}</AppText>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function ReportsTab() {
  const colors = useColors();
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
              <AppText variant="caption" color={colors.mutedForeground}>{new Date(r.createdAt).toLocaleString()}</AppText>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState() {
  const colors = useColors();
  const t = useT();
  return (
    <View style={{ alignItems: "center", paddingTop: 48, gap: 10 }}>
      <Feather name="inbox" size={28} color={colors.mutedForeground} />
      <AppText variant="body" color={colors.mutedForeground}>{t("no_data")}</AppText>
    </View>
  );
}

function computeCompletionPct(u: User): number {
  const checks = [
    !!u.nickname, !!u.city, !!u.gender, !!u.ageRange, !!u.lifestyle,
    u.interests.length >= 3, !!u.personality, !!u.preferredMeetup,
    u.preferredDays.length > 0, u.preferredTimes.length > 0, !!u.funFact,
    !!u.socialEnergy, !!u.conversationStyle, (u.enjoyedTopics ?? []).length >= 1,
    !!u.socialIntent, !!u.planningPreference, !!u.meetupAtmosphere,
    !!u.interactionPreference, (u.personalityTraits ?? []).length >= 1,
    !!u.opennessLevel, !!u.socialBoundary,
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}
