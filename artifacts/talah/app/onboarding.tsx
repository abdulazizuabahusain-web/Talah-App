import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";
import { computeScores } from "@/lib/types";
import type {
  AgeRange,
  ConversationStyle,
  DayOfWeek,
  EnjoyedTopic,
  Gender,
  Interest,
  InteractionPreference,
  Lifestyle,
  MeetupAtmosphere,
  MeetupType,
  OpennessLevel,
  Personality,
  PersonalityTrait,
  PlanningPreference,
  SocialBoundary,
  SocialEnergy,
  SocialIntent,
  TimeOfDay,
} from "@/lib/types";

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

const AGE_OPTIONS: AgeRange[] = ["18-24", "25-29", "30-34", "35-44", "45+"];

const LIFESTYLE_OPTIONS: { id: Lifestyle; key: string }[] = [
  { id: "employee", key: "ls_employee" },
  { id: "student", key: "ls_student" },
  { id: "parent", key: "ls_parent" },
  { id: "entrepreneur", key: "ls_entrepreneur" },
  { id: "other", key: "ls_other" },
];

const INTEREST_OPTIONS: { id: Interest; key: string }[] = [
  { id: "coffee", key: "int_coffee" },
  { id: "books", key: "int_books" },
  { id: "fitness", key: "int_fitness" },
  { id: "wellness", key: "int_wellness" },
  { id: "art", key: "int_art" },
  { id: "business", key: "int_business" },
  { id: "food", key: "int_food" },
  { id: "outdoor", key: "int_outdoor" },
  { id: "self_development", key: "int_self_development" },
];

const PERSONALITY_OPTIONS: { id: Personality; key: string }[] = [
  { id: "calm", key: "pers_calm" },
  { id: "social", key: "pers_social" },
  { id: "curious", key: "pers_curious" },
  { id: "active", key: "pers_active" },
  { id: "creative", key: "pers_creative" },
];

const DAY_OPTIONS: { id: DayOfWeek; key: string }[] = [
  { id: "sat", key: "day_sat" },
  { id: "sun", key: "day_sun" },
  { id: "mon", key: "day_mon" },
  { id: "tue", key: "day_tue" },
  { id: "wed", key: "day_wed" },
  { id: "thu", key: "day_thu" },
  { id: "fri", key: "day_fri" },
];

