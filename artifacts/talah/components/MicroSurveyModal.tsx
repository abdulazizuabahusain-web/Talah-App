import React, { useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Input } from "@/components/Input";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";
import { api } from "@/lib/api";

interface MicroSurveyModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmitted: () => void;
}

const SOURCE_OPTIONS = [
  { key: "friend", ar: "صديقة", en: "Friend" },
  { key: "instagram", ar: "إنستغرام", en: "Instagram" },
  { key: "tiktok", ar: "تيك توك", en: "TikTok" },
  { key: "whatsapp", ar: "واتساب", en: "WhatsApp" },
  { key: "other", ar: "أخرى", en: "Other" },
];

const EXPECTATION_OPTIONS = [
  { key: "meeting_people", ar: "لقاء أشخاص جدد", en: "Meeting new people" },
  { key: "dining", ar: "تجارب المطاعم", en: "Dining experiences" },
  { key: "conversations", ar: "محادثات ذات معنى", en: "Meaningful conversations" },
  { key: "all", ar: "كل شيء", en: "All of it" },
];

export function MicroSurveyModal({ visible, onDismiss, onSubmitted }: MicroSurveyModalProps) {
  const colors = useColors();
  const t = useT();
  const { language } = useApp();
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [source, setSource] = useState<string | null>(null);
  const [expectation, setExpectation] = useState<string | null>(null);
  const [word, setWord] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible]);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const handleSubmit = async () => {
    if (!source || !expectation) return;
    setSubmitting(true);
    try {
      await api.submitSurvey({ type: "micro", responses: { source, expectation, word } });
      showToast();
      setTimeout(() => {
        onSubmitted();
      }, 1800);
    } catch {
      // silent fail — still close
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "90%",
          }}
        >
          {/* Header bar */}
          <View
            style={{
              backgroundColor: colors.primary,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <AppText variant="title" weight="bold" color={colors.primaryForeground}>
              {t("micro_survey_title")}
            </AppText>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <AppText variant="h2" color={colors.primaryForeground}>×</AppText>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Q1 */}
            <View style={{ gap: 10 }}>
              <AppText variant="body" weight="semibold">{t("micro_q1")}</AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {SOURCE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.key}
                    label={language === "ar" ? opt.ar : opt.en}
                    selected={source === opt.key}
                    onPress={() => setSource(opt.key)}
                  />
                ))}
              </View>
            </View>

            {/* Q2 */}
            <View style={{ gap: 10 }}>
              <AppText variant="body" weight="semibold">{t("micro_q2")}</AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {EXPECTATION_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.key}
                    label={language === "ar" ? opt.ar : opt.en}
                    selected={expectation === opt.key}
                    onPress={() => setExpectation(opt.key)}
                  />
                ))}
              </View>
            </View>

            {/* Q3 */}
            <View style={{ gap: 10 }}>
              <AppText variant="body" weight="semibold">{t("micro_q3")}</AppText>
              <Input
                value={word}
                onChangeText={(v) => setWord(v.slice(0, 40))}
                placeholder={t("micro_q3_placeholder")}
                maxLength={40}
              />
            </View>

            <Button
              label={t("micro_submit")}
              onPress={handleSubmit}
              loading={submitting}
              disabled={!source || !expectation || submitting}
            />
          </ScrollView>
        </Animated.View>

        {/* Toast */}
        {toast && (
          <View
            style={{
              position: "absolute",
              bottom: 80,
              alignSelf: "center",
              backgroundColor: colors.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 999,
            }}
          >
            <AppText variant="label" weight="semibold" color={colors.primaryForeground}>
              {t("micro_success_toast")}
            </AppText>
          </View>
        )}
      </View>
    </Modal>
  );
}
