import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";
import type { MeetupType, TimeOfDay } from "@/lib/types";

function nextDays(count: number): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const d = new Date();
  for (let i = 1; i <= count; i++) {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    out.push({ iso: dd.toISOString().slice(0, 10), label: dd.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }) });
  }
  return out;
}

export default function RequestScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser } = useApp();
  const { createRequest } = useData();
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const [meetup, setMeetup] = useState<MeetupType>(currentUser?.preferredMeetup ?? "coffee");
  const [date, setDate] = useState<string>(nextDays(1)[0].iso);
  const [time, setTime] = useState<TimeOfDay>("morning");
  const [area, setArea] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentUser || !area.trim()) return;
    setSubmitting(true);
    await createRequest({
      userId: currentUser.id,
      meetupType: meetup,
      preferredDate: date,
      preferredTime: time,
      area: area.trim(),
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="" />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            gap: 18,
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
            }}
          >
            <Feather name="check" size={36} color={colors.primary} />
          </View>
          <AppText variant="h2" weight="bold" align="center">
            {t("request_submitted")}
          </AppText>
          <View style={{ width: "100%", gap: 10, marginTop: 12 }}>
            <Button label={t("done")} onPress={() => router.replace("/(tabs)")} size="lg" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t("request_title")} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 24,
            gap: 22,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <View style={{ gap: 12 }}>
              <AppText variant="title" weight="semibold">
                {t("request_meet")}
              </AppText>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <MeetupChoice
                  selected={meetup === "coffee"}
                  label={t("meet_coffee")}
                  icon="coffee"
                  onPress={() => setMeetup("coffee")}
                />
                <MeetupChoice
                  selected={meetup === "dinner"}
                  label={t("meet_dinner")}
                  icon="moon"
                  onPress={() => setMeetup("dinner")}
                />
              </View>
            </View>
          </Card>

          <Card>
            <View style={{ gap: 12 }}>
              <AppText variant="title" weight="semibold">
                {t("request_date")}
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {nextDays(10).map((d) => (
                    <Chip
                      key={d.iso}
                      label={d.label}
                      selected={date === d.iso}
                      onPress={() => setDate(d.iso)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          </Card>

          <Card>
            <View style={{ gap: 12 }}>
              <AppText variant="title" weight="semibold">
                {t("request_time")}
              </AppText>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {(["morning", "afternoon", "evening"] as TimeOfDay[]).map((tm) => (
                  <Chip
                    key={tm}
                    label={t(`time_${tm}`)}
                    selected={time === tm}
                    onPress={() => setTime(tm)}
                  />
                ))}
              </View>
            </View>
          </Card>

          <Card>
            <View style={{ gap: 12 }}>
              <AppText variant="title" weight="semibold">
                {t("request_area")}
              </AppText>
              <Input
                placeholder={t("area_placeholder")}
                value={area}
                onChangeText={setArea}
              />
            </View>
          </Card>
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
            label={t("submit_request")}
            onPress={handleSubmit}
            disabled={!area.trim()}
            loading={submitting}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function MeetupChoice({
  selected,
  label,
  icon,
  onPress,
}: {
  selected: boolean;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        padding: 18,
        borderRadius: 18,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accent + "12" : colors.background,
        alignItems: "center",
        gap: 10,
      }}
    >
      <Feather name={icon} size={26} color={selected ? colors.accent : colors.mutedForeground} />
      <AppText variant="body" weight={selected ? "semibold" : "medium"}>
        {label}
      </AppText>
    </Pressable>
  );
}
