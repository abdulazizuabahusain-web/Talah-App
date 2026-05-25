import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Chip } from "@/components/Chip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { api, type ApiTypeChangeRequest } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { computeScores } from "@/lib/types";

// ── Static data ────────────────────────────────────────────────────────────────

const SAUDI_CITIES = [
  "الرياض",
  "جدة",
  "الدمام",
  "الخبر",
  "أبها",
  "مكة المكرمة",
  "المدينة المنورة",
  "تبوك",
  "حائل",
  "الطائف",
  "القصيم",
  "جازان",
];

const LIFE_STAGES = [
  "university_early",
  "early_career",
  "professionally_established",
  "have_family",
  "prefer_not_to_say",
] as const;

const INTEREST_CATEGORIES = [
  { key: "cat_food_coffee", interests: ["coffee", "restaurants", "cooking", "desserts"] },
  { key: "cat_wellness", interests: ["fitness", "walking", "wellness", "yoga"] },
  { key: "cat_creativity", interests: ["photography", "art", "writing", "music"] },
  { key: "cat_life", interests: ["travel", "social_convos", "self_development", "business"] },
  { key: "cat_entertainment", interests: ["movies", "games", "anime"] },
  { key: "cat_outdoor", interests: ["hiking", "sea_outdoor", "camping"] },
] as const;

const SOCIAL_ENERGY_OPTIONS = [
  "very_social",
  "friendly_balanced",
  "quiet_open_later",
  "prefer_listening",
] as const;

const CONV_STYLE_OPTIONS = [
  "light_fun",
  "balanced",
  "deep_meaningful",
] as const;

