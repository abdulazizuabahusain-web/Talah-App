import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
  "مكة المكرمة",
  "المدينة المنورة",
  "أبها",
  "الطائف",
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
    ],
  },
  {
    catKey: "cat_life",
    items: [
      { id: "travel", key: "int_travel" },
      { id: "social_convos", key: "int_social_convos" },
      { id: "self_development", key: "int_self_development" },
      { id: "business", key: "int_business" },
    ],
  },
  {
    catKey: "cat_entertainment",
    items: [
      { id: "movies", key: "int_movies" },
      { id: "games", key: "int_games" },
      { id: "anime", key: "int_anime" },
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

const TOTAL_STEPS = 9;
const VIBE_SECTION_START = 6;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, updateCurrentUser } = useApp();
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

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleArr = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

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
  };

  const selectOtherCity = () => {
    setShowOtherInput(true);
    setCity(otherCity || "");
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
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SAUDI_CITIES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={!showOtherInput && city === c}
                  onPress={() => selectCity(c)}
                />
              ))}
              <Chip
                label={t("city_other")}
                selected={showOtherInput}
                onPress={selectOtherCity}
              />
            </View>
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
                  isWoman ? o.ar_woman : o.ar_man;
                return (
                  <TraitChip
                    key={o.id}
                    arLabel={label}
                    enLabel={o.en}
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
          <AppText style={{ fontSize: 38 }}>✨</AppText>
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
            {step >= VIBE_SECTION_START && (
              <AppText variant="caption" color={colors.accent} weight="medium">
                ✨ Vibe
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
                step >= VIBE_SECTION_START ? colors.accent : colors.primary,
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
  arLabel,
  enLabel,
  selected,
  onPress,
  colors,
  dimmed,
}: {
  arLabel: string;
  enLabel: string;
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
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
      }}
    >
      <AppText
        variant="body"
        weight={selected ? "semibold" : "regular"}
        color={selected ? colors.accent : colors.foreground}
      >
        {arLabel}
      </AppText>
      <AppText variant="caption" color={colors.mutedForeground}>
        {enLabel}
      </AppText>
    </Pressable>
  );
}
