import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Modal, Pressable, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Input } from "@/components/Input";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";

const SOURCE_OPTIONS = [
  { id: "friend", key: "survey_source_friend" },
  { id: "instagram", key: "survey_source_instagram" },
  { id: "tiktok", key: "survey_source_tiktok" },
  { id: "whatsapp", key: "survey_source_whatsapp" },
  { id: "other", key: "survey_source_other" },
];

const EXPECTATION_OPTIONS = [
  { id: "new_people", key: "survey_expect_new_people" },
  { id: "dining", key: "survey_expect_dining" },
  { id: "meaningful", key: "survey_expect_meaningful" },
  { id: "all", key: "survey_expect_all" },
];

interface Props {
  visible: boolean;
  submitting?: boolean;
  onDismiss: () => void;
  onSubmit: (responses: Record<string, string>) => Promise<void>;
}

export function MicroSurveyModal({
  visible,
  submitting,
  onDismiss,
  onSubmit,
}: Props) {
  const colors = useColors();
  const t = useT();
  const [source, setSource] = useState("");
  const [expectation, setExpectation] = useState("");
  const [word, setWord] = useState("");

  const submit = async () => {
    if (!source || !expectation) return;
    try {
      await onSubmit({ source, expectation, word: word.trim().slice(0, 40) });
      Alert.alert(t("survey_thanks"));
      setSource("");
      setExpectation("");
      setWord("");
    } catch (err) {
      Alert.alert(
        t("error_title"),
        (err as Error).message || t("error_generic"),
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.28)",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: colors.primary,
              padding: 18,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <AppText
              variant="title"
              weight="bold"
              color={colors.primaryForeground}
            >
              {t("micro_survey_title")}
            </AppText>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <Feather name="x" size={22} color={colors.primaryForeground} />
            </Pressable>
          </View>
          <View style={{ padding: 20, gap: 18 }}>
            <View style={{ gap: 8 }}>
              <AppText variant="title" weight="semibold">
                {t("micro_q_source")}
              </AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {SOURCE_OPTIONS.map((o) => (
                  <Chip
                    key={o.id}
                    label={t(o.key)}
                    selected={source === o.id}
                    onPress={() => setSource(o.id)}
                  />
                ))}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <AppText variant="title" weight="semibold">
                {t("micro_q_expectation")}
              </AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {EXPECTATION_OPTIONS.map((o) => (
                  <Chip
                    key={o.id}
                    label={t(o.key)}
                    selected={expectation === o.id}
                    onPress={() => setExpectation(o.id)}
                    tone="accent"
                  />
                ))}
              </View>
            </View>
            <Input
              label={t("micro_q_word")}
              placeholder={t("micro_word_placeholder")}
              maxLength={40}
              value={word}
              onChangeText={setWord}
            />
            <Button
              label={t("submit")}
              onPress={submit}
              loading={submitting}
              disabled={!source || !expectation || submitting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