const PERSONALITY_TRAITS = [
  "calm",
  "social",
  "curious",
  "energetic",
  "funny",
  "creative",
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 8 }}>
      <AppText variant="title" weight="bold" color={colors.foreground}>
        {label}
      </AppText>
      {sub ? (
        <AppText variant="caption" color={colors.mutedForeground} style={{ marginTop: 3 }}>
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

function Divider() {
  const colors = useColors();
  return <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 20, marginVertical: 4 }} />;
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function EditPreferencesScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, updateCurrentUser } = useApp();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [nickname, setNickname] = useState(currentUser?.nickname ?? "");
  const [city, setCity] = useState(() => {
    const c = currentUser?.city ?? "";
    return SAUDI_CITIES.includes(c) ? c : c ? "__other__" : "";
  });
  const [cityOther, setCityOther] = useState(() => {
    const c = currentUser?.city ?? "";
    return SAUDI_CITIES.includes(c) ? "" : c;
  });
  const [lifeStage, setLifeStage] = useState<string | null>(currentUser?.lifeStage ?? null);
  const [interests, setInterests] = useState<string[]>(currentUser?.interests ?? []);
  const [preferredMeetup, setPreferredMeetup] = useState<string>(currentUser?.preferredMeetup ?? "coffee");
  const [socialEnergy, setSocialEnergy] = useState<string | null>(currentUser?.socialEnergy ?? null);
  const [conversationStyle, setConversationStyle] = useState<string | null>(currentUser?.conversationStyle ?? null);
  const [personalityTraits, setPersonalityTraits] = useState<string[]>(currentUser?.personalityTraits ?? []);

  // ── Type change request ────────────────────────────────────────────────────
  const [pendingRequest, setPendingRequest] = useState<ApiTypeChangeRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeChangeReason, setTypeChangeReason] = useState("");
  const [submittingTypeChange, setSubmittingTypeChange] = useState(false);
  const [typeChangeError, setTypeChangeError] = useState<string | null>(null);

  // ── Save state ─────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load pending type change request ──────────────────────────────────────
  useEffect(() => {
    api
      .getTypeChangeRequest()
      .then((r) => setPendingRequest(r))
      .catch(() => {})
      .finally(() => setLoadingRequest(false));
  }, []);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function toggleInterest(key: string) {
    setInterests((prev) =>
      prev.includes(key)
        ? prev.filter((i) => i !== key)
        : prev.length < 5
          ? [...prev, key]
          : prev,
    );
  }

  function toggleTrait(key: string) {
    setPersonalityTraits((prev) =>
      prev.includes(key)
        ? prev.filter((t) => t !== key)
        : prev.length < 2
          ? [...prev, key]
          : prev,
    );
  }

  const canSave =
    nickname.trim().length >= 2 &&
    interests.length >= 3 &&
    (city !== "__other__" || cityOther.trim().length >= 2);

  async function handleSave() {
    if (!canSave || saving) return;
    const finalCity = city === "__other__" ? cityOther.trim() : city;
    const scores = computeScores({
      socialEnergy: (socialEnergy as never) ?? undefined,
      conversationStyle: (conversationStyle as never) ?? undefined,
    });
    setSaving(true);
    setSaveError(null);
    try {
      await updateCurrentUser({
        nickname: nickname.trim(),
        city: finalCity,
        lifeStage: (lifeStage as never) ?? undefined,
        interests: interests as never,
        preferredMeetup: (preferredMeetup as never) ?? "coffee",
        socialEnergy: (socialEnergy as never) ?? undefined,
        conversationStyle: (conversationStyle as never) ?? undefined,
        personalityTraits: personalityTraits as never,
        ...scores,
      });
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : t("error_generic"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitTypeChange() {
    if (!currentUser?.gender) return;
    const requestedGender = currentUser.gender === "woman" ? "man" : "woman";
    setSubmittingTypeChange(true);
    setTypeChangeError(null);
    try {
      const created = await api.submitTypeChangeRequest({
        requestedGender,
        reason: typeChangeReason.trim() || undefined,
      });
      setPendingRequest(created);
      setShowTypeModal(false);
      setTypeChangeReason("");
    } catch (e) {
      setTypeChangeError(e instanceof Error ? e.message : t("error_generic"));
    } finally {
      setSubmittingTypeChange(false);
    }
  }

  if (!currentUser) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const genderLabel = currentUser.gender === "woman" ? t("talah_type_women") : t("talah_type_men");
  const oppositeLabel = currentUser.gender === "woman" ? t("talah_type_men") : t("talah_type_women");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ── */}
      <View
        style={{
          paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) + 4,
          paddingBottom: 14,
          paddingHorizontal: 20,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <AppText variant="title" weight="bold" style={{ flex: 1 }}>
          {t("edit_preferences")}
        </AppText>
        {saved && (
          <AppText variant="caption" weight="semibold" color={colors.primary}>
            {t("pref_saved")}
          </AppText>
        )}
      </View>

      {/* ── Body ── */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── My Basics ──────────────────────────────────────────────────── */}
        <SectionHeader label={t("my_basics")} />

        {/* Nickname */}
        <View style={{ paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
          <AppText variant="label" weight="semibold" color={colors.mutedForeground}>
            {t("q_nickname")}
          </AppText>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            maxLength={40}
            placeholder={t("nickname_placeholder")}
            placeholderTextColor={colors.mutedForeground}
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: nickname.trim().length >= 2 ? colors.primary + "60" : colors.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: colors.foreground,
              fontSize: 16,
            }}
          />
        </View>

        <Divider />

        {/* City */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 10, marginBottom: 8 }}>
          <AppText variant="label" weight="semibold" color={colors.mutedForeground}>
            {t("q_city")}
          </AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {SAUDI_CITIES.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={city === c}
                onPress={() => setCity(c)}
                size="sm"
              />
            ))}
            <Chip
              label={t("city_other")}
              selected={city === "__other__"}
              onPress={() => setCity("__other__")}
              size="sm"
            />
          </View>
          {city === "__other__" && (
            <TextInput
              value={cityOther}
              onChangeText={setCityOther}
              placeholder={t("city_other_placeholder")}
              placeholderTextColor={colors.mutedForeground}
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: colors.foreground,
                fontSize: 15,
                marginTop: 4,
              }}
            />
          )}
        </View>

        <Divider />

        {/* Life Stage */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 10, marginBottom: 8 }}>
          <AppText variant="label" weight="semibold" color={colors.mutedForeground}>
            {t("q_life_stage")}
          </AppText>
          <View style={{ gap: 8 }}>
            {LIFE_STAGES.map((ls) => (
              <Pressable
                key={ls}
                onPress={() => setLifeStage(ls)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: lifeStage === ls ? colors.primary : colors.border,
                  backgroundColor: lifeStage === ls ? colors.primary + "10" : colors.card,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: lifeStage === ls ? colors.primary : colors.border,
                    backgroundColor: lifeStage === ls ? colors.primary : "transparent",
                  }}
                />
                <AppText
                  variant="body"
                  weight={lifeStage === ls ? "semibold" : "regular"}
                  color={lifeStage === ls ? colors.primary : colors.foreground}
                >
                  {t(`ls_${ls}`)}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Tal'ah Type ────────────────────────────────────────────────── */}
        <SectionHeader label={t("talah_type_label")} />

        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.accent + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="users" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="body" weight="semibold">
                {genderLabel}
              </AppText>
              <AppText variant="caption" color={colors.mutedForeground}>
                {t("talah_type_label")}
              </AppText>
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: colors.muted,
              }}
            >
              <AppText variant="caption" weight="semibold" color={colors.mutedForeground}>
                {t("verified_badge")}
              </AppText>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Pending / rejected / approved status badge — hidden until change-request flow is activated */}
          {false && !loadingRequest && pendingRequest && (
            <View
              style={{
                margin: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor:
                  pendingRequest?.status === "pending"
                    ? "#F59E0B15"
                    : pendingRequest?.status === "rejected"
                      ? colors.destructive + "12"
                      : colors.primary + "12",
                borderWidth: 1,
                borderColor:
                  pendingRequest?.status === "pending"
                    ? "#F59E0B40"
                    : pendingRequest?.status === "rejected"
                      ? colors.destructive + "40"
                      : colors.primary + "40",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Feather
                name={
                  pendingRequest?.status === "pending"
                    ? "clock"
                    : pendingRequest?.status === "rejected"
                      ? "x-circle"
                      : "check-circle"
                }
                size={16}
                color={
                  pendingRequest?.status === "pending"
                    ? "#F59E0B"
                    : pendingRequest?.status === "rejected"
                      ? colors.destructive
                      : colors.primary
                }
              />
              <View style={{ flex: 1 }}>
                <AppText
                  variant="caption"
                  weight="semibold"
                  color={
                    pendingRequest?.status === "pending"
                      ? "#B45309"
                      : pendingRequest?.status === "rejected"
                        ? colors.destructive
                        : colors.primary
                  }
                >
                  {t(
                    pendingRequest?.status === "pending"
                      ? "type_change_pending_badge"
                      : pendingRequest?.status === "rejected"
                        ? "type_change_rejected_badge"
                        : "type_change_approved_badge",
                  )}
                </AppText>
                {pendingRequest?.adminNotes ? (
                  <AppText variant="caption" color={colors.mutedForeground} style={{ marginTop: 2 }}>
                    {pendingRequest?.adminNotes}
                  </AppText>
                ) : null}
              </View>
            </View>
          )}

          {/* Request change button — hidden until change-request flow is activated */}
          {false && !loadingRequest && pendingRequest?.status !== "pending" && (
            <Pressable
              onPress={() => setShowTypeModal(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 14,
                margin: 12,
                marginTop: pendingRequest ? 0 : 12,
                borderRadius: 12,
                backgroundColor: colors.accent + "10",
                borderWidth: 1,
                borderColor: colors.accent + "30",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Feather name="repeat" size={16} color={colors.accent} />
              <AppText variant="body" weight="semibold" color={colors.accent} style={{ flex: 1 }}>
                {t("request_type_change")}
              </AppText>
              <Feather name="chevron-right" size={16} color={colors.accent} />
            </Pressable>
          )}
        </View>

        {/* ── My Interests ───────────────────────────────────────────────── */}
        <SectionHeader
          label={t("q_interests")}
          sub={`${t("q_interests_hint")} (${interests.length}/5)`}
        />

        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {INTEREST_CATEGORIES.map((cat) => (
            <View key={cat.key} style={{ gap: 8 }}>
              <AppText variant="caption" weight="semibold" color={colors.mutedForeground}>
                {t(cat.key)}
              </AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {(cat.interests as readonly string[]).map((int) => (
                  <Chip
                    key={int}
                    label={t(`int_${int}`)}
                    selected={interests.includes(int)}
                    onPress={() => toggleInterest(int)}
                    size="sm"
                    tone="accent"
                  />
                ))}
              </View>
            </View>
          ))}
          {interests.length < 3 && (
            <AppText variant="caption" color={colors.destructive}>
              {t("q_interests_hint")}
            </AppText>
          )}
        </View>

        {/* ── My Vibe ────────────────────────────────────────────────────── */}
        <SectionHeader label={t("my_vibe_section")} />

        {/* Social Energy */}
        <View style={{ paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
          <AppText variant="label" weight="semibold" color={colors.mutedForeground}>
            {t("q_social_energy")}
          </AppText>
          <View style={{ gap: 8 }}>
            {SOCIAL_ENERGY_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setSocialEnergy(opt)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 13,
                  borderRadius: 13,
                  borderWidth: 1.5,
                  borderColor: socialEnergy === opt ? colors.primary : colors.border,
                  backgroundColor: socialEnergy === opt ? colors.primary + "10" : colors.card,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: socialEnergy === opt ? colors.primary : colors.border,
                    backgroundColor: socialEnergy === opt ? colors.primary : "transparent",
                  }}
                />
                <AppText
                  variant="body"
                  weight={socialEnergy === opt ? "semibold" : "regular"}
                  color={socialEnergy === opt ? colors.primary : colors.foreground}
                >
                  {t(`se_${opt}`)}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <Divider />

        {/* Conversation Style */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8, marginBottom: 16 }}>
          <AppText variant="label" weight="semibold" color={colors.mutedForeground}>
            {t("q_conversation_style")}
          </AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CONV_STYLE_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={t(`cs_${opt}`)}
                selected={conversationStyle === opt}
                onPress={() => setConversationStyle(opt)}
                size="sm"
              />
            ))}
          </View>
        </View>

        <Divider />

        {/* Personality Traits */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8, marginBottom: 8 }}>
          <AppText variant="label" weight="semibold" color={colors.mutedForeground}>
            {t("q_personality_traits")}
          </AppText>
          <AppText variant="caption" color={colors.mutedForeground}>
            {t("q_personality_traits_hint")}
          </AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {PERSONALITY_TRAITS.map((trait) => (
              <Chip
                key={trait}
                label={t(`pt_${trait}`)}
                selected={personalityTraits.includes(trait)}
                onPress={() => toggleTrait(trait)}
                size="sm"
              />
            ))}
          </View>
        </View>

        {/* ── Meetup Preference ──────────────────────────────────────────── */}
        <SectionHeader label={t("meetup_pref_section")} />

        <View style={{ paddingHorizontal: 20, flexDirection: "row", gap: 12, marginBottom: 8 }}>
          {(["coffee", "dinner"] as const).map((type) => (
            <Pressable
              key={type}
              onPress={() => setPreferredMeetup(type)}
              style={({ pressed }) => ({
                flex: 1,
                padding: 16,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: preferredMeetup === type ? colors.primary : colors.border,
                backgroundColor: preferredMeetup === type ? colors.primary + "12" : colors.card,
                alignItems: "center",
                gap: 8,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <AppText variant="display">
                {type === "coffee" ? "☕" : "🍽️"}
              </AppText>
              <AppText
                variant="body"
                weight="semibold"
                color={preferredMeetup === type ? colors.primary : colors.foreground}
              >
                {t(`meet_${type}`)}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Error */}
        {saveError ? (
          <View style={{ marginHorizontal: 20, marginTop: 12 }}>
            <AppText variant="caption" color={colors.destructive}>
              {saveError}
            </AppText>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Footer: Save Button ────────────────────────────────────────────── */}
      <View
        style={{
          paddingBottom: Math.max(insets.bottom, 16),
          paddingTop: 12,
          paddingHorizontal: 20,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          style={({ pressed }) => ({
            backgroundColor: canSave ? colors.primary : colors.muted,
            borderRadius: 16,
            paddingVertical: 15,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <AppText variant="body" weight="bold" color={canSave ? colors.primaryForeground : colors.mutedForeground}>
            {saving ? t("loading") : saved ? t("pref_saved") : t("save_changes")}
          </AppText>
        </Pressable>
      </View>

      {/* ── Type Change Request Modal ────────────────────────────────────── */}
      <Modal
        visible={showTypeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTypeModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
          onPress={() => setShowTypeModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 20),
              paddingHorizontal: 24,
              gap: 16,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: "center",
                marginBottom: 4,
              }}
            />

            <AppText variant="h3" weight="bold">
              {t("type_change_modal_title")}
            </AppText>

            {/* Warning box */}
            <View
              style={{
                backgroundColor: "#F59E0B15",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#F59E0B40",
                padding: 14,
                flexDirection: "row",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <Feather name="alert-triangle" size={16} color="#B45309" style={{ marginTop: 1 }} />
              <AppText variant="bodySmall" color="#92400E" style={{ flex: 1, lineHeight: 20 }}>
                {t("type_change_modal_body")}
              </AppText>
            </View>

            {/* Requested type (fixed to opposite) */}
            <View style={{ gap: 6 }}>
              <AppText variant="caption" weight="semibold" color={colors.mutedForeground}>
                {t("talah_type_label")}
              </AppText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <Feather name="arrow-right" size={16} color={colors.accent} />
                <AppText variant="body" weight="semibold" color={colors.accent}>
                  {oppositeLabel}
                </AppText>
              </View>
            </View>

            {/* Optional reason */}
            <View style={{ gap: 6 }}>
              <AppText variant="caption" weight="semibold" color={colors.mutedForeground}>
                {t("type_change_reason_placeholder")}
              </AppText>
              <TextInput
                value={typeChangeReason}
                onChangeText={setTypeChangeReason}
                placeholder={t("type_change_reason_placeholder")}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                maxLength={500}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: colors.foreground,
                  fontSize: 15,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
              />
            </View>

            {/* Error */}
            {typeChangeError ? (
              <AppText variant="caption" color={colors.destructive}>
                {typeChangeError}
              </AppText>
            ) : null}

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => { setShowTypeModal(false); setTypeChangeError(null); }}
                style={({ pressed }) => ({
                  flex: 1,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <AppText variant="body" weight="semibold" color={colors.mutedForeground}>
                  {t("cancel")}
                </AppText>
              </Pressable>
              <Pressable
                onPress={handleSubmitTypeChange}
                disabled={submittingTypeChange}
                style={({ pressed }) => ({
                  flex: 2,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  opacity: pressed || submittingTypeChange ? 0.7 : 1,
                })}
              >
                <AppText variant="body" weight="bold" color={colors.accentForeground}>
                  {submittingTypeChange ? t("loading") : t("submit_request")}
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
