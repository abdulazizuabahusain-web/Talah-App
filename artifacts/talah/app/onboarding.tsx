import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
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
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Input } from "@/components/Input";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";
import { computeScores } from "@/lib/types";
import { api } from "@/lib/api";
import type {
  ConversationStyle,
  Gender,
  Interest,
  LifeStage,
  MeetupType,
  PersonalityTrait,
  SocialEnergy,
} from "@/lib/types";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SAUDI_CITIES = [
  "الرياض",
  "جدة",
  "الدمام",
  "الخبر",
  "القطيف",
  "مكة المكرمة",
  "المدينة المنورة",
  "أبها",
  "الطائف",
  "بريدة",
  "تبوك",
  "حائل",
  "ينبع",
  "جازان",
  "نجران",
];

const LIFE_STAGE_OPTIONS: { id: LifeStage; key: string }[] = [
  { id: "university_early", key: "life_stage_university" },
  { id: "early_career", key: "life_stage_early_career" },
  { id: "professionally_established", key: "life_stage_established" },
  { id: "have_family", key: "life_stage_family" },
  { id: "prefer_not_to_say", key: "life_stage_prefer_not" },
];

type InterestCategory = {
  catKey: string;
  items: { id: Interest; key: string }[];
};

const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    catKey: "cat_food_coffee",
    items: [
      { id: "coffee", key: "int_coffee" },
      { id: "restaurants", key: "int_restaurants" },
      { id: "cooking", key: "int_cooking" },
      { id: "desserts", key: "int_desserts" },
    ],
  },
  {
    catKey: "cat_wellness",
    items: [
      { id: "fitness", key: "int_fitness" },
      { id: "walking", key: "int_walking" },
      { id: "wellness", key: "int_wellness" },
      { id: "yoga", key: "int_yoga" },
    ],
  },
  {
    catKey: "cat_creativity",
    items: [
      { id: "photography", key: "int_photography" },
      { id: "art", key: "int_art" },
      { id: "writing", key: "int_writing" },
      { id: "music", key: "int_music" },
      { id: "reading", key: "int_reading" },
      { id: "fashion", key: "int_fashion" },
    ],
  },
  {
    catKey: "cat_life",
    items: [
      { id: "travel", key: "int_travel" },
      { id: "social_convos", key: "int_social_convos" },
      { id: "self_development", key: "int_self_development" },
      { id: "business", key: "int_business" },
      { id: "tech", key: "int_tech" },
      { id: "podcasts", key: "int_podcasts" },
      { id: "volunteering", key: "int_volunteering" },
    ],
  },
  {
    catKey: "cat_entertainment",
    items: [
      { id: "movies", key: "int_movies" },
      { id: "games", key: "int_games" },
      { id: "anime", key: "int_anime" },
      { id: "sports_watching", key: "int_sports_watching" },
    ],
  },
  {
    catKey: "cat_outdoor",
    items: [
      { id: "hiking", key: "int_hiking" },
      { id: "sea_outdoor", key: "int_sea_outdoor" },
      { id: "camping", key: "int_camping" },
    ],
  },
];

const SOCIAL_ENERGY_OPTIONS: { id: SocialEnergy; key: string }[] = [
  { id: "very_social", key: "se_very_social" },
  { id: "friendly_balanced", key: "se_friendly_balanced" },
  { id: "quiet_open_later", key: "se_quiet_open_later" },
  { id: "prefer_listening", key: "se_prefer_listening" },
];

const CONVERSATION_OPTIONS: { id: ConversationStyle; key: string }[] = [
  { id: "light_fun", key: "cs_light_fun" },
  { id: "balanced", key: "cs_balanced" },
  { id: "deep_meaningful", key: "cs_deep_meaningful" },
];

type TraitOption = {
  id: PersonalityTrait;
  ar_woman: string;
  ar_man: string;
  en: string;
};

const PERSONALITY_TRAIT_OPTIONS: TraitOption[] = [
  { id: "calm", ar_woman: "هادئة", ar_man: "هادئ", en: "Calm" },
  { id: "social", ar_woman: "اجتماعية", ar_man: "اجتماعي", en: "Social" },
  { id: "curious", ar_woman: "فضولية", ar_man: "فضولي", en: "Curious" },
  { id: "energetic", ar_woman: "نشيطة", ar_man: "نشيط", en: "Energetic" },
  { id: "funny", ar_woman: "مرحة", ar_man: "مرح", en: "Funny" },
  { id: "creative", ar_woman: "مبدعة", ar_man: "مبدع", en: "Creative" },
];

