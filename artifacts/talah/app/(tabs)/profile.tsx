import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { ExitSurveyModal } from "@/components/ExitSurveyModal";
import { useApp } from "@/contexts/AppContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";

const CONTACT_PLATFORMS = [
  { key: "contactPhone" as const, icon: "phone" as const, color: "#2ECC71", label: "WhatsApp / جوال" },
  { key: "instagram" as const, icon: "camera" as const, color: "#E1306C", label: "Instagram" },
  { key: "snapchat" as const, icon: "message-circle" as const, color: "#FFFC00", label: "Snapchat" },
  { key: "twitter" as const, icon: "twitter" as const, color: "#1DA1F2", label: "X / Twitter" },
  { key: "tiktok" as const, icon: "music" as const, color: "#010101", label: "TikTok" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, signOut } = useApp();
  const { removeUser } = useData();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const [showExitSurvey, setShowExitSurvey] = useState(false);

  const initial = (currentUser?.nickname || "?").charAt(0).toUpperCase();

  const handleDelete = () => {
    if (!currentUser) return;
    Alert.alert(t("delete_account_confirm"), undefined, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete_account"),
        style: "destructive",
        onPress: () => setShowExitSurvey(true),
      },
    ]);
  };

  const handleExitComplete = async () => {
    setShowExitSurvey(false);
    if (!currentUser) return;
    await removeUser(currentUser.id);
    await signOut();
    router.replace("/");
  };

  const filledContacts = CONTACT_PLATFORMS.filter(
    (p) => currentUser?.[p.key] && String(currentUser[p.key]).trim().length > 0,
  );

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
        {/* Avatar + name */}
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
            <AppText variant="display" weight="bold" color={colors.accentForeground}>
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
              backgroundColor: currentUser.verified ? colors.primary + "20" : colors.muted,
              borderRadius: 999,
            }}
          >
            <Feather
              name={currentUser.verified ? "check-circle" : "shield"}
              size={14}
              color={currentUser.verified ? colors.primary : colors.mutedForeground}
            />
            <AppText
              variant="caption"
              weight="semibold"
              color={currentUser.verified ? colors.primary : colors.mutedForeground}
            >
              {currentUser.verified ? t("verified_badge") : t("unverified_badge")}
            </AppText>
          </View>
        </View>

        {/* Interests + Personality */}
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
            <Pressable onPress={() => router.push("/onboarding?step=5")} hitSlop={8}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                <Feather name="edit-2" size={14} color={colors.accent} />
                <AppText variant="label" weight="semibold" color={colors.accent}>
                  {t("edit_interests")}
                </AppText>
              </View>
            </Pressable>
          </View>
          <View style={{ height: 1, marginHorizontal: 18, backgroundColor: colors.border }} />
          <Pressable onPress={() => router.push("/onboarding?step=10")} hitSlop={8}>
            <View style={{ padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }}>
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
              <AppText variant="body" weight="semibold" color={colors.accent} style={{ flex: 1 }}>
                {t("edit_personality")}
              </AppText>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </View>
          </Pressable>
        </Card>

        {/* Contact Info card */}
        <Card padded={false}>
          <View style={{ padding: 18, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="title" weight="semibold">
                  {t("contact_info_title")}
                </AppText>
                <AppText variant="bodySmall" color={colors.mutedForeground} style={{ marginTop: 3 }}>
                  {t("contact_info_subtitle")}
                </AppText>
              </View>
              <Pressable
                onPress={() => router.push("/edit-contact")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: colors.primary + "12",
                }}
              >
                <Feather name="edit-2" size={13} color={colors.primary} />
                <AppText variant="caption" weight="semibold" color={colors.primary}>
                  {t("edit")}
                </AppText>
              </Pressable>
            </View>

            {filledContacts.length > 0 ? (
              <View style={{ gap: 8 }}>
                {filledContacts.map((p) => {
                  const val = String(currentUser[p.key]);
                  const display =
                    p.key === "contactPhone" ? val : `@${val.replace(/^@/, "")}`;
                  return (
                    <View
                      key={p.key}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        padding: 10,
                        borderRadius: 10,
                        backgroundColor: colors.muted,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          backgroundColor: p.color + "18",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name={p.icon} size={15} color={p.color} />
                      </View>
                      <AppText variant="body" style={{ flex: 1 }} numberOfLines={1}>
                        {display}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Pressable
                onPress={() => router.push("/edit-contact")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: colors.primary + "08",
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: colors.primary + "30",
                }}
              >
                <Feather name="plus-circle" size={18} color={colors.primary} />
                <AppText variant="body" color={colors.primary} style={{ flex: 1 }}>
                  {t("contact_add_cta")}
                </AppText>
                <Feather name="chevron-right" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>
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
        visible={showExitSurvey}
        onComplete={handleExitComplete}
        onCancel={() => setShowExitSurvey(false)}
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
            <AppText variant="caption" color={colors.mutedForeground} style={{ marginTop: 2 }}>
              {sub}
            </AppText>
          ) : null}
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

function Divider() {
  const colors = useColors();
  return (
    <View style={{ height: 1, marginHorizontal: 18, backgroundColor: colors.border }} />
  );
}
