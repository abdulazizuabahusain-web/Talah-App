import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Input } from "@/components/Input";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";
import { api } from "@/lib/api";

interface ExitSurveyModalProps {
  visible: boolean;
  onComplete: () => void;
}

const REASON_OPTIONS = [
  { key: "limited_cities", ar: "المناطق المتاحة محدودة", en: "Limited cities available" },
  { key: "bad_fit", ar: "المجموعات لم تناسبني", en: "Groups were not the right fit" },
  { key: "privacy", ar: "مخاوف الخصوصية", en: "Privacy concerns" },
  { key: "break", ar: "أخذ استراحة", en: "Taking a break" },
  { key: "other", ar: "أخرى", en: "Other" },
];

export function ExitSurveyModal({ visible, onComplete }: ExitSurveyModalProps) {
  const colors = useColors();
  const t = useT();
  const [reason, setReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await api.submitSurvey({ type: "exit", responses: { reason, comment } });
    } catch {
      // silent fail
    } finally {
      setSubmitting(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleSkip}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "90%",
          }}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: colors.primary,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingVertical: 16,
              paddingHorizontal: 20,
            }}
          >
            <AppText variant="title" weight="bold" color={colors.primaryForeground}>
              {t("exit_survey_title")}
            </AppText>
            <AppText variant="bodySmall" color={colors.primaryForeground} style={{ marginTop: 4, opacity: 0.85 }}>
              {t("exit_survey_subtitle")}
            </AppText>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Q1 */}
            <View style={{ gap: 10 }}>
              <AppText variant="body" weight="semibold">{t("exit_q1")}</AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {REASON_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.key}
                    label={`${opt.ar} / ${opt.en}`}
                    selected={reason === opt.key}
                    onPress={() => setReason(opt.key)}
                  />
                ))}
              </View>
            </View>

            {/* Q2 */}
            <View style={{ gap: 10 }}>
              <AppText variant="body" weight="semibold">{t("exit_q2")}</AppText>
              <Input
                value={comment}
                onChangeText={(v) => setComment(v.slice(0, 200))}
                placeholder={t("exit_q2_placeholder")}
                maxLength={200}
                multiline
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            <Button
              label={t("exit_submit")}
              onPress={handleSubmit}
              loading={submitting}
              disabled={!reason || submitting}
            />

            <Pressable onPress={handleSkip} hitSlop={10} style={{ alignItems: "center" }}>
              <AppText variant="label" color={colors.mutedForeground}>
                {t("exit_skip")}
              </AppText>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