type ContactKey = "contactPhone" | "instagram" | "snapchat" | "twitter" | "tiktok";
const CONTACT_FIELDS: { key: ContactKey; labelKey: string; prefix?: string; keyboardType?: "phone-pad" | "default" }[] = [
  { key: "contactPhone", labelKey: "contact_phone_label", keyboardType: "phone-pad" },
  { key: "instagram", labelKey: "contact_instagram_label", prefix: "@" },
  { key: "snapchat", labelKey: "contact_snapchat_label", prefix: "@" },
  { key: "tiktok", labelKey: "contact_tiktok_label", prefix: "@" },
  { key: "twitter", labelKey: "contact_twitter_label", prefix: "@" },
];

const TOTAL_STEPS = 11;
const VIBE_SECTION_START = 6;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  return invite === "1" ? <InviteOnboardingScreen /> : <FullOnboardingScreen />;
}

function FullOnboardingScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, updateCurrentUser, language } = useApp();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();

  const [step, setStep] = useState(() => {
    const n = parseInt(stepParam ?? "0", 10);
    return Number.isFinite(n) && n >= 0 && n < TOTAL_STEPS ? n : 0;
  });
  const [saving, setSaving] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // ── Field state ────────────────────────────────────────────────────────────
  const [nickname, setNickname] = useState(currentUser?.nickname ?? "");
  const [gender, setGender] = useState<Gender | null>(currentUser?.gender ?? null);
  const [city, setCity] = useState(currentUser?.city ?? "");
  const [otherCity, setOtherCity] = useState(
    currentUser?.city && !SAUDI_CITIES.includes(currentUser.city)
      ? currentUser.city
      : "",
  );
  const [showOtherInput, setShowOtherInput] = useState(
    !!(currentUser?.city && !SAUDI_CITIES.includes(currentUser.city)),
  );
  const [showCityModal, setShowCityModal] = useState(false);
  const [lifeStage, setLifeStage] = useState<LifeStage | null>(
    (currentUser?.lifeStage as LifeStage | undefined) ?? null,
  );
  const [interests, setInterests] = useState<Interest[]>(
    (currentUser?.interests ?? []) as Interest[],
  );
  const [meetup, setMeetup] = useState<MeetupType>(
    currentUser?.preferredMeetup ?? "coffee",
  );
  const [socialEnergy, setSocialEnergy] = useState<SocialEnergy | null>(
    currentUser?.socialEnergy ?? null,
  );
  const [conversationStyle, setConversationStyle] =
    useState<ConversationStyle | null>(currentUser?.conversationStyle ?? null);
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTrait[]>(
    (currentUser?.personalityTraits ?? []) as PersonalityTrait[],
  );
  const [funFact, setFunFact] = useState(currentUser?.funFact ?? "");
  const [contactValues, setContactValues] = useState<Record<ContactKey, string>>({
    contactPhone: currentUser?.contactPhone ?? "",
    instagram: currentUser?.instagram ?? "",
    snapchat: currentUser?.snapchat ?? "",
    twitter: currentUser?.twitter ?? "",
    tiktok: currentUser?.tiktok ?? "",
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleInterest = (v: Interest) => {
    if (interests.includes(v)) {
      setInterests(interests.filter((x) => x !== v));
    } else if (interests.length < 5) {
      setInterests([...interests, v]);
    }
  };

  const toggleTrait = (v: PersonalityTrait) => {
    if (personalityTraits.includes(v)) {
      setPersonalityTraits(personalityTraits.filter((x) => x !== v));
    } else if (personalityTraits.length < 2) {
      setPersonalityTraits([...personalityTraits, v]);
    }
  };

  const selectCity = (c: string) => {
    setCity(c);
    setShowOtherInput(false);
    setOtherCity("");
    setShowCityModal(false);
  };

  const selectOtherCity = () => {
    setShowOtherInput(true);
    setCity(otherCity || "");
    setShowCityModal(false);
  };

  const effectiveCity = showOtherInput ? otherCity.trim() : city;

  // ── Validation ────────────────────────────────────────────────────────────
  const canContinue = useMemo(() => {
    switch (step) {
      case 0: return nickname.trim().length >= 2;
      case 1: return !!gender;
      case 2: return effectiveCity.length >= 2;
      case 3: return !!lifeStage;
      case 4: return interests.length >= 3 && interests.length <= 5;
      case 5: return !!meetup;
      case 6: return !!socialEnergy;
      case 7: return !!conversationStyle;
      case 8: return personalityTraits.length >= 1;
      case 9: return true;
      case 10: return true;
      default: return false;
    }
  }, [step, nickname, gender, effectiveCity, lifeStage, interests, meetup, socialEnergy, conversationStyle, personalityTraits]);

  // ── Submission ────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    const patch = {
      nickname: nickname.trim(),
      gender: gender!,
      city: effectiveCity,
      lifeStage: lifeStage!,
      interests,
      preferredMeetup: meetup,
      socialEnergy: socialEnergy!,
      conversationStyle: conversationStyle!,
      personalityTraits,
      funFact: funFact.trim() || undefined,
      contactPhone: contactValues.contactPhone.trim() || null,
      instagram: contactValues.instagram.trim().replace(/^@/, "") || null,
      snapchat: contactValues.snapchat.trim() || null,
      tiktok: contactValues.tiktok.trim().replace(/^@/, "") || null,
      twitter: contactValues.twitter.trim().replace(/^@/, "") || null,
      onboarded: true,
    };
    const scores = computeScores(patch);
    setSaving(true);
    try {
      await updateCurrentUser({ ...patch, ...scores });
      setShowCompletion(true);
    } catch (e) {
      Alert.alert(t("error_title"), (e as Error).message || t("error_generic"));
    } finally {
      setSaving(false);
    }
  };

  // ── Render step content ───────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepFrame title={t("q_nickname")}>
            <Input
              placeholder={t("nickname_placeholder")}
              value={nickname}
              onChangeText={setNickname}
              autoFocus
            />
          </StepFrame>
        );

      case 1:
        return (
          <StepFrame title={t("q_gender")} hint={t("gender_note")}>
            <View style={{ gap: 12 }}>
              <BigOption
                selected={gender === "woman"}
                label={t("gender_woman")}
                onPress={() => setGender("woman")}
              />
              <BigOption
                selected={gender === "man"}
                label={t("gender_man")}
                onPress={() => setGender("man")}
              />
            </View>
          </StepFrame>
        );

      case 2:
        return (
          <StepFrame title={t("q_city")}>
            <Pressable
              onPress={() => setShowCityModal(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderRadius: 16,
                borderWidth: effectiveCity ? 2 : 1,
                borderColor: effectiveCity ? colors.primary : colors.border,
                backgroundColor: effectiveCity ? colors.primary + "10" : colors.card,
              }}
            >
              <AppText
                variant="body"
                weight={effectiveCity ? "semibold" : "regular"}
                color={effectiveCity ? colors.primary : colors.mutedForeground}
              >
                {effectiveCity || t("city_select_placeholder")}
              </AppText>
              <Feather
                name="chevron-down"
                size={18}
                color={effectiveCity ? colors.primary : colors.mutedForeground}
              />
            </Pressable>

            {showOtherInput && (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  placeholder={t("city_other_placeholder")}
                  placeholderTextColor={colors.mutedForeground}
                  value={otherCity}
                  onChangeText={(v) => {
                    setOtherCity(v);
                    setCity(v.trim());
                  }}
                  autoFocus
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: colors.foreground,
                    backgroundColor: colors.card,
                  }}
                />
              </View>
            )}

            <Modal
              visible={showCityModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowCityModal(false)}
            >
              <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
                onPress={() => setShowCityModal(false)}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: colors.background,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingTop: 16,
                  paddingBottom: Math.max(insets.bottom, 24),
                  maxHeight: "70%",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <AppText variant="title" weight="semibold">
                    {t("city_dropdown_title")}
                  </AppText>
                  <Pressable onPress={() => setShowCityModal(false)} hitSlop={12}>
                    <Feather name="x" size={20} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
                  {SAUDI_CITIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => selectCity(c)}
                      style={{
                        padding: 15,
                        borderRadius: 14,
                        borderWidth: city === c && !showOtherInput ? 2 : 1,
                        borderColor: city === c && !showOtherInput ? colors.primary : colors.border,
                        backgroundColor: city === c && !showOtherInput ? colors.primary + "12" : colors.card,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <AppText
                        variant="body"
                        weight={city === c && !showOtherInput ? "semibold" : "regular"}
                        color={city === c && !showOtherInput ? colors.primary : colors.foreground}
                      >
                        {c}
                      </AppText>
                      {city === c && !showOtherInput && (
                        <Feather name="check" size={16} color={colors.primary} />
                      )}
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={selectOtherCity}
                    style={{
                      padding: 15,
                      borderRadius: 14,
                      borderWidth: showOtherInput ? 2 : 1,
                      borderColor: showOtherInput ? colors.primary : colors.border,
                      backgroundColor: showOtherInput ? colors.primary + "12" : colors.card,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Feather name="edit-2" size={14} color={showOtherInput ? colors.primary : colors.mutedForeground} />
                    <AppText
                      variant="body"
                      weight={showOtherInput ? "semibold" : "regular"}
                      color={showOtherInput ? colors.primary : colors.foreground}
                    >
                      {t("city_other")}
                    </AppText>
                  </Pressable>
                </ScrollView>
              </View>
            </Modal>
          </StepFrame>
        );

      case 3:
        return (
          <StepFrame title={t("q_life_stage")}>
            <View style={{ gap: 10 }}>
              {LIFE_STAGE_OPTIONS.map((o) => (
                <BigOption
                  key={o.id}
                  selected={lifeStage === o.id}
                  label={t(o.key)}
                  onPress={() => setLifeStage(o.id)}
                />
              ))}
            </View>
          </StepFrame>
        );

      case 4:
        return (
          <StepFrame
            title={t("q_interests")}
            hint={`${t("q_interests_hint")} · ${interests.length}/5`}
          >
            {INTEREST_CATEGORIES.map((cat) => (
              <View key={cat.catKey} style={{ marginBottom: 16 }}>
                <AppText
                  variant="caption"
                  weight="semibold"
                  color={colors.mutedForeground}
                  style={{ marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}
                >
                  {t(cat.catKey)}
                </AppText>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {cat.items.map((o) => {
                    const maxed = interests.length >= 5 && !interests.includes(o.id);
                    return (
                      <Chip
                        key={o.id}
                        label={t(o.key)}
                        selected={interests.includes(o.id)}
                        onPress={() => toggleInterest(o.id)}
                        tone="accent"
                        style={{ opacity: maxed ? 0.4 : 1 }}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </StepFrame>
        );

      case 5:
        return (
          <StepFrame title={t("q_meetup")}>
            <View style={{ gap: 12 }}>
              <BigOption
                selected={meetup === "coffee"}
                label={t("meet_coffee")}
                onPress={() => setMeetup("coffee")}
              />
              <BigOption
                selected={meetup === "dinner"}
                label={t("meet_dinner")}
                onPress={() => setMeetup("dinner")}
              />
            </View>
          </StepFrame>
        );

      case 6:
        return (
          <StepFrame title={t("q_social_energy")}>
            <View style={{ gap: 10 }}>
              {SOCIAL_ENERGY_OPTIONS.map((o) => (
                <BigOption
                  key={o.id}
                  selected={socialEnergy === o.id}
                  label={t(o.key)}
                  onPress={() => setSocialEnergy(o.id)}
                />
              ))}
            </View>
          </StepFrame>
        );

      case 7:
        return (
          <StepFrame title={t("q_conversation_style")}>
            <View style={{ gap: 10 }}>
              {CONVERSATION_OPTIONS.map((o) => (
                <BigOption
                  key={o.id}
                  selected={conversationStyle === o.id}
                  label={t(o.key)}
                  onPress={() => setConversationStyle(o.id)}
                />
              ))}
            </View>
          </StepFrame>
        );

      case 8: {
        const isWoman = gender === "woman";
        return (
          <StepFrame
            title={t("q_personality_traits")}
            hint={t("q_personality_traits_hint")}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {PERSONALITY_TRAIT_OPTIONS.map((o) => {
                const maxed =
                  personalityTraits.length >= 2 && !personalityTraits.includes(o.id);
                const label =
                  language === "ar"
                    ? isWoman ? o.ar_woman : o.ar_man
                    : o.en;
                return (
                  <TraitChip
                    key={o.id}
                    label={label}
                    selected={personalityTraits.includes(o.id)}
                    onPress={() => toggleTrait(o.id)}
                    colors={colors}
                    dimmed={maxed}
                  />
                );
              })}
            </View>
          </StepFrame>
        );
      }

      case 9:
        return (
          <StepFrame title={t("q_funfact_onboarding")}>
            <TextInput
              placeholder={t("funfact_placeholder")}
              placeholderTextColor={colors.mutedForeground}
              value={funFact}
              onChangeText={setFunFact}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.foreground,
                backgroundColor: colors.card,
                minHeight: 90,
                textAlignVertical: "top",
              }}
            />
          </StepFrame>
        );

      case 10:
        return (
          <StepFrame title={t("q_contact_onboarding")} hint={t("contact_onboarding_hint")}>
            <View style={{ gap: 10 }}>
              {CONTACT_FIELDS.map((field) => (
                <View
                  key={field.key}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    backgroundColor: colors.card,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    gap: 8,
                  }}
                >
                  <AppText variant="caption" weight="semibold" color={colors.mutedForeground} style={{ width: 90 }}>
                    {t(field.labelKey)}
                  </AppText>
                  {field.prefix && (
                    <AppText variant="body" color={colors.mutedForeground}>{field.prefix}</AppText>
                  )}
                  <TextInput
                    value={contactValues[field.key]}
                    onChangeText={(v) =>
                      setContactValues((prev) => ({ ...prev, [field.key]: v }))
                    }
                    placeholder={t(`contact_${field.key === "contactPhone" ? "phone" : field.key}_placeholder`)}
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType={field.keyboardType ?? "default"}
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: colors.foreground,
                      paddingVertical: 2,
                    }}
                  />
                </View>
              ))}
            </View>
          </StepFrame>
        );

      default:
        return null;
    }
  };

  // ── Completion screen ──────────────────────────────────────────────────────
  if (showCompletion) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + webBottomPad,
          paddingHorizontal: 24,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <Feather name="check-circle" size={38} color={colors.primary} />
        </View>

        <AppText
          variant="h2"
          weight="bold"
          color={colors.foreground}
          style={{ textAlign: "center", marginBottom: 12 }}
        >
          {t("onboarding_complete_title")}
        </AppText>

        <AppText
          variant="h3"
          weight="semibold"
          color={colors.primary}
          style={{ textAlign: "center", marginBottom: 12 }}
        >
          {t("onboarding_complete_sub")}
        </AppText>

        <AppText
          variant="body"
          color={colors.mutedForeground}
          style={{ textAlign: "center", marginBottom: 40, lineHeight: 24 }}
        >
          {t("onboarding_complete_desc")}
        </AppText>

        <Button
          label={t("onboarding_complete_cta")}
          onPress={() => router.replace("/(tabs)")}
          style={{ width: "100%" }}
        />
      </View>
    );
  }

  // ── Main onboarding shell ──────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 8),
          paddingHorizontal: 20,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {step > 0 ? (
            <Pressable onPress={() => setStep(step - 1)} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
          ) : (
            <View style={{ width: 22 }} />
          )}
          <View style={{ alignItems: "center" }}>
            <AppText variant="label" color={colors.mutedForeground}>
              {step + 1} {t("step_of")} {TOTAL_STEPS}
            </AppText>
            {step >= VIBE_SECTION_START && step <= 8 && (
              <AppText variant="caption" color={colors.accent} weight="medium">
                Vibe
              </AppText>
            )}
          </View>
          <View style={{ width: 22 }} />
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.muted,
            marginTop: 14,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
              backgroundColor:
                step >= VIBE_SECTION_START && step <= 8 ? colors.accent : colors.primary,
            }}
          />
        </View>

        {/* Vibe section banner */}
        {step === VIBE_SECTION_START && (
          <View
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.accent + "15",
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Feather name="zap" size={16} color={colors.accent} />
            <AppText
              variant="bodySmall"
              color={colors.accent}
              weight="medium"
              style={{ flex: 1 }}
            >
              {t("vibe_section_banner")}
            </AppText>
          </View>
        )}
      </View>

      {/* Body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer CTA */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + webBottomPad + 8,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <Button
          label={
            saving
              ? t("loading")
              : step === TOTAL_STEPS - 1
                ? t("finish_onboarding")
                : t("next")
          }
          onPress={handleNext}
          disabled={!canContinue || saving}
        />
        {(step === 9 || step === 10) && (
          <Pressable onPress={handleNext} hitSlop={8} style={{ marginTop: 10, alignItems: "center" }}>
            <AppText variant="caption" color={colors.mutedForeground}>
              {t("contact_step_skip")}
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function InviteOnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, updateCurrentUser } = useApp();
  const { inviteToken: inviteTokenParam } = useLocalSearchParams<{
    inviteToken?: string;
  }>();
  const [nickname, setNickname] = useState(currentUser?.nickname ?? "");
  const [gender, setGender] = useState<Gender | null>(currentUser?.gender ?? null);
  const [city, setCity] = useState(currentUser?.city ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (nickname.trim().length < 2 || !gender || city.trim().length < 2) return;
    setSaving(true);
    try {
      await updateCurrentUser({
        nickname: nickname.trim(),
        gender,
        city: city.trim(),
        onboarded: true,
      });
      const inviteToken = Array.isArray(inviteTokenParam)
        ? inviteTokenParam[0]
        : inviteTokenParam;
      if (inviteToken) {
        try {
          const invitation = await api.claimInvitation(inviteToken);
          router.replace({
            pathname: "/(tabs)/invitations",
            params: { invitationId: invitation.id },
          });
          return;
        } catch {
          // The invitation list still matches by the authenticated email.
        }
      }
      router.replace("/(tabs)/invitations");
    } catch (error) {
      Alert.alert("تعذر إكمال الملف", error instanceof Error ? error.message : "حاولي مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: insets.top + 32, gap: 10 }}>
        <AppText variant="h2" weight="bold">انضمي إلى طلعة صديقتك</AppText>
        <AppText variant="body" color={colors.mutedForeground}>
          نحتاج هذه المعلومات الأساسية لتأكيد ملاءمة الدعوة. أسئلة الشخصية اختيارية لاحقاً إذا رغبتِ في مطابقة طلعة العادية.
        </AppText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Input label="الاسم" placeholder="اسمك" value={nickname} onChangeText={setNickname} />
        <View style={{ gap: 8 }}>
          <AppText variant="body" weight="semibold">نوع طلعة</AppText>
          <View style={{ gap: 10 }}>
            <BigOption selected={gender === "woman"} label="سيدات" onPress={() => setGender("woman")} />
            <BigOption selected={gender === "man"} label="رجال" onPress={() => setGender("man")} />
          </View>
        </View>
        <Input label="المدينة" placeholder="مثال: الرياض" value={city} onChangeText={setCity} />
      </ScrollView>
      <View style={{ padding: 20, paddingBottom: insets.bottom + 12 }}>
        <Button
          label="متابعة إلى الدعوة"
          onPress={save}
          loading={saving}
          disabled={nickname.trim().length < 2 || !gender || city.trim().length < 2}
        />
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepFrame({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 6 }}>
        <AppText variant="h2" weight="bold" color={colors.foreground}>
          {title}
        </AppText>
        {hint ? (
          <AppText variant="body" color={colors.mutedForeground}>
            {hint}
          </AppText>
        ) : null}
      </View>
      <View>{children}</View>
    </View>
  );
}

function BigOption({
  selected,
  label,
  onPress,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: 16,
        borderRadius: 16,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary + "12" : colors.card,
      }}
    >
      <AppText
        variant="body"
        weight={selected ? "semibold" : "regular"}
        color={selected ? colors.primary : colors.foreground}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function TraitChip({
  label,
  selected,
  onPress,
  colors,
  dimmed,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  dimmed: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        opacity: dimmed ? 0.4 : 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accent + "15" : colors.card,
        alignItems: "center",
      }}
    >
      <AppText
        variant="body"
        weight={selected ? "semibold" : "regular"}
        color={selected ? colors.accent : colors.foreground}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
