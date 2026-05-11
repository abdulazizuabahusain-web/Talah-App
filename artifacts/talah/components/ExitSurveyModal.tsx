import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Modal, Pressable, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Input } from "@/components/Input";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";

const EXIT_REASONS = [
  { id: "limited_cities", key: "exit_reason_limited_cities" },
  { id: "groups_not_fit", key: "exit_reason_groups_not_fit" },
  { id: "privacy", key: "exit_reason_privacy" },
  { id: "taking_break", key: "exit_reason_taking_break" },
  { id: "other", key: "exit_reason_other" },
];

interface Props {
  visible: boolean;
  submitting?: boolean;
  onSubmit: (responses: Record<string, string>) => Promise<void>;
  onSkip: () => void;
  onClose: () => void;
}

export function ExitSurveyModal({
  visible,
  submitting,
  onSubmit,
  onSkip,
  onClose,
}: Props) {
  const colors = useColors();
  const t = useT();
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  const submit = async () => {
    if (!reason) return;
    try {
      await onSubmit({ reason, comment: comment.trim().slice(0, 200) });
      setReason("");
      setComment("");
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
      onRequestClose={onClose}
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
            padding: 20,
            gap: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <AppText variant="h2" weight="bold">
                {t("exit_survey_title")}
              </AppText>
              <AppText variant="bodySmall" color={colors.mutedForeground}>
                {t("exit_survey_subtitle")}
              </AppText>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={{ gap: 8 }}>
            <AppText variant="title" weight="semibold">
              {t("exit_q_reason")}
            </AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {EXIT_REASONS.map((o) => (
                <Chip
                  key={o.id}
                  label={t(o.key)}
                  selected={reason === o.id}
                  onPress={() => setReason(o.id)}
                />
              ))}
            </View>
          </View>
          <Input
            label={t("exit_q_comment")}
            placeholder={t("exit_comment_placeholder")}
            maxLength={200}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <Button
            label={t("exit_submit_continue")}
            onPress={submit}
            loading={submitting}
            disabled={!reason || submitting}
          />
          <Pressable
            onPress={onSkip}
            style={{ alignItems: "center", paddingVertical: 8 }}
          >
            <AppText
              variant="label"
              weight="semibold"
              color={colors.mutedForeground}
            >
              {t("skip")}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
