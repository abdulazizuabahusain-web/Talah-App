import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { ExitSurveyModal } from "@/components/ExitSurveyModal";
import { Chip } from "@/components/Chip";
import { useApp } from "@/contexts/AppContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";

export default function ProfileScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, signOut } = useApp();
  const { removeUser, submitSurvey } = useData();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const [exitSurveyVisible, setExitSurveyVisible] = useState(false);
  const [exitSurveySubmitting, setExitSurveySubmitting] = useState(false);

  const initial = (currentUser?.nickname || "?").charAt(0).toUpperCase();

  const showDeleteConfirmation = () => {
    if (!currentUser) return;
    Alert.alert(t("delete_account_confirm"), undefined, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete_account"),
        style: "destructive",
        onPress: async () => {
          await removeUser(currentUser.id);
          await signOut();
          router.replace("/");
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!currentUser) return;
    setExitSurveyVisible(true);
  };

  const continueToDeleteConfirmation = () => {
    setExitSurveyVisible(false);
    showDeleteConfirmation();
  };

  const submitExitSurvey = async (responses: Record<string, string>) => {
    setExitSurveySubmitting(true);
    try {
      await submitSurvey("exit", responses);
      continueToDeleteConfirmation();
    } finally {
      setExitSurveySubmitting(false);
    }
  };

  if (!currentUser) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, webTopPad) + 12,
          paddingBottom: 100,
          paddingHorizontal: 20,
          gap: 18,
        }}
      >
        <View style={{ alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText
              variant="display"
              weight="bold"
              color={colors.accentForeground}
            >
              {initial}
            </AppText>
          </View>
          <AppText variant="h2" weight="bold">
            {currentUser.nickname}
          </AppText>
          <AppText variant="bodySmall" color={colors.mutedForeground}>
            {currentUser.city} · {currentUser.ageRange}
          </AppText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: currentUser.verified
                ? colors.primary + "20"
                : colors.muted,
              borderRadius: 999,
            }}
          >
            <Feather
              name={currentUser.verified ? "check-circle" : "shield"}
              size={14}
              color={
                currentUser.verified ? colors.primary : colors.mutedForeground
              }
            />
            <AppText
              variant="caption"
              weight="semibold"
              color={
                currentUser.verified ? colors.primary : colors.mutedForeground
              }
            >
              {currentUser.verified
                ? t("verified_badge")
                : t("unverified_badge")}
            </AppText>
          </View>
        </View>

        <Card padded={false}>
          <View style={{ padding: 18, gap: 12 }}>
            <AppText variant="title" weight="semibold">
              {t("q_interests")}
            </AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {currentUser.interests.map((i) => (
                <Chip
                  key={i}
                  label={t(`int_${i}`)}
                  size="sm"
                  selected
                  tone="accent"
                  onPress={() => router.push("/onboarding?step=5")}
                />
              ))}
            </View>
            <Pressable
              onPress={() => router.push("/onboarding?step=5")}
              hitSlop={8}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <Feather name="edit-2" size={14} color={colors.accent} />
                <AppText
                  variant="label"
                  weight="semibold"
                  color={colors.accent}
                >
                  {t("edit_interests")}
                </AppText>
              </View>
            </Pressable>
          </View>
          <View
            style={{
              height: 1,
              marginHorizontal: 18,
              backgroundColor: colors.border,
            }}
          />
          <Pressable
            onPress={() => router.push("/onboarding?step=10")}
            hitSlop={8}
          >
            <View
              style={{
                padding: 18,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: colors.accent + "15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="zap" size={18} color={colors.accent} />
              </View>
              <AppText
                variant="body"
                weight="semibold"
                color={colors.accent}
                style={{ flex: 1 }}
              >
                {t("edit_personality")}
              </AppText>
              <Feather
                name="chevron-right"
                size={18}
                color={colors.mutedForeground}
              />
            </View>
          </Pressable>
        </Card>

        <Card padded={false}>
          <Row
            icon="shield"
            label={t("privacy_settings")}
            onPress={() => router.push("/privacy")}
          />
          <Divider />
          <Row
            icon="check-circle"
            label={t("id_verification")}
            sub={t("id_verification_sub")}
            onPress={() => {
              Alert.alert(t("id_verification"), t("id_verification_sub"));
            }}
          />
        </Card>

        <Card padded={false}>
          <Row
            icon="book-open"
            label={t("code_of_conduct")}
            onPress={() => router.push("/code-of-conduct")}
          />
          <Divider />
          <Row
            icon="lock"
            label={t("privacy_policy")}
            onPress={() => router.push("/privacy")}
          />
          <Divider />
          <Row
            icon="file-text"
            label={t("terms")}
            onPress={() => router.push("/terms")}
          />
        </Card>

        <Card padded={false}>
          <Row
            icon="sliders"
            label={t("admin_panel")}
            onPress={() => router.push("/admin")}
          />
          <Divider />
          <Row
            icon="log-out"
            label={t("logout")}
            onPress={async () => {
              await signOut();
              router.replace("/");
            }}
          />
          <Divider />
          <Row
            icon="trash-2"
            label={t("delete_account")}
            tone="destructive"
            onPress={handleDelete}
          />
        </Card>
      </ScrollView>
      <ExitSurveyModal
        visible={exitSurveyVisible}
        submitting={exitSurveySubmitting}
        onSubmit={submitExitSurvey}
        onSkip={continueToDeleteConfirmation}
        onClose={() => setExitSurveyVisible(false)}
      />
    </>
  );
}

function Row({
  icon,
  label,
  sub,
  onPress,
  tone,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub?: string;
  onPress: () => void;
  tone?: "destructive";
}) {
  const colors = useColors();
  const fg = tone === "destructive" ? colors.destructive : colors.foreground;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 16,
        paddingHorizontal: 18,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor:
              tone === "destructive" ? colors.destructive + "12" : colors.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={icon} size={18} color={fg} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="body" weight="semibold" color={fg}>
            {label}
          </AppText>
          {sub ? (
            <AppText
              variant="caption"
              color={colors.mutedForeground}
              style={{ marginTop: 2 }}
            >
              {sub}
            </AppText>
          ) : null}
        </View>
        <Feather
          name="chevron-right"
          size={18}
          color={colors.mutedForeground}
        />
      </View>
    </Pressable>
  );
}

function Divider() {
  const colors = useColors();
  return (
    <View
      style={{
        height: 1,
        marginHorizontal: 18,
        backgroundColor: colors.border,
      }}
    />
  );
}
