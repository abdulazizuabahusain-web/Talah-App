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
import type {
  AgeRange,
  DayOfWeek,
  Gender,
  Interest,
  Lifestyle,
  MeetupType,
  Personality,
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

const TOTAL_STEPS = 10;

export default function OnboardingScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, updateCurrentUser } = useApp();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const [step, setStep] = useState(0);
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

  const toggleArr = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return nickname.trim().length >= 2;
      case 1:
        return !!gender;
      case 2:
        return !!city;
      case 3:
        return !!ageRange;
      case 4:
        return !!lifestyle;
      case 5:
        return interests.length >= 3;
      case 6:
        return !!personality;
      case 7:
        return !!meetup;
      case 8:
        return days.length > 0 && times.length > 0;
      case 9:
        return true;
      default:
        return false;
    }
  }, [step, nickname, gender, city, ageRange, lifestyle, interests, personality, meetup, days, times]);

  const handleNext = async () => {
    if (step === TOTAL_STEPS - 1) {
      await updateCurrentUser({
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
        onboarded: true,
      });
      router.replace("/(tabs)");
    } else {
      setStep(step + 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepFrame title={t("q_nickname")}>
            <Input
              placeholder={t("nickname_placeholder")}
              value={nickname}
              onChangeText={setNickname}
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
                  selected={city === c}
                  onPress={() => setCity(c)}
                />
              ))}
            </View>
          </StepFrame>
        );
      case 3:
        return (
          <StepFrame title={t("q_age")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {AGE_OPTIONS.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  selected={ageRange === a}
                  onPress={() => setAgeRange(a)}
                />
              ))}
            </View>
          </StepFrame>
        );
      case 4:
        return (
          <StepFrame title={t("q_lifestyle")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {LIFESTYLE_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={t(o.key)}
                  selected={lifestyle === o.id}
                  onPress={() => setLifestyle(o.id)}
                />
              ))}
            </View>
          </StepFrame>
        );
      case 5:
        return (
          <StepFrame title={t("q_interests")} hint={t("q_interests_hint")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {INTEREST_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={t(o.key)}
                  selected={interests.includes(o.id)}
                  onPress={() => setInterests(toggleArr(interests, o.id))}
                  tone="accent"
                />
              ))}
            </View>
          </StepFrame>
        );
      case 6:
        return (
          <StepFrame title={t("q_personality")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {PERSONALITY_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={t(o.key)}
                  selected={personality === o.id}
                  onPress={() => setPersonality(o.id)}
                />
              ))}
            </View>
          </StepFrame>
        );
      case 7:
        return (
          <StepFrame title={t("q_meetup")}>
            <View style={{ gap: 12 }}>
              <BigOption
                selected={meetup === "coffee"}
                label={t("meet_coffee")}
                onPress={() => setMeetup("coffee")}
                icon="coffee"
              />
              <BigOption
                selected={meetup === "dinner"}
                label={t("meet_dinner")}
                onPress={() => setMeetup("dinner")}
                icon="moon"
              />
            </View>
          </StepFrame>
        );
      case 8:
        return (
          <StepFrame title={t("q_days")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DAY_OPTIONS.map((d) => (
                <Chip
                  key={d.id}
                  label={t(d.key)}
                  selected={days.includes(d.id)}
                  onPress={() => setDays(toggleArr(days, d.id))}
                />
              ))}
            </View>
            <View style={{ height: 16 }} />
            <AppText variant="title" weight="semibold">
              {t("q_times")}
            </AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {TIME_OPTIONS.map((tm) => (
                <Chip
                  key={tm.id}
                  label={t(tm.key)}
                  selected={times.includes(tm.id)}
                  onPress={() => setTimes(toggleArr(times, tm.id))}
                />
              ))}
            </View>
          </StepFrame>
        );
      case 9:
        return (
          <StepFrame title={t("q_funfact")} hint={t("optional")}>
            <Input
              placeholder={t("funfact_placeholder")}
              value={funFact}
              onChangeText={setFunFact}
              multiline
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
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
          <AppText variant="label" color={colors.mutedForeground}>
            {step + 1} {t("step_of")} {TOTAL_STEPS}
          </AppText>
          <View style={{ width: 22 }} />
        </View>

        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.muted,
            marginTop: 14,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
              backgroundColor: colors.accent,
            }}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
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
            label={
              step === TOTAL_STEPS - 1
                ? t("finish_onboarding")
                : t("continue")
            }
            disabled={!canContinue}
            onPress={handleNext}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

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
    <View style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <AppText variant="h2" weight="bold">
          {title}
        </AppText>
        {hint ? (
          <AppText variant="body" color={colors.mutedForeground}>
            {hint}
          </AppText>
        ) : null}
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {icon ? <Feather name={icon} size={22} color={colors.accent} /> : null}
          <AppText variant="title" weight="semibold">
            {label}
          </AppText>
        </View>
        {selected ? <Feather name="check" size={22} color={colors.accent} /> : null}
      </View>
    </Card>
  );
}