const TIME_OPTIONS: { id: TimeOfDay; key: string }[] = [
  { id: "morning", key: "time_morning" },
  { id: "afternoon", key: "time_afternoon" },
  { id: "evening", key: "time_evening" },
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

const TOPIC_OPTIONS: { id: EnjoyedTopic; key: string }[] = [
  { id: "daily_life", key: "et_daily_life" },
  { id: "work_ambition", key: "et_work_ambition" },
  { id: "family_relationships", key: "et_family_relationships" },
  { id: "travel", key: "et_travel" },
  { id: "wellness_growth", key: "et_wellness_growth" },
  { id: "hobbies_activities", key: "et_hobbies_activities" },
];

const INTENT_OPTIONS: { id: SocialIntent; key: string }[] = [
  { id: "new_friends", key: "si_new_friends" },
  { id: "expand_circle", key: "si_expand_circle" },
  { id: "casual_conversations", key: "si_casual_conversations" },
  { id: "long_term_connections", key: "si_long_term_connections" },
];

const PLANNING_OPTIONS: { id: PlanningPreference; key: string }[] = [
  { id: "structured", key: "pp_structured" },
  { id: "flexible", key: "pp_flexible" },
  { id: "spontaneous", key: "pp_spontaneous" },
];

const ATMOSPHERE_OPTIONS: { id: MeetupAtmosphere; key: string }[] = [
  { id: "calm_relaxed", key: "ma_calm_relaxed" },
  { id: "moderate_energy", key: "ma_moderate_energy" },
  { id: "lively_energetic", key: "ma_lively_energetic" },
];

const INTERACTION_OPTIONS: { id: InteractionPreference; key: string }[] = [
  { id: "mostly_conversation", key: "ip_mostly_conversation" },
  { id: "mix_conversation_activity", key: "ip_mix_conversation_activity" },
  { id: "activity_based", key: "ip_activity_based" },
];

const PERSONALITY_TRAIT_OPTIONS: { id: PersonalityTrait; key: string }[] = [
  { id: "calm", key: "pt_calm" },
  { id: "social", key: "pt_social" },
  { id: "curious", key: "pt_curious" },
  { id: "thoughtful", key: "pt_thoughtful" },
  { id: "energetic", key: "pt_energetic" },
  { id: "funny", key: "pt_funny" },
  { id: "organized", key: "pt_organized" },
  { id: "creative", key: "pt_creative" },
];

const OPENNESS_OPTIONS: { id: OpennessLevel; key: string }[] = [
  { id: "open_quickly", key: "ol_open_quickly" },
  { id: "open_gradually", key: "ol_open_gradually" },
  { id: "take_your_time", key: "ol_take_your_time" },
];

const BOUNDARY_OPTIONS: { id: SocialBoundary; key: string }[] = [
  { id: "very_relaxed", key: "sb_very_relaxed" },
  { id: "respectful_balanced", key: "sb_respectful_balanced" },
  { id: "more_reserved", key: "sb_more_reserved" },
];

const TOTAL_STEPS = 20;
const PERSONALITY_SECTION_START = 10;

export default function OnboardingScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, updateCurrentUser } = useApp();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const [step, setStep] = useState(0);

  // ── Existing fields (steps 0–9) ──────────────────
  const [nickname, setNickname] = useState(currentUser?.nickname ?? "");
  const [gender, setGender] = useState<Gender | null>(currentUser?.gender ?? null);
  const [city, setCity] = useState(currentUser?.city ?? "");
  const [ageRange, setAgeRange] = useState<AgeRange>(currentUser?.ageRange ?? "25-29");
  const [lifestyle, setLifestyle] = useState<Lifestyle>(currentUser?.lifestyle ?? "employee");
  const [interests, setInterests] = useState<Interest[]>(currentUser?.interests ?? []);
  const [personality, setPersonality] = useState<Personality>(currentUser?.personality ?? "calm");
  const [meetup, setMeetup] = useState<MeetupType>(currentUser?.preferredMeetup ?? "coffee");
  const [days, setDays] = useState<DayOfWeek[]>(currentUser?.preferredDays ?? []);
  const [times, setTimes] = useState<TimeOfDay[]>(currentUser?.preferredTimes ?? []);
  const [funFact, setFunFact] = useState(currentUser?.funFact ?? "");

  // ── New personality/compatibility fields (steps 10–19) ──
  const [socialEnergy, setSocialEnergy] = useState<SocialEnergy | null>(currentUser?.socialEnergy ?? null);
  const [conversationStyle, setConversationStyle] = useState<ConversationStyle | null>(currentUser?.conversationStyle ?? null);
  const [enjoyedTopics, setEnjoyedTopics] = useState<EnjoyedTopic[]>(currentUser?.enjoyedTopics ?? []);
  const [socialIntent, setSocialIntent] = useState<SocialIntent | null>(currentUser?.socialIntent ?? null);
  const [planningPreference, setPlanningPreference] = useState<PlanningPreference | null>(currentUser?.planningPreference ?? null);
  const [meetupAtmosphere, setMeetupAtmosphere] = useState<MeetupAtmosphere | null>(currentUser?.meetupAtmosphere ?? null);
  const [interactionPreference, setInteractionPreference] = useState<InteractionPreference | null>(currentUser?.interactionPreference ?? null);
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTrait[]>(currentUser?.personalityTraits ?? []);
  const [opennessLevel, setOpennessLevel] = useState<OpennessLevel | null>(currentUser?.opennessLevel ?? null);
  const [socialBoundary, setSocialBoundary] = useState<SocialBoundary | null>(currentUser?.socialBoundary ?? null);

  const toggleArr = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const toggleTrait = (v: PersonalityTrait) => {
    if (personalityTraits.includes(v)) {
      setPersonalityTraits(personalityTraits.filter((x) => x !== v));
    } else if (personalityTraits.length < 3) {
      setPersonalityTraits([...personalityTraits, v]);
    }
  };

  const isSectionDivider = step === PERSONALITY_SECTION_START;

  const canContinue = useMemo(() => {
    switch (step) {
      case 0: return nickname.trim().length >= 2;
      case 1: return !!gender;
      case 2: return !!city;
      case 3: return !!ageRange;
      case 4: return !!lifestyle;
      case 5: return interests.length >= 3;
      case 6: return !!personality;
      case 7: return !!meetup;
      case 8: return days.length > 0 && times.length > 0;
      case 9: return true;
      case 10: return !!socialEnergy;
      case 11: return !!conversationStyle;
      case 12: return enjoyedTopics.length >= 1;
      case 13: return !!socialIntent;
      case 14: return !!planningPreference;
      case 15: return !!meetupAtmosphere;
      case 16: return !!interactionPreference;
      case 17: return personalityTraits.length >= 1;
      case 18: return !!opennessLevel;
      case 19: return !!socialBoundary;
      default: return false;
    }
  }, [step, nickname, gender, city, ageRange, lifestyle, interests, personality, meetup, days, times, socialEnergy, conversationStyle, enjoyedTopics, socialIntent, planningPreference, meetupAtmosphere, interactionPreference, personalityTraits, opennessLevel, socialBoundary]);

  const handleNext = async () => {
    if (step === TOTAL_STEPS - 1) {
      const patch = {
        nickname: nickname.trim(),
        gender: gender!,
        city,
        ageRange,
        lifestyle,
        interests,
        personality,
        preferredMeetup: meetup,
        preferredDays: days,
        preferredTimes: times,
        funFact: funFact.trim(),
        socialEnergy: socialEnergy!,
        conversationStyle: conversationStyle!,
        enjoyedTopics,
        socialIntent: socialIntent!,
        planningPreference: planningPreference!,
        meetupAtmosphere: meetupAtmosphere!,
        interactionPreference: interactionPreference!,
        personalityTraits,
        opennessLevel: opennessLevel!,
        socialBoundary: socialBoundary!,
        onboarded: true,
      };
      const scores = computeScores(patch);
      await updateCurrentUser({ ...patch, ...scores });
      router.replace("/(tabs)");
    } else {
      setStep(step + 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      // ── Existing steps ───────────────────────────────────
      case 0:
        return (
          <StepFrame title={t("q_nickname")}>
            <Input placeholder={t("nickname_placeholder")} value={nickname} onChangeText={setNickname} />
          </StepFrame>
        );
      case 1:
        return (
          <StepFrame title={t("q_gender")} hint={t("gender_note")}>
            <View style={{ gap: 12 }}>
              <BigOption selected={gender === "woman"} label={t("gender_woman")} onPress={() => setGender("woman")} />
              <BigOption selected={gender === "man"} label={t("gender_man")} onPress={() => setGender("man")} />
            </View>
          </StepFrame>
        );
      case 2:
        return (
          <StepFrame title={t("q_city")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SAUDI_CITIES.map((c) => (
                <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />
              ))}
            </View>
          </StepFrame>
        );
      case 3:
        return (
          <StepFrame title={t("q_age")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {AGE_OPTIONS.map((a) => (
                <Chip key={a} label={a} selected={ageRange === a} onPress={() => setAgeRange(a)} />
              ))}
            </View>
          </StepFrame>
        );
      case 4:
        return (
          <StepFrame title={t("q_lifestyle")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {LIFESTYLE_OPTIONS.map((o) => (
                <Chip key={o.id} label={t(o.key)} selected={lifestyle === o.id} onPress={() => setLifestyle(o.id)} />
              ))}
            </View>
          </StepFrame>
        );
      case 5:
        return (
          <StepFrame title={t("q_interests")} hint={t("q_interests_hint")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {INTEREST_OPTIONS.map((o) => (
                <Chip key={o.id} label={t(o.key)} selected={interests.includes(o.id)} onPress={() => setInterests(toggleArr(interests, o.id))} tone="accent" />
              ))}
            </View>
          </StepFrame>
        );
      case 6:
        return (
          <StepFrame title={t("q_personality")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {PERSONALITY_OPTIONS.map((o) => (
                <Chip key={o.id} label={t(o.key)} selected={personality === o.id} onPress={() => setPersonality(o.id)} />
              ))}
            </View>
          </StepFrame>
        );
      case 7:
        return (
          <StepFrame title={t("q_meetup")}>
            <View style={{ gap: 12 }}>
              <BigOption selected={meetup === "coffee"} label={t("meet_coffee")} onPress={() => setMeetup("coffee")} icon="coffee" />
              <BigOption selected={meetup === "dinner"} label={t("meet_dinner")} onPress={() => setMeetup("dinner")} icon="moon" />
            </View>
          </StepFrame>
        );
      case 8:
        return (
          <StepFrame title={t("q_days")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DAY_OPTIONS.map((d) => (
                <Chip key={d.id} label={t(d.key)} selected={days.includes(d.id)} onPress={() => setDays(toggleArr(days, d.id))} />
              ))}
            </View>
            <View style={{ height: 16 }} />
            <AppText variant="title" weight="semibold">{t("q_times")}</AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {TIME_OPTIONS.map((tm) => (
                <Chip key={tm.id} label={t(tm.key)} selected={times.includes(tm.id)} onPress={() => setTimes(toggleArr(times, tm.id))} />
              ))}
            </View>
          </StepFrame>
        );
      case 9:
        return (
          <StepFrame title={t("q_funfact")} hint={t("optional")}>
            <Input placeholder={t("funfact_placeholder")} value={funFact} onChangeText={setFunFact} multiline style={{ minHeight: 100, textAlignVertical: "top" }} />
          </StepFrame>
        );

      // ── New personality/compatibility steps ──────────────
      case 10:
        return (
          <StepFrame title={t("q_social_energy")}>
            <View style={{ gap: 10 }}>
              {SOCIAL_ENERGY_OPTIONS.map((o) => (
                <BigOption key={o.id} selected={socialEnergy === o.id} label={t(o.key)} onPress={() => setSocialEnergy(o.id)} />
              ))}
            </View>
          </StepFrame>
        );
      case 11:
        return (
          <StepFrame title={t("q_conversation_style")}>
            <View style={{ gap: 10 }}>
              {CONVERSATION_OPTIONS.map((o) => (
                <BigOption key={o.id} selected={conversationStyle === o.id} label={t(o.key)} onPress={() => setConversationStyle(o.id)} />
              ))}
            </View>
          </StepFrame>
        );
      case 12:
        return (
          <StepFrame title={t("q_enjoyed_topics")} hint={t("q_enjoyed_topics_hint")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {TOPIC_OPTIONS.map((o) => (
                <Chip key={o.id} label={t(o.key)} selected={enjoyedTopics.includes(o.id)} onPress={() => setEnjoyedTopics(toggleArr(enjoyedTopics, o.id))} tone="accent" />
              ))}
            </View>
          </StepFrame>
        );
      case 13:
        return (
          <StepFrame title={t("q_social_intent")}>
            <View style={{ gap: 10 }}>
              {INTENT_OPTIONS.map((o) => (
                <BigOption key={o.id} selected={socialIntent === o.id} label={t(o.key)} onPress={() => setSocialIntent(o.id)} />
              ))}
            </View>
          </StepFrame>
        );
      case 14:
        return (
          <StepFrame title={t("q_planning_preference")}>
            <View style={{ gap: 10 }}>
              {PLANNING_OPTIONS.map((o) => (
                <BigOption key={o.id} selected={planningPreference === o.id} label={t(o.key)} onPress={() => setPlanningPreference(o.id)} />
              ))}
            </View>
          </StepFrame>
        );
      case 15:
        return (
          <StepFrame title={t("q_meetup_atmosphere")}>
            <View style={{ gap: 10 }}>
              {ATMOSPHERE_OPTIONS.map((o) => (
                <BigOption key={o.id} selected={meetupAtmosphere === o.id} label={t(o.key)} onPress={() => setMeetupAtmosphere(o.id)} />
              ))}
            </View>
          </StepFrame>
        );
      case 16:
        return (
          <StepFrame title={t("q_interaction_preference")}>
            <View style={{ gap: 10 }}>
              {INTERACTION_OPTIONS.map((o) => (
                <BigOption key={o.id} selected={interactionPreference === o.id} label={t(o.key)} onPress={() => setInteractionPreference(o.id)} />
              ))}
            </View>
          </StepFrame>
        );
      case 17:
        return (
          <StepFrame title={t("q_personality_traits")} hint={t("q_personality_traits_hint")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {PERSONALITY_TRAIT_OPTIONS.map((o) => {
                const maxed = personalityTraits.length >= 3 && !personalityTraits.includes(o.id);
                return (
                  <Chip
                    key={o.id}
                    label={t(o.key)}
                    selected={personalityTraits.includes(o.id)}
                    onPress={() => toggleTrait(o.id)}
                    tone="accent"
                    style={{ opacity: maxed ? 0.4 : 1 }}
                  />
                );
              })}
            </View>
          </StepFrame>
        );
      case 18:
        return (
          <StepFrame title={t("q_openness_level")}>
            <View style={{ gap: 10 }}>
              {OPENNESS_OPTIONS.map((o) => (
                <BigOption key={o.id} selected={opennessLevel === o.id} label={t(o.key)} onPress={() => setOpennessLevel(o.id)} />
              ))}
            </View>
          </StepFrame>
        );
      case 19:
        return (
          <StepFrame title={t("q_social_boundary")}>
            <View style={{ gap: 10 }}>
              {BOUNDARY_OPTIONS.map((o) => (
                <BigOption key={o.id} selected={socialBoundary === o.id} label={t(o.key)} onPress={() => setSocialBoundary(o.id)} />
              ))}
            </View>
          </StepFrame>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 8),
          paddingHorizontal: 20,
          paddingBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
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
            {step >= PERSONALITY_SECTION_START ? (
              <AppText variant="caption" color={colors.accent} weight="medium">
                Personality
              </AppText>
            ) : null}
          </View>
          <View style={{ width: 22 }} />
        </View>

        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.muted, marginTop: 14, overflow: "hidden" }}>
          <View
            style={{
              height: "100%",
              width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
              backgroundColor: step >= PERSONALITY_SECTION_START ? colors.accent : colors.primary,
            }}
          />
        </View>

        {step === PERSONALITY_SECTION_START ? (
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
            <AppText variant="bodySmall" color={colors.accent} weight="medium" style={{ flex: 1 }}>
              {colors.accent
                ? "You've completed the basics! Now let's go deeper so we can match you perfectly."
                : ""}
            </AppText>
          </View>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === PERSONALITY_SECTION_START ? (
            <View
              style={{
                marginBottom: 20,
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.accent + "10",
                borderWidth: 1,
                borderColor: colors.accent + "30",
              }}
            >
              <AppText variant="h3" weight="bold" color={colors.accent}>
                🎭 Personality Profile
              </AppText>
              <AppText variant="body" color={colors.mutedForeground} style={{ marginTop: 6 }}>
                These questions help us find people who truly match your social style, energy, and conversation preferences.
              </AppText>
            </View>
          ) : null}
          {renderStep()}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, webBottomPad) + 16,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Button
            label={step === TOTAL_STEPS - 1 ? t("finish_onboarding") : t("continue")}
            disabled={!canContinue}
            onPress={handleNext}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function StepFrame({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <AppText variant="h2" weight="bold">{title}</AppText>
        {hint ? <AppText variant="body" color={colors.mutedForeground}>{hint}</AppText> : null}
      </View>
      {children}
    </View>
  );
}

function BigOption({
  selected,
  label,
  onPress,
  icon,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  return (
    <Card
      onPress={onPress}
      style={{
        borderColor: selected ? colors.accent : colors.border,
        borderWidth: selected ? 2 : 1,
        backgroundColor: selected ? colors.accent + "12" : colors.card,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          {icon ? <Feather name={icon} size={22} color={colors.accent} /> : null}
          <AppText variant="title" weight="semibold" style={{ flex: 1 }}>{label}</AppText>
        </View>
        {selected ? <Feather name="check" size={22} color={colors.accent} /> : null}
      </View>
    </Card>
  );
}
